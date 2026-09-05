/**
 * AES-256-GCM helpers mirroring the backend's CryptoService.
 *
 * The backend wraps the bodies of the encrypted endpoints in an envelope:
 *
 *   { "encrypted": true, "v": 1, "iv": "<base64 nonce>", "data": "<base64 ciphertext||tag>" }
 *
 * Java's AES/GCM/NoPadding appends the 128-bit auth tag to the ciphertext,
 * which is exactly the layout WebCrypto's AES-GCM expects, so `data` decrypts
 * as-is with no repackaging.
 *
 * Note on threat model: the key below ships inside the JS bundle, so anyone who
 * opens devtools can read it. This stops naive curl/requests scraping loops, not
 * a determined scraper driving a headless browser. The rate limiter and the
 * page-size cap are what actually bound the damage.
 */

const RAW_KEY = import.meta.env.VITE_RESPONSE_ENCRYPTION_KEY;

let keyPromise = null;

const base64ToBytes = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
};

const bytesToBase64 = (bytes) => {
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

/** Imported once and reused — importKey is not free and every response needs it. */
const getKey = () => {
    if (!RAW_KEY) {
        return Promise.reject(
            new Error('VITE_RESPONSE_ENCRYPTION_KEY is not set — cannot decrypt API responses.')
        );
    }
    if (!keyPromise) {
        keyPromise = crypto.subtle.importKey(
            'raw',
            base64ToBytes(RAW_KEY),
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
    }
    return keyPromise;
};

/** True when `payload` is an encrypted envelope rather than a normal response body. */
export const isEncryptedPayload = (payload) =>
    !!payload
    && typeof payload === 'object'
    && payload.encrypted === true
    && typeof payload.iv === 'string'
    && typeof payload.data === 'string';

/** Decrypts an envelope back into whatever JSON value the endpoint originally returned. */
export const decryptPayload = async (payload) => {
    const key = await getKey();
    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToBytes(payload.iv), tagLength: 128 },
        key,
        base64ToBytes(payload.data)
    );
    return JSON.parse(new TextDecoder().decode(plaintext));
};

/** Encrypts a JSON-serializable value into the same envelope the backend understands. */
export const encryptPayload = async (value) => {
    const key = await getKey();
    // A fresh nonce per call — reusing one under GCM breaks the cipher outright.
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: 128 },
        key,
        new TextEncoder().encode(JSON.stringify(value))
    );
    return {
        encrypted: true,
        v: 1,
        iv: bytesToBase64(iv),
        data: bytesToBase64(new Uint8Array(ciphertext)),
    };
};

/** Passes plain bodies straight through; unwraps envelopes. */
export const maybeDecrypt = async (payload) =>
    isEncryptedPayload(payload) ? decryptPayload(payload) : payload;
