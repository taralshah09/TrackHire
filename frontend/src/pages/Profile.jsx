import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import AppHeader from '../components/AppHeader';
import { useAuth } from '../context/AuthContext';
import api from '../service/ApiService';
import Cookies from 'js-cookie';
import {
    FaUser, FaEnvelope, FaMapMarkerAlt, FaBriefcase, FaGlobe,
    FaGithub, FaLinkedin, FaSave, FaPlus, FaTimes,
    FaCheckCircle, FaCalendarAlt, FaShieldAlt,
} from 'react-icons/fa';

/* ── Shared style helpers ── */
const card = {
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    borderRadius: '14px',
    padding: '24px',
};

const inputStyle = {
    width: '100%',
    background: 'var(--color-surface-3)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '10px 14px',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    color: 'var(--color-white)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
};

const labelStyle = {
    display: 'block',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '10px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--color-white-40)',
    marginBottom: '8px',
};

const sectionTitle = {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '16px',
    color: 'var(--color-white)',
    margin: '0 0 20px',
    letterSpacing: '-0.01em',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
};

const WORK_TYPES = ['REMOTE', 'HYBRID', 'ONSITE'];

function InputField({ label, icon, value, onChange, name, type = 'text', placeholder }) {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <label style={labelStyle}>{label}</label>
            <div style={{ position: 'relative' }}>
                {icon && (
                    <span style={{
                        position: 'absolute', left: '12px', top: '50%',
                        transform: 'translateY(-50%)',
                        color: focused ? 'var(--color-orange)' : 'var(--color-white-40)',
                        fontSize: '13px', transition: 'color 0.2s',
                        pointerEvents: 'none',
                    }}>{icon}</span>
                )}
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{
                        ...inputStyle,
                        paddingLeft: icon ? '36px' : '14px',
                        borderColor: focused ? 'var(--color-orange)' : 'var(--color-border)',
                        boxShadow: focused ? '0 0 0 3px rgba(249,115,22,0.12)' : 'none',
                    }}
                />
            </div>
        </div>
    );
}

export default function Profile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState(null);
    const [userObj, setUserObj] = useState({});
    const [newSkill, setNewSkill] = useState('');

    const [formData, setFormData] = useState({
        fullName: '', email: '', location: '', experience: 0,
        website: '', github: '', linkedin: '',
    });
    const [preferences, setPreferences] = useState([]);
    const [skills, setSkills] = useState([]);
    const [stats, setStats] = useState({ memberSince: '—', isVerified: false, completion: 0 });

    /* ── fetch ── */
    useEffect(() => {
        (async () => {
            try {
                const username = user?.username || Cookies.get('username');
                if (!username) { toast.error('Please login again.'); return; }
                const res = await api.getUserByUsername(username);
                const data = await res.json();
                setUserObj(data);
                setUserId(data.id);
                const p = data.profile || {};
                setFormData({
                    fullName: p.name || data.username || '',
                    email: data.email || '',
                    location: p.currentLocation || '',
                    experience: p.yearsOfExperience || 0,
                    website: p.socialProfileLinks?.website || '',
                    github: p.socialProfileLinks?.github || '',
                    linkedin: p.socialProfileLinks?.linkedin || '',
                });
                setPreferences(p.openToWorkTypes || []);
                setSkills(p.skills || []);
                if (data.createdAt) {
                    const d = new Date(data.createdAt);
                    const fields = Object.values(p).filter(Boolean).length;
                    const pct = Math.min(100, Math.round((fields / 8) * 100));
                    setStats({
                        memberSince: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        isVerified: data.emailVerified,
                        completion: pct || 70,
                    });
                }
            } catch (e) {
                console.error(e);
                toast.error('Failed to load profile.');
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /* ── save ── */
    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                username: user?.username || Cookies.get('username'),
                email: formData.email,
                profile: {
                    name: formData.fullName,
                    currentLocation: formData.location,
                    yearsOfExperience: parseInt(formData.experience),
                    openToWorkTypes: preferences,
                    skills,
                    socialProfileLinks: { website: formData.website, github: formData.github, linkedin: formData.linkedin },
                },
            };
            const res = await api.updateUser(userId, payload);
            if (res.ok) toast.success('Profile updated!');
            else {
                const err = await res.json();
                toast.error(err.message || 'Update failed.');
            }
        } catch (e) {
            console.error(e);
            toast.error('An error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    const togglePref = (p) => setPreferences(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

    const addSkill = () => {
        const s = newSkill.trim();
        if (s && !skills.includes(s)) { setSkills(prev => [...prev, s]); setNewSkill(''); }
    };
    const removeSkill = (s) => setSkills(prev => prev.filter(x => x !== s));

    /* ── loading ── */
    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
                <Sidebar />
                <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            border: '3px solid var(--color-border)',
                            borderTopColor: 'var(--color-orange)',
                            animation: 'spin 0.7s linear infinite',
                            margin: '0 auto 16px',
                        }} />
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-white-40)' }}>Loading profile…</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input[type=range]::-webkit-slider-thumb { background: var(--color-orange) !important; }
                @media (max-width: 1024px) { .profile-grid { grid-template-columns: 1fr !important; } }
                @media (max-width: 768px)  { .profile-main-inner { padding: 80px 16px 100px !important; } }
            `}</style>

            <Sidebar />

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* ── Header ── */}
                <AppHeader left={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-40)' }}>
                        <span style={{ color: 'var(--color-white-65)' }}>Profile</span>
                    </div>
                } />

                {/* ── Scrollable content ── */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div className="profile-main-inner" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px', boxSizing: 'border-box' }}>

                        {/* Page title */}
                        <div style={{ marginBottom: '28px' }}>
                            <h1 style={{
                                fontFamily: 'var(--font-display)', fontWeight: 800,
                                fontSize: 'clamp(20px, 3vw, 28px)', letterSpacing: '-0.025em',
                                color: 'var(--color-white)', margin: '0 0 6px',
                            }}>Profile Settings</h1>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-white-40)', margin: 0 }}>
                                Manage your professional identity and job hunt preferences.
                            </p>
                        </div>

                        <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>

                            {/* ── Left column ── */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* Personal Info */}
                                <div style={card}>
                                    <h2 style={sectionTitle}>
                                        <span style={{
                                            width: '28px', height: '28px', borderRadius: '8px',
                                            background: 'var(--color-orange-dim)',
                                            border: '1px solid var(--color-orange-border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--color-orange)', fontSize: '12px',
                                        }}><FaUser /></span>
                                        Personal Information
                                    </h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <InputField label="Full Name" icon={<FaUser />} name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Jane Doe" />
                                        <InputField label="Email Address" icon={<FaEnvelope />} name="email" value={formData.email} onChange={handleChange} type="email" placeholder="jane@example.com" />
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <InputField label="Location" icon={<FaMapMarkerAlt />} name="location" value={formData.location} onChange={handleChange} placeholder="San Francisco, CA" />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={labelStyle}>
                                                Years of Experience
                                                <span style={{
                                                    marginLeft: '10px',
                                                    fontFamily: 'var(--font-mono)', fontWeight: 700,
                                                    fontSize: '13px', color: 'var(--color-orange)',
                                                    letterSpacing: 0,
                                                }}>{formData.experience} yrs</span>
                                            </label>
                                            <input
                                                type="range" min="0" max="40" step="1"
                                                value={formData.experience}
                                                onChange={e => setFormData(p => ({ ...p, experience: +e.target.value }))}
                                                style={{
                                                    width: '100%', height: '4px',
                                                    borderRadius: '999px', cursor: 'pointer',
                                                    accentColor: 'var(--color-orange)',
                                                }}
                                            />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-white-20)' }}>0</span>
                                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-white-20)' }}>40 yrs</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Career Alignment */}
                                <div style={card}>
                                    <h2 style={sectionTitle}>
                                        <span style={{
                                            width: '28px', height: '28px', borderRadius: '8px',
                                            background: 'var(--color-orange-dim)',
                                            border: '1px solid var(--color-orange-border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--color-orange)', fontSize: '12px',
                                        }}><FaBriefcase /></span>
                                        Career Alignment
                                    </h2>

                                    {/* Work Preferences */}
                                    <div style={{ marginBottom: '24px' }}>
                                        <label style={labelStyle}>Work Preferences</label>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {WORK_TYPES.map(p => {
                                                const active = preferences.includes(p);
                                                return (
                                                    <button
                                                        key={p}
                                                        onClick={() => togglePref(p)}
                                                        style={{
                                                            fontFamily: 'var(--font-display)', fontWeight: 700,
                                                            fontSize: '11px', letterSpacing: '0.08em',
                                                            textTransform: 'uppercase',
                                                            padding: '7px 16px', borderRadius: '999px',
                                                            cursor: 'pointer', transition: 'all 0.2s',
                                                            background: active ? 'var(--color-orange-dim)' : 'var(--color-surface-3)',
                                                            color: active ? 'var(--color-orange)' : 'var(--color-white-40)',
                                                            border: active ? '1px solid var(--color-orange-border)' : '1px solid var(--color-border)',
                                                        }}
                                                    >
                                                        {p}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    <div>
                                        <label style={labelStyle}>Top Skills</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
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
                                                            transition: 'color 0.15s',
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-white-40)'}
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        {/* Add skill input */}
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                value={newSkill}
                                                onChange={e => setNewSkill(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && addSkill()}
                                                placeholder="e.g. React, Python..."
                                                style={{
                                                    ...inputStyle,
                                                    flex: 1,
                                                    borderStyle: 'dashed',
                                                }}
                                                onFocus={e => { e.target.style.borderColor = 'var(--color-orange)'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'; }}
                                                onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
                                            />
                                            <button
                                                onClick={addSkill}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    padding: '10px 16px', borderRadius: '8px',
                                                    background: 'var(--color-orange-dim)',
                                                    color: 'var(--color-orange)',
                                                    border: '1px solid var(--color-orange-border)',
                                                    cursor: 'pointer', fontFamily: 'var(--font-display)',
                                                    fontWeight: 700, fontSize: '12px', transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-orange)' && (e.currentTarget.style.color = '#000')}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-orange-dim)'; e.currentTarget.style.color = 'var(--color-orange)'; }}
                                            >
                                                <FaPlus style={{ fontSize: '10px' }} />
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Portfolio & Socials */}
                                <div style={card}>
                                    <h2 style={sectionTitle}>
                                        <span style={{
                                            width: '28px', height: '28px', borderRadius: '8px',
                                            background: 'var(--color-orange-dim)',
                                            border: '1px solid var(--color-orange-border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--color-orange)', fontSize: '12px',
                                        }}><FaGlobe /></span>
                                        Portfolio &amp; Socials
                                    </h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <InputField label="Website" icon={<FaGlobe />} name="website" value={formData.website} onChange={handleChange} placeholder="https://yourwebsite.com" />
                                        <InputField label="GitHub" icon={<FaGithub />} name="github" value={formData.github} onChange={handleChange} placeholder="https://github.com/username" />
                                        <InputField label="LinkedIn" icon={<FaLinkedin />} name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
                                    </div>
                                </div>
                            </div>

                            {/* ── Right column ── */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* Avatar card */}
                                <div style={{ ...card, textAlign: 'center' }}>
                                    <div style={{
                                        width: '80px', height: '80px', borderRadius: '50%',
                                        margin: '0 auto 16px',
                                        border: '3px solid var(--color-orange-border)',
                                        overflow: 'hidden',
                                    }}>
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'User')}&background=f97316&color=000&bold=true&size=128`}
                                            alt="avatar"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', color: 'var(--color-white)', margin: '0 0 4px' }}>
                                        {formData.fullName || 'Your Name'}
                                    </p>
                                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-40)', margin: '0 0 16px' }}>
                                        {formData.email}
                                    </p>

                                    {/* Completion bar */}
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-white-40)' }}>
                                                Profile Completion
                                            </span>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: 'var(--color-orange)' }}>
                                                {stats.completion}%
                                            </span>
                                        </div>
                                        <div style={{ height: '4px', borderRadius: '999px', background: 'var(--color-border)', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', borderRadius: '999px',
                                                background: 'var(--color-orange)',
                                                width: `${stats.completion}%`,
                                                transition: 'width 0.4s ease',
                                            }} />
                                        </div>
                                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-white-20)', marginTop: '8px', lineHeight: 1.5 }}>
                                            Add a portfolio link to reach 100% and improve your job matches.
                                        </p>
                                    </div>
                                </div>

                                {/* Account Overview */}
                                <div style={card}>
                                    <h2 style={{ ...sectionTitle, fontSize: '14px' }}>Account Overview</h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        {[
                                            {
                                                icon: <FaShieldAlt />,
                                                label: 'Auth Provider',
                                                value: userObj.authProvider === 'LOCAL' ? 'Email' : 'Google',
                                            },
                                            {
                                                icon: <FaCalendarAlt />,
                                                label: 'Member Since',
                                                value: stats.memberSince,
                                            },
                                            {
                                                icon: <FaCheckCircle />,
                                                label: 'Email Verified',
                                                value: stats.isVerified ? 'Verified' : 'Pending',
                                                badge: true,
                                                ok: stats.isVerified,
                                            },
                                        ].map(({ icon, label, value, badge, ok }) => (
                                            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{
                                                        width: '28px', height: '28px', borderRadius: '8px',
                                                        background: 'var(--color-surface-3)',
                                                        border: '1px solid var(--color-border)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: 'var(--color-white-40)', fontSize: '11px',
                                                    }}>{icon}</div>
                                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-65)' }}>{label}</span>
                                                </div>
                                                {badge ? (
                                                    <span style={{
                                                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em',
                                                        background: ok ? 'rgba(34,197,94,0.12)' : 'rgba(249,115,22,0.12)',
                                                        color: ok ? '#4ade80' : '#f97316',
                                                        border: `1px solid ${ok ? 'rgba(34,197,94,0.20)' : 'rgba(249,115,22,0.22)'}`,
                                                        padding: '3px 10px', borderRadius: '999px',
                                                    }}>{value}</span>
                                                ) : (
                                                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-40)' }}>{value}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Save button */}
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        width: '100%', padding: '14px',
                                        background: saving ? 'var(--color-surface-3)' : 'var(--color-orange)',
                                        color: saving ? 'var(--color-white-40)' : '#000',
                                        border: 'none', borderRadius: '10px',
                                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px',
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: saving ? 'none' : '0 4px 20px rgba(249,115,22,0.25)',
                                    }}
                                    onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--color-orange-hover)'; }}
                                    onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--color-orange)'; }}
                                >
                                    {saving ? (
                                        <>
                                            <div style={{
                                                width: '14px', height: '14px', borderRadius: '50%',
                                                border: '2px solid var(--color-border)',
                                                borderTopColor: 'var(--color-orange)',
                                                animation: 'spin 0.7s linear infinite',
                                            }} />
                                            Saving…
                                        </>
                                    ) : (
                                        <><FaSave style={{ fontSize: '13px' }} /> Save Changes</>
                                    )}
                                </button>

                                {/* Help card */}
                                <div style={{
                                    background: 'linear-gradient(135deg, rgba(249,115,22,0.10) 0%, rgba(249,115,22,0.04) 100%)',
                                    border: '1px solid var(--color-orange-border)',
                                    borderRadius: '14px', padding: '20px',
                                }}>
                                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: 'var(--color-white)', margin: '0 0 6px' }}>
                                        Need help with your profile?
                                    </p>
                                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-65)', margin: '0 0 14px', lineHeight: 1.6 }}>
                                        Chat with our career experts to optimize your presence.
                                    </p>
                                    <button style={{
                                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '12px',
                                        color: 'var(--color-orange)', background: 'none', border: 'none',
                                        cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px',
                                    }}>
                                        Contact Support →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}