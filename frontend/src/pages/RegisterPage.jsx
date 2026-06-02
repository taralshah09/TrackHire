import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiEye, FiEyeOff, FiZap, FiTarget, FiBarChart2 } from 'react-icons/fi';

const STRENGTHS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#060608', '#FF6B00', '#2dd4bf', '#4ade80'];

function calcStrength(pw) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) s++;
    return Math.min(s, 4);
}

export default function RegisterPage() {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    const [formData, setFormData] = useState({
        username: '', email: '', phoneNumber: '', password: '', confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [strength, setStrength] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [isRegistering, setIsRegistering] = useState(false);

    React.useEffect(() => {
        if (isAuthenticated && !isRegistering) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, isRegistering, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'password') setStrength(calcStrength(value));
    };

    const validate = () => {
        if (!formData.username.trim()) { setErrorMsg('Full name is required.'); return false; }
        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) { setErrorMsg('Enter a valid email address.'); return false; }
        if (formData.password.length < 8) { setErrorMsg('Password must be at least 8 characters.'); return false; }
        if (formData.password !== formData.confirmPassword) { setErrorMsg('Passwords do not match.'); return false; }
        if (!agreedToTerms) { setErrorMsg('Agree to the Terms of Service to continue.'); return false; }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setErrorMsg('');
        setLoading(true);
        setIsRegistering(true);
        try {
            const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username, email: formData.email,
                    phoneNumber: formData.phoneNumber || null, password: formData.password,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                const lr = await fetch(import.meta.env.VITE_API_BASE_URL + '/auth/login', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginIdentifier: formData.email, password: formData.password }),
                });
                const ld = await lr.json();
                if (lr.ok && ld.token && ld.refreshToken) {
                    login(ld);
                    navigate('/onboarding', { replace: true });
                    return;
                } else {
                    navigate('/login');
                    return;
                }
            } else {
                const msg = data.message || 'Registration failed.';
                setErrorMsg(msg);
            }
        } catch {
            setErrorMsg('Something went wrong on our end. Refresh the page — your data is safe.');
        }
        setLoading(false);
        setIsRegistering(false);
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

            <div className="w-full max-w-5xl bg-pure-white border-[4px] border-brutalist-black rounded-none flex flex-col md:flex-row z-10" style={{ boxShadow: '12px 12px 0px 0px #060608' }}>

                {/* Left Panel */}
                <div className="hidden md:flex flex-col flex-[0.8] border-r-[4px] border-brutalist-black bg-brutalist-black text-pure-white justify-between relative overflow-hidden" style={{ padding: "48px" }}>
                    <div className="relative z-10">
                        <Link to="/" className="font-headline-md text-3xl uppercase tracking-tighter block mb-12 border-b-[3px] border-pure-white inline-block" style={{ paddingBottom: "8px" }}>
                            TRACK<span className="text-vibrant-orange">HIRE</span>
                        </Link>
                        <h1 className="font-black text-5xl uppercase leading-none mb-6">
                            Start<br />Tracking<br />Smarter.
                        </h1>
                        <p className="font-label-mono font-bold text-base max-w-[200px] mb-8">
                            Set up in 3 minutes. Free forever.
                        </p>
                    </div>

                    <div className="relative z-10 flex flex-col gap-6 mt-8">
                        {[
                            { icon: <FiZap />, text: 'Alerts in < 5 minutes' },
                            { icon: <FiTarget />, text: '500+ companies tracked' },
                            { icon: <FiBarChart2 />, text: 'Pipeline built for you' },
                        ].map(({ icon, text }) => (
                            <div key={text} className="flex items-center gap-4">
                                <span className="text-2xl bg-pure-white w-10 h-10 flex items-center justify-center border-[2px] border-pure-white" style={{ boxShadow: '3px 3px 0px 0px #FF6B00' }}>{icon}</span>
                                <span className="font-label-mono text-sm font-bold uppercase">{text}</span>
                            </div>
                        ))}
                        <div className="bg-vibrant-orange border-[3px] border-pure-white sticker-rotate-neg w-max mt-8 shadow-[4px_4px_0px_0px_#FFFFFF]" style={{ padding: "16px" }}>
                            <span className="font-label-mono text-xs font-black uppercase text-pure-white">NO CREDIT CARD REQUIRED</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="flex-[1.2] flex flex-col justify-center bg-pure-white relative" style={{ padding: "48px" }}>
                    <div className="md:hidden font-headline-md text-2xl uppercase tracking-tighter block mb-8 border-b-[3px] border-brutalist-black inline-block w-max" style={{ paddingBottom: "8px" }}>
                        TRACK<span className="text-vibrant-orange">HIRE</span>
                    </div>

                    <h2 className="font-black text-4xl uppercase mb-2">Create Account</h2>
                    <p className="font-label-mono font-bold text-sm mb-8 text-brutalist-black opacity-80">
                        Already have an account?{' '}
                        <Link to="/login" className="text-vibrant-orange hover:underline decoration-[2px] underline-offset-4 opacity-100">
                            Sign in →
                        </Link>
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="font-label-mono font-bold uppercase text-sm">Full Name</label>
                                <input
                                    type="text" name="username" required
                                    placeholder="e.g. Alex Johnson"
                                    value={formData.username} onChange={handleChange}
                                    className="w-full bg-pure-white border-[3px] border-brutalist-black font-body-lg text-base outline-none focus:border-vibrant-orange transition-colors"
                                    style={{ padding: "12px 16px" }}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-label-mono font-bold uppercase text-sm">Email Address</label>
                                <input
                                    type="email" name="email" required
                                    placeholder="name@company.com"
                                    value={formData.email} onChange={handleChange}
                                    className="w-full bg-pure-white border-[3px] border-brutalist-black font-body-lg text-base outline-none focus:border-vibrant-orange transition-colors"
                                    style={{ padding: "12px 16px" }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="font-label-mono font-bold uppercase text-sm">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password" required
                                        placeholder="••••••••"
                                        value={formData.password} onChange={handleChange}
                                        className="w-full bg-pure-white border-[3px] border-brutalist-black font-body-lg text-base outline-none focus:border-vibrant-orange transition-colors"
                                        style={{ padding: "12px 40px 12px 16px" }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-lg hover:text-vibrant-orange transition-colors"
                                    >
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                                {/* Strength bar */}
                                {formData.password && (
                                    <div className="mt-1">
                                        <div className="flex gap-1 h-2 mb-1">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="flex-1 border-[1px] border-brutalist-black" style={{
                                                    background: i <= strength ? STRENGTH_COLORS[strength] : '#e5e5e5'
                                                }} />
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="font-label-mono text-[10px] font-black uppercase" style={{ color: STRENGTH_COLORS[strength] || '#060608' }}>
                                                {STRENGTHS[strength] || 'Weak'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-label-mono font-bold uppercase text-sm">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="confirmPassword" required
                                        placeholder="••••••••"
                                        value={formData.confirmPassword} onChange={handleChange}
                                        className={`w-full bg-pure-white border-[3px] font-body-lg text-base outline-none transition-colors ${formData.confirmPassword && formData.confirmPassword !== formData.password
                                            ? 'border-red-500 focus:border-red-500'
                                            : 'border-brutalist-black focus:border-vibrant-orange'
                                            }`}
                                        style={{ padding: "12px 40px 12px 16px" }}
                                    />
                                </div>
                            </div>
                        </div>

                        <label className="flex items-start gap-3 mt-4 cursor-pointer group">
                            <div className="relative flex items-center justify-center mt-0.5">
                                <input
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={e => setAgreedToTerms(e.target.checked)}
                                    className="appearance-none w-5 h-5 border-[3px] border-brutalist-black bg-pure-white checked:bg-vibrant-orange transition-colors cursor-pointer"
                                />
                                {agreedToTerms && (
                                    <svg className="absolute w-3 h-3 text-pure-white pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                )}
                            </div>
                            <span className="font-label-mono font-bold text-xs uppercase leading-relaxed">
                                I agree to the{' '}
                                <a href="#" className="text-vibrant-orange underline decoration-[2px] underline-offset-2">Terms of Service</a>
                                {' '}and{' '}
                                <a href="#" className="text-vibrant-orange underline decoration-[2px] underline-offset-2">Privacy Policy</a>
                            </span>
                        </label>

                        {(() => {
                            const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
                            const isFormValid = passwordsMatch && agreedToTerms && !loading && formData.username && formData.email;

                            return (
                                <div className="mt-4 flex flex-col gap-2">
                                    <button
                                        type="submit"
                                        disabled={!isFormValid}
                                        className={`w-full font-black uppercase text-xl border-[3px] border-brutalist-black transition-all flex items-center justify-center ${isFormValid
                                            ? 'bg-vibrant-orange text-pure-white hover:bg-brutalist-black active-btn cursor-pointer'
                                            : 'bg-[#e5e5e5] text-brutalist-black/50 cursor-not-allowed'
                                            }`}
                                        style={{ padding: "16px 24px", boxShadow: !isFormValid || loading ? '0px 0px 0px 0px #060608' : '6px 6px 0px 0px #060608' }}
                                    >
                                        {loading ? 'Creating...' : 'Create Account'}
                                    </button>

                                    {(!isFormValid) && (
                                        <p className="font-label-mono font-bold text-[10px] uppercase text-brutalist-black/60 text-center mt-2">
                                            {formData.confirmPassword && formData.password !== formData.confirmPassword
                                                ? '⚠ Passwords do not match'
                                                : !agreedToTerms
                                                    ? '☑ Please agree to the terms'
                                                    : 'Fill all fields to continue'}
                                        </p>
                                    )}
                                </div>
                            );
                        })()}
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
                        <h3 className="font-black text-2xl uppercase mb-4">Registration Failed</h3>
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