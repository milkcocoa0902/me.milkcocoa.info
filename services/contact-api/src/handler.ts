import {SESClient} from "@aws-sdk/client-ses";
import {parseContact, validEmail, type Contact, type Result} from "./contract.ts";
import {createMailer} from "./mail.ts";

export function createHandler(mail: (contact: Contact) => Promise<Result>) {
    return async (event: unknown): Promise<Result> => {
        const contact = parseContact(event);
        if (!contact) return {status: "invalid_input"};
        try { return await mail(contact); }
        catch { return {status: "unknown"}; }
    };
}

export async function handler(event: unknown): Promise<Result> {
    const from = process.env.CONTACT_FROM ?? "";
    const to = process.env.CONTACT_TO ?? "";
    if (!validEmail(from) || !validEmail(to)) return {status: "failed"};
    const client = new SESClient({maxAttempts: 1, requestHandler: {connectionTimeout: 300, requestTimeout: 1800}});
    try { return await createHandler(createMailer(client, from, to))(event); }
    finally { client.destroy(); }
}
