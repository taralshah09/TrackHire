import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaBriefcase, FaDollarSign } from 'react-icons/fa';

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

// function formatSalary(min, max) {
//     const fmt = (n) => n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;
//     if (min > 0 && max > 0) return `${fmt(min)}–${fmt(max)}`;
//     if (min > 0) return `${fmt(min)}+`;
//     if (max > 0) return `Up to ${fmt(max)}`;
//     return null;
// }

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
        minSalary = 0, maxSalary = 0,
        employmentType,
        postedAt,
        isApplied = false,
        isSaved = false,
        applicationStatus,
    } = job || {};

    const companyLabel = companyName || company || 'Company';
    const statusStyle = isApplied && applicationStatus ? getStatusStyle(applicationStatus) : null;
    const salary = formatSalary(minSalary, maxSalary);

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
            {/* Top row: company initial + saved badge */}
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
                {isSaved && (
                    <span style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: '11px',
                        letterSpacing: '0.06em',
                        background: STATUS_STYLES.SAVED.bg,
                        color: STATUS_STYLES.SAVED.color,
                        border: `1px solid ${STATUS_STYLES.SAVED.border}`,
                        padding: '3px 10px',
                        borderRadius: '999px',
                    }}>
                        Saved
                    </span>
                )}
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
            <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: 'var(--color-orange)',
                margin: '0 0 16px',
                fontWeight: 500,
            }}>
                {companyLabel}
            </p>

            {/* Meta: location, type, salary */}
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
                {/* {salary && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-white-40)', display: 'flex' }}><FaDollarSign /></span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-white-65)', letterSpacing: '0.02em' }}>{salary}</span>
                    </div>
                )} */}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: '16px' }} />

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