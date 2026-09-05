import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../service/ApiService';
import Cookies from 'js-cookie';
import { FiPlus, FiX, FiCheck, FiArrowRight, FiArrowLeft, FiBriefcase, FiCode, FiZap } from 'react-icons/fi';

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

/* ── Shared styles ──
   Tailwind's margin/padding utilities are inert in this app (the v4 preflight
   wins over them), which is why spacing is written inline here, as it is on the
   other brand pages. */
const INPUT_CLASS = 'w-full bg-pure-white border-[3px] border-brutalist-black font-body-lg text-base outline-none focus:border-vibrant-orange transition-colors';
const ADD_BUTTON_CLASS = 'flex items-center justify-center gap-2 border-[3px] border-brutalist-black bg-pure-white text-brutalist-black hover:bg-vibrant-orange hover:text-pure-white font-label-mono font-bold uppercase text-xs whitespace-nowrap transition-all active-btn';
const SECTION_LABEL_CLASS = 'font-label-mono font-bold text-[10px] uppercase tracking-widest text-brutalist-black opacity-50';

/** Square, bordered toggle used for the suggestion chips and the role types. */
function ToggleChip({ active, onClick, children, size = 'sm' }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 border-[3px] border-brutalist-black font-label-mono font-bold uppercase transition-all active-btn ${size === 'sm' ? 'text-[11px]' : 'text-xs justify-center text-center'
                } ${active
                    ? 'bg-vibrant-orange text-pure-white'
                    : 'bg-pure-white text-brutalist-black hover:bg-brutalist-black hover:text-pure-white'
                }`}
            style={{
                padding: size === 'sm' ? '8px 12px' : '14px 12px',
                boxShadow: active ? '4px 4px 0px 0px #060608' : '0px 0px 0px 0px #060608',
            }}
        >
            {active && <FiCheck className="shrink-0" />}
            {children}
        </button>
    );
}

/** Selected tag with a remove control. */
function SelectedTag({ label, onRemove }) {
    return (
        <span
            className="flex items-center gap-2 border-[3px] border-brutalist-black bg-brutalist-black text-pure-white font-label-mono font-bold uppercase text-[11px]"
            style={{ padding: '6px 8px 6px 12px' }}
        >
            {label}
            <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${label}`}
                className="flex items-center hover:text-vibrant-orange transition-colors"
            >
                <FiX />
            </button>
        </span>
    );
}

/** Section heading shared by the three preference steps. */
function StepHeading({ icon, title, subtitle }) {
    return (
        <div style={{ marginBottom: '32px' }}>
            <div
                className="w-12 h-12 border-[3px] border-brutalist-black bg-vibrant-orange text-pure-white flex items-center justify-center text-xl"
                style={{ boxShadow: '4px 4px 0px 0px #060608', marginBottom: '20px' }}
            >
                {icon}
            </div>
            <h2 className="font-black text-3xl uppercase leading-none" style={{ marginBottom: '10px' }}>{title}</h2>
            <p className="font-label-mono font-bold text-sm text-brutalist-black opacity-80">{subtitle}</p>
        </div>
    );
}

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
                navigate('/dashboard');
            } else {
                toast.error('Failed to save preferences. You can set them later in Profile.');
                navigate('/dashboard');
            }
        } catch (e) {
            console.error(e);
            toast.error('Something went wrong. You can set preferences later in Profile.');
            navigate('/dashboard');
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => {
        toast('You can set your preferences anytime from your Profile.', { icon: '💡' });
        navigate('/dashboard');
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
        <div>
            <div
                className="w-16 h-16 border-[3px] border-brutalist-black bg-vibrant-orange text-pure-white flex items-center justify-center text-3xl"
                style={{ boxShadow: '4px 4px 0px 0px #060608', marginBottom: '28px' }}
            >
                <FiZap />
            </div>
            <h1 className="font-black text-4xl uppercase leading-none" style={{ marginBottom: '20px' }}>
                Welcome,<br /><span className="text-vibrant-orange">{firstName}</span>!
            </h1>
            <p className="font-label-mono font-bold text-sm text-brutalist-black opacity-80 max-w-md" style={{ marginBottom: '16px' }}>
                Let's personalize your experience. We'll set up your job notification preferences so you get matched with the right opportunities.
            </p>
            <p className="font-label-mono font-bold text-xs text-brutalist-black opacity-50">
                This takes less than a minute. You can also skip and set up later.
            </p>
        </div>
    );

    const renderJobTitles = () => (
        <div>
            <StepHeading
                icon={<FiBriefcase />}
                title="What roles are you looking for?"
                subtitle="Add job titles you're interested in. We'll notify you when they show up."
            />

            {/* Suggested titles */}
            <div style={{ marginBottom: '24px' }}>
                <p className={SECTION_LABEL_CLASS} style={{ marginBottom: '12px' }}>Popular picks</p>
                <div className="flex flex-wrap gap-2">
                    {SUGGESTED_TITLES.map(t => {
                        const added = jobTitles.includes(t);
                        return (
                            <ToggleChip key={t} active={added} onClick={() => added ? removeTitle(t) : addTitle(t)}>
                                {t}
                            </ToggleChip>
                        );
                    })}
                </div>
            </div>

            {/* Custom input */}
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTitle()}
                    placeholder="Or type a custom title…"
                    className={`${INPUT_CLASS} flex-1`}
                    style={{ padding: '12px 16px' }}
                />
                <button
                    type="button"
                    onClick={() => addTitle()}
                    className={ADD_BUTTON_CLASS}
                    style={{ padding: '12px 18px', boxShadow: '4px 4px 0px 0px #060608' }}
                >
                    <FiPlus /> Add
                </button>
            </div>

            {/* Selected tags */}
            {jobTitles.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                    <p className={SECTION_LABEL_CLASS} style={{ marginBottom: '12px' }}>
                        Selected ({jobTitles.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {jobTitles.map(t => (
                            <SelectedTag key={t} label={t} onRemove={() => removeTitle(t)} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderSkills = () => (
        <div>
            <StepHeading
                icon={<FiCode />}
                title="What are your key skills?"
                subtitle="Jobs mentioning these skills will rank higher in your digest."
            />

            {/* Suggested skills */}
            <div style={{ marginBottom: '24px' }}>
                <p className={SECTION_LABEL_CLASS} style={{ marginBottom: '12px' }}>Popular skills</p>
                <div className="flex flex-wrap gap-2">
                    {SUGGESTED_SKILLS.map(s => {
                        const added = skills.includes(s);
                        return (
                            <ToggleChip key={s} active={added} onClick={() => added ? removeSkill(s) : addSkill(s)}>
                                {s}
                            </ToggleChip>
                        );
                    })}
                </div>
            </div>

            {/* Custom input */}
            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSkill()}
                    placeholder="Or type a custom skill…"
                    className={`${INPUT_CLASS} flex-1`}
                    style={{ padding: '12px 16px' }}
                />
                <button
                    type="button"
                    onClick={() => addSkill()}
                    className={ADD_BUTTON_CLASS}
                    style={{ padding: '12px 18px', boxShadow: '4px 4px 0px 0px #060608' }}
                >
                    <FiPlus /> Add
                </button>
            </div>

            {/* Selected tags */}
            {skills.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                    <p className={SECTION_LABEL_CLASS} style={{ marginBottom: '12px' }}>
                        Selected ({skills.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {skills.map(s => (
                            <SelectedTag key={s} label={s} onRemove={() => removeSkill(s)} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderRoleTypes = () => (
        <div>
            <StepHeading
                icon={<FiZap />}
                title="What type of roles suit you?"
                subtitle="Pick what matches your experience level and work style."
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ROLE_TYPE_OPTIONS.map(type => (
                    <ToggleChip key={type} size="lg" active={roleTypes.includes(type)} onClick={() => toggleRole(type)}>
                        {type}
                    </ToggleChip>
                ))}
            </div>

            {roleTypes.length > 0 && (
                <p className="font-label-mono font-bold text-xs uppercase text-brutalist-black opacity-50" style={{ marginTop: '24px' }}>
                    {roleTypes.length} role type{roleTypes.length !== 1 ? 's' : ''} selected
                </p>
            )}
        </div>
    );

    const steps = [renderWelcome, renderJobTitles, renderSkills, renderRoleTypes];
    const stepLabels = ['Welcome', 'Job Titles', 'Skills', 'Role Types'];
    const isLastStep = step === totalSteps - 1;

    return (
        <div
            className="ob-shell min-h-screen bg-surface flex items-center justify-center font-body-lg text-brutalist-black selection:bg-vibrant-orange selection:text-pure-white overflow-hidden relative"
            style={{ padding: '48px' }}
        >
            <style>{`
                .sticker-rotate-pos { transform: rotate(3deg); }
                .sticker-rotate-neg { transform: rotate(-3deg); }
                .active-btn:active {
                    transform: translate(4px, 4px) !important;
                    box-shadow: 0px 0px 0px 0px #060608 !important;
                }
                @media (max-width: 640px) {
                    .ob-shell { padding: 20px !important; }
                    .ob-panel { padding: 24px !important; }
                }
            `}</style>

            {/* Background grid */}
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{
                backgroundImage: 'linear-gradient(to right, #060608 1px, transparent 1px), linear-gradient(to bottom, #060608 1px, transparent 1px)',
                backgroundSize: '64px 64px'
            }}></div>

            <div
                className="w-full max-w-5xl bg-pure-white border-[4px] border-brutalist-black rounded-none flex flex-col md:flex-row min-h-[600px] z-10"
                style={{ boxShadow: '12px 12px 0px 0px #060608' }}
            >
                {/* Left Panel — branding + progress */}
                <div
                    className="ob-panel hidden md:flex flex-col md:w-[38%] border-r-[4px] border-brutalist-black bg-vibrant-orange text-brutalist-black justify-between relative overflow-hidden"
                    style={{ padding: '48px' }}
                >
                    {/* decorative star */}
                    <svg width="56" height="56" viewBox="0 0 100 100" className="absolute bottom-8 right-8 fill-pure-white stroke-brutalist-black stroke-[4px] hidden lg:block sticker-rotate-pos pointer-events-none z-0">
                        <polygon points="50,5 62,38 95,50 62,62 50,95 38,62 5,50 38,38" strokeLinejoin="round" />
                    </svg>

                    <div className="relative z-10">
                        <Link
                            to="/"
                            className="font-headline-md text-3xl uppercase tracking-tighter block border-b-[3px] border-brutalist-black inline-block"
                            style={{ paddingBottom: '8px', marginBottom: '48px' }}
                        >
                            TRACK<span className="text-pure-white">HIRE</span>
                        </Link>
                        <h1 className="font-black text-5xl uppercase leading-none" style={{ marginBottom: '24px' }}>
                            Set<br />Up.
                        </h1>
                        <p className="font-label-mono font-bold text-base max-w-sm">
                            Tell us what you want. <br />We'll do the hunting.
                        </p>
                    </div>

                    {/* Step list, doubling as the progress indicator */}
                    <div className="relative z-10 flex flex-col gap-3" style={{ marginTop: '48px' }}>
                        {stepLabels.map((labelText, i) => {
                            const done = i < step;
                            const current = i === step;
                            return (
                                <div
                                    key={labelText}
                                    className={`flex items-center gap-4 border-[3px] border-brutalist-black w-max ${current ? 'bg-brutalist-black text-pure-white sticker-rotate-neg' : 'bg-pure-white text-brutalist-black'
                                        }`}
                                    style={{ boxShadow: '4px 4px 0px 0px #060608', padding: '8px 16px' }}
                                >
                                    <span className={`font-black text-xl min-w-[28px] ${current || done ? 'text-vibrant-orange' : ''}`}>
                                        {done ? <FiCheck /> : i + 1}
                                    </span>
                                    <span className="font-label-mono text-sm font-bold uppercase">{labelText}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Panel — step content */}
                <div className="ob-panel flex-1 flex flex-col justify-between bg-pure-white relative" style={{ padding: '48px' }}>
                    <div>
                        {/* Mobile logo (the left panel is hidden at this width) */}
                        <div className="md:hidden flex items-center justify-between" style={{ marginBottom: '32px' }}>
                            <div className="font-headline-md text-2xl uppercase tracking-tighter border-b-[3px] border-brutalist-black inline-block" style={{ paddingBottom: '8px' }}>
                                TRACK<span className="text-vibrant-orange">HIRE</span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{ marginBottom: '40px' }}>
                            <div className="flex justify-between items-end" style={{ marginBottom: '10px' }}>
                                <span className="font-label-mono font-bold text-[10px] uppercase tracking-widest">
                                    Step {step + 1} of {totalSteps}
                                </span>
                                <span className="font-label-mono font-bold text-[10px] uppercase tracking-widest text-vibrant-orange">
                                    {stepLabels[step]}
                                </span>
                            </div>
                            <div className="h-[14px] border-[3px] border-brutalist-black bg-pure-white">
                                <div
                                    className="h-full bg-vibrant-orange transition-all duration-300"
                                    style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Step content */}
                        <div key={step}>{steps[step]()}</div>
                    </div>

                    {/* Navigation */}
                    <div
                        className="flex justify-between items-center gap-4 border-t-[3px] border-brutalist-black"
                        style={{ marginTop: '48px', paddingTop: '32px' }}
                    >
                        {step > 0 ? (
                            <button
                                type="button"
                                onClick={prev}
                                className="flex items-center gap-2 font-label-mono font-bold uppercase text-xs hover:text-vibrant-orange transition-colors"
                            >
                                <FiArrowLeft /> Back
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="font-label-mono font-bold uppercase text-xs hover:text-vibrant-orange transition-colors"
                            >
                                Skip for now
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={isLastStep ? handleFinish : next}
                            disabled={saving}
                            className="font-black uppercase text-lg bg-vibrant-orange text-pure-white border-[3px] border-brutalist-black transition-all hover:bg-brutalist-black disabled:opacity-50 disabled:cursor-not-allowed active-btn flex items-center gap-3"
                            style={{ padding: '14px 28px', boxShadow: saving ? '0px 0px 0px 0px #060608' : '6px 6px 0px 0px #060608' }}
                        >
                            {saving ? 'Saving…' : isLastStep ? (
                                <>Finish Setup <FiCheck /></>
                            ) : step === 0 ? (
                                <>Let's Go <FiArrowRight /></>
                            ) : (
                                <>Continue <FiArrowRight /></>
                            )}
                        </button>
                    </div>

                    {/* Skip link (on non-welcome steps) */}
                    {step > 0 && (
                        <div className="text-center" style={{ marginTop: '20px' }}>
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="font-label-mono font-bold text-[10px] uppercase text-brutalist-black opacity-50 hover:opacity-100 hover:text-vibrant-orange transition-all"
                            >
                                Skip and set up later →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
