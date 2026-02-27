import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import AppHeader from '../components/AppHeader';
import JobCard from '../components/JobCard';
import api from '../service/ApiService';
import { FaBuilding, FaMapMarkerAlt, FaBriefcase, FaArrowRight, FaSearch, FaBolt, FaGlobe } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const COUNTRIES = [
    { code: '', label: '🌍 All Countries' },
    { code: 'in', label: '🇮🇳 India' },
    { code: 'us', label: '🇺🇸 United States' },
    { code: 'gb', label: '🇬🇧 United Kingdom' },
    { code: 'au', label: '🇦🇺 Australia' },
    { code: 'ca', label: '🇨🇦 Canada' },
    { code: 'sg', label: '🇸🇬 Singapore' },
    { code: 'de', label: '🇩🇪 Germany' },
    { code: 'nl', label: '🇳🇱 Netherlands' },
    { code: 'fr', label: '🇫🇷 France' },
    { code: 'nz', label: '🇳🇿 New Zealand' },
];

const JOB_TABS = [
    { key: 'all', label: 'All' },
    { key: 'intern', label: 'Intern' },
    { key: 'fulltime', label: 'Full-Time' },
];

export default function PreferredJobsPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [preferredCompanies, setPreferredCompanies] = useState([]);

    // Search & Filter state
    const [filters, setFilters] = useState({
        position: '', company: '', skills: '', locations: '', countries: '',
    });
    const [appliedFilters, setAppliedFilters] = useState({ ...filters });
    const [inputFocus, setInputFocus] = useState('');

    useEffect(() => {
        const fetchPrefs = async () => {
            try {
                const res = await api.getPreferredCompanies();
                const data = res.json ? await res.json() : res;
                setPreferredCompanies(data || []);
            } catch (e) {
                console.error('Failed to fetch preferences:', e);
            }
        };
        fetchPrefs();
    }, []);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                type: activeTab,
                page,
                size: 9,
                ...appliedFilters
            };

            const response = await api.getPreferredJobs(params);
            const data = response.json ? await response.json() : response;

            setJobs(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (e) {
            console.error('Failed to fetch preferred jobs:', e);
        } finally {
            setLoading(false);
        }
    }, [page, activeTab, appliedFilters]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
        setPage(0);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) setPage(newPage);
    };

    const handleSearch = () => {
        setAppliedFilters({ ...filters });
        setPage(0);
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
                }
            `}</style>
            <Sidebar />

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <AppHeader left={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-40)' }}>
                        <span>Preferred Jobs</span>
                    </div>
                } />

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div className="jobs-main-inner" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <h1 style={{
                                    fontFamily: 'var(--font-display)', fontWeight: 800,
                                    fontSize: 'clamp(24px, 3vw, 36px)', letterSpacing: '-0.025em',
                                    color: 'var(--color-white)', margin: 0,
                                }}>Your Personalized Feed</h1>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-white-40)', marginTop: '4px' }}>
                                    Showing exclusive jobs from your preferred companies.
                                </p>
                            </div>
                            <Link
                                to="/company-preferences"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '10px 16px', borderRadius: '8px',
                                    background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                                    color: 'var(--color-white-65)', textDecoration: 'none',
                                    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '13px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-white-40)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                            >
                                <FaBuilding /> Edit Preferences
                            </Link>
                        </div>

                        {/* Preferred Companies Chips */}
                        {preferredCompanies.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                                <span style={{ color: 'var(--color-white-40)', fontSize: '13px', alignSelf: 'center', marginRight: '8px' }}>Filtering by:</span>
                                {preferredCompanies.map(company => (
                                    <span key={company} style={{
                                        padding: '4px 12px', borderRadius: '20px',
                                        background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)',
                                        color: 'var(--color-orange)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase'
                                    }}>
                                        {company}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Segmented Tabs */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '4px', background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)', borderRadius: '12px',
                            marginBottom: '24px', width: 'fit-content',
                        }}>
                            {JOB_TABS.map(tab => {
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleTabChange(tab.key)}
                                        style={{
                                            padding: '9px 18px', border: 'none', borderRadius: '8px',
                                            cursor: 'pointer', fontFamily: 'var(--font-display)',
                                            fontWeight: isActive ? 700 : 500, fontSize: '13px',
                                            color: isActive ? '#000' : 'var(--color-white-65)',
                                            background: isActive ? 'var(--color-orange)' : 'transparent',
                                            transition: 'all 0.25s'
                                        }}
                                    >
                                        {tab.label}
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

                            {/* Country selector */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <span style={{ fontSize: '14px', color: 'var(--color-white-40)', display: 'flex' }}><FaGlobe /></span>
                                <select
                                    value={filters.countries}
                                    onChange={e => setFilters(prev => ({ ...prev, countries: e.target.value }))}
                                    style={{
                                        flex: 1,
                                        padding: '10px 14px',
                                        background: 'var(--color-surface-3)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        color: filters.countries ? 'var(--color-white)' : 'var(--color-white-40)',
                                        fontFamily: 'var(--font-body)', fontSize: '14px',
                                        outline: 'none', cursor: 'pointer',
                                    }}
                                >
                                    {COUNTRIES.map(c => (
                                        <option key={c.code} value={c.code} style={{ background: 'var(--color-surface-2)' }}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

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
                                <FaSearch style={{ fontSize: '13px' }} /> Search Preferred Jobs
                            </button>
                        </div>

                        {/* Job grid */}
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-white-40)', fontFamily: 'var(--font-body)', fontSize: '15px' }}>
                                Loading prioritized jobs…
                            </div>
                        ) : jobs.length === 0 ? (
                            <div style={{
                                textAlign: 'center', padding: '80px 32px',
                                background: 'var(--color-surface-1)', borderRadius: '24px',
                                border: '1px dashed var(--color-border)'
                            }}>
                                <FaBriefcase size={40} style={{ color: 'var(--color-white-10)', marginBottom: '16px' }} />
                                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-white)', marginBottom: '8px' }}>No jobs found</h3>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-white-40)', maxWidth: '400px', margin: '0 auto 24px' }}>
                                    {preferredCompanies.length === 0
                                        ? "You haven't selected any preferred companies yet."
                                        : "We couldn't find any jobs matching your preferences and search filters."}
                                </p>
                                <Link to="/company-preferences" style={{ color: 'var(--color-orange)', textDecoration: 'none', fontWeight: 600 }}>
                                    Adjust Preferences <FaArrowRight size={10} />
                                </Link>
                            </div>
                        ) : (
                            <div
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px', marginBottom: '32px' }}
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
                                            padding: '8px 14px', background: 'var(--color-surface-2)',
                                            border: '1px solid var(--color-border)', borderRadius: '8px',
                                            color: 'var(--color-white-65)', cursor: page === 0 ? 'not-allowed' : 'pointer',
                                            opacity: page === 0 ? 0.4 : 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
                                        }}
                                    >← Prev</button>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-white-65)' }}>
                                        {page + 1} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page >= totalPages - 1}
                                        style={{
                                            padding: '8px 14px', background: 'var(--color-surface-2)',
                                            border: '1px solid var(--color-border)', borderRadius: '8px',
                                            color: 'var(--color-white-65)', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                                            opacity: page >= totalPages - 1 ? 0.4 : 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
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
