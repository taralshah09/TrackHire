import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AppHeader from '../components/AppHeader';
import JobCard from '../components/JobCard';
import api from '../service/ApiService';
import Cookies from 'js-cookie';
import { FaSearch, FaBuilding, FaBolt, FaMapMarkerAlt } from 'react-icons/fa';

// Tab configuration — All / Intern / Full-Time
const JOB_TABS = [
    { key: 'all', label: 'All', apiValue: null },
    { key: 'intern', label: 'Intern', apiValue: 'INTERNSHIP' },
    { key: 'fulltime', label: 'Full-Time', apiValue: 'FULL_TIME' },
];

export default function JobsPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Read initial tab from URL, default to 'all'
    const initialTab = JOB_TABS.find(t => t.key === searchParams.get('type'))?.key || 'all';

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [tabCounts, setTabCounts] = useState({});
    const [filters, setFilters] = useState({
        position: '', company: '', skills: '', locations: '',
        experienceLevels: '', sort: 'postedAt', direction: 'DESC',
    });
    const [appliedFilters, setAppliedFilters] = useState({ ...filters });
    const [inputFocus, setInputFocus] = useState('');

    // Fetch tab badge counts on mount
    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const res = await api.getEmploymentTypeCounts();
                const data = res.json ? await res.json() : res;
                setTabCounts({
                    all: data.ALL || 0,
                    intern: data.INTERNSHIP || 0,
                    fulltime: data.FULL_TIME || 0,
                });
            } catch (e) {
                console.error('Failed to fetch tab counts:', e);
            }
        };
        fetchCounts();
    }, []);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, size: 9, sort: filters.sort, direction: filters.direction };
            if (appliedFilters.position) params.position = appliedFilters.position;
            if (appliedFilters.company) params.companies = appliedFilters.company;
            if (appliedFilters.skills) params.skills = appliedFilters.skills;
            if (appliedFilters.locations) params.locations = appliedFilters.locations;
            if (appliedFilters.experienceLevels) params.experienceLevels = appliedFilters.experienceLevels;

            // Choose endpoint by active tab
            let response;
            if (activeTab === 'intern') {
                response = await api.getInternJobs(params);
            } else if (activeTab === 'fulltime') {
                response = await api.getFulltimeJobs(params);
            } else {
                const tab = JOB_TABS.find(t => t.key === activeTab);
                if (tab && tab.apiValue) params.employmentTypes = tab.apiValue;
                response = await api.filterJobs(params);
            }
            const data = response.json ? await response.json() : response;
            setJobs(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [page, activeTab, appliedFilters, filters.sort, filters.direction]);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
        setPage(0);
        // Update URL query param
        const newParams = new URLSearchParams(searchParams);
        if (tabKey === 'all') {
            newParams.delete('type');
        } else {
            newParams.set('type', tabKey);
        }
        setSearchParams(newParams, { replace: true });
    };

    const handleSearch = () => {
        setAppliedFilters({ ...filters });
        setPage(0);
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
                    .job-type-tabs { gap: 4px !important; }
                    .job-type-tab { padding: 8px 12px !important; font-size: 12px !important; }
                }
                @media (min-width: 769px) and (max-width: 1024px) {
                    .jobs-grid { grid-template-columns: 1fr 1fr !important; }
                }
                .job-type-tab {
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .job-type-tab:hover {
                    background: var(--color-surface-3) !important;
                }
                .job-type-tab-active {
                    background: var(--color-orange) !important;
                    color: #000 !important;
                    box-shadow: 0 2px 8px rgba(249,115,22,0.3);
                }
                .job-type-tab-active:hover {
                    background: var(--color-orange-hover) !important;
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

                        {/* ===== Segmented Tabs ===== */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px',
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '12px',
                            marginBottom: '24px',
                            width: 'fit-content',
                        }} className="job-type-tabs">
                            {JOB_TABS.map(tab => {
                                const isActive = activeTab === tab.key;
                                const count = tabCounts[tab.key];
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleTabChange(tab.key)}
                                        className={`job-type-tab ${isActive ? 'job-type-tab-active' : ''}`}
                                        style={{
                                            padding: '9px 18px',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontFamily: 'var(--font-display)',
                                            fontWeight: isActive ? 700 : 500,
                                            fontSize: '13px',
                                            color: isActive ? '#000' : 'var(--color-white-65)',
                                            background: isActive ? 'var(--color-orange)' : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {tab.label}
                                        {count !== undefined && (
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                fontFamily: 'var(--font-mono)',
                                                padding: '1px 6px',
                                                borderRadius: '6px',
                                                background: isActive ? 'rgba(0,0,0,0.15)' : 'var(--color-surface-3)',
                                                color: isActive ? '#000' : 'var(--color-white-40)',
                                            }}>
                                                {count.toLocaleString()}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
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
