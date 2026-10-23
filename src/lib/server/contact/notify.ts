import "server-only";
import type {Notification, NotificationResult} from "./storage";

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
        if (!alias || !role || alias[1] !== role[1] || alias[3] !== role[2] || !env.CONTACT_AWS_ACCESS_KEY_ID || !env.CONTACT_AWS_SECRET_ACCESS_KEY) return {status: "failed"};
        // Standard SDK signing. No custom SigV4, retry loop or credential cache.
        const [{STSClient, AssumeRoleCommand}, {LambdaClient, InvokeCommand}] = await Promise.all([
            import("@aws-sdk/client-sts"), import("@aws-sdk/client-lambda"),
        ]);
        const options = {region: alias[2], maxAttempts: 1, requestHandler: {connectionTimeout: 500, requestTimeout: 3000}};
        const sts = new STSClient({...options, credentials: {accessKeyId: env.CONTACT_AWS_ACCESS_KEY_ID, secretAccessKey: env.CONTACT_AWS_SECRET_ACCESS_KEY}});
        let credentials;
        try {
            credentials = (await sts.send(new AssumeRoleCommand({RoleArn: env.CONTACT_AWS_ROLE_ARN, RoleSessionName: "business-contact", DurationSeconds: 900}), {abortSignal: AbortSignal.timeout(3000)})).Credentials;
        } catch { return {status: "failed"}; }
        finally { sts.destroy(); }
        if (!credentials?.AccessKeyId || !credentials.SecretAccessKey || !credentials.SessionToken) return {status: "failed"};
        const lambda = new LambdaClient({...options, requestHandler: {connectionTimeout: 500, requestTimeout: 6000}, credentials: {accessKeyId: credentials.AccessKeyId, secretAccessKey: credentials.SecretAccessKey, sessionToken: credentials.SessionToken}});
        try {
            const result = await lambda.send(new InvokeCommand({FunctionName: env.CONTACT_LAMBDA_ALIAS_ARN, InvocationType: "RequestResponse", Payload: new TextEncoder().encode(JSON.stringify(contact))}), {abortSignal: AbortSignal.timeout(6000)});
            if (result.FunctionError || !result.Payload) return {status: "unknown"};
            const response: unknown = JSON.parse(new TextDecoder().decode(result.Payload));
            if (response && typeof response === "object" && "status" in response) {
                if (response.status === "sent" && "messageId" in response && typeof response.messageId === "string" && response.messageId) return {status: "sent", messageId: response.messageId};
                if (response.status === "failed" || response.status === "invalid_input") return {status: "failed"};
            }
            return {status: "unknown"};
        } catch { return {status: "unknown"}; }
        finally { lambda.destroy(); }
    };
}
