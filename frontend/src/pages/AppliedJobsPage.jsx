import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AppHeader from '../components/AppHeader';
import api from '../service/ApiService';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';
import Cookies from 'js-cookie';

const STATUS_STYLES = {
    APPLIED: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.20)' },
    PHONE_SCREEN: { bg: 'rgba(20,184,166,0.12)', color: '#2dd4bf', border: 'rgba(20,184,166,0.20)' },
    INTERVIEW: { bg: 'rgba(249,115,22,0.12)', color: '#f97316', border: 'rgba(249,115,22,0.22)' },
    OFFER: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'rgba(34,197,94,0.20)' },
    REJECTED: { bg: 'rgba(239,68,68,0.10)', color: '#f87171', border: 'rgba(239,68,68,0.18)' },
    WITHDRAWN: { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.20)' },
};
function getStatus(s) { return STATUS_STYLES[(s || 'APPLIED').toUpperCase().replace(' ', '_')] || STATUS_STYLES.APPLIED; }

export default function AppliedJobsPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [sort, setSort] = useState('appliedAt');
    const [direction, setDirection] = useState('DESC');
    const username = Cookies.get('username') || '';

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const res = await api.getAppliedJobs({ page, size: 15, sort, direction });
            const d = res.json ? await res.json() : res;
            setJobs(d.content || d || []);
            setTotalPages(d.totalPages || 0);
            setTotalElements(d.totalElements || 0);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchJobs(); }, [page, sort, direction]);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
            <style>{`
                @media (max-width: 768px) {
                    .applied-table th:nth-child(3),
                    .applied-table td:nth-child(3) { display: none; }
                    .applied-main-inner { padding: 72px 16px 24px !important; }
                }
            `}</style>

            <Sidebar />

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <AppHeader left={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-40)' }}>

                        <span style={{ color: 'var(--color-white-65)' }}>Applied Jobs</span>
                    </div>
                } />

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div className="applied-main-inner" style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px' }}>

                        {/* Title + controls */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <h1 style={{
                                    fontFamily: 'var(--font-display)', fontWeight: 800,
                                    fontSize: 'clamp(22px, 3vw, 32px)', letterSpacing: '-0.025em',
                                    color: 'var(--color-white)', margin: 0,
                                }}>Applied Jobs</h1>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-white-40)', marginTop: '4px' }}>
                                    {loading ? 'Loading…' : `${totalElements} applications tracked`}
                                </p>
                            </div>
                            {/* Sort controls */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <select
                                    value={sort}
                                    onChange={e => { setSort(e.target.value); setPage(0); }}
                                    style={{
                                        background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                                        borderRadius: '8px', color: 'var(--color-white)',
                                        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '12px',
                                        padding: '7px 12px', outline: 'none', cursor: 'pointer',
                                    }}
                                >
                                    <option value="appliedAt">Date Applied</option>
                                    <option value="applicationStatus">Status</option>
                                </select>
                                <select
                                    value={direction}
                                    onChange={e => { setDirection(e.target.value); setPage(0); }}
                                    style={{
                                        background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                                        borderRadius: '8px', color: 'var(--color-white)',
                                        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '12px',
                                        padding: '7px 12px', outline: 'none', cursor: 'pointer',
                                    }}
                                >
                                    <option value="DESC">Newest First</option>
                                    <option value="ASC">Oldest First</option>
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div style={{
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '14px', overflow: 'hidden',
                        }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="applied-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            {['Job Title', 'Company', 'Location', 'Status', 'Date Applied', 'Link'].map(h => (
                                                <th key={h} style={{
                                                    padding: '14px 20px', textAlign: 'left',
                                                    fontFamily: 'var(--font-display)', fontWeight: 700,
                                                    fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                                                    color: 'var(--color-white-40)', whiteSpace: 'nowrap',
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-white-40)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>Loading…</td></tr>
                                        ) : jobs.length === 0 ? (
                                            <tr><td colSpan="6" style={{ padding: '64px', textAlign: 'center' }}>
                                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-white-65)', margin: '0 0 6px' }}>No applications tracked yet.</p>
                                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-20)', margin: 0 }}>Start applying to jobs and track your pipeline here.</p>
                                            </td></tr>
                                        ) : jobs.map((job) => {
                                            const st = getStatus(job.applicationStatus);
                                            return (
                                                <tr key={job.id} style={{ borderBottom: '1px solid rgba(46,46,46,0.5)' }}>
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <span style={{
                                                            fontFamily: 'var(--font-display)', fontWeight: 700,
                                                            fontSize: '14px', color: 'var(--color-white)',
                                                        }}>
                                                            {job.title || job.role}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-white-65)' }}>
                                                        {job.companyName || job.company}
                                                    </td>
                                                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-40)' }}>
                                                        {job.location || '—'}
                                                    </td>
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <span style={{
                                                            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '11px',
                                                            letterSpacing: '0.06em',
                                                            background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                                                            padding: '4px 10px', borderRadius: '999px', whiteSpace: 'nowrap',
                                                        }}>
                                                            {job.applicationStatus || 'Applied'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-white-40)', whiteSpace: 'nowrap' }}>
                                                        {job.appliedAt ? `Applied on ${new Date(job.appliedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : '—'}
                                                    </td>
                                                    <td style={{ padding: '14px 20px' }}>
                                                        <Link to={`/jobs/${job.jobId || job.id}`} style={{
                                                            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '12px',
                                                            color: 'var(--color-orange)', textDecoration: 'none',
                                                            transition: 'color 0.2s',
                                                        }}
                                                            onMouseEnter={e => e.target.style.color = 'var(--color-orange-hover)'}
                                                            onMouseLeave={e => e.target.style.color = 'var(--color-orange)'}
                                                        >View →</Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {!loading && jobs.length > 0 && totalPages > 1 && (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                marginTop: '24px', flexWrap: 'wrap', gap: '12px',
                            }}>
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-40)' }}>
                                    Page {page + 1} of {totalPages}
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {[...Array(Math.min(totalPages, 7))].map((_, i) => (
                                        <button key={i}
                                            onClick={() => setPage(i)}
                                            style={{
                                                padding: '8px 12px',
                                                border: `1px solid ${page === i ? 'var(--color-orange-border)' : 'var(--color-border)'}`,
                                                borderRadius: '8px',
                                                background: page === i ? 'var(--color-orange-dim)' : 'var(--color-surface-2)',
                                                color: page === i ? 'var(--color-orange)' : 'var(--color-white-65)',
                                                cursor: 'pointer',
                                                fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700,
                                            }}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
