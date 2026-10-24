import "server-only";
import {CONTACT_ACTION} from "../../contact/contract";
import type {Verification} from "./handler";
import {logContactFailure} from "./diagnostics";

export function createTurnstileVerifier(secret: string, hostname: string, fetcher: typeof fetch = fetch) {
    return async (token: string, ip: string): Promise<Verification> => {
        if (!secret) { logContactFailure("turnstile_missing_secret"); return "unavailable"; }
        try {
            const response = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
                method: "POST",
                body: new URLSearchParams({secret, response: token, remoteip: ip}),
                signal: AbortSignal.timeout(5000),
                // Workers rejects redirect: "error" before sending the request.
                // Return redirects without following them; response.ok rejects 3xx below.
                redirect: "manual",
            });
            if (!response.ok) { logContactFailure("turnstile_http_error"); return "unavailable"; }
            const data: unknown = await response.json();
            if (!data || typeof data !== "object") { logContactFailure("turnstile_invalid_response"); return "unavailable"; }
            const result = data as {success?: unknown; hostname?: unknown; action?: unknown; "error-codes"?: unknown};
            if (result.success !== true) {
                const codes = result["error-codes"];
                if (!Array.isArray(codes) || !codes.length || codes.some(code =>
                    !["invalid-input-response", "missing-input-response", "timeout-or-duplicate"].includes(code))) {
                    logContactFailure(Array.isArray(codes) && codes.includes("invalid-input-secret")
                        ? "turnstile_invalid_secret" : "turnstile_provider_error");
                    return "unavailable";
                }
                return "invalid";
            }
            return result.hostname === hostname && result.action === CONTACT_ACTION ? "valid" : "forbidden";
        } catch { logContactFailure("turnstile_fetch_or_parse_failed"); return "unavailable"; }
    };
}
