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
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        locations: '',
        experienceLevels: '',
        salaryRange: '', // e.g., "80000-120000"
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

            if (searchQuery) params.keywords = searchQuery;
            if (filters.locations) {
                if (filters.locations === 'Remote') params.isRemote = true;
                else params.locations = filters.locations;
            }
            if (filters.experienceLevels) params.experienceLevels = filters.experienceLevels;
            if (filters.salaryRange) {
                const [min, max] = filters.salaryRange.split('-');
                if (min) params.minSalary = min;
                if (max) params.maxSalary = max;
            }

            // Decide which endpoint to use based on complexity
            let response;
            if (searchQuery || filters.locations || filters.experienceLevels || filters.salaryRange) {
                response = await api.filterJobs(params);
            } else {
                response = await api.getJobs(params);
            }

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

    // Handle Search Enter
    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            setPage(0); // Reset to first page
            fetchJobs();
        }
    };

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
                        <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                            placeholder="Search for jobs, companies, or keywords..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleSearch}
                        />
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
                            {/* Filter Bar */}
                            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-center">
                                <div className="flex-1 min-w-[200px] relative">
                                    <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">location_on</span>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg pl-9 p-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        onChange={(e) => handleFilterChange('locations', e.target.value)}
                                        value={filters.locations}
                                    >
                                        <option value="">Any Location</option>
                                        <option value="Remote">Remote</option>
                                        <option value="San Francisco">San Francisco, CA</option>
                                        <option value="New York">New York, NY</option>
                                    </select>
                                </div>
                                <div className="flex-1 min-w-[200px] relative">
                                    <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">stairs</span>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg pl-9 p-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        onChange={(e) => handleFilterChange('experienceLevels', e.target.value)}
                                        value={filters.experienceLevels}
                                    >
                                        <option value="">Experience Level</option>
                                        <option value="JUNIOR">Junior (0-2y)</option>
                                        <option value="MID">Mid-Level (3-5y)</option>
                                        <option value="SENIOR">Senior (6y+)</option>
                                    </select>
                                </div>
                                <div className="flex-1 min-w-[200px] relative">
                                    <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">payments</span>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg pl-9 p-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        onChange={(e) => handleFilterChange('salaryRange', e.target.value)}
                                        value={filters.salaryRange}
                                    >
                                        <option value="">Salary Range</option>
                                        <option value="80000-120000">$80k - $120k</option>
                                        <option value="120000-160000">$120k - $160k</option>
                                        <option value="160000-500000">$160k+</option>
                                    </select>
                                </div>
                                <button
                                    className="bg-primary text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
                                    onClick={fetchJobs}
                                >
                                    <span className="material-icons-round text-sm">filter_list</span>
                                    Apply Filters
                                </button>
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
