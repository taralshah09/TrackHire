import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../service/ApiService';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import { formatDate } from '../utils/dateUtils';

const AppliedJobsPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [filters, setFilters] = useState({
        sort: 'appliedAt',
        direction: 'DESC'
    });

    const fetchAppliedJobs = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                size: 10,
                sort: filters.sort,
                direction: filters.direction
            };

            const response = await api.getAppliedJobs(params);
            const data = response.json ? await response.json() : response;

            setJobs(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
        } catch (error) {
            console.error('Error fetching applied jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppliedJobs();
    }, [page, filters]);

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
        }
    };

    const handleSortChange = (e) => {
        setFilters(prev => ({ ...prev, sort: e.target.value }));
        setPage(0);
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
                        <h1 className="text-xl font-semibold">Your Applications</h1>
                    </div>
                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold">{Cookies.get("username")}</p>
                        </div>
                        <img alt="User Profile" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover" src={`https://ui-avatars.com/api/?name=${Cookies.get("username") || 'User'}&background=random`} />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-slate-500">Showing {jobs.length} of {totalElements} applications</p>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-slate-500">Sort by:</span>
                                <select
                                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg text-sm py-1.5 focus:ring-primary outline-none"
                                    onChange={handleSortChange}
                                    value={filters.sort}
                                >
                                    <option value="appliedAt">Date Applied</option>
                                    <option value="status">Status</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-widest border-b border-slate-100 dark:border-slate-700">
                                        <tr>
                                            <th className="px-6 py-4">Job Title</th>
                                            <th className="px-6 py-4">Company</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Date Applied</th>
                                            <th className="px-6 py-4">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {loading ? (
                                            <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading applications...</td></tr>
                                        ) : jobs.length === 0 ? (
                                            <tr><td colSpan="5" className="p-8 text-center text-slate-500">You haven't applied to any jobs yet.</td></tr>
                                        ) : jobs.map((job) => (
                                            <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <Link to={`/jobs/${job.id}`} className="font-semibold text-slate-900 dark:text-slate-200 hover:text-primary">
                                                        {job.title || job.role}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className={`w-8 h-8 rounded mr-3 flex items-center justify-center text-xs text-white font-bold ${job.logoColor || 'bg-blue-600'}`}>
                                                            {(job.companyName || job.company || 'C').charAt(0)}
                                                        </div>
                                                        <span className="text-slate-600 dark:text-slate-400 font-medium">{job.companyName || job.company}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                                                        ${job.applicationStatus === 'OFFER' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                            job.applicationStatus === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                job.applicationStatus === 'INTERVIEW' ? 'bg-blue-100 text-primary dark:bg-primary/20 dark:text-primary' :
                                                                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                        {job.applicationStatus || 'Applied'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(job.appliedAt)}</td>
                                                <td className="px-6 py-4">
                                                    <Link to={`/jobs/${job.id}`} className="text-primary hover:underline text-sm font-medium">View Job</Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 0}
                                >
                                    <span className="material-icons-round text-lg leading-none">chevron_left</span>
                                </button>

                                <span className="text-sm text-slate-500">
                                    Page {page + 1} of {totalPages || 1}
                                </span>

                                <button
                                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= totalPages - 1}
                                >
                                    <span className="material-icons-round text-lg leading-none">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AppliedJobsPage;
