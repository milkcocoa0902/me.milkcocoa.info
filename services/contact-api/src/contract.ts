export type Contact = {requestId: string; name: string; email: string; message: string};
export type Result = {status: "sent"; messageId: string} | {status: "failed" | "unknown" | "invalid_input"};

export function validEmail(value: string): boolean {
    return value.length <= 254 && !/[\u0000-\u0020\u007f]/.test(value) && /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(value);
}

// Standalone SAM package: keep this boundary aligned with src/lib/contact/contract.ts.
// Token, verified flags and caller-selected recipients are deliberately not part of the event.
export function parseContact(event: unknown): Contact | undefined {
    if (!event || typeof event !== "object" || Array.isArray(event)) return;
    const value = event as Record<string, unknown>;
    const keys = ["requestId", "name", "email", "message"];
    if (Object.keys(value).length !== keys.length || keys.some(key => typeof value[key] !== "string")) return;
    const input = value as Contact;
    if (Buffer.byteLength(JSON.stringify(input), "utf8") > 32768 ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId) ||
        /[\u0000-\u001f\u007f]/.test(input.name) ||
        /[\u0000-\u001f\u007f]/.test(input.email) ||
        /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(input.message)) return;
    const name = input.name.trim();
    const email = input.email.trim();
    const message = input.message.replace(/\r\n?/g, "\n").trim();
    if (!name || Array.from(name).length > 200 || !validEmail(email) || !message || Array.from(message).length > 8000) return;
    return {requestId: input.requestId.toLowerCase(), name, email, message};
}
