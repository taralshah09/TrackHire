import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AppHeader from '../components/AppHeader';
import JobCard from '../components/JobCard';
import api from '../service/ApiService';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import { FaBookmark } from 'react-icons/fa';

export default function SavedJobsPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [sort, setSort] = useState('savedAt');
    const [direction, setDirection] = useState('DESC');
    const [error, setError] = useState(null);
    const username = Cookies.get('username') || '';

    const fetchJobs = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await api.getSavedJobs({ page, size: 9, sort, direction });

            // Handle fetch-style response
            let data;

            if (res?.ok === false) {
                throw new Error(`Server error: ${res.status}`);
            }

            if (typeof res?.json === "function") {
                try {
                    data = await res.json();
                } catch (jsonErr) {
                    throw new Error("Invalid server response.");
                }
            } else {
                data = res;
            }

            // Validate structure safely
            const safeContent = Array.isArray(data?.content)
                ? data.content
                : Array.isArray(data)
                    ? data
                    : [];

            setJobs(safeContent);
            setTotalPages(Number.isInteger(data?.totalPages) ? data.totalPages : 0);
            setTotalElements(Number.isInteger(data?.totalElements) ? data.totalElements : 0);

        } catch (err) {
            console.error("SavedJobs fetch error:", err);

            setJobs([]); // Prevent stale UI
            setTotalPages(0);
            setTotalElements(0);

            setError(
                err?.message?.includes("Network")
                    ? "Network error. Please check your internet connection."
                    : "Unable to load saved jobs. Please try again later."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const safeFetch = async () => {
            if (!isMounted) return;
            await fetchJobs();
        };

        safeFetch();

        return () => {
            isMounted = false;
        };
    }, [page, sort, direction]);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
            <style>{`
                @media (max-width: 768px) {
                    .saved-main-inner { padding: 72px 16px 24px !important; }
                    .saved-jobs-grid { grid-template-columns: 1fr !important; }
                }
                @media (min-width: 769px) and (max-width: 1024px) {
                    .saved-jobs-grid { grid-template-columns: 1fr 1fr !important; }
                }
            `}</style>

            <Sidebar />

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <AppHeader left={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-40)' }}>
                        <span style={{ color: 'var(--color-white-65)' }}>Saved Jobs</span>
                    </div>
                } />

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div className="saved-main-inner" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>

                        {/* Title + sort */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <h1 style={{
                                    fontFamily: 'var(--font-display)', fontWeight: 800,
                                    fontSize: 'clamp(22px, 3vw, 32px)', letterSpacing: '-0.025em',
                                    color: 'var(--color-white)', margin: 0,
                                }}>Saved Jobs</h1>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-white-40)', marginTop: '4px' }}>
                                    {loading ? 'Loading…' : `${totalElements} jobs saved`}
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
                                    <option value="savedAt">Date Saved</option>
                                    <option value="job.postedAt">Date Posted</option>
                                    <option value="job.title">Job Title</option>
                                    <option value="job.company">Company</option>
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

                        {/* Grid or empty state */}
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '80px', color: 'var(--color-white-40)', fontFamily: 'var(--font-body)', fontSize: '15px' }}>
                                Loading…
                            </div>
                        ) : error ? (
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                minHeight: '320px', border: '1px solid var(--color-border)',
                                borderRadius: '14px', textAlign: 'center', padding: '48px',
                            }}>
                                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', color: '#f87171', margin: '0 0 12px' }}>{error}</p>
                                <button
                                    onClick={fetchJobs}
                                    style={{
                                        background: 'var(--color-surface-3)', border: '1px solid var(--color-border)',
                                        color: 'var(--color-white)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer'
                                    }}
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : jobs.length === 0 ? (
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                minHeight: '320px', border: '1px dashed var(--color-border)',
                                borderRadius: '14px', textAlign: 'center', padding: '48px',
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--color-orange)' }}><FaBookmark /></div>
                                <p style={{
                                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px',
                                    color: 'var(--color-white-65)', margin: '0 0 8px',
                                }}>
                                    No saved jobs yet.
                                </p>
                                <p style={{
                                    fontFamily: 'var(--font-body)', fontSize: '14px',
                                    color: 'var(--color-white-40)', margin: '0 0 24px',
                                }}>
                                    Browse jobs and save roles that interest you.
                                </p>
                                <Link to="/jobs" style={{
                                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
                                    color: '#000', background: 'var(--color-orange)',
                                    textDecoration: 'none', padding: '10px 20px',
                                    borderRadius: '8px', border: 'none',
                                    transition: 'background 0.2s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-orange-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-orange)'}
                                >
                                    Browse Jobs →
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div
                                    className="saved-jobs-grid"
                                    style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}
                                >
                                    {jobs?.map((job, i) => <JobCard key={job?.id || i} job={job} />)}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        paddingTop: '24px', borderTop: '1px solid var(--color-border)',
                                        flexWrap: 'wrap', gap: '12px',
                                    }}>
                                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-40)' }}>
                                            Page {page + 1} of {totalPages}
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                                disabled={page === 0}
                                                style={{
                                                    padding: '8px 14px',
                                                    border: '1px solid var(--color-border)', borderRadius: '8px',
                                                    background: 'var(--color-surface-2)', color: 'var(--color-white-65)',
                                                    cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1,
                                                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
                                                }}
                                            >← Prev</button>
                                            <button
                                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                                disabled={page >= totalPages - 1}
                                                style={{
                                                    padding: '8px 14px',
                                                    border: '1px solid var(--color-border)', borderRadius: '8px',
                                                    background: 'var(--color-surface-2)', color: 'var(--color-white-65)',
                                                    cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: page >= totalPages - 1 ? 0.4 : 1,
                                                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
                                                }}
                                            >Next →</button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
