import {SESClient} from "@aws-sdk/client-ses";
import {parseContact, validEmail, type Contact, type Result} from "./contract.ts";
import {createMailer} from "./mail.ts";
import {logNotification} from "./diagnostics.ts";

export function createHandler(mail: (contact: Contact) => Promise<Result>) {
    return async (event: unknown): Promise<Result> => {
        const contact = parseContact(event);
        if (!contact) { logNotification("invalid_input"); return {status: "invalid_input"}; }
        logNotification("notification_started", contact.requestId);
        try {
            const result = await mail(contact);
            logNotification(`notification_${result.status}`, contact.requestId);
            return result;
        }
        catch (error) { logNotification("notification_exception", contact.requestId, error); return {status: "unknown"}; }
    };
}

export async function handler(event: unknown): Promise<Result> {
    logNotification("handler_started");
    const from = process.env.CONTACT_FROM ?? "";
    const to = process.env.CONTACT_TO ?? "";
    if (!validEmail(from) || !validEmail(to)) { logNotification("invalid_mail_configuration"); return {status: "failed"}; }
    const client = new SESClient({maxAttempts: 1, requestHandler: {connectionTimeout: 300, requestTimeout: 1800}});
    try { return await createHandler(createMailer(client, from, to))(event); }
    finally { client.destroy(); }
}
