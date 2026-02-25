import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AppHeader from '../components/AppHeader';
import StatCard from '../components/StatCard';
import api from '../service/ApiService';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';
import Cookies from 'js-cookie';
import { FaPaperPlane, FaCalendarAlt, FaTrophy, FaBookmark, FaHandPaper } from 'react-icons/fa';

/* Brand status badge styles */
const STATUS_STYLES = {
    SAVED: { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', border: 'rgba(168,85,247,0.20)' },
    APPLIED: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.20)' },
    PHONE_SCREEN: { bg: 'rgba(20,184,166,0.12)', color: '#2dd4bf', border: 'rgba(20,184,166,0.20)' },
    INTERVIEW: { bg: 'rgba(249,115,22,0.12)', color: '#f97316', border: 'rgba(249,115,22,0.22)' },
    OFFER: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'rgba(34,197,94,0.20)' },
    REJECTED: { bg: 'rgba(239,68,68,0.10)', color: '#f87171', border: 'rgba(239,68,68,0.18)' },
    WITHDRAWN: { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.20)' },
};

function getStatus(status) {
    if (!status) return STATUS_STYLES.APPLIED;
    return STATUS_STYLES[status.toUpperCase().replace(' ', '_')] || STATUS_STYLES.APPLIED;
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function DashboardPage() {
    const [stats, setStats] = useState({});
    const [appliedJobs, setAppliedJobs] = useState([]);
    const [savedJobs, setSavedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const username = Cookies.get('username') || 'there';
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    useEffect(() => {
        const fetch = async () => {
            try {
                const [sr, ar, svr] = await Promise.all([
                    api.getUserStats(),
                    api.getAppliedJobs({ page: 0, size: 5, sort: 'appliedAt', direction: 'DESC' }),
                    api.getSavedJobs({ page: 0, size: 4, sort: 'savedAt', direction: 'DESC' }),
                ]);
                setStats(sr.json ? await sr.json() : sr);
                const ad = ar.json ? await ar.json() : ar;
                const sd = svr.json ? await svr.json() : svr;
                const appliedArr = ad.content || (Array.isArray(ad) ? ad : []);
                const savedArr = sd.content || (Array.isArray(sd) ? sd : []);
                setAppliedJobs(appliedArr);
                setSavedJobs(savedArr);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const breakdown = stats.applicationStatusBreakdown || {};

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
            <style>{`
                @media (max-width: 1024px) {
                    .dash-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 768px) {
                    .dash-main { padding-left: 0 !important; }
                    .dash-main-inner { padding: 80px 16px 24px !important; }
                    .dash-grid-4 { grid-template-columns: 1fr 1fr !important; }
                    .dash-bottom { flex-direction: column !important; }
                    .dash-saved-panel { width: 100% !important; }
                    
                    /* Table responsiveness */
                    .activity-table th:nth-child(2), .activity-table td:nth-child(2),
                    .activity-table th:nth-child(4), .activity-table td:nth-child(4) {
                        display: none !important;
                    }
                }
                @media (max-width: 480px) {
                    .dash-grid-4 { grid-template-columns: 1fr !important; }
                    .dash-main-inner { padding-top: 72px !important; }
                }
            `}</style>

            <Sidebar />

            <main className="dash-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Top header */}
                <AppHeader left={
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: 'var(--color-white-40)' }}>
                        {today}
                    </div>
                } />

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div className="dash-main-inner" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>

                        {/* Greeting */}
                        <div style={{ marginBottom: '32px' }}>
                            <h1 style={{
                                fontFamily: 'var(--font-display)', fontWeight: 800,
                                fontSize: 'clamp(22px, 3vw, 32px)', letterSpacing: '-0.025em',
                                color: 'var(--color-white)', margin: 0,
                            }}>
                                {getGreeting()}, {username} <FaHandPaper style={{ display: 'inline', marginLeft: '6px', color: 'var(--color-orange)' }} />
                            </h1>
                            <p style={{
                                fontFamily: 'var(--font-body)', fontSize: '14px',
                                color: 'var(--color-white-40)', marginTop: '6px',
                            }}>
                                {today}
                            </p>
                        </div>

                        {/* Stat cards */}
                        <div
                            className="dash-grid-4"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '16px', marginBottom: '32px',
                            }}
                        >
                            <StatCard title="Total Applied" value={stats.totalApplied || 0} icon={<FaPaperPlane />} />
                            <StatCard title="Interviews Scheduled" value={breakdown.INTERVIEW || 0} icon={<FaCalendarAlt />} />
                            <StatCard title="Offers Received" value={breakdown.OFFER || 0} icon={<FaTrophy />} accentColor="green" />
                            <StatCard title="Saved Jobs" value={stats.totalSaved || 0} icon={<FaBookmark />} />
                        </div>

                        {/* Bottom row */}
                        <div className="dash-bottom" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

                            {/* Applied jobs table */}
                            <div style={{
                                flex: 1,
                                background: 'var(--color-surface-2)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '14px', overflow: 'hidden',
                            }}>
                                <div style={{
                                    padding: '20px 24px',
                                    borderBottom: '1px solid var(--color-border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                    <h2 style={{
                                        fontFamily: 'var(--font-display)', fontWeight: 700,
                                        fontSize: '16px', color: 'var(--color-white)', margin: 0,
                                    }}>Recent Activity</h2>
                                    <Link to="/applied-all" style={{
                                        fontFamily: 'var(--font-display)', fontWeight: 700,
                                        fontSize: '12px', color: 'var(--color-orange)',
                                        textDecoration: 'none', letterSpacing: '0.04em',
                                    }}>View All →</Link>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="activity-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                                {['Job Title', 'Company', 'Status', 'Date Applied'].map(h => (
                                                    <th key={h} style={{
                                                        padding: '12px 20px',
                                                        fontFamily: 'var(--font-display)', fontWeight: 700,
                                                        fontSize: '10px', letterSpacing: '0.12em',
                                                        textTransform: 'uppercase',
                                                        color: 'var(--color-white-40)',
                                                        textAlign: 'left', whiteSpace: 'nowrap',
                                                    }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-white-40)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>Loading…</td></tr>
                                            ) : appliedJobs.length === 0 ? (
                                                <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center' }}>
                                                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-white-40)', margin: '0 0 4px' }}>No activity yet.</p>
                                                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-20)', margin: 0 }}>Add your first application to get started.</p>
                                                </td></tr>
                                            ) : appliedJobs.map((job) => {
                                                const s = getStatus(job.applicationStatus);
                                                return (
                                                    <tr key={job.id} style={{ borderBottom: '1px solid rgba(46,46,46,0.5)' }}>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <Link to={`/jobs/${job.id}`} style={{
                                                                fontFamily: 'var(--font-display)', fontWeight: 700,
                                                                fontSize: '14px', color: 'var(--color-white)',
                                                                textDecoration: 'none',
                                                            }}
                                                                onMouseEnter={e => e.target.style.color = 'var(--color-orange)'}
                                                                onMouseLeave={e => e.target.style.color = 'var(--color-white)'}
                                                            >
                                                                {job.title || job.role}
                                                            </Link>
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-white-65)' }}>
                                                            {job.companyName || job.company}
                                                        </td>
                                                        <td style={{ padding: '14px 20px' }}>
                                                            <span style={{
                                                                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '11px',
                                                                letterSpacing: '0.06em',
                                                                background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                                                                padding: '3px 10px', borderRadius: '999px',
                                                            }}>
                                                                {job.applicationStatus || 'Applied'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-white-40)' }}>
                                                            {formatDate(job.appliedAt)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Saved jobs panel */}
                            <div className="dash-saved-panel" style={{
                                width: '280px', flexShrink: 0,
                                background: 'var(--color-surface-2)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '14px', overflow: 'hidden',
                            }}>
                                <div style={{
                                    padding: '20px 20px',
                                    borderBottom: '1px solid var(--color-border)',
                                }}>
                                    <h2 style={{
                                        fontFamily: 'var(--font-display)', fontWeight: 700,
                                        fontSize: '16px', color: 'var(--color-white)', margin: 0,
                                    }}>Saved Jobs</h2>
                                </div>
                                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {loading ? (
                                        <p style={{ padding: '16px', textAlign: 'center', color: 'var(--color-white-40)', fontFamily: 'var(--font-body)', fontSize: '13px' }}>Loading…</p>
                                    ) : savedJobs.length === 0 ? (
                                        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-40)', margin: '0 0 4px' }}>No saved jobs yet.</p>
                                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-white-20)', margin: 0 }}>Browse jobs to start saving opportunities.</p>
                                        </div>
                                    ) : savedJobs.map((job) => (
                                        <Link key={job.id} to={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                                            <div style={{
                                                padding: '12px',
                                                background: 'var(--color-surface-3)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '10px',
                                                transition: 'border-color 0.2s',
                                            }}
                                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-orange-border)'}
                                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                                            >
                                                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: 'var(--color-white)', margin: '0 0 3px' }}>
                                                    {job.title || job.role}
                                                </p>
                                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-white-40)', margin: 0 }}>
                                                    {job.companyName || job.company}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <div style={{ padding: '12px', borderTop: '1px solid var(--color-border)' }}>
                                    <Link to="/saved-all" style={{
                                        display: 'block', textAlign: 'center',
                                        fontFamily: 'var(--font-display)', fontWeight: 700,
                                        fontSize: '12px', color: 'var(--color-white-65)',
                                        textDecoration: 'none', padding: '8px',
                                        borderRadius: '8px',
                                        transition: 'color 0.2s, background 0.2s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-white)'; e.currentTarget.style.background = 'var(--color-surface-3)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-white-65)'; e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        View All Saved Jobs →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
