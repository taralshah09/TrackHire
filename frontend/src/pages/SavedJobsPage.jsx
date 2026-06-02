import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [sort, setSort] = useState('savedAt');
    const [direction, setDirection] = useState('DESC');
    const [error, setError] = useState(null);
    const username = Cookies.get('username') || '';

    const loadJobs = useCallback(async (pageToLoad, append = false) => {
        if (append) setIsFetchingMore(true);
        else setLoading(true);
        setError(null);

        try {
            const res = await api.getSavedJobs({ page: pageToLoad, size: 9, sort, direction });

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

            const safeContent = Array.isArray(data?.content)
                ? data.content
                : Array.isArray(data)
                    ? data
                    : [];

            // Filter out saved jobs that have already been applied to
            const unappliedSavedJobs = safeContent.filter(job => !job?.isApplied);

            if (append) {
                setJobs(prev => [...prev, ...unappliedSavedJobs]);
            } else {
                setJobs(unappliedSavedJobs);
            }

            const totalP = Number.isInteger(data?.totalPages) ? data.totalPages : 0;
            setTotalPages(totalP);
            setTotalElements(Number.isInteger(data?.totalElements) ? data.totalElements : 0);
            setHasMore(pageToLoad < totalP - 1);
            return data;

        } catch (err) {
            console.error("SavedJobs fetch error:", err);
            if (!append) setJobs([]);
            setError(
                err?.message?.includes("Network")
                    ? "Network error. Please check your internet connection."
                    : "Unable to load saved jobs. Please try again later."
            );
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    }, [sort, direction]);

    const handleJobAppliedChange = useCallback((jobId, isAppliedNow) => {
        if (isAppliedNow) {
            setJobs(prev => prev.filter(j => j?.id !== jobId));
            setTotalElements(prev => Math.max(0, prev - 1));
        }
    }, []);

    const handleJobBookmarkChange = useCallback((jobId, isSavedNow) => {
        if (!isSavedNow) {
            setJobs(prev => prev.filter(j => j?.id !== jobId));
            setTotalElements(prev => Math.max(0, prev - 1));
        }
    }, []);

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
            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden relative z-10">
                {/* Header */}
                <AppHeader left={
                    <div className="font-label-mono font-bold uppercase text-sm text-brutalist-black bg-pure-white border-[3px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608] inline-block" style={{ padding: "16px 32px" }}>
                        Saved Jobs
                    </div>
                } />

                <div className="flex-1 overflow-y-auto dashboard-main-content p-8 md:p-14 lg:p-20">
                    <div className="max-w-7xl mx-auto" style={{ padding: "40px 10px" }}>

                        {/* Page title */}
                        <div className="flex items-end justify-between flex-wrap gap-6 mb-16 bg-pure-white border-[4px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608] dashboard-header-block" style={{ padding: "48px" }}>
                            <div>
                                <h1 className="font-headline-md font-black uppercase tracking-tighter text-3xl md:text-5xl text-brutalist-black m-0 dashboard-greeting">
                                    Saved Jobs
                                </h1>
                                <p className="font-label-mono font-bold uppercase text-sm text-gray-500 m-0 mt-2">
                                    {loading ? 'Loading…' : `${totalElements} jobs saved`}
                                </p>
                            </div>
                            {/* Sort controls */}
                            <div className="flex items-center gap-4">
                                <select
                                    value={sort}
                                    onChange={e => { setSort(e.target.value); setPage(0); }}
                                    className="bg-pure-white border-[3px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608] font-label-mono font-bold text-sm outline-none cursor-pointer text-brutalist-black focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_#060608]"
                                    style={{ padding: "8px 16px" }}
                                >
                                    <option value="savedAt">Date Saved</option>
                                    <option value="job.postedAt">Date Posted</option>
                                    <option value="job.title">Job Title</option>
                                    <option value="job.company">Company</option>
                                </select>
                                <select
                                    value={direction}
                                    onChange={e => { setDirection(e.target.value); setPage(0); }}
                                    className="bg-pure-white border-[3px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608] font-label-mono font-bold text-sm outline-none cursor-pointer text-brutalist-black focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_#060608]"
                                    style={{ padding: "8px 16px" }}
                                >
                                    <option value="DESC">Newest First</option>
                                    <option value="ASC">Oldest First</option>
                                </select>
                            </div>
                        </div>

                        {/* Grid or empty state */}
                        {loading ? (
                            <div className="text-center font-label-mono font-bold uppercase text-lg text-brutalist-black border-[4px] border-dashed border-brutalist-black bg-pure-white" style={{ padding: "64px" }}>
                                Loading…
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center min-h-[320px] bg-pure-white border-[4px] border-dashed border-brutalist-black text-center shadow-[4px_4px_0px_0px_#060608]" style={{ padding: "48px" }}>
                                <p className="font-headline-md font-bold text-xl text-[#f87171] uppercase mb-4">{error}</p>
                                <button
                                    onClick={() => loadJobs(0, false)}
                                    className="bg-pure-white border-[3px] border-brutalist-black text-brutalist-black font-label-mono font-bold text-sm uppercase transition-all shadow-[2px_2px_0px_0px_#060608] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer"
                                    style={{ padding: "10px 20px" }}
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center min-h-[320px] bg-pure-white border-[4px] border-dashed border-brutalist-black text-center shadow-[4px_4px_0px_0px_#060608]" style={{ padding: "48px" }}>
                                <div className="text-5xl text-vibrant-orange mb-4"><FaBookmark /></div>
                                <p className="font-headline-md font-bold text-2xl text-brutalist-black uppercase m-0 mb-2">
                                    No saved jobs yet.
                                </p>
                                <p className="font-label-mono font-bold uppercase text-sm text-gray-500 m-0 mb-6">
                                    Browse jobs and save roles that interest you.
                                </p>
                                <Link to="/jobs" className="bg-vibrant-orange border-[3px] border-brutalist-black text-pure-white font-label-mono font-bold text-sm uppercase transition-all shadow-[4px_4px_0px_0px_#060608] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none" style={{ padding: "12px 24px" }}>
                                    Browse Jobs →
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10 mb-16" style={{ marginTop: "20px" }}>
                                    {jobs?.map((job, i) => {
                                        if (jobs.length === i + 1) {
                                            return <div ref={lastJobElementRef} key={job?.id || i} className="flex"><JobCard job={job} onAppliedChange={handleJobAppliedChange} onBookmarkChange={handleJobBookmarkChange} /></div>;
                                        }
                                        return <JobCard key={job?.id || i} job={job} onAppliedChange={handleJobAppliedChange} onBookmarkChange={handleJobBookmarkChange} />;
                                    })}
                                </div>
                                {isFetchingMore && (
                                    <div className="text-center font-label-mono font-bold uppercase text-sm text-brutalist-black border-[3px] border-dashed border-brutalist-black bg-[#F4F4F5]" style={{ padding: "32px" }}>
                                        Loading more saved jobs…
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
