import "server-only";

// Only static stages and allowlisted error names; never log exception messages or payloads.
export function logContactFailure(stage: string, error?: unknown) {
    const allowed = ["AccessDenied", "AccessDeniedException", "InvalidClientTokenId", "SignatureDoesNotMatch",
        "ExpiredToken", "ExpiredTokenException", "UnrecognizedClientException", "InvalidSignatureException",
        "ResourceNotFoundException", "TooManyRequestsException", "TimeoutError", "AbortError", "TypeError", "SyntaxError"];
    const name = error && typeof error === "object" && "name" in error ? error.name : undefined;
    const errorType = typeof name === "string" && allowed.includes(name) ? name : "OtherError";
    console.error(JSON.stringify({event: "contact_failure", stage, ...(error === undefined ? {} : {errorType})}));
}
