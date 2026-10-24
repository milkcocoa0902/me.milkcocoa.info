export const CONTACT_PATH = "/api/contact";
export const CONTACT_ACTION = "business_contact";
export const CONTACT_EMAIL = "developer@milkcocoa.info";
export const CONTACT_LIMITS = {bodyBytes: 32 * 1024, name: 200, email: 254, message: 8000, token: 2048} as const;

export type ContactFields = {name: string; email: string; message: string};
export type ContactRequest = ContactFields & {requestId: string; turnstileToken: string};
export type FieldErrors = Partial<Record<keyof ContactFields, string>>;
export type ContactErrorCode = "invalid_input" | "invalid_token" | "forbidden" | "too_large" |
    "unsupported_type" | "conflict" | "rate_limited" | "unavailable" | "unknown";
export type ContactResponse = {status: "accepted"; requestId: string} |
    {status: "error"; code: ContactErrorCode; fields?: FieldErrors};

export function normalizeFields(fields: ContactFields): ContactFields {
    return {name: fields.name.trim(), email: fields.email.trim(), message: fields.message.replace(/\r\n?/g, "\n").trim()};
}

const length = (value: string) => Array.from(value).length;
const control = /[\u0000-\u001f\u007f]/;
// Deliberately accept one ordinary address, rather than display names or address lists.
const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

export function validateFields(raw: ContactFields): FieldErrors {
    const fields = normalizeFields(raw);
    const errors: FieldErrors = {};
    if (!fields.name || length(fields.name) > CONTACT_LIMITS.name || control.test(raw.name)) {
        errors.name = "お名前／組織名を200文字以内で入力してください（改行不可）。";
    }
    if (length(fields.email) > CONTACT_LIMITS.email || control.test(raw.email) || !emailPattern.test(fields.email)) {
        errors.email = "返信先のメールアドレスを1つ入力してください。";
    }
    if (!fields.message || length(fields.message) > CONTACT_LIMITS.message || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(raw.message)) {
        errors.message = "お問い合わせ内容を8,000文字以内で入力してください。";
    }
    return errors;
}

export function parseContactRequest(value: unknown): {ok: true; value: ContactRequest} | {ok: false; fields?: FieldErrors} {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {ok: false};
    const data = value as Record<string, unknown>;
    const keys = ["requestId", "name", "email", "message", "turnstileToken"];
    if (Object.keys(data).some(key => !keys.includes(key)) || keys.some(key => typeof data[key] !== "string")) return {ok: false};
    const input = data as ContactRequest;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId) ||
        !input.turnstileToken.trim() || input.turnstileToken.length > CONTACT_LIMITS.token) return {ok: false};
    const fields = validateFields(input);
    if (Object.keys(fields).length) return {ok: false, fields};
    return {ok: true, value: {...normalizeFields(input), requestId: input.requestId.toLowerCase(), turnstileToken: input.turnstileToken}};
}
