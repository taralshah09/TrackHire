import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import api from '../service/ApiService';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
    const [stats, setStats] = useState({ saved: 0, applied: 0, interviewed: 0, offered: 0 });
    const [appliedJobs, setAppliedJobs] = useState([]);
    const [savedJobs, setSavedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, appliedRes, savedRes] = await Promise.all([
                    api.getUserStats(),
                    api.getAppliedJobs({ page: 0, size: 5, sort: 'appliedAt', direction: 'DESC' }),
                    api.getSavedJobs({ page: 0, size: 5, sort: 'savedAt', direction: 'DESC' })
                ]);

                // Adjust based on actual API response structure
                const statsData = statsRes.json ? await statsRes.json() : statsRes;
                const appliedData = appliedRes.json ? await appliedRes.json() : appliedRes;
                const savedData = savedRes.json ? await savedRes.json() : savedRes;

                setStats(statsData); // Assuming statsData matches keys or needs mapping
                setAppliedJobs(appliedData.content || appliedData || []);
                setSavedJobs(savedData.content || savedData || []);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);
    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-display transition-colors duration-200">
            <div className="flex min-h-screen">
                <Sidebar />

                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Top Navigation */}
                    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md flex items-center justify-between px-8 z-10 sticky top-0">
                        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Welcome back, Alex</h1>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <span className="material-icons text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">search</span>
                                <input className="pl-10 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary w-64 outline-none" placeholder="Search applications..." type="text" />
                            </div>
                            <button className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative">
                                <span className="material-icons">notifications</span>
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
                            </button>
                            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2">
                                <span className="material-icons text-sm">add</span>
                                <span>New Job</span>
                            </button>
                        </div>
                    </header>

                    {/* Dashboard Content */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {/* Summary Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatCard
                                title="Total Saved"
                                value={stats.saved || 0}
                                icon="bookmark_border"
                                iconColor="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                                trend="neutral"
                                trendValue="--"
                                trendLabel="Total saved jobs"
                            />
                            <StatCard
                                title="Applied"
                                value={stats.applied || 0}
                                icon="send"
                                iconColor="bg-blue-50 dark:bg-blue-900/30 text-primary"
                                trend="neutral"
                                trendValue="--"
                                trendLabel="Applications sent"
                            />
                            <StatCard
                                title="Interviews"
                                value={stats.interviewed || 0}
                                icon="forum"
                                iconColor="bg-amber-50 dark:bg-amber-900/30 text-amber-500"
                                trend="neutral"
                                trendValue="--"
                                trendLabel="Interviews scheduled"
                            />
                            <StatCard
                                title="Offers"
                                value={stats.offered || 0}
                                icon="verified"
                                iconColor="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500"
                                trend="neutral"
                                trendValue="--"
                                trendLabel="Job offers"
                            />
                        </div>

                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Main Table Section */}
                            <div className="flex-grow">
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Applied Jobs</h2>
                                        <button className="text-sm text-primary font-medium hover:underline">View All</button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-widest border-b border-slate-100 dark:border-slate-700">
                                                <tr>
                                                    <th className="px-6 py-4">Job Title</th>
                                                    <th className="px-6 py-4">Company</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4">Date Applied</th>
                                                    <th className="px-6 py-4">Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {loading ? (
                                                    <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>
                                                ) : appliedJobs.length === 0 ? (
                                                    <tr><td colSpan="5" className="p-4 text-center text-slate-500">No applications yet.</td></tr>
                                                ) : appliedJobs.map((job) => (
                                                    <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <Link to={`/jobs/${job.id}`} className="font-semibold text-slate-900 dark:text-slate-200 hover:text-primary">
                                                                {job.title || job.role}
                                                            </Link>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center">
                                                                <div className={`w-6 h-6 rounded mr-2 flex items-center justify-center text-[10px] text-white font-bold ${job.logoColor || 'bg-blue-600'}`}>
                                                                    {(job.companyName || job.company || 'C').charAt(0)}
                                                                </div>
                                                                <span className="text-slate-600 dark:text-slate-400">{job.companyName || job.company}</span>
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
                                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{job.appliedAt || 'N/A'}</td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{job.note || '-'}</p>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Side Panel: Saved Jobs */}
                            <div className="w-full lg:w-80 flex-shrink-0">
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full">
                                    <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                                            <span className="material-icons text-primary mr-2 text-xl">star</span>
                                            Saved Jobs
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1">Jobs you haven't applied to yet.</p>
                                    </div>
                                    <div className="p-4 space-y-4 overflow-y-auto">
                                        {loading ? (
                                            <div className="text-center p-4">Loading stats...</div>
                                        ) : savedJobs.length === 0 ? (
                                            <div className="text-center p-4 text-slate-500 text-sm">No saved jobs yet.</div>
                                        ) : savedJobs.map((job) => (
                                            <div key={job.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 hover:border-primary/50 transition-colors group cursor-pointer">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className={`w-10 h-10 rounded-lg shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-600 ${job.logoColor || 'bg-white dark:bg-slate-700'}`}>
                                                        <span className="material-icons text-primary">{job.icon || 'work'}</span>
                                                    </div>
                                                    <button
                                                        className="text-slate-300 hover:text-red-500"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            // unsaveJob(job.id); // Implement if needed here or just link to details
                                                        }}
                                                    >
                                                        <span className="material-icons text-lg">close</span>
                                                    </button>
                                                </div>
                                                <Link to={`/jobs/${job.id}`}>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm hover:text-primary transition-colors">{job.title || job.role}</h4>
                                                </Link>
                                                <p className="text-xs text-slate-500 mb-4">{job.companyName || job.company} • {job.location}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Saved {job.savedAt || 'recently'}</span>
                                                    <Link to={`/jobs/${job.id}`} className="bg-primary text-white text-[10px] px-3 py-1.5 rounded font-bold uppercase tracking-widest hover:bg-blue-700 transition-all">Apply Now</Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 mt-auto border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                                        <button className="w-full py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                            View All Saved Jobs
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardPage;
