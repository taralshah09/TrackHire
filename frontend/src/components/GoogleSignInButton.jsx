import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../service/ApiService';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/** Google's four-colour "G", at the official proportions. */
function GoogleGlyph() {
    return (
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="shrink-0">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.6.27-3.15.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
    );
}

/**
 * Google Identity Services, loaded from the script tag in index.html.
 *
 * The visible button is ours — brutalist frame, offset shadow, Space Mono
 * label. Google's own rendered button is still what gets clicked: it sits over
 * ours, transparent and scaled up to cover the whole face. One Tap (`prompt()`)
 * is subject to FedCM and third-party-cookie settings and can silently no-op,
 * so we keep the real button as the click target and borrow its behaviour, not
 * its looks. The overlay is clipped to the frame, so nothing outside the border
 * is clickable, and it carries Google's own accessible label for screen readers
 * and keyboard users (the frame shows the pressed state on :focus-within).
 */
export default function GoogleSignInButton({ label = 'Continue with Google' }) {
    const navigate = useNavigate();
    const { login } = useAuth();
    const frameRef = useRef(null);
    const buttonRef = useRef(null);
    const [status, setStatus] = useState('loading'); // loading | ready | unavailable
    const [busy, setBusy] = useState(false);
    const [frameWidth, setFrameWidth] = useState(0);

    const handleCredential = useCallback(async ({ credential }) => {
        setBusy(true);
        try {
            const response = await api.googleSignIn(credential);
            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || 'Google sign-in failed.');
                return;
            }

            if (data.status === 'USERNAME_REQUIRED') {
                // Brand new: no account exists yet, so they pick a name first.
                navigate('/choose-username', {
                    state: {
                        signupToken: data.signupToken,
                        email: data.email,
                        suggestedUsername: data.suggestedUsername,
                    },
                });
                return;
            }

            if (data.token && data.refreshToken) {
                login(data);
                toast.success('Welcome back!');
                navigate('/dashboard', { replace: true });
                return;
            }

            toast.error('Google sign-in failed.');
        } catch {
            toast.error('Something went wrong signing in with Google.');
        } finally {
            setBusy(false);
        }
    }, [login, navigate]);

    // Google's button has to be rendered at least as wide as our frame or the
    // click target will not cover it, so track the frame's rendered width.
    useLayoutEffect(() => {
        const frame = frameRef.current;
        if (!frame) return undefined;

        setFrameWidth(Math.round(frame.getBoundingClientRect().width));
        const observer = new ResizeObserver(([entry]) => {
            setFrameWidth(Math.round(entry.contentRect.width));
        });
        observer.observe(frame);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!CLIENT_ID) {
            setStatus('unavailable');
            return undefined;
        }
        if (!frameWidth) return undefined;

        let cancelled = false;
        let attempts = 0;

        // The GIS script is loaded async, so it may not be there on first paint.
        // Give up after ~5s and render a disabled button that says so — a dead
        // button with no explanation is worse than an honest one.
        const timer = setInterval(() => {
            if (cancelled) return;
            attempts += 1;

            if (window.google?.accounts?.id) {
                clearInterval(timer);
                window.google.accounts.id.initialize({
                    client_id: CLIENT_ID,
                    callback: handleCredential,
                });
                if (buttonRef.current) {
                    // Re-rendering on resize would otherwise stack buttons.
                    buttonRef.current.innerHTML = '';
                    window.google.accounts.id.renderButton(buttonRef.current, {
                        theme: 'outline',
                        size: 'large',
                        text: 'continue_with',
                        width: Math.min(400, Math.max(200, frameWidth)), // GIS caps at 400
                    });
                }
                setStatus('ready');
            } else if (attempts > 50) {
                clearInterval(timer);
                setStatus('unavailable');
            }
        }, 100);

        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [handleCredential, frameWidth]);

    if (status === 'unavailable') {
        return (
            <div
                className="w-full border-[3px] border-brutalist-black bg-[#e5e5e5] text-brutalist-black/50 font-label-mono font-bold text-xs uppercase text-center"
                style={{ padding: '14px 16px' }}
            >
                Google sign-in unavailable
            </div>
        );
    }

    const interactive = status === 'ready' && !busy;

    return (
        <div className="w-full">
            <style>{`
                .gsi-frame { transition: transform 0.2s, box-shadow 0.2s; }
                .gsi-frame:active,
                .gsi-frame:focus-within {
                    transform: translate(4px, 4px);
                    box-shadow: 0px 0px 0px 0px #060608 !important;
                }
                .gsi-frame:hover .gsi-face { background-color: #060608; color: #FFFFFF; }
            `}</style>

            <div
                ref={frameRef}
                className={`gsi-frame relative w-full border-[3px] border-brutalist-black overflow-hidden ${interactive ? 'cursor-pointer' : 'opacity-50 pointer-events-none'}`}
                style={{ boxShadow: '6px 6px 0px 0px #060608' }}
            >
                {/* What the user sees. */}
                <div
                    aria-hidden="true"
                    className="gsi-face w-full flex items-center justify-center gap-3 bg-pure-white text-brutalist-black font-label-mono font-bold uppercase text-sm tracking-wide select-none transition-colors"
                    style={{ padding: '14px 16px' }}
                >
                    <GoogleGlyph />
                    <span>{busy ? 'Signing in…' : status === 'loading' ? 'Loading Google…' : label}</span>
                </div>

                {/* What actually gets clicked. */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0">
                    <div ref={buttonRef} style={{ transform: 'scale(2)', transformOrigin: 'center' }} />
                </div>
            </div>
        </div>
    );
}
