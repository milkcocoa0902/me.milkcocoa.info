import {CONTACT_LIMITS, CONTACT_PATH, normalizeFields, type ContactFields, type ContactRequest, type ContactResponse} from "./contract";

export type ContactAttempt = {requestId: string; content: string};

export function prepareAttempt(fields: ContactFields, previous: ContactAttempt | null, makeId = () => crypto.randomUUID()): ContactAttempt {
    const content = JSON.stringify(normalizeFields(fields));
    return previous?.content === content ? previous : {content, requestId: makeId()};
}

export async function submitContact(payload: ContactRequest, signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<ContactResponse> {
    const body = JSON.stringify(payload);
    if (new TextEncoder().encode(body).byteLength > CONTACT_LIMITS.bodyBytes) return {status: "error", code: "too_large"};
    try {
        const response = await fetcher(CONTACT_PATH, {
            method: "POST", headers: {"Content-Type": "application/json"}, body,
            credentials: "omit", cache: "no-store", redirect: "error", signal,
        });
        if (response.status === 429) return {status: "error", code: "rate_limited"};
        if (response.status === 413) return {status: "error", code: "too_large"};
        if (!response.headers.get("content-type")?.includes("application/json")) return {status: "error", code: "unknown"};
        const data = await response.json() as Partial<ContactResponse>;
        if (response.status === 200 && data?.status === "accepted" && data.requestId === payload.requestId) return data as ContactResponse;
        const codes = ["invalid_input", "invalid_token", "forbidden", "too_large", "unsupported_type", "conflict", "rate_limited", "unavailable", "unknown"];
        if (!response.ok && data?.status === "error" && typeof data.code === "string" && codes.includes(data.code)) {
            return {status: "error", code: data.code};
        }
        return {status: "error", code: "unknown"};
    } catch { return {status: "error", code: "unknown"}; }
}

export const contactErrorMessages = {
    invalid_input: "入力内容を確認してください。",
    invalid_token: "送信前の確認が期限切れか、無効です。もう一度確認してください。",
    forbidden: "このページからの送信を確認できませんでした。正規のサイトを開き直してください。",
    too_large: "送信データが大きすぎます。本文を短くしてください。",
    unsupported_type: "送信形式を確認できませんでした。ページを開き直してください。",
    conflict: "同じ受付IDで保存済みの内容と一致しません。入力を保持しています。受付IDをメールでご照会ください。",
    rate_limited: "受付上限に達しました。時間をおくか、メールでご連絡ください。",
    unavailable: "現在フォームを利用できません。入力を保持しています。メールでもご連絡いただけます。",
    unknown: "受付結果を確認できませんでした。すでに届いている可能性があります。再試行する場合は内容を変えず、受付IDをメールで照会することもできます。",
} as const;
