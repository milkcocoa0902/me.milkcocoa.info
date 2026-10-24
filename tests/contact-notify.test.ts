import {test, mock} from "node:test";
import assert from "node:assert/strict";
import {STSClient, type AssumeRoleCommand} from "@aws-sdk/client-sts";
import {LambdaClient, type InvokeCommand} from "@aws-sdk/client-lambda";
import {createNotifier} from "../src/lib/server/contact/notify";
import {logContactFailure} from "../src/lib/server/contact/diagnostics";

const env = {
    CONTACT_AWS_ACCESS_KEY_ID: "test-key", CONTACT_AWS_SECRET_ACCESS_KEY: "test-secret",
    CONTACT_AWS_ROLE_ARN: "arn:aws:iam::123456789012:role/contact-invoke",
    CONTACT_LAMBDA_ALIAS_ARN: "arn:aws:lambda:ap-northeast-1:123456789012:function:contact:live",
};
const input = {requestId: "d66fc392-4c37-40e9-b435-22b7058f643f", name: "名前", email: "user@example.net", message: "相談です"};

test("real SDK signing and serialization use Fetch for STS then Lambda", async () => {
    const requests: Request[] = [];
    const transport = mock.method(globalThis, "fetch", async (request: Request) => {
        requests.push(request);
        const url = new URL(request.url);
        const authorization = request.headers.get("authorization") ?? "";
        if (url.hostname === "sts.ap-northeast-1.amazonaws.com") {
            assert.match(authorization, /AWS4-HMAC-SHA256 Credential=test-key\//);
            const body = await request.text();
            assert.ok(body.includes("AssumeRole") || request.headers.get("x-amz-target")?.includes("AssumeRole"));
            return new Response(`<AssumeRoleResponse xmlns="https://sts.amazonaws.com/doc/2011-06-15/"><AssumeRoleResult><Credentials><AccessKeyId>short-key</AccessKeyId><SecretAccessKey>short-secret</SecretAccessKey><SessionToken>session-token</SessionToken><Expiration>2099-01-01T00:00:00Z</Expiration></Credentials></AssumeRoleResult><ResponseMetadata><RequestId>test</RequestId></ResponseMetadata></AssumeRoleResponse>`, {headers: {"content-type": "text/xml"}});
        }
        assert.equal(url.hostname, "lambda.ap-northeast-1.amazonaws.com");
        assert.match(decodeURIComponent(url.pathname), /function:contact:live\/invocations$/);
        assert.match(authorization, /AWS4-HMAC-SHA256 Credential=short-key\//);
        assert.equal(request.headers.get("x-amz-security-token"), "session-token");
        assert.deepEqual(await request.json(), input);
        return Response.json({status: "sent", messageId: "ses-id"});
    });
    try {
        assert.deepEqual(await createNotifier(env)(input), {status: "sent", messageId: "ses-id"});
        assert.equal(requests.length, 2);
    } finally {transport.mock.restore();}
});

test("AWS diagnostics distinguish access denial without logging error messages or arbitrary names", () => {
    const logger = mock.method(console, "error", () => {});
    try {
        logContactFailure("aws_assume_role_failed", {name: "AccessDenied", message: "private credential", secret: "private"});
        logContactFailure("lambda_invoke_or_parse_failed", {name: "private credential", message: "private"});
        assert.deepEqual(logger.mock.calls.map(call => JSON.parse(call.arguments[0])), [
            {event: "contact_failure", stage: "aws_assume_role_failed", errorType: "AccessDenied"},
            {event: "contact_failure", stage: "lambda_invoke_or_parse_failed", errorType: "OtherError"},
        ]);
    } finally { logger.mock.restore(); }
});

test("Worker notification assumes the fixed role before invoking only the live alias, with no token or IP", async () => {
    const order: string[] = [];
    const sts = mock.method(STSClient.prototype, "send", async function(this: STSClient, command: AssumeRoleCommand) {
        order.push("sts");
        assert.equal(await this.config.maxAttempts(), 1);
        assert.equal(command.input.RoleArn, env.CONTACT_AWS_ROLE_ARN);
        assert.equal(command.input.DurationSeconds, 900);
        return {Credentials: {AccessKeyId: "short-key", SecretAccessKey: "short-secret", SessionToken: "session-token"}};
    });
    const lambda = mock.method(LambdaClient.prototype, "send", async function(this: LambdaClient, command: InvokeCommand) {
        order.push("invoke");
        assert.equal(await this.config.maxAttempts(), 1);
        assert.equal((await this.config.credentials()).sessionToken, "session-token");
        assert.equal(command.input.FunctionName, env.CONTACT_LAMBDA_ALIAS_ARN);
        assert.equal(command.input.InvocationType, "RequestResponse");
        const payload = command.input.Payload;
        assert.ok(payload instanceof Uint8Array);
        assert.deepEqual(JSON.parse(new TextDecoder().decode(payload)), input);
        return {Payload: new TextEncoder().encode(JSON.stringify({status: "sent", messageId: "ses-id"}))};
    });
    try {
        assert.deepEqual(await createNotifier(env)(input), {status: "sent", messageId: "ses-id"});
        assert.deepEqual(order, ["sts", "invoke"]);
    } finally {sts.mock.restore(); lambda.mock.restore();}
});

test("invalid target or failed STS never invokes Lambda; ambiguous Invoke never retries", async () => {
    let invokes = 0;
    const sts = mock.method(STSClient.prototype, "send", async () => {throw new Error("STS unavailable");});
    const lambda = mock.method(LambdaClient.prototype, "send", async () => {invokes++; throw new Error("timeout");});
    try {
        assert.deepEqual(await createNotifier({...env, CONTACT_LAMBDA_ALIAS_ARN: env.CONTACT_LAMBDA_ALIAS_ARN.replace(":live", ":other")})(input), {status: "failed"});
        assert.equal(sts.mock.callCount(), 0);
        assert.deepEqual(await createNotifier(env)(input), {status: "failed"});
        assert.equal(invokes, 0);
        sts.mock.mockImplementation(async () => ({Credentials: {AccessKeyId: "short-key", SecretAccessKey: "short-secret", SessionToken: "token"}}));
        assert.deepEqual(await createNotifier(env)(input), {status: "unknown"});
        assert.equal(invokes, 1);
    } finally {sts.mock.restore(); lambda.mock.restore();}
});
