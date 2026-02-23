import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AppHeader from '../components/AppHeader';
import JobCard from '../components/JobCard';
import api from '../service/ApiService';
import Cookies from 'js-cookie';
import { FaSearch, FaBuilding, FaBolt, FaMapMarkerAlt } from 'react-icons/fa';

export default function JobsPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [filters, setFilters] = useState({
        position: '', company: '', skills: '', locations: '',
        experienceLevels: '', sort: 'postedAt', direction: 'DESC',
    });
    const [inputFocus, setInputFocus] = useState('');

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const params = { page, size: 9, sort: filters.sort, direction: filters.direction };
            if (filters.position) params.position = filters.position;
            if (filters.company) params.companies = filters.company;
            if (filters.skills) params.skills = filters.skills;
            if (filters.locations) params.locations = filters.locations;
            if (filters.experienceLevels) params.experienceLevels = filters.experienceLevels;
            const response = await api.filterJobs(params);
            const data = response.json ? await response.json() : response;
            setJobs(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchJobs(); }, [page]);

    const handleSearch = () => {
        if (page === 0) {
            fetchJobs();
        } else {
            setPage(0); // triggers useEffect → fetchJobs
        }

    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) setPage(newPage);
    };

    const inputStyle = (name) => ({
        width: '100%',
        padding: '10px 14px 10px 36px',
        background: 'var(--color-surface-3)',
        border: `1px solid ${inputFocus === name ? 'var(--color-orange)' : 'var(--color-border)'}`,
        borderRadius: '8px',
        color: 'var(--color-white)',
        fontFamily: 'var(--font-body)', fontSize: '14px',
        outline: 'none',
        boxShadow: inputFocus === name ? '0 0 0 3px rgba(249,115,22,0.15)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box',
    });

    const SEARCH_FIELDS = [
        { key: 'position', icon: <FaSearch />, placeholder: 'Job title, skill, or company...' },
        { key: 'company', icon: <FaBuilding />, placeholder: 'Company name...' },
        { key: 'skills', icon: <FaBolt />, placeholder: 'Skills or keywords...' },
        { key: 'locations', icon: <FaMapMarkerAlt />, placeholder: 'Location (e.g. Remote)' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
            <style>{`
                @media (max-width: 768px) {
                    .jobs-search-grid { grid-template-columns: 1fr !important; }
                    .jobs-grid { grid-template-columns: 1fr !important; }
                    .jobs-main-inner { padding: 72px 16px 24px !important; }
                }
                @media (min-width: 769px) and (max-width: 1024px) {
                    .jobs-grid { grid-template-columns: 1fr 1fr !important; }
                }
            `}</style>

            <Sidebar />

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <AppHeader left={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-40)' }}>
                        <span>Browse Jobs</span>
                    </div>
                } />

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div className="jobs-main-inner" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>

                        {/* Page title */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h1 style={{
                                    fontFamily: 'var(--font-display)', fontWeight: 800,
                                    fontSize: 'clamp(24px, 3vw, 36px)', letterSpacing: '-0.025em',
                                    color: 'var(--color-white)', margin: 0,
                                }}>Browse Jobs</h1>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-white-40)', marginTop: '4px' }}>
                                    {loading ? 'Searching…' : `${totalElements} jobs found`}
                                </p>
                            </div>
                            {/* Sort */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-40)' }}>Sort by</span>
                                <select
                                    value={filters.sort}
                                    onChange={e => handleFilterChange('sort', e.target.value)}
                                    style={{
                                        background: 'var(--color-surface-2)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        color: 'var(--color-white)',
                                        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '13px',
                                        padding: '8px 12px', outline: 'none', cursor: 'pointer',
                                    }}
                                >
                                    <option value="postedAt">Newest First</option>
                                    <option value="relevance">Relevant</option>
                                </select>
                            </div>
                        </div>

                        {/* Search bar */}
                        <div style={{
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '14px',
                            padding: '20px',
                            marginBottom: '32px',
                        }}>
                            {/* 2-column grid — all inputs equal width */}
                            <div
                                className="jobs-search-grid"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '10px',
                                    marginBottom: '12px',
                                }}
                            >
                                {SEARCH_FIELDS.map(({ key, icon, placeholder }) => (
                                    <div key={key} style={{ position: 'relative' }}>
                                        <span style={{
                                            position: 'absolute', left: '10px', top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: '14px', pointerEvents: 'none',
                                            color: inputFocus === key ? 'var(--color-orange)' : 'var(--color-white-40)',
                                            transition: 'color 0.2s',
                                        }}>{icon}</span>
                                        <input
                                            type="text"
                                            placeholder={placeholder}
                                            value={filters[key]}
                                            onChange={e => setFilters(prev => ({ ...prev, [key]: e.target.value }))}
                                            onFocus={() => setInputFocus(key)}
                                            onBlur={() => setInputFocus('')}
                                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                            style={inputStyle(key)}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Full-width search button */}
                            <button
                                onClick={handleSearch}
                                style={{
                                    width: '100%',
                                    background: 'var(--color-orange)',
                                    border: 'none', borderRadius: '8px',
                                    color: '#000',
                                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px',
                                    padding: '11px 24px', cursor: 'pointer',
                                    transition: 'background 0.2s, transform 0.15s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-orange-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-orange)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <FaSearch style={{ fontSize: '13px' }} /> Search Jobs
                            </button>
                        </div>

                        {/* Job grid */}
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-white-40)', fontFamily: 'var(--font-body)', fontSize: '15px' }}>
                                Searching…
                            </div>
                        ) : jobs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '64px' }}>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-white-65)', margin: '0 0 4px' }}>No jobs match your filters.</p>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-40)', margin: 0 }}>Try adjusting your search.</p>
                            </div>
                        ) : (
                            <div
                                className="jobs-grid"
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}
                            >
                                {jobs.map((job, i) => <JobCard key={job.id || i} job={job} />)}
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && jobs.length > 0 && (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                paddingTop: '24px', borderTop: '1px solid var(--color-border)',
                                flexWrap: 'wrap', gap: '12px',
                            }}>
                                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-40)' }}>
                                    Showing {jobs.length} of {totalElements} jobs
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 0}
                                        style={{
                                            padding: '8px 14px',
                                            background: 'var(--color-surface-2)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '8px', color: 'var(--color-white-65)',
                                            cursor: page === 0 ? 'not-allowed' : 'pointer',
                                            opacity: page === 0 ? 0.4 : 1,
                                            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
                                            transition: 'background 0.2s',
                                        }}
                                    >← Prev</button>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-white-65)' }}>
                                        {page + 1} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page >= totalPages - 1}
                                        style={{
                                            padding: '8px 14px',
                                            background: 'var(--color-surface-2)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '8px', color: 'var(--color-white-65)',
                                            cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                                            opacity: page >= totalPages - 1 ? 0.4 : 1,
                                            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
                                        }}
                                    >Next →</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
