import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [hasMore, setHasMore] = useState(false);
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

    const loadJobs = useCallback(async (pageToLoad, append = false) => {
        if (append) setIsFetchingMore(true);
        else setLoading(true);

        try {
            const params = { page: pageToLoad, size: 9, sort: filters.sort, direction: filters.direction };
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
            const newJobs = data.content || [];

            // Filter out jobs that the user has already applied to
            const unappliedJobs = newJobs.filter(job => !job.isApplied);

            if (append) {
                setJobs(prev => {
                    const combined = [...prev, ...unappliedJobs];
                    const uniqueIds = new Set();
                    return combined.filter(job => {
                        if (uniqueIds.has(job.id)) return false;
                        uniqueIds.add(job.id);
                        return true;
                    });
                });
            } else {
                setJobs(unappliedJobs);
            }

            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
            setHasMore(pageToLoad < (data.totalPages || 0) - 1);
            return data;
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    }, [activeTab, appliedFilters, filters.sort, filters.direction]);

    // Triggered on filter/tab changes: Reset and load initial 2 sets
    useEffect(() => {
        const fetchInitialSets = async () => {
            const firstSet = await loadJobs(0, false);
            if (firstSet && firstSet.totalPages > 1) {
                await loadJobs(1, true);
                setPage(1);
            } else {
                setPage(0);
            }
        };
        fetchInitialSets();
    }, [loadJobs]);

    // Triggered when page increments via IntersectionObserver
    useEffect(() => {
        if (page > 1) {
            loadJobs(page, true);
        }
    }, [page, loadJobs]);

    const observer = useRef();
    const lastJobElementRef = useCallback(node => {
        if (loading || isFetchingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, isFetchingMore, hasMore]);

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

    const handleJobAppliedChange = useCallback((jobId, isAppliedNow) => {
        if (isAppliedNow) {
            setJobs(prev => prev.filter(j => j.id !== jobId));
            setTotalElements(prev => Math.max(0, prev - 1));
        }
    }, []);

    const handleSearch = () => {
        setAppliedFilters({ ...filters });
        setPage(0);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handlePageChange = (newPage) => {
        // Not used anymore in infinite scroll
    };

    const inputStyle = (name) => ({
        width: '100%',
        padding: '20px 20px 20px 20px',
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
        <div className="flex min-h-screen bg-[#F4F4F5] relative">
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0" style={{ backgroundImage: 'linear-gradient(to right, #060608 1px, transparent 1px), linear-gradient(to bottom, #060608 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden relative z-10">
                {/* Header */}
                <AppHeader left={
                    <div className="font-label-mono font-bold uppercase text-sm text-brutalist-black bg-pure-white border-[3px] border-brutalist-black px-8 py-4 shadow-[4px_4px_0px_0px_#060608] inline-block" style={{ "paddingLeft": "32px", "paddingRight": "32px", "paddingTop": "16px", "paddingBottom": "16px" }}>
                        Browse Jobs
                    </div>
                } />

                <div className="flex-1 overflow-y-auto p-8 md:p-14 lg:p-20" style={{ padding: "00px 10px" }}>
                    <div className="max-w-7xl mx-auto" style={{ padding: "40px 10px" }}>

                        {/* Page title */}
                        <div className="flex items-end justify-between flex-wrap gap-6 mb-16 bg-pure-white border-[4px] border-brutalist-black p-12 shadow-[4px_4px_0px_0px_#060608]" style={{ "padding": "48px" }}>
                            <div>
                                <h1 className="font-headline-md font-black uppercase tracking-tighter text-3xl md:text-5xl text-brutalist-black m-0">
                                    Browse Jobs
                                </h1>
                                <p className="font-label-mono text-sm text-brutalist-black font-bold mt-2">
                                    {loading ? 'Searching…' : `${totalElements} jobs found`}
                                </p>
                            </div>
                        </div>

                        {/* ===== Segmented Tabs ===== */}
                        <div className="flex items-center gap-4 mb-16 p-4 bg-pure-white border-[4px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608] w-max max-w-full overflow-x-auto" style={{ "padding": "16px" }}>
                            {JOB_TABS.map(tab => {
                                const isActive = activeTab === tab.key;
                                const count = tabCounts[tab.key];
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => handleTabChange(tab.key)}
                                        className={`px-8 py-3 font-label-mono font-bold uppercase text-sm border-[3px] transition-all duration-200 cursor-pointer flex items-center gap-3 whitespace-nowrap
                                            ${isActive
                                                ? 'bg-vibrant-orange text-pure-white border-brutalist-black shadow-[4px_4px_0px_0px_#060608]'
                                                : 'bg-pure-white text-brutalist-black border-transparent hover:border-brutalist-black'
                                            }`}
                                    >
                                        {tab.label}
                                        {count !== undefined && (
                                            <span className={`px-3 py-1 text-xs border-[2px] ${isActive ? 'bg-pure-white text-brutalist-black border-brutalist-black' : 'bg-[#F4F4F5] border-transparent'}`} style={{ "paddingLeft": "12px", "paddingRight": "12px", "paddingTop": "4px", "paddingBottom": "4px" }}>
                                                {count.toLocaleString()}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search bar */}
                        <div className="bg-pure-white border-[4px] border-brutalist-black p-12 shadow-[4px_4px_0px_0px_#060608] mb-20" style={{ "padding": "48px" }}>
                            {/* 2-column grid — all inputs equal width */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {SEARCH_FIELDS.map(({ key, icon, placeholder }) => (
                                    <div key={key} className="relative">
                                        <span className={`absolute left-5 top-1/2 -translate-y-1/2 text-lg pointer-events-none transition-colors ${inputFocus === key ? 'text-vibrant-orange' : 'text-brutalist-black'}`}>
                                            {icon}
                                        </span>
                                        <input
                                            style={{ "padding": "10px 15px 10px 40px" }}
                                            type="text"
                                            placeholder={placeholder}
                                            value={filters[key]}
                                            onChange={e => setFilters(prev => ({ ...prev, [key]: e.target.value }))}
                                            onFocus={() => setInputFocus(key)}
                                            onBlur={() => setInputFocus('')}
                                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                            className="w-full py-5 pl-14 pr-5 bg-[#F4F4F5] border-[3px] border-brutalist-black font-label-mono font-bold text-sm outline-none text-brutalist-black transition-all focus:border-vibrant-orange focus:shadow-[4px_4px_0px_0px_#FF6B00]"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Full-width search button */}
                            <button
                                onClick={handleSearch}
                                className="w-full bg-vibrant-orange border-[3px] border-brutalist-black py-5 font-headline-md font-bold uppercase tracking-tighter text-xl text-pure-white shadow-[4px_4px_0px_0px_#060608] transition-all hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[0px_0px_0px_0px_#060608] flex items-center justify-center gap-3 cursor-pointer"
                                style={{ "marginTop": "15px", "paddingTop": "20px", "paddingBottom": "20px" }}>
                                <FaSearch /> Search Jobs
                            </button>
                        </div>

                        {/* Job grid */}
                        {loading ? (
                            <div className="text-center p-16 font-label-mono font-bold uppercase text-lg text-brutalist-black border-[4px] border-dashed border-brutalist-black bg-pure-white" style={{ "padding": "64px" }}>
                                Searching…
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="text-center p-16 border-[4px] border-dashed border-brutalist-black bg-pure-white shadow-[4px_4px_0px_0px_#060608]" style={{ "padding": "64px" }}>
                                <p className="font-headline-md font-bold text-3xl text-brutalist-black mb-4 uppercase">No jobs match your filters.</p>
                                <p className="font-label-mono font-bold uppercase text-sm text-gray-500 m-0">Try adjusting your search.</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ marginTop: "20px" }} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10 mb-16">
                                    {jobs.map((job, i) => {
                                        if (jobs.length === i + 1) {
                                            return <div ref={lastJobElementRef} key={job.id || i} className="flex"><JobCard job={job} onAppliedChange={handleJobAppliedChange} /></div>;
                                        }
                                        return <JobCard key={job.id || i} job={job} onAppliedChange={handleJobAppliedChange} />;
                                    })}
                                </div>
                                {isFetchingMore && (
                                    <div className="text-center p-8 font-label-mono font-bold uppercase text-sm text-brutalist-black border-[3px] border-dashed border-brutalist-black bg-[#F4F4F5]" style={{ "padding": "32px" }}>
                                        Loading more jobs…
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
