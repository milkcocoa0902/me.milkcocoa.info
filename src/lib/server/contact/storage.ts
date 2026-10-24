import "server-only";
import type {ContactResponse} from "../../contact/contract";
import type {ContactDelivery, VerifiedContact} from "./handler";
import {emailEncryption} from "./encryption";
import {logContactFailure} from "./diagnostics";

// Small SQL boundary so the same statements can be checked against SQLite in tests.
export type ContactDatabase = {
    prepare(sql: string): {
        bind(...values: (string | number | null)[]): {
            first<T>(): Promise<T | null>;
            run(): Promise<{meta: {changes: number}}>;
        };
    };
};
type ContactRow = {request_id: string; name: string; email_ciphertext: string; message: string};
export type Notification = {requestId: string; name: string; email: string; message: string};
export type NotificationResult = {status: "sent"; messageId: string} | {status: "failed" | "unknown"};

export function createStoredDelivery(deps: {
    db: ContactDatabase; emailKey: string; notify: (contact: Notification) => Promise<NotificationResult>;
    now?: () => number;
}): ContactDelivery {
    return async (contact: VerifiedContact): Promise<ContactResponse> => {
        const accepted: ContactResponse = {status: "accepted", requestId: contact.requestId};
        let encryption: Awaited<ReturnType<typeof emailEncryption>>;
        try { encryption = await emailEncryption(deps.emailKey); }
        catch { logContactFailure("email_key_import_failed"); return {status: "error", code: "unavailable"}; }
        let stage = "d1_read";
        const read = () => deps.db.prepare("SELECT request_id, name, email_ciphertext, message FROM contacts WHERE request_id = ?")
            .bind(contact.requestId).first<ContactRow>();
        const replay = async (row: ContactRow): Promise<ContactResponse> => {
            stage = "email_decrypt";
            const email = await encryption.decrypt(row.email_ciphertext, row.request_id);
            return row.name === contact.name && row.message === contact.message && email === contact.email ? accepted : {status: "error", code: "conflict"};
        };
        try {
            const existing = await read();
            if (existing) return await replay(existing);
            const now = Math.floor((deps.now ?? Date.now)() / 1000);
            const date = new Date(now * 1000);
            const dayStart = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 1000);
            const monthStart = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1) / 1000);
            // One INSERT atomically checks quotas and reserves the ID. The original is the receipt.
            stage = "email_encrypt";
            const ciphertext = await encryption.encrypt(contact.email, contact.requestId);
            stage = "d1_insert";
            const saved = await deps.db.prepare(`
                INSERT INTO contacts (request_id, name, email_ciphertext, message, client_ip, created_at)
                SELECT ?, ?, ?, ?, ?, ?
                WHERE (SELECT COUNT(*) FROM contacts WHERE created_at >= ?) < 50
                  AND (SELECT COUNT(*) FROM contacts WHERE created_at >= ?) < 500
                  AND (SELECT COUNT(*) FROM contacts WHERE client_ip = ? AND created_at >= ?) < 3
                ON CONFLICT(request_id) DO NOTHING
            `).bind(contact.requestId, contact.name, ciphertext, contact.message,
                contact.clientIp, now, dayStart, monthStart, contact.clientIp, now - 600).run();
            if (saved.meta.changes === 0) {
                stage = "d1_read";
                const existing = await read();
                return existing ? await replay(existing) : {status: "error", code: "rate_limited"};
            }
        } catch {
            logContactFailure(stage);
            // Persistence was not confirmed. No notification is permitted.
            return {status: "error", code: "unavailable"};
        }
        let notification: NotificationResult;
        const {requestId, name, email, message} = contact;
        try { notification = await deps.notify({requestId, name, email, message}); }
        catch (error) { logContactFailure("notification_exception", error); notification = {status: "unknown"}; }
        try {
            await deps.db.prepare("UPDATE contacts SET mail_status = ?, mail_message_id = ? WHERE request_id = ? AND mail_status = 'pending'")
                .bind(notification.status, notification.status === "sent" ? notification.messageId : null, requestId).run();
        } catch {
            // Original remains saved. Pending means delivery needs manual reconciliation.
            logContactFailure("notification_status_update_failed");
        }
        return accepted;
    };
}
