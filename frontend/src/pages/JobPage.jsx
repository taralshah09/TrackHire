import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AppHeader from '../components/AppHeader';
import api from '../service/ApiService';
import {
    FaArrowLeft, FaBookmark, FaRegBookmark, FaExternalLinkAlt,
    FaMapMarkerAlt, FaBriefcase, FaDollarSign, FaCalendarAlt,
    FaLayerGroup, FaLink, FaChevronDown, FaCheck, FaTimes,
} from 'react-icons/fa';

/* ── Brand status tokens (mirrors DashboardPage) ── */
const STATUS_STYLES = {
    APPLIED: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.20)' },
    INTERVIEW: { bg: 'rgba(249,115,22,0.12)', color: '#f97316', border: 'rgba(249,115,22,0.22)' },
    OFFER: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'rgba(34,197,94,0.20)' },
    REJECTED: { bg: 'rgba(239,68,68,0.10)', color: '#f87171', border: 'rgba(239,68,68,0.18)' },
    PHONE_SCREEN: { bg: 'rgba(20,184,166,0.12)', color: '#2dd4bf', border: 'rgba(20,184,166,0.20)' },
    WITHDRAWN: { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.20)' },
};

const STATUS_OPTIONS = [
    { value: 'APPLIED', label: 'Applied', icon: <FaCheck /> },
    { value: 'INTERVIEW', label: 'Interview', icon: <FaCalendarAlt /> },
    { value: 'OFFER', label: 'Offer', icon: <FaCheck /> },
    { value: 'REJECTED', label: 'Rejected', icon: <FaTimes /> },
    { value: 'PHONE_SCREEN', label: 'Phone Screen', icon: <FaCheck /> },
];

/* ── Shared inline style helpers ── */
const card = {
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    borderRadius: '14px',
    padding: '24px',
};

const labelStyle = {
    fontFamily: 'var(--font-display)', fontWeight: 700,
    fontSize: '10px', letterSpacing: '0.12em',
    textTransform: 'uppercase', color: 'var(--color-white-40)',
    marginBottom: '4px',
};

const valueStyle = {
    fontFamily: 'var(--font-body)', fontSize: '14px',
    color: 'var(--color-white-65)',
};

export default function JobPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [applied, setApplied] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const dropdownRef = useRef(null);

    /* fetch ── */
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const res = await api.getJobById(id);
                const data = await res.json();
                setJob(data);
                setSaved(data.isSaved || false);
                setApplied(data.isApplied || false);
                setApplicationStatus(data.applicationStatus || null);
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

    const handleApplyClick = () => {
        if (applied) setShowDropdown(d => !d);
        else handleStatusChange('APPLIED');
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
    // const formatSalary = () => {
    //     if (!job) return 'Not disclosed';
    //     const { minSalary = 0, maxSalary = 0 } = job;
    //     if (minSalary > 0 && maxSalary > 0) return `₹${minSalary.toLocaleString()} – ₹${maxSalary.toLocaleString()}`;
    //     if (minSalary > 0) return `₹${minSalary.toLocaleString()}+`;
    //     if (maxSalary > 0) return `Up to ₹${maxSalary.toLocaleString()}`;
    //     return 'Not disclosed';
    // };

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
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-white-40)' }}>
                            Loading job…
                        </p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                </main>
            </div>
        );
    }

    /* ── job not found ── */
    if (!job) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
                <Sidebar />
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', color: 'var(--color-white)' }}>
                        Job not found.
                    </p>
                    <button onClick={() => navigate('/jobs')} style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px',
                        color: 'var(--color-orange)', background: 'transparent', border: 'none',
                        cursor: 'pointer', textDecoration: 'underline',
                    }}>
                        ← Back to Browse Jobs
                    </button>
                </main>
            </div>
        );
    }

    const tags = [job.employmentType, job.jobCategory].filter(Boolean);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 900px) {
                    .job-layout { flex-direction: column !important; }
                    .job-sidebar { width: 100% !important; }
                }
                @media (max-width: 768px) {
                    .job-main-inner { padding: 80px 16px 32px !important; }
                }
            `}</style>

            <Sidebar />

            <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

                {/* ── Sticky top header ── */}
                <AppHeader left={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={() => navigate(-1)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                fontFamily: 'var(--font-display)', fontWeight: 600,
                                fontSize: '14px', color: 'var(--color-white-65)',
                                transition: 'color 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-white)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-white-65)'}
                        >
                            <FaArrowLeft style={{ fontSize: '13px' }} />
                            Back
                        </button>
                        <span style={{ color: 'var(--color-border)' }}>|</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-40)' }}>
                            <Link to="/jobs" style={{ color: 'var(--color-white-40)', textDecoration: 'none' }}
                                onMouseEnter={e => e.target.style.color = 'var(--color-orange)'}
                                onMouseLeave={e => e.target.style.color = 'var(--color-white-40)'}
                            >Browse Jobs</Link>
                            <span>/</span>
                            <span style={{ color: 'var(--color-white-65)' }}>{job.title}</span>
                        </div>
                    </div>
                } />

                {/* ── Page content ── */}
                <div className="job-main-inner" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px', width: '100%', boxSizing: 'border-box' }}>

                    {/* ── Hero card ── */}
                    <div style={{ ...card, marginBottom: '24px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                            {/* Job identity */}
                            <div style={{ flex: 1, minWidth: '240px' }}>
                                {/* Company logo placeholder */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '12px',
                                        background: 'var(--color-surface-3)', border: '1px solid var(--color-border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '22px', fontWeight: 700,
                                        fontFamily: 'var(--font-display)', color: 'var(--color-orange)',
                                        flexShrink: 0,
                                    }}>
                                        {job.company?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <h1 style={{
                                            fontFamily: 'var(--font-display)', fontWeight: 800,
                                            fontSize: 'clamp(18px, 3vw, 26px)', letterSpacing: '-0.02em',
                                            color: 'var(--color-white)', margin: '0 0 4px',
                                        }}>
                                            {job.title}
                                        </h1>
                                        <p style={{
                                            fontFamily: 'var(--font-body)', fontSize: '15px',
                                            color: 'var(--color-orange)', margin: 0, fontWeight: 500,
                                        }}>
                                            {job.company}
                                        </p>
                                    </div>
                                </div>

                                {/* Meta pills */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                                    {job.location && (
                                        <span style={{
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                            fontFamily: 'var(--font-body)', fontSize: '13px',
                                            color: 'var(--color-white-65)',
                                            background: 'var(--color-surface-3)',
                                            border: '1px solid var(--color-border)',
                                            padding: '4px 10px', borderRadius: '999px',
                                        }}>
                                            <FaMapMarkerAlt style={{ fontSize: '11px', color: 'var(--color-white-40)' }} />
                                            {job.location}
                                        </span>
                                    )}
                                    {tags.map((t, i) => (
                                        <span key={i} style={{
                                            fontFamily: 'var(--font-display)', fontWeight: 700,
                                            fontSize: '10px', letterSpacing: '0.08em',
                                            textTransform: 'uppercase',
                                            color: 'var(--color-white-65)',
                                            background: 'var(--color-surface-3)',
                                            border: '1px solid var(--color-border)',
                                            padding: '4px 10px', borderRadius: '999px',
                                        }}>
                                            {t}
                                        </span>
                                    ))}
                                    <span style={{
                                        fontFamily: 'var(--font-display)', fontWeight: 700,
                                        fontSize: '10px', letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        color: 'var(--color-white-40)',
                                        fontStyle: 'italic',
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        padding: '4px 0',
                                    }}>
                                        <FaCalendarAlt style={{ fontSize: '10px' }} />
                                        {formatDate(job.postedAt)}
                                    </span>
                                </div>

                                {/* Applied badge */}
                                {applied && statusMeta && (
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        background: statusMeta.bg, color: statusMeta.color,
                                        border: `1px solid ${statusMeta.border}`,
                                        padding: '4px 12px', borderRadius: '999px',
                                        fontFamily: 'var(--font-display)', fontWeight: 700,
                                        fontSize: '11px', letterSpacing: '0.06em',
                                    }}>
                                        <FaCheck style={{ fontSize: '9px' }} />
                                        {currentStatusLabel}
                                    </span>
                                )}
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-start', flexShrink: 0 }}>
                                {/* Save */}
                                <button
                                    onClick={handleSaveToggle}
                                    disabled={actionLoading}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 18px', borderRadius: '8px', cursor: 'pointer',
                                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
                                        transition: 'all 0.2s',
                                        background: saved ? 'rgba(168,85,247,0.10)' : 'transparent',
                                        color: saved ? '#c084fc' : 'var(--color-white-65)',
                                        border: saved ? '1px solid rgba(168,85,247,0.25)' : '1px solid var(--color-border)',
                                    }}
                                    onMouseEnter={e => { if (!saved) { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.25)'; e.currentTarget.style.color = '#c084fc'; } }}
                                    onMouseLeave={e => { if (!saved) { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-white-65)'; } }}
                                >
                                    {saved ? <FaBookmark style={{ fontSize: '13px' }} /> : <FaRegBookmark style={{ fontSize: '13px' }} />}
                                    {saved ? 'Saved' : 'Save Job'}
                                </button>

                                {/* Apply / Status */}
                                <div style={{ position: 'relative' }} ref={dropdownRef}>
                                    <button
                                        onClick={handleApplyClick}
                                        disabled={actionLoading}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                                            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
                                            transition: 'all 0.2s',
                                            background: applied ? (statusMeta?.bg || 'rgba(59,130,246,0.12)') : 'var(--color-orange)',
                                            color: applied ? (statusMeta?.color || '#60a5fa') : '#000',
                                            border: applied ? `1px solid ${statusMeta?.border || 'rgba(59,130,246,0.20)'}` : 'none',
                                        }}
                                        onMouseEnter={e => { if (!applied) e.currentTarget.style.background = 'var(--color-orange-hover)'; }}
                                        onMouseLeave={e => { if (!applied) e.currentTarget.style.background = 'var(--color-orange)'; }}
                                    >
                                        {applied ? currentStatusLabel : 'Apply Now'}
                                        {applied && <FaChevronDown style={{ fontSize: '11px' }} />}
                                    </button>

                                    {/* Status dropdown */}
                                    {showDropdown && applied && (
                                        <div style={{
                                            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                                            width: '220px', zIndex: 100,
                                            background: 'var(--color-surface-2)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '12px', overflow: 'hidden',
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                        }}>
                                            <div style={{
                                                padding: '10px 14px',
                                                borderBottom: '1px solid var(--color-border)',
                                                fontFamily: 'var(--font-display)', fontWeight: 700,
                                                fontSize: '10px', letterSpacing: '0.12em',
                                                textTransform: 'uppercase', color: 'var(--color-white-40)',
                                            }}>Update Status</div>
                                            {STATUS_OPTIONS.map(opt => {
                                                const s = STATUS_STYLES[opt.value];
                                                const isCurrent = applicationStatus === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => handleStatusChange(opt.value)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '10px',
                                                            width: '100%', padding: '10px 14px',
                                                            background: isCurrent ? s.bg : 'transparent',
                                                            border: 'none', cursor: 'pointer',
                                                            fontFamily: 'var(--font-body)', fontSize: '13px',
                                                            color: isCurrent ? s.color : 'var(--color-white-65)',
                                                            textAlign: 'left', transition: 'background 0.15s',
                                                        }}
                                                        onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'var(--color-surface-3)'; }}
                                                        onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                                                    >
                                                        <span style={{ fontSize: '11px', color: s.color }}>{opt.icon}</span>
                                                        {opt.label}
                                                        {isCurrent && <FaCheck style={{ marginLeft: 'auto', fontSize: '10px' }} />}
                                                    </button>
                                                );
                                            })}
                                            <div style={{ borderTop: '1px solid var(--color-border)' }}>
                                                <button
                                                    onClick={handleWithdraw}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '10px',
                                                        width: '100%', padding: '10px 14px',
                                                        background: 'transparent', border: 'none', cursor: 'pointer',
                                                        fontFamily: 'var(--font-body)', fontSize: '13px',
                                                        color: '#f87171', textAlign: 'left', transition: 'background 0.15s',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <FaTimes style={{ fontSize: '11px' }} />
                                                    Withdraw Application
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* External apply link */}
                                {job.applyUrl && (
                                    <a
                                        href={job.applyUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '7px',
                                            padding: '10px 16px', borderRadius: '8px',
                                            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
                                            color: 'var(--color-white-65)',
                                            background: 'transparent',
                                            border: '1px solid var(--color-border)',
                                            textDecoration: 'none', transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-white-40)'; e.currentTarget.style.color = 'var(--color-white)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-white-65)'; }}
                                    >
                                        <FaExternalLinkAlt style={{ fontSize: '11px' }} />
                                        Apply on Site
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Two-column layout ── */}
                    <div className="job-layout" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

                        {/* Left — description */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>

                            {/* Description */}
                            <div style={card}>
                                <h2 style={{
                                    fontFamily: 'var(--font-display)', fontWeight: 700,
                                    fontSize: '16px', color: 'var(--color-white)',
                                    margin: '0 0 20px', letterSpacing: '-0.01em',
                                }}>
                                    Job Description
                                </h2>
                                <div style={{
                                    fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.8,
                                    color: 'var(--color-white-65)', whiteSpace: 'pre-wrap',
                                }}>
                                    {job.description || 'No description provided.'}
                                </div>
                            </div>

                            {/* Skills */}
                            {job.skills && job.skills.length > 0 && (
                                <div style={card}>
                                    <h2 style={{
                                        fontFamily: 'var(--font-display)', fontWeight: 700,
                                        fontSize: '16px', color: 'var(--color-white)',
                                        margin: '0 0 16px', letterSpacing: '-0.01em',
                                    }}>
                                        Required Skills
                                    </h2>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {job.skills.map((skill, i) => (
                                            <span key={i} style={{
                                                fontFamily: 'var(--font-display)', fontWeight: 700,
                                                fontSize: '11px', letterSpacing: '0.06em',
                                                textTransform: 'uppercase',
                                                background: 'var(--color-orange-dim)',
                                                color: 'var(--color-orange)',
                                                border: '1px solid var(--color-orange-border)',
                                                padding: '5px 12px', borderRadius: '999px',
                                            }}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right sidebar — job overview */}
                        <div className="job-sidebar" style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>

                            {/* Overview */}
                            <div style={card}>
                                <h2 style={{
                                    fontFamily: 'var(--font-display)', fontWeight: 700,
                                    fontSize: '14px', color: 'var(--color-white)',
                                    margin: '0 0 20px', letterSpacing: '-0.01em',
                                }}>
                                    Job Overview
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[
                                        { icon: <FaCalendarAlt />, label: 'Posted', value: formatDate(job.postedAt) },
                                        { icon: <FaBriefcase />, label: 'Job Type', value: job.employmentType || 'Full-time' },
                                        // { icon: <FaDollarSign />, label: 'Salary', value: formatSalary() },
                                        { icon: <FaMapMarkerAlt />, label: 'Location', value: job.location || 'Not specified' },
                                        { icon: <FaLayerGroup />, label: 'Category', value: job.jobCategory || '—' },
                                        { icon: <FaLink />, label: 'Source', value: job.source || '—' },
                                    ].map(({ icon, label, value }) => (
                                        <div key={label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: 'var(--color-surface-3)',
                                                border: '1px solid var(--color-border)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'var(--color-white-40)', fontSize: '12px', flexShrink: 0,
                                            }}>
                                                {icon}
                                            </div>
                                            <div>
                                                <div style={labelStyle}>{label}</div>
                                                <div style={valueStyle}>{value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Applied? track it card */}
                            {!applied && (
                                <div style={{
                                    background: 'linear-gradient(135deg, rgba(249,115,22,0.14) 0%, rgba(249,115,22,0.05) 100%)',
                                    border: '1px solid var(--color-orange-border)',
                                    borderRadius: '14px', padding: '20px', textAlign: 'center',
                                }}>
                                    <p style={{
                                        fontFamily: 'var(--font-display)', fontWeight: 700,
                                        fontSize: '14px', color: 'var(--color-white)', margin: '0 0 8px',
                                    }}>
                                        Applied externally?
                                    </p>
                                    <p style={{
                                        fontFamily: 'var(--font-body)', fontSize: '13px',
                                        color: 'var(--color-white-65)', margin: '0 0 16px', lineHeight: 1.6,
                                    }}>
                                        Track this application → in your pipeline.
                                    </p>
                                    <button
                                        onClick={() => handleStatusChange('APPLIED')}
                                        style={{
                                            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
                                            color: '#000', background: 'var(--color-orange)',
                                            border: 'none', borderRadius: '8px',
                                            padding: '10px 20px', cursor: 'pointer',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-orange-hover)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'var(--color-orange)'}
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