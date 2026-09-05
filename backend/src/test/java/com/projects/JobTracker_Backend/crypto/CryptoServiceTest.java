package com.projects.JobTracker_Backend.crypto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class CryptoServiceTest {

    /** Fixed 32-byte key so the test is deterministic. */
    private static final String KEY = Base64.getEncoder().encodeToString(new byte[32]);

    private CryptoService crypto;

    @BeforeEach
    void setUp() {
        crypto = new CryptoService(true, KEY);
        crypto.init();
    }

    @Test
    void roundTripsArbitraryJson() {
        String json = "{\"content\":[{\"id\":1,\"title\":\"SDE Intern\"}],\"totalPages\":3}";

        EncryptedPayload payload = crypto.encrypt(json);

        assertTrue(payload.encrypted());
        assertEquals(EncryptedPayload.VERSION, payload.v());
        assertEquals(json, crypto.decrypt(payload));
    }

    @Test
    void usesAFreshNonceEveryCall() {
        // Nonce reuse under GCM is catastrophic, so this is worth pinning down.
        EncryptedPayload first = crypto.encrypt("same plaintext");
        EncryptedPayload second = crypto.encrypt("same plaintext");

        assertNotEquals(first.iv(), second.iv());
        assertNotEquals(first.data(), second.data());
    }

    @Test
    void emitsA96BitNonce() {
        byte[] nonce = Base64.getDecoder().decode(crypto.encrypt("x").iv());
        assertEquals(12, nonce.length);
    }

    @Test
    void rejectsTamperedCiphertext() {
        EncryptedPayload payload = crypto.encrypt("{\"salary\":100000}");
        byte[] ciphertext = Base64.getDecoder().decode(payload.data());
        ciphertext[0] ^= 0xff;
        String tampered = Base64.getEncoder().encodeToString(ciphertext);

        assertThrows(IllegalStateException.class, () -> crypto.decrypt(payload.iv(), tampered));
    }

    @Test
    void refusesToStartWithoutAKey() {
        CryptoService noKey = new CryptoService(true, "");
        assertThrows(IllegalStateException.class, noKey::init);
    }

    @Test
    void refusesAKeyOfTheWrongLength() {
        String shortKey = Base64.getEncoder().encodeToString(new byte[16]);
        CryptoService weak = new CryptoService(true, shortKey);
        assertThrows(IllegalStateException.class, weak::init);
    }

    @Test
    void refusesNonBase64Key() {
        CryptoService bad = new CryptoService(true, "not base64!!!");
        assertThrows(IllegalStateException.class, bad::init);
    }

    @Test
    void startsWithoutAKeyWhenDisabled() {
        CryptoService disabled = new CryptoService(false, "");
        assertDoesNotThrow(disabled::init);
        assertFalse(disabled.isEnabled());
        assertThrows(IllegalStateException.class, () -> disabled.encrypt("x"));
    }
}
