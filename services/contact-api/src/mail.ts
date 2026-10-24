import {SendEmailCommand, type SESClient} from "@aws-sdk/client-ses";
import type {Contact, Result} from "./contract.ts";
import {logNotification} from "./diagnostics.ts";

export function createMailer(client: Pick<SESClient, "send">, from: string, to: string) {
    return async (contact: Contact): Promise<Result> => {
        const started = Date.now();
        logNotification("ses_send_started", contact.requestId);
        try {
            const result = await client.send(new SendEmailCommand({
                Source: from,
                Destination: {ToAddresses: [to]},
                ReplyToAddresses: [contact.email],
                Message: {
                    Subject: {Charset: "UTF-8", Data: "【事業お問い合わせ】新しいご相談"},
                    Body: {Text: {Charset: "UTF-8", Data: [
                        `受付ID: ${contact.requestId}`, `お名前／組織名: ${contact.name}`, `返信先: ${contact.email}`, "", contact.message,
                    ].join("\n")}},
                },
            }), {abortSignal: AbortSignal.timeout(1800)});
            logNotification(result.MessageId ? "ses_send_accepted" : "ses_missing_message_id", contact.requestId, undefined, Date.now() - started);
            return result.MessageId ? {status: "sent", messageId: result.MessageId} : {status: "unknown"};
        } catch (error) {
            logNotification("ses_send_exception", contact.requestId, error, Date.now() - started);
            const failure = (error ?? {}) as {name?: string; $metadata?: {httpStatusCode?: number}};
            // Only explicit, non-retryable service rejections prove the message was not accepted.
            const rejections = ["MessageRejected", "MailFromDomainNotVerifiedException", "ConfigurationSetDoesNotExistException", "AccountSendingPausedException", "AccessDenied", "AccessDeniedException", "InvalidParameterValue"];
            if (failure.$metadata?.httpStatusCode === 400 || failure.$metadata?.httpStatusCode === 403) {
                if (rejections.includes(failure.name ?? "")) return {status: "failed"};
            }
            return {status: "unknown"};
        }
    };
}
