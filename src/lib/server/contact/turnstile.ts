import "server-only";
import {CONTACT_ACTION} from "../../contact/contract";
import type {Verification} from "./handler";

export function createTurnstileVerifier(secret: string, hostname: string, fetcher: typeof fetch = fetch) {
    return async (token: string, ip: string): Promise<Verification> => {
        if (!secret) return "unavailable";
        try {
            const response = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
                method: "POST",
                body: new URLSearchParams({secret, response: token, remoteip: ip}),
                signal: AbortSignal.timeout(5000),
                redirect: "error",
            });
            if (!response.ok) return "unavailable";
            const data: unknown = await response.json();
            if (!data || typeof data !== "object") return "unavailable";
            const result = data as {success?: unknown; hostname?: unknown; action?: unknown; "error-codes"?: unknown};
            if (result.success !== true) {
                const codes = result["error-codes"];
                if (!Array.isArray(codes) || !codes.length || codes.some(code =>
                    !["invalid-input-response", "missing-input-response", "timeout-or-duplicate"].includes(code))) return "unavailable";
                return "invalid";
            }
            return result.hostname === hostname && result.action === CONTACT_ACTION ? "valid" : "forbidden";
        } catch { return "unavailable"; }
    };
}
