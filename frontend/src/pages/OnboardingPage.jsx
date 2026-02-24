import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../service/ApiService';
import Cookies from 'js-cookie';
import { FaPlus, FaTimes, FaCheckCircle, FaArrowRight, FaArrowLeft, FaBell, FaBriefcase, FaCode, FaRocket } from 'react-icons/fa';

/* ── Constants ── */
const ROLE_TYPE_OPTIONS = [
    'Intern', 'Junior', 'Mid-level', 'Senior', 'Lead',
    'Full-time', 'Part-time', 'Contract', 'Freelance',
];

const SUGGESTED_TITLES = [
    'Software Engineer', 'Frontend Developer', 'Backend Developer',
    'Full Stack Developer', 'Data Scientist', 'DevOps Engineer',
    'Product Manager', 'UI/UX Designer', 'Mobile Developer',
    'Cloud Engineer', 'ML Engineer', 'QA Engineer',
];

const SUGGESTED_SKILLS = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js',
    'TypeScript', 'AWS', 'Docker', 'SQL', 'Git',
    'C++', 'Go', 'Kubernetes', 'MongoDB', 'GraphQL',
];

/* ── Shared styles ── */
const inputStyle = {
    width: '100%',
    background: 'var(--color-surface-3)',
    border: '1px solid var(--color-border)',
    borderRadius: '10px',
    padding: '12px 16px',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    color: 'var(--color-white)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
};

export default function OnboardingPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [userId, setUserId] = useState(null);
    const [saving, setSaving] = useState(false);

    /* Preferences state */
    const [jobTitles, setJobTitles] = useState([]);
    const [skills, setSkills] = useState([]);
    const [roleTypes, setRoleTypes] = useState([]);
    const [newTitle, setNewTitle] = useState('');
    const [newSkill, setNewSkill] = useState('');

    /* Fetch userId on mount */
    useEffect(() => {
        (async () => {
            try {
                const username = user?.username || Cookies.get('username');
                if (!username) return;
                const res = await api.getUserByUsername(username);
                if (res.ok) {
                    const data = await res.json();
                    setUserId(data.id);
                }
            } catch (e) {
                console.error('Failed to fetch user:', e);
            }
        })();
    }, [user]);

    const totalSteps = 4; // 0=Welcome, 1=Titles, 2=Skills, 3=RoleTypes, then finish

    const next = () => setStep(s => Math.min(s + 1, totalSteps));
    const prev = () => setStep(s => Math.max(s - 1, 0));

    const handleFinish = async () => {
        if (!userId) {
            toast.error('Could not identify your account. Please try again.');
            return;
        }
        setSaving(true);
        try {
            const payload = { jobTitles, skills, roleTypes, emailEnabled: true };
            const res = await api.saveJobPreferences(userId, payload);
            if (res.ok) {
                toast.success("You're all set! Edit your preferences anytime from your profile.");
                navigate('/profile');
            } else {
                toast.error('Failed to save preferences. You can set them later in Profile.');
                navigate('/profile');
            }
        } catch (e) {
            console.error(e);
            toast.error('Something went wrong. You can set preferences later in Profile.');
            navigate('/profile');
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => {
        toast('You can set your preferences anytime from your Profile.', { icon: '💡' });
        navigate('/profile');
    };

    /* ── Tag helpers ── */
    const addTitle = (t) => {
        const val = (t || newTitle).trim();
        if (val && !jobTitles.includes(val)) { setJobTitles(prev => [...prev, val]); setNewTitle(''); }
    };
    const removeTitle = (t) => setJobTitles(prev => prev.filter(x => x !== t));

    const addSkill = (s) => {
        const val = (s || newSkill).trim();
        if (val && !skills.includes(val)) { setSkills(prev => [...prev, val]); setNewSkill(''); }
    };
    const removeSkill = (s) => setSkills(prev => prev.filter(x => x !== s));

    const toggleRole = (r) => setRoleTypes(prev =>
        prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );

    const username = user?.username || Cookies.get('username') || 'there';
    const firstName = username.split(' ')[0];

    /* ── Step renderers ── */
    const renderWelcome = () => (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
                width: '80px', height: '80px', borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(249,115,22,0.05) 100%)',
                border: '1px solid rgba(249,115,22,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px', fontSize: '36px',
            }}>
                🚀
            </div>
            <h1 style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: 'clamp(26px, 4vw, 36px)', letterSpacing: '-0.03em',
                color: 'var(--color-white)', margin: '0 0 12px',
                lineHeight: 1.2,
            }}>
                Welcome, <span style={{ color: 'var(--color-orange)' }}>{firstName}</span>!
            </h1>
            <p style={{
                fontFamily: 'var(--font-body)', fontSize: '16px',
                color: 'var(--color-white-65)', lineHeight: 1.7,
                maxWidth: '460px', margin: '0 auto 8px',
            }}>
                Let's personalize your experience. We'll set up your job notification preferences so you get matched with the right opportunities.
            </p>
            <p style={{
                fontFamily: 'var(--font-body)', fontSize: '13px',
                color: 'var(--color-white-40)', margin: '0 auto',
            }}>
                This takes less than a minute. You can also skip and set up later.
            </p>
        </div>
    );

    const renderJobTitles = () => (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', color: '#818cf8', fontSize: '18px',
                }}>
                    <FaBriefcase />
                </div>
                <h2 style={{
                    fontFamily: 'var(--font-display)', fontWeight: 800,
                    fontSize: '22px', color: 'var(--color-white)',
                    margin: '0 0 8px', letterSpacing: '-0.02em',
                }}>
                    What roles are you looking for?
                </h2>
                <p style={{
                    fontFamily: 'var(--font-body)', fontSize: '14px',
                    color: 'var(--color-white-40)', margin: 0,
                }}>
                    Add job titles you're interested in. We'll notify you when they show up.
                </p>
            </div>

            {/* Suggested titles */}
            <div style={{ marginBottom: '20px' }}>
                <p style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'var(--color-white-40)', marginBottom: '10px',
                }}>
                    Popular picks
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {SUGGESTED_TITLES.map(t => {
                        const added = jobTitles.includes(t);
                        return (
                            <button
                                key={t}
                                onClick={() => added ? removeTitle(t) : addTitle(t)}
                                style={{
                                    fontFamily: 'var(--font-display)', fontWeight: 700,
                                    fontSize: '11px', letterSpacing: '0.05em',
                                    padding: '7px 14px', borderRadius: '999px',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    background: added ? 'rgba(99,102,241,0.20)' : 'var(--color-surface-3)',
                                    color: added ? '#a5b4fc' : 'var(--color-white-40)',
                                    border: added ? '1px solid rgba(99,102,241,0.40)' : '1px solid var(--color-border)',
                                }}
                            >
                                {added && <FaCheckCircle style={{ marginRight: '5px', fontSize: '9px' }} />}
                                {t}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Custom input */}
            <div style={{ display: 'flex', gap: '8px' }}>
                <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTitle()}
                    placeholder="Or type a custom title…"
                    style={{
                        ...inputStyle, flex: 1, borderStyle: 'dashed',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                    onClick={() => addTitle()}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '10px 18px', borderRadius: '10px',
                        background: 'rgba(99,102,241,0.15)',
                        color: '#818cf8',
                        border: '1px solid rgba(99,102,241,0.30)',
                        cursor: 'pointer', fontFamily: 'var(--font-display)',
                        fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                    }}
                >
                    <FaPlus style={{ fontSize: '10px' }} /> Add
                </button>
            </div>

            {/* Selected tags */}
            {jobTitles.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                    <p style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700,
                        fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: 'var(--color-white-40)', marginBottom: '10px',
                    }}>
                        Selected ({jobTitles.length})
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {jobTitles.map(t => (
                            <span key={t} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                fontFamily: 'var(--font-display)', fontWeight: 700,
                                fontSize: '11px', letterSpacing: '0.06em',
                                background: 'rgba(99,102,241,0.12)',
                                color: '#a5b4fc',
                                border: '1px solid rgba(99,102,241,0.25)',
                                padding: '5px 10px 5px 12px', borderRadius: '999px',
                            }}>
                                {t}
                                <button
                                    onClick={() => removeTitle(t)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'rgba(165,180,252,0.6)', fontSize: '10px',
                                        display: 'flex', alignItems: 'center', padding: 0,
                                    }}
                                >
                                    <FaTimes />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderSkills = () => (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: 'var(--color-orange-dim)',
                    border: '1px solid var(--color-orange-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', color: 'var(--color-orange)', fontSize: '18px',
                }}>
                    <FaCode />
                </div>
                <h2 style={{
                    fontFamily: 'var(--font-display)', fontWeight: 800,
                    fontSize: '22px', color: 'var(--color-white)',
                    margin: '0 0 8px', letterSpacing: '-0.02em',
                }}>
                    What are your key skills?
                </h2>
                <p style={{
                    fontFamily: 'var(--font-body)', fontSize: '14px',
                    color: 'var(--color-white-40)', margin: 0,
                }}>
                    Jobs mentioning these skills will rank higher in your digest.
                </p>
            </div>

            {/* Suggested skills */}
            <div style={{ marginBottom: '20px' }}>
                <p style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'var(--color-white-40)', marginBottom: '10px',
                }}>
                    Popular skills
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {SUGGESTED_SKILLS.map(s => {
                        const added = skills.includes(s);
                        return (
                            <button
                                key={s}
                                onClick={() => added ? removeSkill(s) : addSkill(s)}
                                style={{
                                    fontFamily: 'var(--font-display)', fontWeight: 700,
                                    fontSize: '11px', letterSpacing: '0.05em',
                                    padding: '7px 14px', borderRadius: '999px',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    background: added ? 'var(--color-orange-dim)' : 'var(--color-surface-3)',
                                    color: added ? 'var(--color-orange)' : 'var(--color-white-40)',
                                    border: added ? '1px solid var(--color-orange-border)' : '1px solid var(--color-border)',
                                }}
                            >
                                {added && <FaCheckCircle style={{ marginRight: '5px', fontSize: '9px' }} />}
                                {s}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Custom input */}
            <div style={{ display: 'flex', gap: '8px' }}>
                <input
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSkill()}
                    placeholder="Or type a custom skill…"
                    style={{
                        ...inputStyle, flex: 1, borderStyle: 'dashed',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--color-orange)'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                />
                <button
                    onClick={() => addSkill()}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '10px 18px', borderRadius: '10px',
                        background: 'var(--color-orange-dim)',
                        color: 'var(--color-orange)',
                        border: '1px solid var(--color-orange-border)',
                        cursor: 'pointer', fontFamily: 'var(--font-display)',
                        fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                    }}
                >
                    <FaPlus style={{ fontSize: '10px' }} /> Add
                </button>
            </div>

            {/* Selected tags */}
            {skills.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                    <p style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700,
                        fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: 'var(--color-white-40)', marginBottom: '10px',
                    }}>
                        Selected ({skills.length})
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {skills.map(s => (
                            <span key={s} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                fontFamily: 'var(--font-display)', fontWeight: 700,
                                fontSize: '11px', letterSpacing: '0.06em',
                                background: 'var(--color-surface-3)',
                                color: 'var(--color-white-65)',
                                border: '1px solid var(--color-border)',
                                padding: '5px 10px 5px 12px', borderRadius: '999px',
                            }}>
                                {s}
                                <button
                                    onClick={() => removeSkill(s)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--color-white-40)', fontSize: '10px',
                                        display: 'flex', alignItems: 'center', padding: 0,
                                    }}
                                >
                                    <FaTimes />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderRoleTypes = () => (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: 'rgba(34,197,94,0.15)',
                    border: '1px solid rgba(34,197,94,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', color: '#4ade80', fontSize: '18px',
                }}>
                    <FaRocket />
                </div>
                <h2 style={{
                    fontFamily: 'var(--font-display)', fontWeight: 800,
                    fontSize: '22px', color: 'var(--color-white)',
                    margin: '0 0 8px', letterSpacing: '-0.02em',
                }}>
                    What type of roles suit you?
                </h2>
                <p style={{
                    fontFamily: 'var(--font-body)', fontSize: '14px',
                    color: 'var(--color-white-40)', margin: 0,
                }}>
                    Pick what matches your experience level and work style.
                </p>
            </div>

            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '10px',
            }}>
                {ROLE_TYPE_OPTIONS.map(type => {
                    const active = roleTypes.includes(type);
                    return (
                        <button
                            key={type}
                            onClick={() => toggleRole(type)}
                            style={{
                                fontFamily: 'var(--font-display)', fontWeight: 700,
                                fontSize: '12px', letterSpacing: '0.05em',
                                padding: '14px 16px', borderRadius: '12px',
                                cursor: 'pointer', transition: 'all 0.2s',
                                textAlign: 'center',
                                background: active ? 'rgba(34,197,94,0.15)' : 'var(--color-surface-3)',
                                color: active ? '#4ade80' : 'var(--color-white-40)',
                                border: active ? '1px solid rgba(34,197,94,0.40)' : '1px solid var(--color-border)',
                                boxShadow: active ? '0 0 0 2px rgba(34,197,94,0.12)' : 'none',
                            }}
                            onMouseEnter={e => {
                                if (!active) {
                                    e.currentTarget.style.background = 'rgba(34,197,94,0.08)';
                                    e.currentTarget.style.color = '#86efac';
                                    e.currentTarget.style.borderColor = 'rgba(34,197,94,0.25)';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!active) {
                                    e.currentTarget.style.background = 'var(--color-surface-3)';
                                    e.currentTarget.style.color = 'var(--color-white-40)';
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                }
                            }}
                        >
                            {active && <FaCheckCircle style={{ marginRight: '6px', fontSize: '10px' }} />}
                            {type}
                        </button>
                    );
                })}
            </div>

            {roleTypes.length > 0 && (
                <p style={{
                    fontFamily: 'var(--font-body)', fontSize: '12px',
                    color: 'var(--color-white-40)', textAlign: 'center',
                    marginTop: '16px',
                }}>
                    {roleTypes.length} role type{roleTypes.length !== 1 ? 's' : ''} selected
                </p>
            )}
        </div>
    );

    const steps = [renderWelcome, renderJobTitles, renderSkills, renderRoleTypes];
    const stepLabels = ['Welcome', 'Job Titles', 'Skills', 'Role Types'];
    const isLastStep = step === totalSteps - 1;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--color-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', fontFamily: 'var(--font-body)',
        }}>
            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                }
                @media (max-width: 600px) {
                    .onboarding-card { max-width: 100% !important; padding: 28px 20px !important; }
                }
            `}</style>

            {/* Background decorations */}
            <div style={{
                position: 'fixed', top: '-120px', right: '-120px',
                width: '400px', height: '400px',
                background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)',
                borderRadius: '50%', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'fixed', bottom: '-100px', left: '-100px',
                width: '350px', height: '350px',
                background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
                borderRadius: '50%', pointerEvents: 'none',
            }} />

            <div
                className="onboarding-card"
                style={{
                    width: '100%', maxWidth: '560px',
                    background: 'var(--color-surface-1)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '20px',
                    padding: '40px 36px',
                    position: 'relative',
                    animation: 'fadeSlideIn 0.5s ease-out',
                }}
            >
                {/* Logo */}
                <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 800,
                    fontSize: '18px', color: 'var(--color-white)',
                    letterSpacing: '-0.02em', marginBottom: '8px',
                    textAlign: 'center',
                }}>
                    Track<span style={{ color: 'var(--color-orange)' }}>H</span>ire
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        marginBottom: '8px',
                    }}>
                        <span style={{
                            fontFamily: 'var(--font-display)', fontWeight: 700,
                            fontSize: '10px', letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: 'var(--color-white-40)',
                        }}>
                            Step {step + 1} of {totalSteps}
                        </span>
                        <span style={{
                            fontFamily: 'var(--font-display)', fontWeight: 700,
                            fontSize: '10px', letterSpacing: '0.08em',
                            color: 'var(--color-orange)',
                        }}>
                            {stepLabels[step]}
                        </span>
                    </div>
                    <div style={{
                        height: '3px', borderRadius: '999px',
                        background: 'var(--color-border)', overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%', borderRadius: '999px',
                            background: 'linear-gradient(90deg, var(--color-orange), #f59e0b)',
                            width: `${((step + 1) / totalSteps) * 100}%`,
                            transition: 'width 0.4s ease',
                        }} />
                    </div>
                </div>

                {/* Step content */}
                <div key={step} style={{ animation: 'fadeSlideIn 0.35s ease-out' }}>
                    {steps[step]()}
                </div>

                {/* Navigation buttons */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginTop: '32px',
                    gap: '12px',
                }}>
                    {/* Left side — Back or Skip */}
                    <div>
                        {step > 0 ? (
                            <button
                                onClick={prev}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    fontFamily: 'var(--font-display)', fontWeight: 700,
                                    fontSize: '13px', color: 'var(--color-white-40)',
                                    background: 'none', border: 'none',
                                    cursor: 'pointer', padding: '8px 0',
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-white)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-white-40)'}
                            >
                                <FaArrowLeft style={{ fontSize: '11px' }} /> Back
                            </button>
                        ) : (
                            <button
                                onClick={handleSkip}
                                style={{
                                    fontFamily: 'var(--font-display)', fontWeight: 700,
                                    fontSize: '13px', color: 'var(--color-white-40)',
                                    background: 'none', border: 'none',
                                    cursor: 'pointer', padding: '8px 0',
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-white)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-white-40)'}
                            >
                                Skip for now
                            </button>
                        )}
                    </div>

                    {/* Right side — Next or Finish */}
                    <button
                        onClick={isLastStep ? handleFinish : next}
                        disabled={saving}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            fontFamily: 'var(--font-display)', fontWeight: 700,
                            fontSize: '14px', color: '#000',
                            background: saving ? 'var(--color-white-20)' : 'var(--color-orange)',
                            padding: '12px 28px',
                            borderRadius: '10px', border: 'none',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 12px rgba(249,115,22,0.25)',
                        }}
                        onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--color-orange-hover)'; }}
                        onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--color-orange)'; }}
                    >
                        {saving ? 'Saving…' : isLastStep ? (
                            <>Finish Setup <FaCheckCircle style={{ fontSize: '12px' }} /></>
                        ) : step === 0 ? (
                            <>Let's Go <FaArrowRight style={{ fontSize: '11px' }} /></>
                        ) : (
                            <>Continue <FaArrowRight style={{ fontSize: '11px' }} /></>
                        )}
                    </button>
                </div>

                {/* Skip link (on non-welcome steps) */}
                {step > 0 && (
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <button
                            onClick={handleSkip}
                            style={{
                                fontFamily: 'var(--font-body)', fontSize: '12px',
                                color: 'var(--color-white-20)',
                                background: 'none', border: 'none',
                                cursor: 'pointer', padding: '4px 0',
                                transition: 'color 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-white-40)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-white-20)'}
                        >
                            Skip and set up later →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
