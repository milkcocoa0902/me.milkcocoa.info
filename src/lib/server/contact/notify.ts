import "server-only";
import type {Notification, NotificationResult} from "./storage";
import {logContactFailure} from "./diagnostics";
import {FetchHttpHandler, streamCollector} from "@smithy/fetch-http-handler";

type NotificationConfig = {
    CONTACT_AWS_ACCESS_KEY_ID: string;
    CONTACT_AWS_SECRET_ACCESS_KEY: string;
    CONTACT_AWS_ROLE_ARN: string;
    CONTACT_LAMBDA_ALIAS_ARN: string;
};

export function createNotifier(env: NotificationConfig) {
    return async (contact: Notification): Promise<NotificationResult> => {
        const alias = /^arn:(aws|aws-cn|aws-us-gov):lambda:([a-z0-9-]+):(\d{12}):function:[a-zA-Z0-9_-]+:live$/.exec(env.CONTACT_LAMBDA_ALIAS_ARN);
        const role = /^arn:(aws|aws-cn|aws-us-gov):iam::(\d{12}):role\/.+$/.exec(env.CONTACT_AWS_ROLE_ARN);
        if (!alias || !role || alias[1] !== role[1] || alias[3] !== role[2]) {
            logContactFailure("aws_invalid_target"); return {status: "failed"};
        }
        if (!env.CONTACT_AWS_ACCESS_KEY_ID || !env.CONTACT_AWS_SECRET_ACCESS_KEY) {
            logContactFailure("aws_missing_credentials"); return {status: "failed"};
        }
        // Standard SDK signing. No custom SigV4, retry loop or credential cache.
        const [{STSClient, AssumeRoleCommand}, {LambdaClient, InvokeCommand}] = await Promise.all([
            import("@aws-sdk/client-sts"), import("@aws-sdk/client-lambda"),
        ]);
        // OpenNext selects the Node SDK build. Explicitly use Workers' Fetch API
        // and Web Streams instead of the SDK's default Node HTTP transport.
        const options = {region: alias[2], maxAttempts: 1, streamCollector};
        const sts = new STSClient({...options, requestHandler: new FetchHttpHandler({requestTimeout: 3000}),
            credentials: {accessKeyId: env.CONTACT_AWS_ACCESS_KEY_ID, secretAccessKey: env.CONTACT_AWS_SECRET_ACCESS_KEY}});
        let credentials;
        try {
            credentials = (await sts.send(new AssumeRoleCommand({RoleArn: env.CONTACT_AWS_ROLE_ARN, RoleSessionName: "business-contact", DurationSeconds: 900}), {abortSignal: AbortSignal.timeout(3000)})).Credentials;
        } catch (error) { logContactFailure("aws_assume_role_failed", error); return {status: "failed"}; }
        finally { sts.destroy(); }
        if (!credentials?.AccessKeyId || !credentials.SecretAccessKey || !credentials.SessionToken) {
            logContactFailure("aws_incomplete_session"); return {status: "failed"};
        }
        const lambda = new LambdaClient({...options, requestHandler: new FetchHttpHandler({requestTimeout: 6000}), credentials: {accessKeyId: credentials.AccessKeyId, secretAccessKey: credentials.SecretAccessKey, sessionToken: credentials.SessionToken}});
        try {
            const result = await lambda.send(new InvokeCommand({FunctionName: env.CONTACT_LAMBDA_ALIAS_ARN, InvocationType: "RequestResponse", Payload: new TextEncoder().encode(JSON.stringify(contact))}), {abortSignal: AbortSignal.timeout(6000)});
            if (result.FunctionError || !result.Payload) {
                logContactFailure("lambda_function_error_or_empty_payload"); return {status: "unknown"};
            }
            const response: unknown = JSON.parse(new TextDecoder().decode(result.Payload));
            if (response && typeof response === "object" && "status" in response) {
                if (response.status === "sent" && "messageId" in response && typeof response.messageId === "string" && response.messageId) return {status: "sent", messageId: response.messageId};
                if (response.status === "failed" || response.status === "invalid_input") {
                    logContactFailure("lambda_notification_rejected"); return {status: "failed"};
                }
                if (response.status === "unknown") {
                    logContactFailure("lambda_notification_unknown"); return {status: "unknown"};
                }
            }
            logContactFailure("lambda_unexpected_response"); return {status: "unknown"};
        } catch (error) { logContactFailure("lambda_invoke_or_parse_failed", error); return {status: "unknown"}; }
        finally { lambda.destroy(); }
    };
}
