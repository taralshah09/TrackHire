package com.projects.JobTracker_Backend.crypto;

/**
 * Wire format for an encrypted response body.
 *
 * <pre>
 * { "encrypted": true, "v": 1, "iv": "&lt;base64 96-bit nonce&gt;", "data": "&lt;base64 ciphertext||tag&gt;" }
 * </pre>
 *
 * <p>{@code data} is exactly what {@code AES/GCM/NoPadding} emits, i.e. the
 * ciphertext with the 128-bit auth tag appended — the same layout the browser's
 * WebCrypto {@code AES-GCM} expects, so the client can decrypt with no
 * repackaging.
 *
 * @param encrypted always true; lets the client tell an envelope from a normal body
 * @param v         envelope version, for future key/format rotation
 * @param iv        base64 nonce, fresh for every single response
 * @param data      base64 ciphertext with appended auth tag
 */
public record EncryptedPayload(boolean encrypted, int v, String iv, String data) {

    public static final int VERSION = 1;

    public static EncryptedPayload of(String iv, String data) {
        return new EncryptedPayload(true, VERSION, iv, data);
    }
}
