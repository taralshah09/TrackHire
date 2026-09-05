import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../service/ApiService';

/**
 * Second screen of a brand-new Google signup.
 *
 * Google gave us a verified identity but no username, and no `users` row exists
 * yet — it is created only when this form is submitted.
 */
export default function ChooseUsernamePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const passed = location.state || {};
    const [signupToken, setSignupToken] = useState(passed.signupToken || '');
    const [username, setUsername] = useState(passed.suggestedUsername || '');
    const [availability, setAvailability] = useState(null); // null | 'checking' | 'free' | 'taken' | reason
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const debounceRef = useRef(null);

    // Landing here directly (a refresh, a bookmark) means there is no verified
    // Google identity in flight, so there is nothing to complete.
    useEffect(() => {
        if (!passed.signupToken) {
            navigate('/register', { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const checkAvailability = useCallback((value) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!value || value.trim().length < 3) {
            setAvailability(null);
            return;
        }
        setAvailability('checking');
        debounceRef.current = setTimeout(async () => {
            try {
                const response = await api.usernameAvailable(value.trim());
                const data = await response.json();
                if (data.available) {
                    setAvailability('free');
                } else {
                    setAvailability(data.reason || 'taken');
                }
            } catch {
                setAvailability(null);
            }
        }, 400);
    }, []);

    const handleChange = (e) => {
        const value = e.target.value;
        setUsername(value);
        setErrorMsg('');
        checkAvailability(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);
        try {
            const response = await api.googleComplete(signupToken, username.trim());
            const data = await response.json();

            if (response.ok && data.token && data.refreshToken) {
                login(data);
                navigate('/onboarding', { replace: true });
                return;
            }

            // A rejection consumes the pending token, so the server hands back a
            // replacement. Swap it in and let them try another name instead of
            // sending them through Google again for one typo.
            if (data.signupToken) {
                setSignupToken(data.signupToken);
                setErrorMsg(data.message || 'Please pick a different username.');
                setAvailability('taken');
                return;
            }

            // No replacement token means the 15-minute window lapsed.
            toast.error(data.message || 'Sign-in session expired. Please try again.');
            navigate('/register', { replace: true });
        } catch {
            setErrorMsg('Something went wrong on our end. Try again in a moment.');
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = !loading && username.trim().length >= 3 && availability !== 'checking';

    return (
        <div
            className="min-h-screen bg-surface flex items-center justify-center font-body-lg text-brutalist-black selection:bg-vibrant-orange selection:text-pure-white overflow-hidden relative"
            style={{ padding: '48px' }}
        >
            <style>{`
                .active-btn:active {
                    transform: translate(4px, 4px) !important;
                    box-shadow: 0px 0px 0px 0px #060608 !important;
                }
            `}</style>

            <div className="absolute inset-0 pointer-events-none opacity-20" style={{
                backgroundImage: 'linear-gradient(to right, #060608 1px, transparent 1px), linear-gradient(to bottom, #060608 1px, transparent 1px)',
                backgroundSize: '64px 64px'
            }}></div>

            <div
                className="w-full max-w-lg bg-pure-white border-[4px] border-brutalist-black z-10"
                style={{ padding: '48px', boxShadow: '12px 12px 0px 0px #060608' }}
            >
                <div className="font-headline-md text-2xl uppercase tracking-tighter border-b-[3px] border-brutalist-black inline-block mb-8" style={{ paddingBottom: '8px' }}>
                    TRACK<span className="text-vibrant-orange">HIRE</span>
                </div>

                <h1 className="font-black text-4xl uppercase mb-2 leading-none">Pick a<br />Username</h1>
                <p className="font-label-mono font-bold text-sm mb-8 text-brutalist-black opacity-80">
                    Signed in as {passed.email}. This is the only thing left.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="font-label-mono font-bold uppercase text-sm">Username</label>
                        <input
                            type="text"
                            name="username"
                            required
                            autoFocus
                            value={username}
                            onChange={handleChange}
                            placeholder="e.g. alex_johnson"
                            className="w-full bg-pure-white border-[3px] border-brutalist-black font-body-lg text-base outline-none focus:border-vibrant-orange transition-colors"
                            style={{ padding: '12px 16px' }}
                        />
                        <span className="font-label-mono font-bold text-[10px] uppercase min-h-[14px]">
                            {availability === 'checking' && <span className="text-brutalist-black/50">Checking…</span>}
                            {availability === 'free' && <span className="text-green-600">✓ Available</span>}
                            {availability === 'taken' && <span className="text-red-500">✗ Already taken</span>}
                            {availability && !['checking', 'free', 'taken'].includes(availability) && (
                                <span className="text-red-500">{availability}</span>
                            )}
                        </span>
                    </div>

                    {errorMsg && (
                        <div className="border-[3px] border-brutalist-black bg-vibrant-orange text-pure-white font-label-mono font-bold text-xs uppercase" style={{ padding: '12px 16px' }}>
                            {errorMsg}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className={`w-full font-black uppercase text-xl border-[3px] border-brutalist-black transition-all flex items-center justify-center ${canSubmit
                            ? 'bg-vibrant-orange text-pure-white hover:bg-brutalist-black active-btn cursor-pointer'
                            : 'bg-[#e5e5e5] text-brutalist-black/50 cursor-not-allowed'
                            }`}
                        style={{ padding: '16px 24px', boxShadow: canSubmit ? '6px 6px 0px 0px #060608' : '0px 0px 0px 0px #060608' }}
                    >
                        {loading ? 'Creating…' : 'Finish Signup'}
                    </button>
                </form>
            </div>
        </div>
    );
}
