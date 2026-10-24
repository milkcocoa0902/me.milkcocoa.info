const errorNames = new Set([
    "TimeoutError", "AbortError", "TypeError", "MessageRejected", "AccessDenied", "AccessDeniedException",
    "MailFromDomainNotVerifiedException", "ConfigurationSetDoesNotExistException", "AccountSendingPausedException",
    "InvalidParameterValue", "Throttling", "ThrottlingException", "ServiceUnavailable", "CredentialsProviderError",
    "InvalidClientTokenId", "SignatureDoesNotMatch", "ExpiredToken",
]);

// Never serialize the event, SDK exception/message, addresses, or credentials.
export function logNotification(stage: string, requestId?: string, error?: unknown, elapsedMs?: number) {
    const failure = error && typeof error === "object" ? error as {name?: unknown; $metadata?: {httpStatusCode?: unknown}} : undefined;
    const name = failure?.name;
    const httpStatus = failure?.$metadata?.httpStatusCode;
    const record = {
        event: "contact_notification", stage,
        ...(requestId && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId) ? {requestId} : {}),
        ...(elapsedMs === undefined ? {} : {elapsedMs}),
        ...(error === undefined ? {} : {errorType: typeof name === "string" && errorNames.has(name) ? name : "OtherError"}),
        ...(typeof httpStatus === "number" && Number.isInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599 ? {httpStatus} : {}),
    };
    console.log(JSON.stringify(record));
}
