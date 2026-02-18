import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import JobCard from '../components/JobCard';
import api from '../service/ApiService';
import Cookies from 'js-cookie'

const JobsPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Filters State
    const [filters, setFilters] = useState({
        position: '',
        company: '',
        skills: '',
        locations: '',
        experienceLevels: '',
        sort: 'postedAt',
        direction: 'DESC'
    });

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                size: 9, // Grid size
                sort: filters.sort,
                direction: filters.direction
            };

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

        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, [page, filters]); // Re-fetch when page or filters change



    const handleFilterChange = (key, value) => {

        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(0);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setPage(newPage);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased h-screen flex overflow-hidden">
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Bar */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
                    <div className="flex-1 max-w-xl relative">
                        {/* Global Search Removed in favor of granular filters below */}
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
                            <span className="material-icons-round">notifications_none</span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                        </button>
                        <div className="h-8 w-px bg-slate-200 dark:border-slate-700"></div>
                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold">{Cookies.get("username")}</p>
                                {/* <p className="text-xs text-slate-500">Premium User</p> */}
                            </div>
                            <img alt="User Profile" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCs-IvhRUBwAqQWmQpjMY49CMQK7PcMg7T9x9MBoY3sCMyopUYs-Gya3NYjvmJ0BdLa1sKgCK61VVymdj4HEV-q-r_c3G0CfzbmQ6d-dtlo0CqHhQ8y0rMjB4OWpOhsF-uW8VL7g7HEgc92rT4kn15zjVwWMkVo4kxrJ3NTmMDpw5qWrr-DxF6ZaKgFp-BUN8-GiNDVLHr7JdVpHPfNBVBp-5z-3tvOwJAczAMMrCuIftohGKL4R6jMkGkuhet-m2djV9BGknh1XMnN" />
                        </div>
                    </div>
                </header>

                {/* View Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Page Header & Filters */}
                        <div className="space-y-6">
                            <div className="flex items-end justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">Discover Jobs</h1>
                                    <p className="text-slate-500 mt-1">Found {totalElements} matching opportunities for your profile.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-slate-500">Sort by:</span>
                                    <select
                                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg text-sm py-1.5 focus:ring-primary outline-none"
                                        onChange={(e) => handleFilterChange('sort', e.target.value)}
                                        value={filters.sort}
                                    >
                                        <option value="postedAt">Newest First</option>
                                        <option value="salary">Salary</option>
                                        <option value="relevance">Relevant</option>
                                    </select>
                                </div>
                            </div>
                            {/* Search & Filter Bar */}
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Position */}
                                    <div className="relative">
                                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">work_outline</span>
                                        <input
                                            type="text"
                                            placeholder="Job Title / Position"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg pl-9 p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={filters.position}
                                            onChange={(e) => handleFilterChange('position', e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                                        />
                                    </div>

                                    {/* Company */}
                                    <div className="relative">
                                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">business</span>
                                        <input
                                            type="text"
                                            placeholder="Company"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg pl-9 p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={filters.company}
                                            onChange={(e) => handleFilterChange('company', e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                                        />
                                    </div>

                                    {/* Skills */}
                                    <div className="relative">
                                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">psychology</span>
                                        <input
                                            type="text"
                                            placeholder="Skills / Keywords"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg pl-9 p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={filters.skills}
                                            onChange={(e) => handleFilterChange('skills', e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                                        />
                                    </div>

                                    {/* Location */}
                                    <div className="relative">
                                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">location_on</span>
                                        <input
                                            type="text"
                                            placeholder="Location (e.g. Remote)"
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg pl-9 p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={filters.locations}
                                            onChange={(e) => handleFilterChange('locations', e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 justify-between">
                                    {/* Experience Level */}

                                    <button
                                        className="bg-primary text-white px-8 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                                        onClick={fetchJobs}
                                    >
                                        <span className="material-icons-round text-sm">search</span>
                                        Search Jobs
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Job Grid */}
                        {loading ? (
                            <div className="flex justify-center p-12">
                                <span className="material-icons-round animate-spin text-4xl text-primary">refresh</span>
                            </div>
                        ) : jobs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {jobs.map((job, index) => (
                                    <JobCard key={job.id || index} job={job} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-12 text-slate-500">
                                No jobs found matching your criteria.
                            </div>
                        )}

                        {/* Pagination */}
                        {/* Pagination */}
                        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
                            <p className="text-sm text-slate-500">Showing {jobs.length} of {totalElements} jobs</p>
                            <div className="flex items-center gap-2">
                                <button
                                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 0}
                                >
                                    <span className="material-icons-round text-lg leading-none">chevron_left</span>
                                </button>

                                <span className="px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
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
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default JobsPage;
