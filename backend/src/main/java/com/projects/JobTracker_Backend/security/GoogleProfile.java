package com.projects.JobTracker_Backend.security;

/**
 * The claims we actually use out of a verified Google ID token.
 *
 * @param sub        Google's stable subject id. This, not the email, is the identity
 *                   key for an already-linked account: a person can change the
 *                   address on their Google account, but {@code sub} never changes.
 * @param email      always verified by the time this record exists (see {@link GoogleTokenVerifier})
 * @param name       display name, may be null
 * @param pictureUrl avatar URL, may be null
 */
public record GoogleProfile(String sub, String email, String name, String pictureUrl) {
}
