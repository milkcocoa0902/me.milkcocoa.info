import {test, mock} from "node:test";
import assert from "node:assert/strict";
import {SendEmailCommand, type SESClient} from "@aws-sdk/client-ses";
import {parseContact, validEmail} from "../src/contract.ts";
import {createHandler} from "../src/handler.ts";
import {createMailer} from "../src/mail.ts";
import {logNotification} from "../src/diagnostics.ts";

const input = {requestId: "d66fc392-4c37-40e9-b435-22b7058f643f", name: "相談者", email: "user@example.net", message: "日本語の本文\n2行目"};

test("SES diagnostics preserve stage and safe metadata without leaking exception contents", async () => {
    const logger = mock.method(console, "log", () => {});
    try {
        const client = {send: async () => {throw {name: "TimeoutError", message: input.email, payload: input, $metadata: {httpStatusCode: 504}};}} as unknown as SESClient;
        const result = await createHandler(createMailer(client, "from@example.org", "to@example.org"))(input);
        assert.deepEqual(result, {status: "unknown"});
        const logs = logger.mock.calls.map(call => JSON.parse(call.arguments[0]));
        assert.deepEqual(logs.map(log => log.stage), ["notification_started", "ses_send_started", "ses_send_exception", "notification_unknown"]);
        assert.equal(logs[2].errorType, "TimeoutError");
        assert.equal(logs[2].httpStatus, 504);
        assert.equal(logs[2].requestId, input.requestId);
        assert.equal(typeof logs[2].elapsedMs, "number");
        logNotification("invalid_input", input.email, {name: input.message});
        const serialized = JSON.stringify(logger.mock.calls.map(call => call.arguments));
        for (const value of [input.email, input.name, input.message, "from@example.org", "to@example.org"]) assert.equal(serialized.includes(value), false);
    } finally {logger.mock.restore();}
});

test("Lambda accepts only notification fields and never sends invalid events", async () => {
    assert.equal(validEmail("contact@example.org\n"), false);
    let sends = 0;
    const handler = createHandler(async () => {sends++; return {status: "sent", messageId: "ses-id"};});
    for (const event of [null, [], {}, {...input, clientIp: "192.0.2.1"}, {...input, verified: true}, {...input, turnstileToken: "token"},
        {...input, to: "evil@example.org"}, {...input, name: 1}, {...input, requestId: "bad"}, {...input, name: "a\nb"},
        {...input, email: "a@example.net\r\nBcc: evil@example.net"}, {...input, message: "a\0b"}, {...input, message: "あ".repeat(8001)}]) {
        assert.deepEqual(await handler(event), {status: "invalid_input"});
    }
    assert.equal(sends, 0);
    assert.equal((await handler(input)).status, "sent");
    assert.equal(sends, 1);
    assert.equal(parseContact({...input, message: " 本文\r\n次の行 "})?.message, "本文\n次の行");
    assert.equal(parseContact({...input, name: "😀".repeat(200)})?.name.length, 400);
});

test("SES command fixes addresses/subject and contains UTF-8 content and receipt ID", async () => {
    let sends = 0;
    const client = {send: async (command: SendEmailCommand, options: {abortSignal: AbortSignal}) => {
        sends++;
        assert.equal(command.input.Source, "contact@example.org");
        assert.deepEqual(command.input.Destination, {ToAddresses: ["owner@example.org"]});
        assert.deepEqual(command.input.ReplyToAddresses, [input.email]);
        assert.equal(command.input.Message?.Subject?.Data, "【事業お問い合わせ】新しいご相談");
        assert.equal(command.input.Message?.Body?.Text?.Charset, "UTF-8");
        assert.ok(command.input.Message?.Body?.Text?.Data?.includes(input.requestId));
        assert.ok(command.input.Message?.Body?.Text?.Data?.includes(input.message));
        assert.ok(options.abortSignal instanceof AbortSignal);
        return {MessageId: "ses-id"};
    }} as unknown as SESClient;
    assert.deepEqual(await createMailer(client, "contact@example.org", "owner@example.org")(input), {status: "sent", messageId: "ses-id"});
    assert.equal(sends, 1);
});

test("SES explicit rejection differs from timeout/5xx; none automatically retries", async () => {
    for (const [error, status] of [
        [{name: "TimeoutError"}, "unknown"],
        [{name: "MessageRejected", $metadata: {httpStatusCode: 400}}, "failed"],
        [{name: "AccessDeniedException", $metadata: {httpStatusCode: 403}}, "failed"],
        [{name: "AccessDenied", $metadata: {httpStatusCode: 403}}, "failed"],
        [{name: "MessageRejected", $metadata: {httpStatusCode: 500}}, "unknown"],
    ] as const) {
        let sends = 0;
        const client = {send: async () => {sends++; throw error;}} as unknown as SESClient;
        assert.deepEqual(await createMailer(client, "a@example.org", "b@example.org")(input), {status});
        assert.equal(sends, 1);
    }
    assert.deepEqual(await createHandler(async () => {throw new Error("timeout");})(input), {status: "unknown"});
});
