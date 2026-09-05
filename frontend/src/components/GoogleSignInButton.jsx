import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../service/ApiService';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Google Identity Services, loaded from the script tag in index.html.
 *
 * We render Google's own button rather than driving `prompt()` from a brutalist
 * one. The rendered button ignores our CSS, which is a real cost — but One Tap
 * is subject to FedCM and third-party-cookie settings and can silently no-op,
 * and a sign-in button that sometimes does nothing is worse than one that does
 * not match the page. The frame around it is ours.
 */
export default function GoogleSignInButton({ width = 320 }) {
    const navigate = useNavigate();
    const { login } = useAuth();
    const buttonRef = useRef(null);
    const [status, setStatus] = useState('loading'); // loading | ready | unavailable
    const [busy, setBusy] = useState(false);

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

    useEffect(() => {
        if (!CLIENT_ID) {
            setStatus('unavailable');
            return undefined;
        }

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
                    window.google.accounts.id.renderButton(buttonRef.current, {
                        theme: 'outline',
                        size: 'large',
                        text: 'continue_with',
                        width,
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
    }, [handleCredential, width]);

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

    return (
        <div className="w-full flex flex-col items-center">
            <div
                ref={buttonRef}
                className={`flex justify-center ${busy ? 'opacity-50 pointer-events-none' : ''}`}
                style={{ minHeight: '44px' }}
            />
            {status === 'loading' && (
                <span className="font-label-mono font-bold text-[10px] uppercase text-brutalist-black/50 mt-2">
                    Loading Google…
                </span>
            )}
        </div>
    );
}
