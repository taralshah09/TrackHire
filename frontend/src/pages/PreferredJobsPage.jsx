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
        <div className="flex min-h-screen bg-background-light">
            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden relative z-10">
                {/* Header */}
                <AppHeader left={
                    <div className="font-label-mono font-bold uppercase text-sm text-brutalist-black bg-pure-white border-[3px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608] inline-block" style={{ padding: "16px 32px" }}>
                        For You
                    </div>
                } />

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto" style={{ padding: "40px 10px" }}>

                        {/* Page header */}
                        <div className="flex items-end justify-between flex-wrap gap-6 mb-16 bg-pure-white border-[4px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608]" style={{ padding: "48px" }}>
                            <div>
                                <h1 className="font-headline-md font-black uppercase tracking-tighter text-3xl md:text-5xl text-brutalist-black m-0 mb-2">
                                    For You
                                </h1>
                                <p className="font-label-mono font-bold uppercase text-sm text-gray-500 m-0">
                                    {loading
                                        ? 'Loading your personalised feed…'
                                        : feed.length > 0
                                            ? `${feed.length} jobs matched to your skills, titles & preferences — ranked by fit.`
                                            : 'Jobs ranked by how well they match your profile.'}
                                </p>
                            </div>

                            <div className="flex gap-4 flex-wrap">
                                <button
                                    onClick={() => loadFeed()}
                                    disabled={loading}
                                    className="flex items-center gap-2 bg-pure-white border-[3px] border-brutalist-black text-brutalist-black font-label-mono font-bold text-sm uppercase transition-all shadow-[2px_2px_0px_0px_#060608] hover:bg-vibrant-orange hover:text-pure-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer disabled:opacity-50"
                                    style={{ padding: "12px 20px" }}
                                >
                                    <FaSync /> Refresh
                                </button>
                                <Link
                                    to="/profile"
                                    className="flex items-center gap-2 bg-pure-white border-[3px] border-brutalist-black text-brutalist-black font-label-mono font-bold text-sm uppercase transition-all shadow-[2px_2px_0px_0px_#060608] hover:bg-brutalist-black hover:text-pure-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none no-underline"
                                    style={{ padding: "12px 20px" }}
                                >
                                    <FaSlidersH /> Edit Preferences
                                </Link>
                            </div>
                        </div>

                        {/* Loading skeleton */}
                        {loading && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-72 border-[4px] border-brutalist-black bg-[#F4F4F5] animate-pulse shadow-[4px_4px_0px_0px_#060608]" />
                                ))}
                            </div>
                        )}

                        {/* Error state */}
                        {!loading && error && (
                            <div className="flex flex-col items-center justify-center min-h-[320px] bg-pure-white border-[4px] border-dashed border-brutalist-black text-center shadow-[4px_4px_0px_0px_#060608]" style={{ padding: "48px" }}>
                                <p className="font-headline-md font-bold text-xl text-[#f87171] uppercase mb-6">{error}</p>
                                <button
                                    onClick={loadFeed}
                                    className="bg-vibrant-orange border-[3px] border-brutalist-black text-pure-white font-label-mono font-bold text-sm uppercase transition-all shadow-[2px_2px_0px_0px_#060608] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer"
                                    style={{ padding: "12px 24px" }}
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {/* Empty state */}
                        {!loading && !error && feed.length === 0 && (
                            <div className="flex flex-col items-center justify-center min-h-[320px] bg-pure-white border-[4px] border-dashed border-brutalist-black text-center shadow-[4px_4px_0px_0px_#060608]" style={{ padding: "48px" }}>
                                <div className="text-5xl text-brutalist-black mb-6"><FaBriefcase /></div>
                                <h3 className="font-headline-md font-black uppercase text-2xl text-brutalist-black m-0 mb-4">
                                    Your feed is being prepared
                                </h3>
                                <p className="font-label-mono font-bold uppercase text-sm text-gray-500 m-0 mb-8 max-w-lg mx-auto leading-relaxed">
                                    Add your skills, preferred job titles, and preferred companies to your profile.
                                    We'll rank matching jobs and show them here.
                                </p>
                                <div className="flex gap-4 justify-center flex-wrap">
                                    <Link
                                        to="/profile"
                                        className="flex items-center gap-2 bg-vibrant-orange border-[3px] border-brutalist-black text-pure-white font-label-mono font-bold text-sm uppercase transition-all shadow-[4px_4px_0px_0px_#060608] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none no-underline"
                                        style={{ padding: "16px 24px" }}
                                    >
                                        Set up preferences <FaArrowRight />
                                    </Link>
                                    <Link
                                        to="/jobs"
                                        className="flex items-center gap-2 bg-pure-white border-[3px] border-brutalist-black text-brutalist-black font-label-mono font-bold text-sm uppercase transition-all shadow-[4px_4px_0px_0px_#060608] hover:bg-brutalist-black hover:text-pure-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none no-underline"
                                        style={{ padding: "16px 24px" }}
                                    >
                                        Browse all jobs
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Feed grid */}
                        {!loading && !error && feed.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
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
                            <div className="mt-16 bg-pure-white border-[4px] border-brutalist-black flex flex-wrap items-center gap-8 shadow-[4px_4px_0px_0px_#060608]" style={{ padding: "24px 32px" }}>
                                <span className="font-headline-md font-bold text-lg uppercase tracking-tight text-brutalist-black">Match score</span>
                                {[
                                    { label: '70–100%', color: 'bg-[#22c55e]', desc: 'Strong match' },
                                    { label: '50–69%', color: 'bg-vibrant-orange', desc: 'Good match' },
                                    { label: '40–49%', color: 'bg-gray-400', desc: 'Partial match' },
                                ].map(({ label, color, desc }) => (
                                    <div key={label} className="flex items-center gap-3">
                                        <div className={`w-4 h-4 border-[2px] border-brutalist-black ${color}`} />
                                        <span className="font-label-mono font-bold uppercase text-xs text-gray-500">
                                            <span className="text-brutalist-black">{label}</span> — {desc}
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
