import {test} from "node:test";
import assert from "node:assert/strict";
import {renderToStaticMarkup} from "react-dom/server";
import {ContactForm} from "../src/app/contact/_components/ContactForm";
import {CONTACT_LIMITS, parseContactRequest, validateFields} from "../src/lib/contact/contract";
import {prepareAttempt, submitContact} from "../src/lib/contact/client";
import {handleContact, type ContactDependencies, type VerifiedContact} from "../src/lib/server/contact/handler";
import {createTurnstileVerifier} from "../src/lib/server/contact/turnstile";
import "./contact-storage.test";
import "./contact-notify.test";

const origin = "https://me.milkcocoa.info";
const input = {requestId: "d66fc392-4c37-40e9-b435-22b7058f643f", name: "相談者", email: "user@example.net", message: "開発の相談です。\n日本語の本文。", turnstileToken: "token"};
function request(body: unknown = input, headers: Record<string, string> = {}, url = `${origin}/api/contact`, method = "POST") {
    return new Request(url, {method, headers: {host: new URL(url).host, origin, "content-type": "application/json", "cf-connecting-ip": "192.0.2.1", ...headers},
        ...(method === "POST" ? {body: typeof body === "string" ? body : JSON.stringify(body)} : {})});
}
function dependencies() {
    const calls: string[] = [];
    const contacts: VerifiedContact[] = [];
    const deps: ContactDependencies = {enabled: true, origin,
        verify: async () => {calls.push("verify"); return "valid";},
        deliver: async contact => {calls.push("deliver"); contacts.push(contact); return {status: "accepted", requestId: contact.requestId};},
    };
    return {calls, contacts, deps};
}

test("normalizes whitespace/newlines, counts Unicode code points, rejects header injection and extra fields", () => {
    const parsed = parseContactRequest({...input, name: " 名前 ", message: " 本文\r\n続き "});
    assert.equal(parsed.ok && parsed.value.message, "本文\n続き");
    assert.equal(parsed.ok && parsed.value.name, "名前");
    assert.deepEqual(validateFields({...input, name: "😀".repeat(200)}), {});
    assert.ok(validateFields({...input, name: "😀".repeat(201)}).name);
    for (const email of ["a@example.net\r\nBcc: other@example.net", "a@example.net,b@example.net", "Name <a@example.net>", "\na@example.net"]) {
        assert.equal(parseContactRequest({...input, email}).ok, false);
    }
    assert.equal(parseContactRequest({...input, verified: true}).ok, false);
    assert.equal(parseContactRequest({...input, requestId: "arbitrary"}).ok, false);
    assert.equal(parseContactRequest({...input, turnstileToken: ""}).ok, false);
    assert.equal(parseContactRequest({...input, message: "a\0b"}).ok, false);
});

test("valid requests verify first; delivery receives no token or self-declared verification", async () => {
    const {deps, calls, contacts} = dependencies();
    const response = await handleContact(request(), deps);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), {status: "accepted", requestId: input.requestId});
    assert.deepEqual(calls, ["verify", "deliver"]);
    assert.deepEqual(Object.keys(contacts[0]).sort(), ["name", "email", "message", "requestId", "clientIp"].sort());
    assert.equal(contacts[0].clientIp, "192.0.2.1");
});

test("GET/HEAD/OPTIONS, alternate hosts, forged Host/Origin, invalid inputs and oversized bodies cause no external calls", async () => {
    const {deps, calls} = dependencies();
    for (const method of ["GET", "HEAD", "OPTIONS"]) assert.equal((await handleContact(request(input, {}, undefined, method), deps)).status, 405);
    const cases: [Request, number][] = [
        [request(input, {}, "https://preview.workers.dev/api/contact"), 403],
        [request(input, {host: "preview.workers.dev"}), 403],
        [request(input, {origin: "https://evil.example"}), 403],
        [request(input, {origin: ""}), 403],
        [request(input, {}, `${origin}/other`), 403],
        [request(input, {"content-type": "text/plain"}), 415],
        [request(input, {"content-encoding": "gzip"}), 415],
        [request({...input, email: "invalid"}), 400],
        [request("{bad json"), 400],
        [request(input, {"content-length": String(CONTACT_LIMITS.bodyBytes + 1)}), 413],
        [request("あ".repeat(11000)), 413],
    ];
    for (const [req, status] of cases) assert.equal((await handleContact(req, deps)).status, status);
    assert.deepEqual(calls, []);
});

test("streamed bodies enforce actual bytes even without Content-Length", async () => {
    const {deps, calls} = dependencies();
    const stream = new ReadableStream({start(controller) {controller.enqueue(new Uint8Array(20000)); controller.enqueue(new Uint8Array(20000)); controller.close();}});
    const req = new Request(`${origin}/api/contact`, {method: "POST", headers: {host: "me.milkcocoa.info", origin, "content-type": "application/json"}, body: stream, duplex: "half"} as RequestInit);
    assert.equal((await handleContact(req, deps)).status, 413);
    assert.deepEqual(calls, []);
});

test("disabled/unconnected ingress fails closed without consuming Turnstile", async () => {
    const {deps, calls} = dependencies();
    assert.equal((await handleContact(request(), {...deps, enabled: false})).status, 503);
    assert.equal((await handleContact(request(), {...deps, deliver: undefined})).status, 503);
    assert.deepEqual(calls, []);
});

test("invalid/expired/mismatched/unavailable Turnstile never invokes delivery", async () => {
    for (const result of ["invalid", "forbidden", "unavailable"] as const) {
        const {deps, calls} = dependencies();
        const response = await handleContact(request(), {...deps, verify: async () => result});
        assert.equal(response.status, result === "invalid" ? 400 : result === "forbidden" ? 403 : 503);
        assert.deepEqual(calls, []);
    }
});

test("delivery timeout/failure yields unknown, with no automatic retry", async () => {
    let attempts = 0;
    const {deps} = dependencies();
    const response = await handleContact(request(), {...deps, deliver: async () => {attempts++; throw new Error("timeout");}});
    assert.equal(response.status, 503);
    const body = await response.json() as {code: string};
    assert.equal(body.code, "unknown");
    assert.equal(attempts, 1);
});

test("Siteverify checks hostname and action, rejects replay, and fails closed on provider/network errors", async () => {
    let count = 0;
    const fetcher = ((_: unknown, init: RequestInit) => {
        count++;
        assert.ok(init.body instanceof URLSearchParams);
        assert.equal(init.body.get("secret"), "test-secret");
        assert.equal(init.body.get("remoteip"), "192.0.2.1");
        assert.equal(init.redirect, "error");
        assert.ok(init.signal);
        return Promise.resolve(Response.json({success: true, hostname: "me.milkcocoa.info", action: "business_contact"}));
    }) as typeof fetch;
    assert.equal(await createTurnstileVerifier("test-secret", "me.milkcocoa.info", fetcher)("token", "192.0.2.1"), "valid");
    assert.equal(count, 1);
    const cases = [
        [{success: true, hostname: "other.example", action: "business_contact"}, "forbidden"],
        [{success: true, hostname: "me.milkcocoa.info", action: "login"}, "forbidden"],
        [{success: false, "error-codes": ["timeout-or-duplicate"]}, "invalid"],
        [{success: false, "error-codes": ["invalid-input-secret"]}, "unavailable"],
        [{success: false, "error-codes": ["internal-error"]}, "unavailable"],
        [null, "unavailable"],
    ] as const;
    for (const [body, expected] of cases) {
        assert.equal(await createTurnstileVerifier("test", "me.milkcocoa.info", (async () => Response.json(body)) as typeof fetch)("token", "ip"), expected);
    }
    assert.equal(await createTurnstileVerifier("test", "host", (async () => {throw new Error();}) as typeof fetch)("token", "ip"), "unavailable");
});

test("manual retries preserve the request ID, content edits create a new ID, tokens are excluded", () => {
    const first = prepareAttempt(input, null, () => "first");
    assert.equal(prepareAttempt(input, first, () => "second"), first);
    assert.equal(prepareAttempt({...input, message: "changed"}, first, () => "second").requestId, "second");
    assert.equal(first.content.includes("token"), false);
});

test("client handles verified success, mismatch, quota, non-JSON, failure and abort without retry", async () => {
    const cases: [Response, string][] = [
        [Response.json({status: "accepted", requestId: input.requestId}), "accepted"],
        [Response.json({status: "accepted", requestId: "wrong"}), "unknown"],
        [new Response("quota", {status: 429}), "rate_limited"],
        [new Response("<html>error</html>", {status: 500}), "unknown"],
        [Response.json({status: "error", code: "unavailable"}, {status: 503}), "unavailable"],
        [Response.json(null, {status: 503}), "unknown"],
    ];
    for (const [response, expected] of cases) {
        let count = 0;
        const result = await submitContact(input, new AbortController().signal, (async (url, init) => {
            count++; assert.equal(url, "/api/contact"); assert.equal(init?.credentials, "omit"); return response;
        }) as typeof fetch);
        assert.equal(result.status === "accepted" ? "accepted" : result.code, expected);
        assert.equal(count, 1);
    }
    const result = await submitContact(input, new AbortController().signal, (async () => {throw new Error("abort");}) as typeof fetch);
    assert.deepEqual(result, {status: "error", code: "unknown"});
});

test("missing site key is visible, with labels, no premature field errors and disabled submission", () => {
    const html = renderToStaticMarkup(<ContactForm />);
    for (const id of ["contact-name", "contact-email", "contact-message"]) assert.ok(html.includes(`for="${id}"`));
    assert.ok(html.includes("Turnstile のサイトキーが未設定"));
    assert.ok(html.includes("mailto:developer@milkcocoa.info"));
    assert.ok(html.includes("aria-live=\"polite\""));
    assert.ok(html.includes("disabled=\"\""));
    assert.ok(!html.includes("aria-invalid=\"true\""));
    assert.ok(!html.includes("challenges.cloudflare.com"));
});

test("configured site key renders the Widget before submit without an availability flag", () => {
    const html = renderToStaticMarkup(<ContactForm siteKey="test-site-key" />);
    const widgetPosition = html.indexOf('aria-label="送信前の確認"');
    assert.ok(widgetPosition >= 0);
    assert.ok(widgetPosition < html.indexOf('type="submit"'));
    assert.ok(!html.includes('disabled=""'));
    assert.ok(!html.includes("サイトキーが未設定"));
    assert.ok(!html.includes("フォームは準備中"));
});
