import "server-only";
import {CONTACT_PATH, CONTACT_LIMITS, parseContactRequest, type ContactFields, type ContactResponse} from "../../contact/contract";

export type VerifiedContact = ContactFields & {requestId: string; clientIp: string};
export type ContactDelivery = (contact: VerifiedContact) => Promise<ContactResponse>;
export type Verification = "valid" | "invalid" | "forbidden" | "unavailable";
export type ContactDependencies = {
    enabled: boolean;
    origin: string;
    verify: (token: string, ip: string) => Promise<Verification>;
    deliver?: ContactDelivery;
};

const statusCodes = {invalid_input: 400, invalid_token: 400, forbidden: 403, too_large: 413,
    unsupported_type: 415, conflict: 409, rate_limited: 429, unavailable: 503, unknown: 503} as const;

function respond(body: ContactResponse): Response {
    return Response.json(body, {
        status: body.status === "accepted" ? 200 : statusCodes[body.code],
        headers: {"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
    });
}

async function readJson(request: Request): Promise<unknown> {
    const declared = request.headers.get("content-length");
    if (declared && (!/^\d+$/.test(declared) || Number(declared) > CONTACT_LIMITS.bodyBytes)) throw new RangeError();
    if (!request.body) throw new SyntaxError();
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    let timedOut = false;
    const timer = setTimeout(() => {timedOut = true; void reader.cancel().catch(() => {});}, 5000);
    try {
        while (true) {
            const {done, value} = await reader.read();
            if (timedOut) throw new SyntaxError();
            if (done) break;
            size += value.byteLength;
            if (size > CONTACT_LIMITS.bodyBytes) {
                await reader.cancel();
                throw new RangeError();
            }
            chunks.push(value);
        }
    } finally {
        clearTimeout(timer);
        reader.releaseLock();
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder("utf-8", {fatal: true}).decode(bytes));
}

// No I/O on import. The route is the server-only boundary; dependencies keep this unit testable.
export async function handleContact(request: Request, deps: ContactDependencies): Promise<Response> {
    if (request.method !== "POST") return new Response(null, {status: 405, headers: {Allow: "POST", "Cache-Control": "no-store"}});
    const url = new URL(request.url);
    const expected = new URL(deps.origin);
    if (url.origin !== expected.origin || url.pathname !== CONTACT_PATH ||
        request.headers.get("host") !== expected.host || request.headers.get("origin") !== expected.origin) {
        return respond({status: "error", code: "forbidden"});
    }
    // A missing persistence adapter must never consume a token or pretend to accept contact.
    if (!deps.enabled || !deps.deliver) return respond({status: "error", code: "unavailable"});
    if (request.headers.get("content-encoding") && request.headers.get("content-encoding") !== "identity") {
        return respond({status: "error", code: "unsupported_type"});
    }
    if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get("content-type") ?? "")) {
        return respond({status: "error", code: "unsupported_type"});
    }
    let value: unknown;
    try { value = await readJson(request); }
    catch (error) { return respond({status: "error", code: error instanceof RangeError ? "too_large" : "invalid_input"}); }
    const parsed = parseContactRequest(value);
    if (!parsed.ok) return respond({status: "error", code: "invalid_input", fields: parsed.fields});
    // Only the deployed Cloudflare ingress may supply this header. Never read client JSON/X-Forwarded-For.
    const ip = request.headers.get("cf-connecting-ip");
    if (!ip) return respond({status: "error", code: "unavailable"});
    let verification: Verification;
    try { verification = await deps.verify(parsed.value.turnstileToken, ip); }
    catch { verification = "unavailable"; }
    if (verification !== "valid") {
        return respond({status: "error", code: verification === "invalid" ? "invalid_token" : verification});
    }
    const {name, email, message, requestId} = parsed.value;
    try {
        return respond(await deps.deliver({name, email, message, requestId, clientIp: ip}));
    } catch {
        // An unexpected failure may follow persistence. Preserve the request ID for a safe replay.
        return respond({status: "error", code: "unknown"});
    }
}
