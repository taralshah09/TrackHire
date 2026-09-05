import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../service/ApiService';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function LoginPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({ loginIdentifier: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);
        try {
            // Through ApiService so the body goes out encrypted and a 401 is not
            // mistaken for an expired session (which would hard-navigate away
            // before this error is ever shown).
            const response = await api.login(formData.loginIdentifier, formData.password);
            const data = await response.json();
            if (response.ok && data.token && data.refreshToken) {
                const ok = login(data);
                if (ok !== false) {
                    toast.success('Welcome back!');
                    navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
                } else {
                    setErrorMsg('Failed to save login session.');
                    toast.error('Failed to save login session.');
                }
            } else if (data.code === 'NO_PASSWORD_ACCOUNT') {
                // Registered with Google and never set a password. Point at the
                // button rather than repeating "invalid credentials".
                const msg = 'Account not found. If you signed up with Google, continue with Google below.';
                setErrorMsg(msg);
                toast.error(msg);
            } else {
                const msg = data.message || "We couldn't log you in. Check your email and password and try again.";
                setErrorMsg(msg);
                toast.error(msg);
            }
        } catch {
            setErrorMsg('Something went wrong on our end. Refresh the page — your data is safe.');
            toast.error('Something went wrong on our end. Refresh the page — your data is safe.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center font-body-lg text-brutalist-black selection:bg-vibrant-orange selection:text-pure-white overflow-hidden relative" style={{ padding: "48px" }}>
            <style>{`
                .sticker-rotate-pos { transform: rotate(3deg); }
                .sticker-rotate-neg { transform: rotate(-3deg); }
                .active-btn:active {
                    transform: translate(4px, 4px) !important;
                    box-shadow: 0px 0px 0px 0px #060608 !important;
                }
            `}</style>

            {/* Background grid */}
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{
                backgroundImage: 'linear-gradient(to right, #060608 1px, transparent 1px), linear-gradient(to bottom, #060608 1px, transparent 1px)',
                backgroundSize: '64px 64px'
            }}></div>

            <div className="w-full max-w-5xl bg-pure-white border-[4px] border-brutalist-black rounded-none flex flex-col md:flex-row min-h-[600px] z-10" style={{ boxShadow: '12px 12px 0px 0px #060608' }}>

                {/* Left Panel */}
                <div className="hidden md:flex flex-col flex-1 border-r-[4px] border-brutalist-black bg-vibrant-orange text-brutalist-black justify-between relative overflow-hidden" style={{ padding: "48px" }}>
                    <div className="relative z-10">
                        <Link to="/" className="font-headline-md text-3xl uppercase tracking-tighter block mb-12 border-b-[3px] border-brutalist-black inline-block" style={{ paddingBottom: "8px" }}>
                            TRACK<span className="text-pure-white">HIRE</span>
                        </Link>
                        <h1 className="font-black text-5xl uppercase leading-none mb-6">
                            Welcome<br />Back.
                        </h1>
                        <p className="font-label-mono font-bold text-base max-w-sm">
                            Your pipeline is waiting. <br />Stop hunting. <br />Start landing.
                        </p>
                    </div>

                    <div className="relative z-10 flex flex-col gap-4 mt-12">
                        {[
                            { stat: '500+', label: 'Companies' },
                            { stat: '< 5 min', label: 'Alerts' },
                            { stat: '9 min', label: 'Daily time' },
                        ].map(({ stat, label }, i) => (
                            <div key={label} className={`flex items-center gap-4 bg-pure-white border-[3px] border-brutalist-black w-max ${i % 2 === 0 ? 'sticker-rotate-neg' : 'sticker-rotate-pos'}`} style={{ boxShadow: '4px 4px 0px 0px #060608', padding: "8px 16px" }}>
                                <span className="font-black text-xl text-vibrant-orange min-w-[72px]">{stat}</span>
                                <span className="font-label-mono text-sm font-bold uppercase">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="flex-1 flex flex-col justify-center bg-pure-white relative" style={{ padding: "48px" }}>
                    {/* decorative star */}
                    <svg width="48" height="48" viewBox="0 0 100 100" className="absolute top-6 right-6 fill-pure-white stroke-brutalist-black stroke-[4px] hidden lg:block sticker-rotate-pos pointer-events-none">
                        <polygon points="50,5 62,38 95,50 62,62 50,95 38,62 5,50 38,38" strokeLinejoin="round" />
                    </svg>

                    <div className="md:hidden font-headline-md text-2xl uppercase tracking-tighter block mb-8 border-b-[3px] border-brutalist-black inline-block w-max" style={{ paddingBottom: "8px" }}>
                        TRACK<span className="text-vibrant-orange">HIRE</span>
                    </div>

                    <h2 className="font-black text-4xl uppercase mb-2">Sign In</h2>
                    <p className="font-label-mono font-bold text-sm mb-10 text-brutalist-black opacity-80">
                        New here?{' '}
                        <Link to="/register" className="text-vibrant-orange hover:underline decoration-[2px] underline-offset-4 opacity-100">
                            Create a free account →
                        </Link>
                    </p>

                    {/* Inline spacing: Tailwind's margin utilities are inert in this
                        app, and the button's offset shadow needs the clearance. */}
                    <div style={{ marginBottom: '28px' }}>
                        <GoogleSignInButton />
                    </div>

                    <div className="flex items-center gap-4" style={{ marginBottom: '24px' }}>
                        <span className="flex-1 h-[3px] bg-brutalist-black"></span>
                        <span className="font-label-mono font-black text-[11px] uppercase">or</span>
                        <span className="flex-1 h-[3px] bg-brutalist-black"></span>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="font-label-mono font-bold uppercase text-sm">Email Address</label>
                            <input
                                type="text"
                                name="loginIdentifier"
                                placeholder="name@company.com"
                                required
                                value={formData.loginIdentifier}
                                onChange={handleChange}
                                className="w-full bg-pure-white border-[3px] border-brutalist-black font-body-lg text-base outline-none focus:border-vibrant-orange transition-colors"
                                style={{ padding: "12px 16px" }}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <label className="font-label-mono font-bold uppercase text-sm">Password</label>
                                <a href="#" className="font-label-mono text-xs font-bold uppercase hover:text-vibrant-orange transition-colors">
                                    Forgot?
                                </a>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="••••••••"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-pure-white border-[3px] border-brutalist-black font-body-lg text-base outline-none focus:border-vibrant-orange transition-colors"
                                    style={{ padding: "12px 48px 12px 16px" }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-xl hover:text-vibrant-orange transition-colors"
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-4 font-black uppercase text-xl bg-vibrant-orange text-pure-white border-[3px] border-brutalist-black transition-transform hover:bg-brutalist-black disabled:opacity-50 disabled:cursor-not-allowed active-btn flex items-center justify-center"
                            style={{ padding: "16px 24px", boxShadow: loading ? '0px 0px 0px 0px #060608' : '6px 6px 0px 0px #060608' }}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Error popup */}
            {errorMsg && (
                <div onClick={() => setErrorMsg('')} className="fixed inset-0 bg-brutalist-black/80 flex items-center justify-center z-[9999]" style={{ padding: "16px" }}>
                    <div onClick={e => e.stopPropagation()} className="bg-pure-white border-[4px] border-brutalist-black max-w-md w-full text-center sticker-rotate-neg" style={{ padding: "32px", boxShadow: '12px 12px 0px 0px #FF6B00' }}>
                        <div className="w-16 h-16 border-[3px] border-brutalist-black bg-vibrant-orange text-pure-white flex items-center justify-center mx-auto mb-6 rounded-full font-black text-4xl leading-none">
                            <span style={{ marginTop: '-4px' }}>!</span>
                        </div>
                        <h3 className="font-black text-2xl uppercase mb-4">Login Failed</h3>
                        <p className="font-label-mono font-bold mb-8 text-sm">{errorMsg}</p>
                        <button onClick={() => setErrorMsg('')} className="font-black uppercase text-lg bg-brutalist-black text-pure-white border-[3px] border-brutalist-black transition-transform hover:bg-vibrant-orange active-btn inline-block" style={{ padding: "12px 32px", boxShadow: '6px 6px 0px 0px #FF6B00' }}>
                            Try Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}