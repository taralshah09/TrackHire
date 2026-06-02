import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AppHeader from '../components/AppHeader';
import api from '../service/ApiService';
import {
    FaArrowLeft, FaBookmark, FaRegBookmark, FaExternalLinkAlt,
    FaMapMarkerAlt, FaBriefcase, FaCalendarAlt,
    FaLayerGroup, FaLink, FaChevronDown, FaCheck, FaTimes,
} from 'react-icons/fa';

/* ── Brand status tokens ── */
const STATUS_STYLES = {
    APPLIED: { bg: '#3b82f6', color: '#ffffff', border: '#060608' },
    INTERVIEW: { bg: '#f97316', color: '#ffffff', border: '#060608' },
    OFFER: { bg: '#22c55e', color: '#ffffff', border: '#060608' },
    REJECTED: { bg: '#ef4444', color: '#ffffff', border: '#060608' },
    PHONE_SCREEN: { bg: '#14b8a6', color: '#ffffff', border: '#060608' },
    WITHDRAWN: { bg: '#94a3b8', color: '#ffffff', border: '#060608' },
};

const STATUS_OPTIONS = [
    { value: 'APPLIED', label: 'Applied', icon: <FaCheck /> },
    { value: 'INTERVIEW', label: 'Interview', icon: <FaCalendarAlt /> },
    { value: 'OFFER', label: 'Offer', icon: <FaCheck /> },
    { value: 'REJECTED', label: 'Rejected', icon: <FaTimes /> },
    { value: 'PHONE_SCREEN', label: 'Phone Screen', icon: <FaCheck /> },
];

/* ── Shared Neo-Brutalist helpers ── */
const cardClasses = "bg-pure-white border-[4px] border-brutalist-black rounded-none";
const cardStyle = {
    padding: '32px',
    boxShadow: '8px 8px 0px 0px #060608',
};

const btnClasses = "font-black uppercase border-[3px] border-brutalist-black flex items-center justify-center transition-transform hover:-translate-y-1 active:translate-y-1 active:shadow-none";
const pillClasses = "font-label-mono font-bold text-xs uppercase bg-pure-white border-[2px] border-brutalist-black text-brutalist-black flex items-center gap-1";

export default function JobPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [applied, setApplied] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [descExpanded, setDescExpanded] = useState(false);
    const dropdownRef = useRef(null);

    /* fetch ── */
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const [jobRes, skillsRes] = await Promise.all([
                    api.getJobById(id),
                    api.getJobSkills(id),
                ]);
                const data = await jobRes.json();
                setJob(data);
                setSaved(data.isSaved || false);
                setApplied(data.isApplied || false);
                setApplicationStatus(data.applicationStatus || null);
                if (skillsRes.ok) {
                    setSkills(await skillsRes.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    /* close dropdown on outside click */
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setShowDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* ── handlers ── */
    const handleSaveToggle = async () => {
        try {
            setActionLoading(true);
            if (saved) { await api.unsaveJob(id); setSaved(false); }
            else { await api.saveJob(id); setSaved(true); }
        } catch (e) { console.error(e); }
        finally { setActionLoading(false); }
    };

    const handleStatusChange = async (status) => {
        try {
            setActionLoading(true);
            await api.updateJobStatus(id, status);
            setApplied(true);
            setApplicationStatus(status);
            setShowDropdown(false);
        } catch (e) { console.error(e); }
        finally { setActionLoading(false); }
    };

    const handleWithdraw = async () => {
        try {
            setActionLoading(true);
            await api.withdrawApplication(id);
            setApplied(false);
            setApplicationStatus(null);
            setShowDropdown(false);
        } catch (e) { console.error(e); }
        finally { setActionLoading(false); }
    };

    /* ── formatters ── */
    const formatDate = (ds) => {
        if (!ds) return 'Recently';
        const diff = Math.ceil((Date.now() - new Date(ds)) / 86400000);
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7) return `${diff} days ago`;
        if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
        return `${Math.floor(diff / 30)} months ago`;
    };

    /* ── current status display meta ── */
    const statusMeta = applicationStatus ? STATUS_STYLES[applicationStatus] || STATUS_STYLES.APPLIED : null;
    const currentStatusLabel = STATUS_OPTIONS.find(s => s.value === applicationStatus)?.label || 'Applied';

    /* ── loading skeleton ── */
    if (loading) {
        return (
            <div className="min-h-screen bg-surface flex font-body-lg text-brutalist-black selection:bg-vibrant-orange selection:text-pure-white">
                <Sidebar />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-[4px] border-brutalist-black border-t-vibrant-orange rounded-full animate-spin mx-auto mb-4" />
                        <p className="font-label-mono font-bold uppercase">Loading job…</p>
                    </div>
                </main>
            </div>
        );
    }

    /* ── job not found ── */
    if (!job) {
        return (
            <div className="min-h-screen bg-surface flex font-body-lg text-brutalist-black selection:bg-vibrant-orange selection:text-pure-white">
                <Sidebar />
                <main className="flex-1 flex flex-col items-center justify-center gap-4">
                    <p className="font-black text-2xl uppercase">Job not found.</p>
                    <button onClick={() => navigate('/jobs')} className="font-label-mono font-bold uppercase text-vibrant-orange underline decoration-[2px] underline-offset-4">
                        ← Back to Browse Jobs
                    </button>
                </main>
            </div>
        );
    }

    const tags = [job.employmentType, job.jobCategory].filter(Boolean);

    return (
        <div className="min-h-screen bg-surface flex font-body-lg text-brutalist-black selection:bg-vibrant-orange selection:text-pure-white">
            <style>{`
                @media (max-width: 900px) {
                    .job-layout { flex-direction: column !important; }
                    .job-sidebar { width: 100% !important; }
                }
                @media (max-width: 768px) {
                    .job-action-btns { 
                        flex-direction: column !important; 
                        width: 100% !important;
                    }
                    .job-action-btns > * { width: 100% !important; }
                    .job-action-btns select { width: 100% !important; }
                }
            `}</style>

            <Sidebar />

            <main className="flex-1 overflow-y-auto flex flex-col">
                <AppHeader left={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="font-label-mono font-bold uppercase text-sm flex items-center gap-2 hover:text-vibrant-orange transition-colors"
                        >
                            <FaArrowLeft /> Back
                        </button>
                        <span className="text-brutalist-black/20">|</span>
                        <div className="font-label-mono font-bold uppercase text-xs flex items-center gap-2 text-brutalist-black/60">
                            <Link to="/jobs" className="hover:text-vibrant-orange transition-colors">Browse Jobs</Link>
                            <span>/</span>
                            <span className="text-brutalist-black">
                                {window.innerWidth <= 600 && job.title.length > 25 ? job.title.slice(0, 25) + '...' : job.title}
                            </span>
                        </div>
                    </div>
                } />

                {/* ── Page content ── */}
                <div className="w-full max-w-6xl mx-auto box-border" style={{ padding: '32px' }}>

                    {/* ── Hero card ── */}
                    <div className={cardClasses} style={{ ...cardStyle, marginBottom: '32px' }}>
                        <div className="flex flex-wrap gap-6 justify-between items-start">

                            {/* Job identity */}
                            <div className="flex-1 min-w-[240px]">
                                {/* Company logo placeholder */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 bg-vibrant-orange text-pure-white border-[3px] border-brutalist-black flex items-center justify-center text-3xl font-black uppercase shrink-0" style={{ boxShadow: '4px 4px 0px 0px #060608' }}>
                                        {job.company?.[0] || '?'}
                                    </div>
                                    <div>
                                        <h1 className="font-black text-3xl uppercase mb-1">
                                            {window.innerWidth <= 600 && job.title.length > 40 ? job.title.slice(0, 40) + '...' : job.title}
                                        </h1>
                                        <p className="font-label-mono font-bold text-lg text-vibrant-orange uppercase">
                                            {job.company}
                                        </p>
                                    </div>
                                </div>

                                {/* Meta pills */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {job.location && (
                                        <span className={pillClasses} style={{ padding: '6px 12px' }}>
                                            <FaMapMarkerAlt className="text-vibrant-orange" />
                                            {job.location}
                                        </span>
                                    )}
                                    {tags.map((t, i) => (
                                        <span key={i} className={pillClasses} style={{ padding: '6px 12px' }}>
                                            {t}
                                        </span>
                                    ))}
                                    <span className={pillClasses} style={{ padding: '6px 12px', background: '#f5f5f5' }}>
                                        <FaCalendarAlt />
                                        {formatDate(job.postedAt)}
                                    </span>
                                </div>

                                {/* Applied badge */}
                                {applied && statusMeta && (
                                    <span className="font-black text-sm uppercase flex items-center gap-2 border-[3px]" style={{
                                        background: statusMeta.bg, color: statusMeta.color,
                                        borderColor: statusMeta.border, padding: '8px 16px',
                                        width: 'max-content', boxShadow: '4px 4px 0px 0px #060608'
                                    }}>
                                        <FaCheck /> {currentStatusLabel}
                                    </span>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div className="job-action-btns flex gap-3 flex-wrap items-start shrink-0">
                                {/* Save */}
                                <button
                                    onClick={handleSaveToggle}
                                    disabled={actionLoading}
                                    className={`${btnClasses} ${saved ? 'bg-brutalist-black text-pure-white' : 'bg-pure-white text-brutalist-black'}`}
                                    style={{ padding: '12px 24px', boxShadow: '4px 4px 0px 0px #060608', fontSize: '14px' }}
                                >
                                    {saved ? <FaBookmark className="mr-2" /> : <FaRegBookmark className="mr-2" />}
                                    {saved ? 'Saved' : 'Save Job'}
                                </button>

                                {/* Application Status Dropdown */}
                                <div className="relative" ref={dropdownRef}>
                                    <select
                                        value={applicationStatus || 'NOT_APPLIED'}
                                        disabled={actionLoading}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === 'NOT_APPLIED') {
                                                handleWithdraw();
                                            } else {
                                                handleStatusChange(value);
                                            }
                                        }}
                                        className={`${btnClasses} cursor-pointer appearance-none min-w-[200px] outline-none`}
                                        style={{
                                            padding: '12px 24px',
                                            boxShadow: '4px 4px 0px 0px #060608',
                                            fontSize: '14px',
                                            background: applied ? (statusMeta?.bg || '#3b82f6') : '#ffffff',
                                            color: applied ? (statusMeta?.color || '#ffffff') : '#060608',
                                            borderColor: '#060608'
                                        }}
                                    >
                                        <option value="NOT_APPLIED">Not Applied</option>
                                        {STATUS_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* External apply link */}
                                {job.applyUrl && (
                                    <a
                                        href={job.applyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`${btnClasses} bg-vibrant-orange text-pure-white`}
                                        style={{ padding: '12px 24px', boxShadow: '4px 4px 0px 0px #060608', fontSize: '14px' }}
                                    >
                                        <FaExternalLinkAlt className="mr-2" />
                                        Apply on Site
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Two-column layout ── */}
                    <div className="job-layout flex gap-8 items-start">

                        {/* Left — description */}
                        <div className="flex-1 flex flex-col gap-8 min-w-0">

                            {/* Description */}
                            <div className={cardClasses} style={cardStyle}>
                                <h2 className="font-black text-2xl uppercase mb-6 border-b-[3px] border-brutalist-black inline-block" style={{ paddingBottom: '8px' }}>
                                    Job Description
                                </h2>
                                {(() => {
                                    const DESC_LIMIT = 500;
                                    const desc = job.description || 'No description provided.';
                                    const isLong = desc.length > DESC_LIMIT;
                                    const displayed = isLong && !descExpanded
                                        ? desc.slice(0, DESC_LIMIT) + '…'
                                        : desc;
                                    return (
                                        <>
                                            <div className="font-body-lg text-base whitespace-pre-wrap leading-relaxed opacity-80">
                                                {displayed}
                                            </div>
                                            {isLong && (
                                                <button
                                                    onClick={() => setDescExpanded(e => !e)}
                                                    className="mt-4 font-label-mono font-bold uppercase text-vibrant-orange hover:underline decoration-[2px] underline-offset-4"
                                                >
                                                    {descExpanded ? 'Read less' : 'Read more'}
                                                </button>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Skills */}
                            {skills.length > 0 && (() => {
                                const SKILL_COLORS = {
                                    'Required': { bg: '#FF6B00', color: '#ffffff' },
                                    'Nice to Have': { bg: '#2dd4bf', color: '#ffffff' },
                                };
                                const fallbackColors = { bg: '#f5f5f5', color: '#060608' };

                                const groups = skills.reduce((acc, s) => {
                                    const key = s.category || '';
                                    if (!acc[key]) acc[key] = [];
                                    acc[key].push(s.skillName);
                                    return acc;
                                }, {});

                                const groupEntries = Object.entries(groups);
                                const hasCategories = groupEntries.some(([key]) => key !== '');

                                return (
                                    <div className={cardClasses} style={cardStyle}>
                                        <h2 className="font-black text-2xl uppercase mb-6 border-b-[3px] border-brutalist-black inline-block" style={{ paddingBottom: '8px' }}>
                                            Skills
                                        </h2>
                                        <div className="flex flex-col gap-6">
                                            {groupEntries.map(([category, names]) => {
                                                const colors = SKILL_COLORS[category] || fallbackColors;
                                                return (
                                                    <div key={category || 'uncategorized'}>
                                                        {hasCategories && category && (
                                                            <div className="font-label-mono font-bold uppercase text-sm mb-3">
                                                                {category}
                                                            </div>
                                                        )}
                                                        <div className="flex flex-wrap gap-3">
                                                            {names.map((name, i) => (
                                                                <span key={i} className="font-black text-xs uppercase border-[2px] border-brutalist-black" style={{
                                                                    background: colors.bg,
                                                                    color: colors.color,
                                                                    padding: '8px 16px',
                                                                    boxShadow: '3px 3px 0px 0px #060608'
                                                                }}>
                                                                    {name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Right sidebar — job overview */}
                        <div className="job-sidebar w-[320px] shrink-0 flex flex-col gap-8">

                            {/* Overview */}
                            <div className={cardClasses} style={cardStyle}>
                                <h2 className="font-black text-xl uppercase mb-6 border-b-[3px] border-brutalist-black inline-block" style={{ paddingBottom: '8px' }}>
                                    Job Overview
                                </h2>
                                <div className="flex flex-col gap-6">
                                    {[
                                        { icon: <FaCalendarAlt />, label: 'Posted', value: formatDate(job.postedAt) },
                                        { icon: <FaBriefcase />, label: 'Job Type', value: job.employmentType || 'Full-time' },
                                        { icon: <FaMapMarkerAlt />, label: 'Location', value: job.location || 'Not specified' },
                                        { icon: <FaLayerGroup />, label: 'Category', value: job.jobCategory || '—' },
                                        { icon: <FaLink />, label: 'Source', value: job.source || '—' },
                                    ].map(({ icon, label, value }) => (
                                        <div key={label} className="flex gap-4 items-start">
                                            <div className="w-10 h-10 bg-pure-white border-[2px] border-brutalist-black flex items-center justify-center text-vibrant-orange shrink-0" style={{ boxShadow: '2px 2px 0px 0px #060608' }}>
                                                {icon}
                                            </div>
                                            <div>
                                                <div className="font-label-mono font-bold uppercase text-xs opacity-60 mb-1">{label}</div>
                                                <div className="font-body-lg font-bold">{value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Applied? track it card */}
                            {!applied && (
                                <div className="bg-vibrant-orange border-[4px] border-brutalist-black text-center" style={{ padding: '32px', boxShadow: '8px 8px 0px 0px #060608' }}>
                                    <p className="font-black text-2xl uppercase text-pure-white mb-2">
                                        Applied externally?
                                    </p>
                                    <p className="font-label-mono font-bold text-sm text-pure-white mb-6">
                                        Track this application in your pipeline.
                                    </p>
                                    <button
                                        onClick={() => handleStatusChange('APPLIED')}
                                        className="w-full font-black uppercase text-lg bg-pure-white text-brutalist-black border-[3px] border-brutalist-black hover:-translate-y-1 active:translate-y-1 transition-transform"
                                        style={{ padding: '12px', boxShadow: '4px 4px 0px 0px #060608' }}
                                    >
                                        Mark as Applied →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}