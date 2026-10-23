import {test, mock} from "node:test";
import assert from "node:assert/strict";
import {STSClient, type AssumeRoleCommand} from "@aws-sdk/client-sts";
import {LambdaClient, type InvokeCommand} from "@aws-sdk/client-lambda";
import {createNotifier} from "../src/lib/server/contact/notify";

const env = {
    CONTACT_AWS_ACCESS_KEY_ID: "test-key", CONTACT_AWS_SECRET_ACCESS_KEY: "test-secret",
    CONTACT_AWS_ROLE_ARN: "arn:aws:iam::123456789012:role/contact-invoke",
    CONTACT_LAMBDA_ALIAS_ARN: "arn:aws:lambda:ap-northeast-1:123456789012:function:contact:live",
};
const input = {requestId: "d66fc392-4c37-40e9-b435-22b7058f643f", name: "名前", email: "user@example.net", message: "相談です"};

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
