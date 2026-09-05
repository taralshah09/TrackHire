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
    FaCheckCircle, FaCalendarAlt, FaShieldAlt, FaBell,
} from 'react-icons/fa';

/* ── Shared style helpers ── */
const cardClasses = "bg-pure-white border-[4px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608]";
const inputClasses = "w-full bg-transparent border-[3px] border-brutalist-black font-label-mono font-bold uppercase text-sm text-brutalist-black outline-none focus:bg-vibrant-orange focus:text-pure-white focus:placeholder-pure-white transition-colors shadow-[2px_2px_0px_0px_#060608]";
const labelClasses = "block font-headline-md font-bold text-xs uppercase text-brutalist-black mb-2";
const sectionTitleClasses = "font-headline-md font-black uppercase text-xl text-brutalist-black mb-6 flex items-center gap-3";

const WORK_TYPES = ['REMOTE', 'HYBRID', 'ONSITE'];

const ROLE_TYPE_OPTIONS = [
    'Intern', 'Junior', 'Mid-level', 'Senior', 'Lead',
    'Full-time', 'Part-time', 'Contract', 'Freelance',
];

function InputField({ label, icon, value, onChange, name, type = 'text', placeholder }) {
    const [focused, setFocused] = useState(false);
    return (
        <div>
            <label className={labelClasses}>{label}</label>
            <div className="relative">
                {icon && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brutalist-black text-lg pointer-events-none z-10">
                        {icon}
                    </span>
                )}
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={inputClasses}
                    style={{ padding: icon ? "12px 12px 12px 48px" : "12px 16px" }}
                />
            </div>
        </div>
    );
}

export default function Profile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingPrefs, setSavingPrefs] = useState(false);
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

    // ── Email job preferences state ──
    const [emailPrefs, setEmailPrefs] = useState({ jobTitles: [], skills: [], roleTypes: [], emailEnabled: true });
    const [newEmailTitle, setNewEmailTitle] = useState('');
    const [newEmailSkill, setNewEmailSkill] = useState('');

    /* ── fetch ── */
    useEffect(() => {
        (async () => {
            try {
                const username = user?.username || Cookies.get('username');
                if (!username) { toast.error('Please login again.'); return; }
                const res = await api.getUserByUsername(username);
                if (!res.ok) {
                    const errBody = await res.json().catch(() => ({}));
                    toast.error(errBody.message || 'Failed to load user data.');
                    return;
                }
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
                // Fetch email job preferences
                try {
                    const prefRes = await api.getJobPreferences(data.id);
                    if (prefRes.ok) {
                        const prefData = await prefRes.json();
                        setEmailPrefs({
                            jobTitles: prefData.jobTitles || [],
                            skills: prefData.skills || [],
                            roleTypes: prefData.roleTypes || [],
                            emailEnabled: prefData.emailEnabled ?? true,
                        });
                    }
                } catch (_) { /* silent — first-time users have no prefs yet */ }
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

    /* ── email prefs helpers ── */
    const addEmailTitle = () => {
        const t = newEmailTitle.trim();
        if (t && !emailPrefs.jobTitles.includes(t)) {
            setEmailPrefs(p => ({ ...p, jobTitles: [...p.jobTitles, t] }));
            setNewEmailTitle('');
        }
    };
    const removeEmailTitle = (t) => setEmailPrefs(p => ({ ...p, jobTitles: p.jobTitles.filter(x => x !== t) }));

    const addEmailSkill = () => {
        const s = newEmailSkill.trim();
        if (s && !emailPrefs.skills.includes(s)) {
            setEmailPrefs(p => ({ ...p, skills: [...p.skills, s] }));
            setNewEmailSkill('');
        }
    };
    const removeEmailSkill = (s) => setEmailPrefs(p => ({ ...p, skills: p.skills.filter(x => x !== s) }));

    const toggleRoleType = (type) => setEmailPrefs(p => ({
        ...p,
        roleTypes: p.roleTypes.includes(type)
            ? p.roleTypes.filter(r => r !== type)
            : [...p.roleTypes, type],
    }));

    const handleSaveEmailPrefs = async () => {
        if (!userId) return;
        setSavingPrefs(true);
        try {
            const payload = {
                jobTitles: emailPrefs.jobTitles,
                skills: emailPrefs.skills,
                roleTypes: emailPrefs.roleTypes,
                emailEnabled: emailPrefs.emailEnabled,
            };
            const res = await api.saveJobPreferences(userId, payload);
            if (res.ok) toast.success('Email preferences saved!');
            else {
                const errBody = await res.text();
                console.error('[handleSaveEmailPrefs] error body =', errBody);
                toast.error('Failed to save email preferences.');
            }
        } catch (e) {
            console.error('[handleSaveEmailPrefs] exception =', e);
            toast.error('An error occurred.');
        } finally {
            setSavingPrefs(false);
        }
    };

    /* ── loading ── */
    if (loading) {
        return (
        <div className="flex h-screen overflow-hidden bg-background-light">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center font-label-mono font-bold uppercase text-brutalist-black">
                        Loading profile…
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background-light">
            <style>{`
                input[type=range]::-webkit-slider-thumb { background: var(--color-orange) !important; }
                @media (max-width: 1024px) { 
                    .profile-grid { grid-template-columns: 1fr !important; } 
                }
                @media (max-width: 768px)  { 
                    .profile-main-inner { padding: 80px 16px 100px !important; } 
                    .personal-info-grid { grid-template-columns: 1fr !important; }
                    .email-prefs-header { flex-direction: column; align-items: flex-start !important; gap: 12px; }
                }
                @media (max-width: 480px) {
                    .profile-main-inner { padding-top: 72px !important; }
                }
            `}</style>

            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden relative z-10">

                {/* ── Header ── */}
                <AppHeader left={
                    <div className="font-label-mono font-bold uppercase text-sm text-brutalist-black bg-pure-white border-[3px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608] inline-block" style={{ padding: "16px 32px" }}>
                        Profile
                    </div>
                } />

                {/* ── Scrollable content ── */}
                <div className="flex-1 overflow-y-auto">
                    <div className="profile-main-inner max-w-6xl mx-auto" style={{ padding: "40px 10px" }}>

                        {/* Page title */}
                        <div className="bg-pure-white border-[4px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608] mb-12" style={{ padding: "48px" }}>
                            <h1 className="font-headline-md font-black uppercase tracking-tighter text-3xl md:text-5xl text-brutalist-black m-0 mb-4">
                                Profile Settings
                            </h1>
                            <p className="font-label-mono font-bold uppercase text-sm text-gray-500 m-0">
                                Manage your professional identity and job hunt preferences.
                            </p>
                        </div>

                        <div className="profile-grid grid" style={{ gridTemplateColumns: "1fr 350px", gap: "32px" }}>

                            {/* ── Left column ── */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                {/* Personal Info */}
                                <div className={cardClasses} style={{ padding: "32px" }}>
                                    <h2 className={sectionTitleClasses}>
                                        <FaUser /> Personal Information
                                    </h2>
                                    <div className="personal-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                        <InputField label="Full Name" icon={<FaUser />} name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Jane Doe" />
                                        <InputField label="Email Address" icon={<FaEnvelope />} name="email" value={formData.email} onChange={handleChange} type="email" placeholder="jane@example.com" />
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <InputField label="Location" icon={<FaMapMarkerAlt />} name="location" value={formData.location} onChange={handleChange} placeholder="San Francisco, CA" />
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label className={labelClasses}>
                                                Years of Experience
                                                <span className="ml-2 font-label-mono font-bold text-sm text-vibrant-orange">
                                                    {formData.experience} yrs
                                                </span>
                                            </label>
                                            <input
                                                type="range" min="0" max="40" step="1"
                                                value={formData.experience}
                                                onChange={e => setFormData(p => ({ ...p, experience: +e.target.value }))}
                                                className="w-full h-2 rounded-full cursor-pointer accent-vibrant-orange mt-2"
                                            />
                                            <div className="flex justify-between mt-2 font-label-mono font-bold text-xs text-gray-500 uppercase">
                                                <span>0</span>
                                                <span>40 yrs</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Career Alignment */}
                                <div className={cardClasses} style={{ padding: "32px" }}>
                                    <h2 className={sectionTitleClasses}>
                                        <FaBriefcase /> Career Alignment
                                    </h2>

                                    {/* Work Preferences */}
                                    <div className="mb-8">
                                        <label className={labelClasses}>Work Preferences</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {WORK_TYPES.map(p => {
                                                const active = preferences.includes(p);
                                                return (
                                                    <button
                                                        key={p}
                                                        onClick={() => togglePref(p)}
                                                        className={`font-label-mono font-bold text-xs uppercase px-4 py-2 border-[2px] border-brutalist-black transition-all shadow-[2px_2px_0px_0px_#060608] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${active ? 'bg-vibrant-orange text-pure-white' : 'bg-pure-white text-brutalist-black'}`}
                                                    >
                                                        {p}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    <div>
                                        <label className={labelClasses}>Top Skills</label>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {skills.map(s => (
                                                <span key={s} className="flex items-center gap-2 bg-pure-white border-[2px] border-brutalist-black text-brutalist-black font-label-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_#060608]" style={{ padding: "6px 12px" }}>
                                                    {s}
                                                    <button
                                                        onClick={() => removeSkill(s)}
                                                        className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-[#ef4444] text-sm p-0 flex items-center transition-colors"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        {/* Add skill input */}
                                        <div className="flex gap-2">
                                            <input
                                                value={newSkill}
                                                onChange={e => setNewSkill(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && addSkill()}
                                                placeholder="e.g. React, Python..."
                                                className={inputClasses}
                                                style={{ padding: "12px 16px" }}
                                            />
                                            <button
                                                onClick={addSkill}
                                                className="flex items-center gap-2 bg-vibrant-orange text-pure-white border-[3px] border-brutalist-black font-label-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_#060608] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer whitespace-nowrap"
                                                style={{ padding: "12px 24px" }}
                                            >
                                                <FaPlus />
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Portfolio & Socials */}
                                <div className={cardClasses} style={{ padding: "32px" }}>
                                    <h2 className={sectionTitleClasses}>
                                        <FaGlobe /> Portfolio &amp; Socials
                                    </h2>
                                    <div className="flex flex-col gap-4">
                                        <InputField label="Website" icon={<FaGlobe />} name="website" value={formData.website} onChange={handleChange} placeholder="https://yourwebsite.com" />
                                        <InputField label="GitHub" icon={<FaGithub />} name="github" value={formData.github} onChange={handleChange} placeholder="https://github.com/username" />
                                        <InputField label="LinkedIn" icon={<FaLinkedin />} name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
                                    </div>
                                </div>

                                {/* ── Email Job Notification Preferences ── */}
                                <div className={cardClasses} style={{ padding: "32px" }}>
                                    <h2 className={sectionTitleClasses}>
                                        <FaBell /> Email Job Notifications
                                    </h2>

                                    {/* Email toggle */}
                                    <div className="email-prefs-header flex items-center justify-between mb-6">
                                        <div>
                                            <p className="font-headline-md font-bold text-sm text-brutalist-black m-0 mb-1">
                                                Weekly Job Digest
                                            </p>
                                            <p className="font-label-mono font-bold text-xs text-gray-500 m-0 uppercase">
                                                Receive matching new jobs every week by email
                                            </p>
                                        </div>
                                        {/* Toggle switch */}
                                        <button
                                            onClick={() => setEmailPrefs(p => ({ ...p, emailEnabled: !p.emailEnabled }))}
                                            className={`relative w-12 h-6 border-[3px] border-brutalist-black transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#060608] shrink-0 ${emailPrefs.emailEnabled ? 'bg-vibrant-orange' : 'bg-pure-white'}`}
                                            style={{ padding: 0 }}
                                        >
                                            <span className={`absolute top-0 w-[18px] h-[18px] bg-brutalist-black transition-all ${emailPrefs.emailEnabled ? 'left-[22px]' : 'left-0'}`} />
                                        </button>
                                    </div>

                                    {/* Preferred Job Titles */}
                                    <div className="mb-6">
                                        <label className={labelClasses}>Preferred Job Titles</label>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {emailPrefs.jobTitles.map(t => (
                                                <span key={t} className="flex items-center gap-2 bg-pure-white border-[2px] border-brutalist-black text-brutalist-black font-label-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_#060608]" style={{ padding: "6px 12px" }}>
                                                    {t}
                                                    <button
                                                        onClick={() => removeEmailTitle(t)}
                                                        className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-[#ef4444] text-sm p-0 flex items-center transition-colors"
                                                    ><FaTimes /></button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                value={newEmailTitle}
                                                onChange={e => setNewEmailTitle(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && addEmailTitle()}
                                                placeholder="e.g. Software Engineer, Backend Developer…"
                                                className={inputClasses}
                                                style={{ padding: "12px 16px" }}
                                            />
                                            <button
                                                onClick={addEmailTitle}
                                                className="flex items-center gap-2 bg-vibrant-orange text-pure-white border-[3px] border-brutalist-black font-label-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_#060608] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer whitespace-nowrap"
                                                style={{ padding: "12px 24px" }}
                                            >
                                                <FaPlus /> Add
                                            </button>
                                        </div>
                                    </div>

                                    {/* Skills to match */}
                                    <div className="mb-8">
                                        <label className={labelClasses}>Skills to Match</label>
                                        <p className="font-label-mono font-bold text-xs text-gray-500 mb-3 uppercase">
                                            Jobs mentioning any of these skills rank higher in your digest.
                                        </p>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {emailPrefs.skills.map(s => (
                                                <span key={s} className="flex items-center gap-2 bg-pure-white border-[2px] border-brutalist-black text-brutalist-black font-label-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_#060608]" style={{ padding: "6px 12px" }}>
                                                    {s}
                                                    <button
                                                        onClick={() => removeEmailSkill(s)}
                                                        className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-[#ef4444] text-sm p-0 flex items-center transition-colors"
                                                    ><FaTimes /></button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                value={newEmailSkill}
                                                onChange={e => setNewEmailSkill(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && addEmailSkill()}
                                                placeholder="e.g. Java, React, AWS…"
                                                className={inputClasses}
                                                style={{ padding: "12px 16px" }}
                                            />
                                            <button
                                                onClick={addEmailSkill}
                                                className="flex items-center gap-2 bg-vibrant-orange text-pure-white border-[3px] border-brutalist-black font-label-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_#060608] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer whitespace-nowrap"
                                                style={{ padding: "12px 24px" }}
                                            >
                                                <FaPlus /> Add
                                            </button>
                                        </div>
                                    </div>

                                    {/* Role Types */}
                                    <div className="mb-8">
                                        <label className={labelClasses}>Preferred Role Types</label>
                                        <p className="font-label-mono font-bold text-xs text-gray-500 mb-3 uppercase">
                                            Only receive emails for these role levels.
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {ROLE_TYPE_OPTIONS.map(type => {
                                                const active = emailPrefs.roleTypes.includes(type);
                                                return (
                                                    <button
                                                        key={type}
                                                        onClick={() => toggleRoleType(type)}
                                                        className={`font-label-mono font-bold text-xs uppercase px-3 py-1 border-[2px] border-brutalist-black transition-all shadow-[2px_2px_0px_0px_#060608] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${active ? 'bg-vibrant-orange text-pure-white' : 'bg-pure-white text-brutalist-black'}`}
                                                    >
                                                        {active && <FaCheckCircle className="inline mr-1" />}
                                                        {type}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Save preferences button */}
                                    <button
                                        onClick={handleSaveEmailPrefs}
                                        disabled={savingPrefs}
                                        className="flex items-center justify-center gap-2 w-full bg-pure-white border-[3px] border-brutalist-black text-brutalist-black font-label-mono font-bold text-sm uppercase transition-all shadow-[4px_4px_0px_0px_#060608] hover:bg-brutalist-black hover:text-pure-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none cursor-pointer disabled:opacity-50"
                                        style={{ padding: "16px" }}
                                    >
                                        {savingPrefs ? (
                                            'Saving…'
                                        ) : (
                                            <><FaBell /> Save Notification Preferences</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* ── Right column ── */}
                            <div className="flex flex-col gap-6">

                                {/* Avatar card */}
                                <div className={`${cardClasses} text-center`} style={{ padding: "32px" }}>
                                    <div className="w-20 h-20 rounded-full mx-auto mb-4 border-[3px] border-brutalist-black overflow-hidden bg-vibrant-orange">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName || 'User')}&background=f97316&color=000&bold=true&size=128`}
                                            alt="avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <p className="font-headline-md font-bold text-lg text-brutalist-black m-0 mb-1">
                                        {formData.fullName || 'Your Name'}
                                    </p>
                                    <p className="font-label-mono font-bold text-sm text-gray-500 m-0 mb-4">
                                        {formData.email}
                                    </p>

                                    {/* Completion bar */}
                                    <div className="text-left">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-label-mono font-bold text-xs uppercase text-gray-500">
                                                Profile Completion
                                            </span>
                                            <span className="font-label-mono font-bold text-sm text-vibrant-orange">
                                                {stats.completion}%
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-gray-200 overflow-hidden border-[2px] border-brutalist-black">
                                            <div
                                                className="h-full bg-vibrant-orange transition-all duration-500 ease-out border-r-[2px] border-brutalist-black"
                                                style={{ width: `${stats.completion}%` }}
                                            />
                                        </div>
                                        <p className="font-label-mono font-bold text-xs text-gray-500 mt-2 uppercase">
                                            Add a portfolio link to reach 100% and improve your job matches.
                                        </p>
                                    </div>
                                </div>

                                {/* Account Overview */}
                                <div className={cardClasses} style={{ padding: "32px" }}>
                                    <h2 className={sectionTitleClasses}>Account Overview</h2>
                                    <div className="flex flex-col gap-4">
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
                                            <div key={label} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-none border-[2px] border-brutalist-black bg-pure-white flex items-center justify-center text-brutalist-black shadow-[2px_2px_0px_0px_#060608]">
                                                        {icon}
                                                    </div>
                                                    <span className="font-label-mono font-bold text-xs text-brutalist-black uppercase">{label}</span>
                                                </div>
                                                {badge ? (
                                                    <span className={`font-label-mono font-bold text-xs uppercase px-2 py-1 border-[2px] border-brutalist-black shadow-[2px_2px_0px_0px_#060608] ${ok ? 'bg-green-400 text-brutalist-black' : 'bg-vibrant-orange text-pure-white'}`}>
                                                        {value}
                                                    </span>
                                                ) : (
                                                    <span className="font-label-mono font-bold text-xs text-gray-500 uppercase">{value}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Save button */}
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center justify-center gap-2 w-full bg-vibrant-orange border-[3px] border-brutalist-black text-pure-white font-label-mono font-bold text-sm uppercase transition-all shadow-[4px_4px_0px_0px_#060608] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none cursor-pointer disabled:opacity-50"
                                    style={{ padding: "16px" }}
                                >
                                    {saving ? (
                                        'Saving…'
                                    ) : (
                                        <><FaSave /> Save Changes</>
                                    )}
                                </button>

                                {/* Help card */}
                                <div className="bg-pure-white border-[3px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608]" style={{ padding: "24px" }}>
                                    <p className="font-headline-md font-bold text-md text-brutalist-black m-0 mb-2">
                                        Need help with your profile?
                                    </p>
                                    <p className="font-label-mono font-bold text-xs text-gray-500 uppercase m-0 mb-4">
                                        Chat with our career experts to optimize your presence.
                                    </p>
                                    <button className="font-label-mono font-bold text-xs uppercase text-vibrant-orange bg-transparent border-none cursor-pointer p-0 flex items-center gap-1 hover:underline">
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