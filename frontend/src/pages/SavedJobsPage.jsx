import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import JobCard from '../components/JobCard';
import api from '../service/ApiService';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';

const SavedJobsPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [sort, setSort] = useState('savedAt');

    const fetchSavedJobs = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                size: 9, // Grid size
                sort: sort,
                direction: 'DESC'
            };

            const response = await api.getSavedJobs(params);
            const data = response.json ? await response.json() : response;
            console.log(data.content)
            setJobs(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (error) {
            console.error('Error fetching saved jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedJobs();
    }, [page, sort]);

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased h-screen flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                            <span className="material-icons-round">arrow_back</span>
                        </Link>
                        <h1 className="text-xl font-semibold">Saved Jobs</h1>
                    </div>
                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold">{Cookies.get("username")}</p>
                        </div>
                        <img alt="User Profile" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover" src={`https://ui-avatars.com/api/?name=${Cookies.get("username") || 'User'}&background=random`} />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-background-dark">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-slate-500">You have saved {totalElements} jobs</p>
                            <select
                                className="bg-white dark:bg-slate-800 border-none rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-primary shadow-sm outline-none"
                                onChange={(e) => setSort(e.target.value)}
                                value={sort}
                            >
                                <option value="savedAt">Recently Saved</option>
                                <option value="postedAt">Newest Jobs</option>
                            </select>
                        </div>

                        {loading ? (
                            <div className="flex justify-center p-12">
                                <span className="material-icons-round animate-spin text-4xl text-primary">refresh</span>
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="text-center p-12 text-slate-500">
                                <span className="material-icons-round text-4xl mb-2 text-slate-300">bookmark_border</span>
                                <p>No saved jobs yet. Browse jobs to save them here.</p>
                                <Link to="/jobs" className="inline-block mt-4 text-primary font-semibold hover:underline">Browse Jobs</Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {jobs.map((job) => (
                                    <JobCard key={job.id} job={{ ...job, isSaved: true }} />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && jobs.length > 0 && (
                            <div className="flex items-center justify-between pt-8 border-t border-slate-200 dark:border-slate-800 mt-8">
                                <button
                                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 0}
                                >
                                    <span className="material-icons-round text-lg leading-none">chevron_left</span>
                                </button>

                                <span className="text-sm text-slate-500">
                                    Page {page + 1} of {totalPages}
                                </span>

                                <button
                                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= totalPages - 1}
                                >
                                    <span className="material-icons-round text-lg leading-none">chevron_right</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SavedJobsPage;
