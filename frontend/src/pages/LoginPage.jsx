import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ── Shared brand button styles ── */
const primaryBtn = {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '14px',
    color: '#000',
    background: 'var(--color-orange)',
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    letterSpacing: '0.01em',
    transition: 'background 0.2s, transform 0.15s',
};

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

export default function LoginPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({ loginIdentifier: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState('');

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8081/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok && data.token && data.refreshToken) {
                const ok = login(data);
                if (ok !== false) {
                    toast.success('Welcome back!');
                    navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
                } else {
                    toast.error('Failed to save login session.');
                }
            } else {
                toast.error(data.message || "We couldn't log you in. Check your email and password and try again.");
            }
        } catch {
            toast.error('Something went wrong on our end. Refresh the page — your data is safe.');
        } finally {
            setLoading(false);
        }
    };

    const getInputStyle = (name) => ({
        ...inputBaseStyle,
        borderColor: focused === name ? 'var(--color-orange)' : 'var(--color-border)',
        boxShadow: focused === name ? '0 0 0 3px rgba(249,115,22,0.15)' : 'none',
        background: focused === name ? '#1a1a1a' : 'var(--color-surface-3)',
    });

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--color-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'var(--font-body)',
        }}>
            <style>{`
                @media (max-width: 768px) {
                    .login-left-panel { display: none !important; }
                    .login-card { max-width: 440px !important; }
                }
            `}</style>

            <div
                className="login-card"
                style={{
                    width: '100%',
                    maxWidth: '900px',
                    background: 'var(--color-surface-1)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    display: 'flex',
                    minHeight: '560px',
                }}
            >
                {/* Left panel — brand splash */}
                <div
                    className="login-left-panel"
                    style={{
                        flex: 1,
                        background: 'linear-gradient(145deg, rgba(249,115,22,0.14) 0%, rgba(8,8,8,0) 60%)',
                        borderRight: '1px solid var(--color-border)',
                        padding: '48px 40px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Glow orb */}
                    <div style={{
                        position: 'absolute', top: '-60px', left: '-60px',
                        width: '300px', height: '300px',
                        background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',
                        borderRadius: '50%', pointerEvents: 'none',
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            fontFamily: 'var(--font-display)', fontWeight: 800,
                            fontSize: '24px', color: 'var(--color-white)',
                            letterSpacing: '-0.02em', marginBottom: '48px',
                        }}>
                            Track<span style={{ color: 'var(--color-orange)' }}>H</span>ire
                        </div>
                        <h1 style={{
                            fontFamily: 'var(--font-display)', fontWeight: 800,
                            fontSize: '32px', letterSpacing: '-0.025em',
                            lineHeight: 1.15, color: 'var(--color-white)',
                            margin: '0 0 16px',
                        }}>
                            Welcome back.
                        </h1>
                        <p style={{
                            fontFamily: 'var(--font-body)', fontSize: '15px',
                            color: 'var(--color-white-65)', lineHeight: 1.7, margin: 0,
                        }}>
                            Your pipeline is waiting.
                        </p>
                    </div>

                    {/* Stats strip */}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { stat: '500+', label: 'Companies monitored' },
                            { stat: '< 5 min', label: 'Alert delivery' },
                            { stat: '9 min/day', label: 'Avg daily time' },
                        ].map(({ stat, label }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{
                                    fontFamily: 'var(--font-mono)', fontWeight: 700,
                                    fontSize: '16px', color: 'var(--color-orange)',
                                    minWidth: '72px',
                                }}>{stat}</span>
                                <span style={{
                                    fontFamily: 'var(--font-body)', fontSize: '13px',
                                    color: 'var(--color-white-40)',
                                }}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right panel — form */}
                <div style={{
                    flex: 1, padding: '48px 40px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                }}>
                    <h2 style={{
                        fontFamily: 'var(--font-display)', fontWeight: 800,
                        fontSize: '28px', letterSpacing: '-0.025em',
                        color: 'var(--color-white)', margin: '0 0 8px',
                    }}>
                        Sign In
                    </h2>
                    <p style={{
                        fontFamily: 'var(--font-body)', fontSize: '14px',
                        color: 'var(--color-white-65)', margin: '0 0 32px',
                    }}>
                        New to TrackHire?{' '}
                        <Link to="/register" style={{ color: 'var(--color-orange)', fontWeight: 500, textDecoration: 'none' }}>
                            Create a free account →
                        </Link>
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Email */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontFamily: 'var(--font-body)', fontWeight: 500,
                                fontSize: '13px', color: 'var(--color-white-65)',
                                marginBottom: '8px',
                            }}>
                                Email address
                            </label>
                            <input
                                type="text"
                                name="loginIdentifier"
                                placeholder="name@company.com"
                                required
                                value={formData.loginIdentifier}
                                onChange={handleChange}
                                onFocus={() => setFocused('email')}
                                onBlur={() => setFocused('')}
                                style={getInputStyle('email')}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label style={{
                                    fontFamily: 'var(--font-body)', fontWeight: 500,
                                    fontSize: '13px', color: 'var(--color-white-65)',
                                }}>
                                    Password
                                </label>
                                <a href="#" style={{
                                    fontFamily: 'var(--font-body)', fontSize: '13px',
                                    color: 'var(--color-white-40)', textDecoration: 'none',
                                    transition: 'color 0.2s',
                                }}
                                    onMouseEnter={e => e.target.style.color = 'var(--color-orange)'}
                                    onMouseLeave={e => e.target.style.color = 'var(--color-white-40)'}
                                >
                                    Forgot password?
                                </a>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="••••••••"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    onFocus={() => setFocused('password')}
                                    onBlur={() => setFocused('')}
                                    style={{ ...getInputStyle('password'), paddingRight: '44px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none', border: 'none',
                                        cursor: 'pointer', color: 'var(--color-white-40)',
                                        fontSize: '14px', padding: '4px',
                                    }}
                                >
                                    {showPassword ? '🙈' : '👁'}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...primaryBtn,
                                opacity: loading ? 0.7 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--color-orange-hover)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-orange)'; }}
                        >
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    <p style={{
                        fontFamily: 'var(--font-body)', fontSize: '13px',
                        color: 'var(--color-white-40)', textAlign: 'center',
                        marginTop: '24px',
                    }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: 'var(--color-white-65)', fontWeight: 500, textDecoration: 'none' }}
                            onMouseEnter={e => e.target.style.color = 'var(--color-white)'}
                            onMouseLeave={e => e.target.style.color = 'var(--color-white-65)'}
                        >
                            Sign up →
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}