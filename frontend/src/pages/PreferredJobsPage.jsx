import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AppHeader from '../components/AppHeader';
import JobCard from '../components/JobCard';
import api from '../service/ApiService';
import { FaBriefcase, FaArrowRight, FaSlidersH, FaSync } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function PreferredJobsPage() {
    const [feed, setFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadFeed = async (signal) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.getForYouFeed();
            if (signal?.aborted) return;
            const data = res.json ? await res.json() : res;
            setFeed(Array.isArray(data) ? data : []);
        } catch (e) {
            if (e?.name === 'AbortError' || signal?.aborted) return;
            console.error('Failed to fetch For You feed:', e);
            setError('Failed to load your feed. Please try again.');
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        loadFeed(controller.signal);
        return () => controller.abort();
    }, []);

    const hasPreferences = feed.length > 0;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
            <style>{`
                @media (max-width: 768px) {
                    .foryou-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
            <Sidebar />

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <AppHeader left={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-40)' }}>
                        <span>For You</span>
                    </div>
                } />

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>

                        {/* Page header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h1 style={{
                                    fontFamily: 'var(--font-display)', fontWeight: 800,
                                    fontSize: 'clamp(24px, 3vw, 36px)', letterSpacing: '-0.025em',
                                    color: 'var(--color-white)', margin: '0 0 6px',
                                }}>
                                    For You
                                </h1>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-white-40)', margin: 0 }}>
                                    {loading
                                        ? 'Loading your personalised feed…'
                                        : feed.length > 0
                                            ? `${feed.length} jobs matched to your skills, titles & preferences — ranked by fit.`
                                            : 'Jobs ranked by how well they match your profile.'}
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => loadFeed()}
                                    disabled={loading}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 16px', borderRadius: '8px',
                                        background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                                        color: 'var(--color-white-65)', cursor: 'pointer',
                                        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '13px',
                                        transition: 'all 0.2s', opacity: loading ? 0.5 : 1,
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-white-40)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                                >
                                    <FaSync style={{ fontSize: '11px' }} /> Refresh
                                </button>
                                <Link
                                    to="/profile"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 16px', borderRadius: '8px',
                                        background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                                        color: 'var(--color-white-65)', textDecoration: 'none',
                                        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '13px',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-white-40)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                                >
                                    <FaSlidersH style={{ fontSize: '11px' }} /> Edit Preferences
                                </Link>
                            </div>
                        </div>

                        {/* Loading skeleton */}
                        {loading && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                                gap: '20px',
                            }}>
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} style={{
                                        height: '280px', borderRadius: '14px',
                                        background: 'var(--color-surface-2)',
                                        border: '1px solid var(--color-border)',
                                        animation: 'pulse 1.5s ease-in-out infinite',
                                    }} />
                                ))}
                            </div>
                        )}

                        {/* Error state */}
                        {!loading && error && (
                            <div style={{
                                textAlign: 'center', padding: '80px 32px',
                                background: 'var(--color-surface-1)', borderRadius: '24px',
                                border: '1px dashed var(--color-border)',
                            }}>
                                <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-white-40)', marginBottom: '16px' }}>
                                    {error}
                                </p>
                                <button
                                    onClick={loadFeed}
                                    style={{
                                        padding: '10px 24px', borderRadius: '8px',
                                        background: 'var(--color-orange)', border: 'none',
                                        color: '#000', fontFamily: 'var(--font-display)',
                                        fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                                    }}
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {/* Empty state */}
                        {!loading && !error && feed.length === 0 && (
                            <div style={{
                                textAlign: 'center', padding: '80px 32px',
                                background: 'var(--color-surface-1)', borderRadius: '24px',
                                border: '1px dashed var(--color-border)',
                            }}>
                                <FaBriefcase size={40} style={{ color: 'var(--color-white-20)', marginBottom: '16px' }} />
                                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-white)', marginBottom: '8px', fontSize: '20px' }}>
                                    Your feed is being prepared
                                </h3>
                                <p style={{
                                    fontFamily: 'var(--font-body)', fontSize: '15px',
                                    color: 'var(--color-white-40)', maxWidth: '440px',
                                    margin: '0 auto 24px', lineHeight: 1.6,
                                }}>
                                    Add your skills, preferred job titles, and preferred companies to your profile.
                                    We'll rank matching jobs and show them here.
                                </p>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <Link
                                        to="/profile"
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                                            padding: '11px 22px', borderRadius: '8px',
                                            background: 'var(--color-orange)', color: '#000',
                                            textDecoration: 'none', fontFamily: 'var(--font-display)',
                                            fontWeight: 700, fontSize: '13px',
                                        }}
                                    >
                                        Set up preferences <FaArrowRight size={11} />
                                    </Link>
                                    <Link
                                        to="/jobs"
                                        style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                                            padding: '11px 22px', borderRadius: '8px',
                                            background: 'var(--color-surface-2)', color: 'var(--color-white-65)',
                                            textDecoration: 'none', fontFamily: 'var(--font-display)',
                                            fontWeight: 700, fontSize: '13px',
                                            border: '1px solid var(--color-border)',
                                        }}
                                    >
                                        Browse all jobs
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Feed grid */}
                        {!loading && !error && feed.length > 0 && (
                            <div
                                className="foryou-grid"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                                    gap: '20px',
                                }}
                            >
                                {feed.map((item) => (
                                    <JobCard
                                        key={item.job?.id}
                                        job={item.job}
                                        score={item.score}
                                        reasons={item.reasons}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Legend */}
                        {!loading && feed.length > 0 && (
                            <div style={{
                                marginTop: '40px', padding: '16px 20px',
                                background: 'var(--color-surface-1)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '12px',
                                display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center',
                            }}>
                                <span style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, color: 'var(--color-white-40)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Match score</span>
                                {[
                                    { label: '70–100%', color: '#22c55e', desc: 'Strong match' },
                                    { label: '50–69%', color: 'var(--color-orange)', desc: 'Good match' },
                                    { label: '40–49%', color: '#94a3b8', desc: 'Partial match' },
                                ].map(({ label, color, desc }) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-white-40)' }}>
                                            <span style={{ color: 'var(--color-white-65)', fontWeight: 600 }}>{label}</span> — {desc}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
}
