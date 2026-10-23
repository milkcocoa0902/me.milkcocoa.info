import "server-only";

const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const decode = (text: string) => Uint8Array.from(atob(text), char => char.charCodeAt(0));

// 32 random bytes, base64 encoded, in a Worker Secret. Never NEXT_PUBLIC_*.
export async function emailEncryption(secret: string) {
    const raw = decode(secret);
    if (raw.byteLength !== 32) throw new Error("Contact email key must be 32 bytes");
    const key = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
    return {
        async encrypt(email: string, requestId: string): Promise<string> {
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const ciphertext = await crypto.subtle.encrypt({name: "AES-GCM", iv, additionalData: new TextEncoder().encode(requestId)}, key, new TextEncoder().encode(email));
            return `v1.${encode(iv)}.${encode(new Uint8Array(ciphertext))}`;
        },
        async decrypt(value: string, requestId: string): Promise<string> {
            const [version, iv, ciphertext, extra] = value.split(".");
            if (version !== "v1" || !iv || !ciphertext || extra !== undefined) throw new Error("Invalid contact ciphertext");
            const plaintext = await crypto.subtle.decrypt({name: "AES-GCM", iv: decode(iv), additionalData: new TextEncoder().encode(requestId)}, key, decode(ciphertext));
            return new TextDecoder().decode(plaintext);
        },
    };
}
