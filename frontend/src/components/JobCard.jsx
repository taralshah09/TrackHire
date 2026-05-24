import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaBriefcase, FaBookmark, FaRegBookmark, FaCheck, FaChevronDown } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import api from '../service/ApiService';

/* Brand-accurate status badge styles per guidelines */
const STATUS_STYLES = {
    SAVED: { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', border: 'rgba(168,85,247,0.20)' },
    APPLIED: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.20)' },
    PHONE_SCREEN: { bg: 'rgba(20,184,166,0.12)', color: '#2dd4bf', border: 'rgba(20,184,166,0.20)' },
    INTERVIEW: { bg: 'rgba(249,115,22,0.12)', color: '#f97316', border: 'rgba(249,115,22,0.22)' },
    OFFER: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'rgba(34,197,94,0.20)' },
    REJECTED: { bg: 'rgba(239,68,68,0.10)', color: '#f87171', border: 'rgba(239,68,68,0.18)' },
    WITHDRAWN: { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.20)' },
};

function getStatusStyle(status) {
    if (!status) return null;
    return STATUS_STYLES[status.toUpperCase().replace(' ', '_')] || STATUS_STYLES.APPLIED;
}



function formatPostedDate(dateString) {
    if (!dateString) return 'Recently';
    const diff = Math.floor((Date.now() - new Date(dateString)) / 86400000);
    if (diff < 1) return 'Today';
    if (diff === 1) return '1 day ago';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return `${Math.floor(diff / 30)} months ago`;
}

export default function JobCard({ job }) {
    const [hovered, setHovered] = useState(false);

    const {
        id,
        title = 'Software Engineer',
        company, companyName,
        location = 'Remote',

        employmentType,
        postedAt,
        isApplied = false,
        isSaved = false,
        applicationStatus,
    } = job || {};

    const companyLabel = companyName || company || 'Company';

    const [saved, setSaved] = useState(isSaved);
    const [applied, setApplied] = useState(isApplied);
    const [statusState, setStatusState] = useState(applicationStatus);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);
    const [applyLoading, setApplyLoading] = useState(false);

    useEffect(() => {
        setSaved(isSaved);
        setApplied(isApplied);
        setStatusState(applicationStatus);
    }, [isSaved, isApplied, applicationStatus]);

    const statusStyle = applied && statusState ? getStatusStyle(statusState) : null;


    const [followed, setFollowed] = useState(job.isFollowed || false);
    const [followLoading, setFollowLoading] = useState(false);

    const handleBookmarkClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (bookmarkLoading) return;

        setBookmarkLoading(true);
        try {
            if (saved) {
                await api.unsaveJob(id);
                setSaved(false);
                toast.success('Job removed from Saved');
            } else {
                await api.saveJob(id);
                setSaved(true);
                toast.success('Job saved!');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to update bookmark');
        } finally {
            setBookmarkLoading(false);
        }
    };

    const handleAppliedCheckboxChange = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (applyLoading) return;

        setApplyLoading(true);
        try {
            if (applied) {
                await api.withdrawApplication(id);
                setApplied(false);
                setStatusState(null);
                toast.success('Application withdrawn');
            } else {
                await api.updateJobStatus(id, 'APPLIED');
                setApplied(true);
                setStatusState('APPLIED');
                toast.success('Marked as Applied!');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to update application');
        } finally {
            setApplyLoading(false);
        }
    };

    const handleDropdownChange = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const newStatus = e.target.value;

        if (applyLoading || bookmarkLoading) return;

        setApplyLoading(true);
        try {
            if (newStatus === 'NOT_APPLIED') {
                if (applied) {
                    await api.withdrawApplication(id);
                }
                if (saved) {
                    await api.unsaveJob(id);
                }
                setApplied(false);
                setSaved(false);
                setStatusState(null);
                toast.success('Job reset (not saved, not applied)');
            } else if (newStatus === 'SAVED') {
                if (!saved) {
                    await api.saveJob(id);
                }
                if (applied) {
                    await api.withdrawApplication(id);
                }
                setApplied(false);
                setSaved(true);
                setStatusState(null);
                toast.success('Job moved to Saved');
            } else {
                await api.updateJobStatus(id, newStatus);
                setApplied(true);
                setStatusState(newStatus);
                toast.success(`Job marked as ${newStatus.toLowerCase().replace('_', ' ')}`);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to update job status');
        } finally {
            setApplyLoading(false);
        }
    };

    const handleFollowToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (followLoading) return;

        setFollowLoading(true);
        try {
            const res = await api.getPreferredCompanies();
            const prefs = res.json ? await res.json() : res;
            let newPrefs;
            if (!followed) {
                newPrefs = [...prefs, companyLabel];
            } else {
                newPrefs = prefs.filter(c => c !== companyLabel);
            }
            await api.savePreferredCompanies(newPrefs);
            setFollowed(!followed);
        } catch (err) {
            console.error(err);
        } finally {
            setFollowLoading(false);
        }
    };

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'var(--color-surface-2)',
                border: hovered ? '1px solid var(--color-orange-border)' : '1px solid var(--color-border)',
                borderRadius: '14px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0',
                transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.2s',
                boxShadow: hovered ? '0 0 32px rgba(249,115,22,0.10)' : 'none',
                transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
                cursor: 'default',
                position: 'relative',
            }}
        >
            {followed && (
                <div style={{
                    position: 'absolute', top: '-10px', right: '12px',
                    background: 'var(--color-orange)', color: '#000',
                    fontSize: '10px', fontWeight: 800, padding: '2px 8px',
                    borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em',
                    boxShadow: '0 4px 12px rgba(249,115,22,0.3)', zIndex: 5
                }}>
                    Prioritized
                </div>
            )}
            {/* Top row: company initial + bookmark button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{
                    width: '40px', height: '40px',
                    background: 'var(--color-surface-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '16px',
                    color: 'var(--color-orange)',
                }}>
                    {companyLabel.charAt(0).toUpperCase()}
                </div>
                <button
                    onClick={handleBookmarkClick}
                    disabled={bookmarkLoading}
                    title={saved ? "Remove Bookmark" : "Bookmark Job"}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: saved ? '#c084fc' : 'var(--color-white-40)',
                        fontSize: '18px',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.color = saved ? '#c084fc' : 'var(--color-white-65)';
                        e.currentTarget.style.background = 'var(--color-surface-3)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.color = saved ? '#c084fc' : 'var(--color-white-40)';
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    {saved ? <FaBookmark /> : <FaRegBookmark />}
                </button>
            </div>

            {/* Title + company */}
            <h3 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '16px',
                letterSpacing: '-0.01em',
                color: 'var(--color-white)',
                margin: '0 0 4px',
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
            }}>
                {title}
            </h3>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                margin: '0 0 16px',
            }}>
                <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px',
                    color: 'var(--color-orange)',
                    margin: 0,
                    fontWeight: 500,
                }}>
                    {companyLabel}
                </p>
                <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    style={{
                        background: followed ? 'var(--color-orange)' : 'transparent',
                        border: followed ? '1px solid var(--color-orange)' : '1px solid var(--color-orange-border)',
                        color: followed ? '#000' : 'var(--color-orange)',
                        fontSize: '10px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        transition: 'all 0.2s',
                        opacity: followLoading ? 0.6 : 1,
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                    }}
                    onMouseEnter={e => {
                        if (!followed) {
                            e.currentTarget.style.background = 'var(--color-orange)';
                            e.currentTarget.style.color = '#000';
                        }
                    }}
                    onMouseLeave={e => {
                        if (!followed) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--color-orange)';
                        }
                    }}
                >
                    {followLoading ? '...' : followed ? 'Following' : 'Follow'}
                </button>
            </div>

            {/* Meta: location, type */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-white-40)', display: 'flex' }}><FaMapMarkerAlt /></span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-65)' }}>{location}</span>
                </div>
                {employmentType && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-white-40)', display: 'flex' }}><FaBriefcase /></span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-65)' }}>{employmentType}</span>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: '16px' }} />

            {/* Interactive Actions Row */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '16px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '8px 12px',
            }}>
                <div
                    onClick={handleAppliedCheckboxChange}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        fontFamily: 'var(--font-display)',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: applied ? '#60a5fa' : 'var(--color-white-40)',
                        transition: 'color 0.2s',
                    }}
                >
                    <div style={{
                        width: '16px',
                        height: '16px',
                        border: applied ? '1px solid rgba(59,130,246,0.6)' : '1px solid var(--color-border)',
                        borderRadius: '4px',
                        background: applied ? 'rgba(59,130,246,0.12)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#60a5fa',
                        fontSize: '10px',
                        transition: 'all 0.2s',
                    }}>
                        {applied && <FaCheck />}
                    </div>
                    <span>Applied</span>
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <select
                        value={applied ? (statusState || 'APPLIED') : (saved ? 'SAVED' : 'NOT_APPLIED')}
                        disabled={applyLoading || bookmarkLoading}
                        onChange={handleDropdownChange}
                        style={{
                            appearance: 'none',
                            background: 'var(--color-surface-3)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            padding: '4px 24px 4px 10px',
                            color: 'var(--color-white-65)',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600,
                            fontSize: '11px',
                            cursor: 'pointer',
                            outline: 'none',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-white-40)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                    >
                        <option value="NOT_APPLIED">Not Applied</option>
                        <option value="SAVED">Saved</option>
                        <option value="APPLIED">Applied</option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="OFFER">Offer</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    <FaChevronDown style={{
                        position: 'absolute',
                        right: '8px',
                        pointerEvents: 'none',
                        fontSize: '9px',
                        color: 'var(--color-white-40)'
                    }} />
                </div>
            </div>

            {/* Footer: date + status + CTA */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-white-40)', letterSpacing: '0.04em' }}>
                    {formatPostedDate(postedAt)}
                </span>
                {statusStyle && (
                    <span style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: '11px',
                        letterSpacing: '0.06em',
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`,
                        padding: '3px 10px',
                        borderRadius: '999px',
                    }}>
                        {applicationStatus}
                    </span>
                )}
            </div>

            {/* View Details CTA */}
            <Link
                to={`/jobs/${id}`}
                style={{
                    display: 'block',
                    textAlign: 'center',
                    marginTop: '12px',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'var(--color-orange-dim)',
                    border: '1px solid var(--color-orange-border)',
                    color: 'var(--color-orange)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '13px',
                    textDecoration: 'none',
                    transition: 'background 0.2s, color 0.2s',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--color-orange)';
                    e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--color-orange-dim)';
                    e.currentTarget.style.color = 'var(--color-orange)';
                }}
            >
                View Details →
            </Link>
        </div>
    );
}