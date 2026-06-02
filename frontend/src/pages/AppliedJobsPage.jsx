import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [sort, setSort] = useState('appliedAt');
    const [direction, setDirection] = useState('DESC');
    const [error, setError] = useState(null);
    const username = Cookies.get('username') || '';

    const loadJobs = useCallback(async (pageToLoad, append = false) => {
        if (append) setIsFetchingMore(true);
        else setLoading(true);
        setError(null);

        try {
            const res = await api.getAppliedJobs({ page: pageToLoad, size: 15, sort, direction });

            let data;
            if (res?.ok === false) {
                throw new Error(`Server error: ${res.status}`);
            }

            if (typeof res?.json === "function") {
                try {
                    data = await res.json();
                } catch {
                    throw new Error("Invalid server response.");
                }
            } else {
                data = res;
            }

            const safeContent = Array.isArray(data?.content)
                ? data.content
                : Array.isArray(data)
                    ? data
                    : [];

            if (append) {
                setJobs(prev => [...prev, ...safeContent]);
            } else {
                setJobs(safeContent);
            }

            const totalP = Number.isInteger(data?.totalPages) ? data.totalPages : 0;
            setTotalPages(totalP);
            setTotalElements(Number.isInteger(data?.totalElements) ? data.totalElements : 0);
            setHasMore(pageToLoad < totalP - 1);
            return data;

        } catch (err) {
            console.error("AppliedJobs fetch error:", err);
            if (!append) setJobs([]);
            if (err?.name === "AbortError") {
                setError("Request timed out. Please try again.");
            } else if (err?.message?.includes("Network")) {
                setError("Network error. Check your connection.");
            } else {
                setError("Unable to load applied jobs. Please try again later.");
            }
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    }, [sort, direction]);

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

    return (
        <div className="flex min-h-screen bg-background-light">
            <style>{`
                @media (max-width: 1024px) {
                    .applied-table th:nth-child(3), .applied-table td:nth-child(3),
                    .applied-table th:nth-child(5), .applied-table td:nth-child(5) { 
                        display: none !important; 
                    }
                }
                @media (max-width: 768px) {
                    .applied-table th:nth-child(6), .applied-table td:nth-child(6) { 
                        display: none !important; 
                    }
                }
            `}</style>

            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden relative z-10">
                {/* Header */}
                <AppHeader left={
                    <div className="font-label-mono font-bold uppercase text-sm text-brutalist-black bg-pure-white border-[3px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608] inline-block" style={{ padding: "16px 32px" }}>
                        Applied Jobs
                    </div>
                } />

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto" style={{ padding: "40px 10px" }}>

                        {/* Title + controls */}
                        <div className="flex items-end justify-between flex-wrap gap-6 mb-16 bg-pure-white border-[4px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608]" style={{ padding: "48px" }}>
                            <div>
                                <h1 className="font-headline-md font-black uppercase tracking-tighter text-3xl md:text-5xl text-brutalist-black m-0 mb-2">
                                    Applied Jobs
                                </h1>
                                <p className="font-label-mono font-bold uppercase text-sm text-gray-500 m-0">
                                    {loading ? 'Loading…' : `${totalElements} applications tracked`}
                                </p>
                            </div>
                            {/* Sort controls */}
                            <div className="flex gap-4 items-center flex-wrap">
                                <select
                                    value={sort}
                                    onChange={e => { setSort(e.target.value); setPage(0); }}
                                    className="bg-pure-white border-[3px] border-brutalist-black text-brutalist-black font-label-mono font-bold uppercase text-sm outline-none cursor-pointer shadow-[2px_2px_0px_0px_#060608] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                                    style={{ padding: "12px 16px" }}
                                >
                                    <option value="appliedAt">Date Applied</option>
                                    <option value="status">Status</option>
                                </select>
                                <select
                                    value={direction}
                                    onChange={e => { setDirection(e.target.value); setPage(0); }}
                                    className="bg-pure-white border-[3px] border-brutalist-black text-brutalist-black font-label-mono font-bold uppercase text-sm outline-none cursor-pointer shadow-[2px_2px_0px_0px_#060608] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                                    style={{ padding: "12px 16px" }}
                                >
                                    <option value="DESC">Newest First</option>
                                    <option value="ASC">Oldest First</option>
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-pure-white border-[4px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608] overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="applied-table w-full border-collapse">
                                    <thead>
                                        <tr className="border-b-[4px] border-brutalist-black bg-[#F4F4F5]">
                                            {[
                                                { label: 'Job Title', key: 'job.title' },
                                                { label: 'Company', key: 'job.company' },
                                                { label: 'Location', key: 'job.location' },
                                                { label: 'Status', key: 'status' },
                                                { label: 'Date Posted', key: 'job.postedAt' },
                                                { label: 'Date Applied', key: 'appliedAt' },
                                                { label: 'Link', key: null }
                                            ].map(({ label, key }) => (
                                                <th key={label}
                                                    onClick={() => {
                                                        if (!key) return;
                                                        if (sort === key) {
                                                            setDirection(d => d === 'ASC' ? 'DESC' : 'ASC');
                                                        } else {
                                                            setSort(key);
                                                            setDirection('DESC');
                                                        }
                                                        setPage(0);
                                                    }}
                                                    className={`text-left font-label-mono font-bold text-sm uppercase tracking-wider whitespace-nowrap select-none transition-colors ${key ? 'cursor-pointer' : 'cursor-default'} ${sort === key ? 'text-vibrant-orange' : 'text-brutalist-black'}`}
                                                    style={{ padding: "20px 24px" }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {label}
                                                        {key && sort === key && (
                                                            <span>{direction === 'DESC' ? '↓' : '↑'}</span>
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="7" className="text-center font-label-mono font-bold uppercase text-sm text-gray-500" style={{ padding: "64px" }}>Loading…</td></tr>
                                        ) : error ? (
                                            <tr><td colSpan="7" className="text-center" style={{ padding: "64px" }}>
                                                <p className="font-headline-md font-bold text-lg text-[#f87171] uppercase mb-4">{error}</p>
                                                <button
                                                    onClick={() => loadJobs(0, false)}
                                                    className="bg-vibrant-orange border-[3px] border-brutalist-black text-pure-white font-label-mono font-bold text-sm uppercase transition-all shadow-[2px_2px_0px_0px_#060608] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer"
                                                    style={{ padding: "12px 24px" }}
                                                >
                                                    Try Again
                                                </button>
                                            </td></tr>
                                        ) : jobs?.length === 0 ? (
                                            <tr><td colSpan="7" className="text-center" style={{ padding: "64px" }}>
                                                <p className="font-headline-md font-bold text-xl text-brutalist-black uppercase mb-2">No applications tracked yet.</p>
                                                <p className="font-label-mono font-bold uppercase text-sm text-gray-500 m-0">Start applying to jobs and track your pipeline here.</p>
                                            </td></tr>
                                        ) : (
                                            <>
                                                {jobs?.map((job, idx) => {
                                                    const st = getStatus(job?.applicationStatus);
                                                    const isLast = jobs.length === idx + 1;
                                                    return (
                                                        <tr key={job?.id} ref={isLast ? lastJobElementRef : null} className="border-b-[2px] border-brutalist-black hover:bg-[#F4F4F5] transition-colors">
                                                            <td className="font-headline-md font-bold text-lg text-brutalist-black" style={{ padding: "20px 24px" }}>
                                                                {job?.title || job?.role}
                                                            </td>
                                                            <td className="font-body text-base text-brutalist-black" style={{ padding: "20px 24px" }}>
                                                                {job?.companyName || job?.company}
                                                            </td>
                                                            <td className="font-body text-sm text-gray-600" style={{ padding: "20px 24px" }}>
                                                                {job?.location || '—'}
                                                            </td>
                                                            <td style={{ padding: "20px 24px" }}>
                                                                <span className="font-label-mono font-bold text-xs uppercase tracking-wider whitespace-nowrap border-[2px] border-brutalist-black shadow-[2px_2px_0px_0px_#060608]"
                                                                    style={{
                                                                        padding: "8px 12px",
                                                                        background: st.bg,
                                                                        color: st.color === '#60a5fa' ? '#2563eb' :
                                                                               st.color === '#2dd4bf' ? '#0d9488' :
                                                                               st.color === '#f97316' ? '#ea580c' :
                                                                               st.color === '#4ade80' ? '#16a34a' :
                                                                               st.color === '#f87171' ? '#dc2626' :
                                                                               st.color === '#94a3b8' ? '#475569' : st.color,
                                                                    }}>
                                                                    {job?.applicationStatus || 'Applied'}
                                                                </span>
                                                            </td>
                                                            <td className="font-label-mono font-bold text-sm text-gray-600 whitespace-nowrap" style={{ padding: "20px 24px" }}>
                                                                {job?.postedAt ? new Date(job.postedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                            </td>
                                                            <td className="font-label-mono font-bold text-sm text-gray-600 whitespace-nowrap" style={{ padding: "20px 24px" }}>
                                                                {job?.appliedAt ? new Date(job.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                            </td>
                                                            <td style={{ padding: "20px 24px" }}>
                                                                <Link to={`/jobs/${job?.jobId || job?.id}`} className="font-label-mono font-bold text-sm uppercase text-vibrant-orange hover:text-brutalist-black transition-colors no-underline">
                                                                    View →
                                                                </Link>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {isFetchingMore && (
                                                    <tr>
                                                        <td colSpan="7" className="text-center font-label-mono font-bold uppercase text-sm text-gray-500" style={{ padding: "32px" }}>
                                                            Loading more applications…
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
