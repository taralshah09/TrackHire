import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const inputBaseStyle = {
    width: '100%',
    padding: '12px 14px',
    background: 'var(--color-surface-3)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    color: 'var(--color-white)',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
};

const STRENGTHS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', '#f87171', '#fbbf24', '#2dd4bf', '#4ade80'];

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
    const { login, setRedirectPath } = useAuth();

    const [formData, setFormData] = useState({
        username: '', email: '', phoneNumber: '', password: '', confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [focused, setFocused] = useState('');
    const [strength, setStrength] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');

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
                // Auto-login
                const lr = await fetch(import.meta.env.VITE_API_BASE_URL + '/auth/login', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginIdentifier: formData.email, password: formData.password }),
                });
                const ld = await lr.json();
                if (lr.ok && ld.token && ld.refreshToken) {
                    setRedirectPath('/onboarding');
                    login(ld);
                    toast.success('Account created! Welcome to TrackHire.');
                } else {
                    toast.success('Account created! Sign in to continue.');
                    navigate('/login');
                }
            } else {
                const msg = data.message || 'Registration failed.';
                setErrorMsg(msg);
            }
        } catch {
            setErrorMsg('Something went wrong on our end. Refresh the page — your data is safe.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = (name) => ({
        ...inputBaseStyle,
        borderColor: focused === name ? 'var(--color-orange)' : 'var(--color-border)',
        boxShadow: focused === name ? '0 0 0 3px rgba(249,115,22,0.15)' : 'none',
        background: focused === name ? '#1a1a1a' : 'var(--color-surface-3)',
    });

    const labelStyle = {
        display: 'block',
        fontFamily: 'var(--font-body)', fontWeight: 500,
        fontSize: '13px', color: 'var(--color-white-65)',
        marginBottom: '8px',
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--color-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', fontFamily: 'var(--font-body)',
        }}>
            <style>{`
                @media (max-width: 768px) {
                    .register-left-panel { display: none !important; }
                    .register-card { max-width: 480px !important; }
                }
                @media (min-width: 769px) {
                    .register-form-grid { grid-template-columns: 1fr 1fr !important; }
                }
                @keyframes popupFadeIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
                    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                @keyframes backdropFadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
            `}</style>

            <div
                className="register-card"
                style={{
                    width: '100%', maxWidth: '960px',
                    background: 'var(--color-surface-1)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '20px', overflow: 'hidden',
                    display: 'flex',
                }}
            >
                {/* Left panel */}
                <div
                    className="register-left-panel"
                    style={{
                        width: '340px', flexShrink: 0,
                        background: 'linear-gradient(145deg, rgba(249,115,22,0.14) 0%, rgba(8,8,8,0) 70%)',
                        borderRight: '1px solid var(--color-border)',
                        padding: '48px 36px',
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        position: 'relative', overflow: 'hidden',
                    }}
                >
                    <div style={{
                        position: 'absolute', top: '-80px', right: '-80px',
                        width: '280px', height: '280px',
                        background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)',
                        borderRadius: '50%', pointerEvents: 'none',
                    }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            fontFamily: 'var(--font-display)', fontWeight: 800,
                            fontSize: '22px', color: 'var(--color-white)',
                            letterSpacing: '-0.02em', marginBottom: '40px',
                        }}>
                            Track<span style={{ color: 'var(--color-orange)' }}>H</span>ire
                        </div>
                        <h1 style={{
                            fontFamily: 'var(--font-display)', fontWeight: 800,
                            fontSize: '28px', letterSpacing: '-0.025em',
                            lineHeight: 1.2, color: 'var(--color-white)',
                            margin: '0 0 16px',
                        }}>
                            Start tracking smarter.
                        </h1>
                        <p style={{
                            fontFamily: 'var(--font-body)', fontSize: '14px',
                            color: 'var(--color-white-65)', lineHeight: 1.7, margin: 0,
                        }}>
                            Set up in 3 minutes. Free forever.
                        </p>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {[
                            { icon: '⚡', text: 'Alerts in < 5 minutes' },
                            { icon: '🎯', text: '500+ companies tracked' },
                            { icon: '📊', text: 'Pipeline built for you' },
                        ].map(({ icon, text }) => (
                            <div key={text} style={{
                                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px',
                            }}>
                                <span style={{ fontSize: '18px' }}>{icon}</span>
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-65)' }}>{text}</span>
                            </div>
                        ))}
                        <p style={{
                            fontFamily: 'var(--font-body)', fontSize: '12px',
                            color: 'var(--color-white-20)', marginTop: '16px', margin: '16px 0 0',
                        }}>
                            No credit card required. Free plan available.
                        </p>
                    </div>
                </div>

                {/* Right panel — form */}
                <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                    <h2 style={{
                        fontFamily: 'var(--font-display)', fontWeight: 800,
                        fontSize: '24px', letterSpacing: '-0.02em',
                        color: 'var(--color-white)', margin: '0 0 6px',
                    }}>
                        Create Free Account
                    </h2>
                    <p style={{
                        fontFamily: 'var(--font-body)', fontSize: '14px',
                        color: 'var(--color-white-65)', margin: '0 0 28px',
                    }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--color-orange)', fontWeight: 500, textDecoration: 'none' }}>
                            Sign in →
                        </Link>
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div
                            className="register-form-grid"
                            style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '16px' }}
                        >
                            {/* Full name */}
                            <div>
                                <label style={labelStyle}>Full name</label>
                                <input
                                    type="text" name="username" required
                                    placeholder="e.g. Alex Johnson"
                                    value={formData.username} onChange={handleChange}
                                    onFocus={() => setFocused('username')} onBlur={() => setFocused('')}
                                    style={inputStyle('username')}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label style={labelStyle}>Email address</label>
                                <input
                                    type="email" name="email" required
                                    placeholder="name@company.com"
                                    value={formData.email} onChange={handleChange}
                                    onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                                    style={inputStyle('email')}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label style={labelStyle}>Password</label>
                                <input
                                    type="password" name="password" required
                                    placeholder="••••••••"
                                    value={formData.password} onChange={handleChange}
                                    onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                                    style={inputStyle('password')}
                                />
                                {/* Strength bar */}
                                {formData.password && (
                                    <div style={{ marginTop: '8px' }}>
                                        <div style={{ display: 'flex', gap: '4px', height: '3px' }}>
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} style={{
                                                    flex: 1, borderRadius: '4px',
                                                    background: i <= strength ? STRENGTH_COLORS[strength] : 'var(--color-border)',
                                                    transition: 'background 0.3s',
                                                }} />
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, color: STRENGTH_COLORS[strength] || 'var(--color-white-40)', letterSpacing: '0.06em' }}>
                                                {STRENGTHS[strength] || 'Weak'}
                                            </span>
                                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-white-40)' }}>
                                                At least 8 characters.
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm password */}
                            <div>
                                <label style={labelStyle}>Confirm password</label>
                                <input
                                    type="password" name="confirmPassword" required
                                    placeholder="••••••••"
                                    value={formData.confirmPassword} onChange={handleChange}
                                    onFocus={() => setFocused('confirm')} onBlur={() => setFocused('')}
                                    style={{
                                        ...inputStyle('confirm'),
                                        borderColor: formData.confirmPassword && formData.confirmPassword !== formData.password
                                            ? '#ef4444'
                                            : focused === 'confirm' ? 'var(--color-orange)' : 'var(--color-border)',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Terms */}
                        <label style={{
                            display: 'flex', alignItems: 'flex-start', gap: '10px',
                            cursor: 'pointer', marginBottom: '24px',
                        }}>
                            <input
                                type="checkbox"
                                checked={agreedToTerms}
                                onChange={e => setAgreedToTerms(e.target.checked)}
                                style={{ marginTop: '2px', accentColor: 'var(--color-orange)', width: '16px', height: '16px', flexShrink: 0 }}
                            />
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-65)', lineHeight: 1.5 }}>
                                I agree to the{' '}
                                <a href="#" style={{ color: 'var(--color-orange)', textDecoration: 'none' }}>Terms of Service</a>
                                {' '}and{' '}
                                <a href="#" style={{ color: 'var(--color-orange)', textDecoration: 'none' }}>Privacy Policy</a>
                            </span>
                        </label>

                        {/* Submit — only enabled when passwords match + terms agreed */}
                        {(() => {
                            const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
                            const isFormValid = passwordsMatch && agreedToTerms && !loading;
                            return (
                                <button
                                    type="submit"
                                    disabled={!isFormValid}
                                    style={{
                                        width: '100%',
                                        fontFamily: 'var(--font-display)', fontWeight: 700,
                                        fontSize: '14px', color: '#000',
                                        background: !isFormValid ? 'var(--color-white-20)' : 'var(--color-orange)',
                                        padding: '13px 24px',
                                        borderRadius: '8px', border: 'none',
                                        cursor: !isFormValid ? 'not-allowed' : 'pointer',
                                        opacity: !isFormValid ? 0.5 : 1,
                                        transition: 'background 0.2s, opacity 0.2s',
                                    }}
                                    onMouseEnter={e => { if (isFormValid) e.currentTarget.style.background = 'var(--color-orange-hover)'; }}
                                    onMouseLeave={e => { if (isFormValid) e.currentTarget.style.background = 'var(--color-orange)'; }}
                                >
                                    {loading ? 'Creating Account…' : 'Create Free Account'}
                                </button>
                            );
                        })()}

                        {/* Hint text when button is disabled */}
                        {(!agreedToTerms || !formData.confirmPassword || formData.password !== formData.confirmPassword) && (
                            <p style={{
                                fontFamily: 'var(--font-body)', fontSize: '12px',
                                color: 'var(--color-white-40)', textAlign: 'center',
                                marginTop: '8px', marginBottom: 0,
                            }}>
                                {formData.confirmPassword && formData.password !== formData.confirmPassword
                                    ? '⚠ Passwords do not match'
                                    : !agreedToTerms
                                        ? '☑ Please agree to the Terms of Service'
                                        : 'Fill in all required fields to continue'}
                            </p>
                        )}
                    </form>
                </div>
            </div>

            {/* Error modal popup */}
            {errorMsg && (
                <div
                    onClick={() => setErrorMsg('')}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 9999,
                        animation: 'backdropFadeIn 0.25s ease-out',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            position: 'fixed', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: 'var(--color-surface-1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '16px',
                            padding: '32px',
                            maxWidth: '400px',
                            width: '90%',
                            textAlign: 'center',
                            animation: 'popupFadeIn 0.3s ease-out',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        }}
                    >
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '50%',
                            background: 'rgba(239, 68, 68, 0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px',
                        }}>
                            <span style={{ fontSize: '28px' }}>✕</span>
                        </div>
                        <h3 style={{
                            fontFamily: 'var(--font-display)', fontWeight: 700,
                            fontSize: '18px', color: '#fca5a5',
                            margin: '0 0 8px',
                        }}>Registration Failed</h3>
                        <p style={{
                            fontFamily: 'var(--font-body)', fontSize: '14px',
                            color: 'var(--color-white-65)', lineHeight: 1.6,
                            margin: '0 0 24px',
                        }}>{errorMsg}</p>
                        <button
                            onClick={() => setErrorMsg('')}
                            style={{
                                fontFamily: 'var(--font-display)', fontWeight: 700,
                                fontSize: '14px', color: '#000',
                                background: 'var(--color-orange)',
                                padding: '10px 32px',
                                borderRadius: '8px', border: 'none',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-orange-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-orange)'}
                        >Try Again</button>
                    </div>
                </div>
            )}
        </div>
    );
}