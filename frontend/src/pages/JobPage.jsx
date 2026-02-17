import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../service/ApiService';

const JobPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [applied, setApplied] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState(null);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const statusOptions = [
        { value: 'APPLIED', label: 'Applied', icon: 'send', color: 'text-blue-600' },
        { value: 'INTERVIEW', label: 'Interview', icon: 'people', color: 'text-amber-600' },
        { value: 'OFFER', label: 'Offer', icon: 'workspace_premium', color: 'text-green-600' },
        { value: 'REJECTED', label: 'Rejected', icon: 'cancel', color: 'text-red-600' }
    ];

    useEffect(() => {
        const fetchJobDetails = async () => {
            try {
                setLoading(true);
                const jobRes = await api.getJobById(id);
                const jobData = await jobRes.json();

                setJob(jobData);
                setSaved(jobData.isSaved || false);
                setApplied(jobData.isApplied || false);
                setApplicationStatus(jobData.applicationStatus || null);

            } catch (error) {
                console.error('Error fetching job details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchJobDetails();
        }
    }, [id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowStatusDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSaveToggle = async () => {
        try {
            if (saved) {
                await api.unsaveJob(id);
                setSaved(false);
            } else {
                await api.saveJob(id);
                setSaved(true);
            }
        } catch (error) {
            console.error('Error toggling save status:', error);
        }
    };

    const handleApplyClick = async () => {
        if (applied) {
            // If already applied, show dropdown to change status
            setShowStatusDropdown(!showStatusDropdown);
        } else {
            // First time applying - set to APPLIED status
            await handleStatusChange('APPLIED');
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            await api.updateJobStatus(id, newStatus);
            setApplied(true);
            setApplicationStatus(newStatus);
            setShowStatusDropdown(false);
        } catch (error) {
            console.error('Error updating application status:', error);
        }
    };

    const handleWithdrawApplication = async () => {
        try {
            await api.withdrawApplication(id);
            setApplied(false);
            setApplicationStatus(null);
            setShowStatusDropdown(false);
        } catch (error) {
            console.error('Error withdrawing application:', error);
        }
    };

    const formatSalary = () => {
        if (!job) return "Salary not disclosed";
        const { minSalary = 0, maxSalary = 0 } = job;

        if (minSalary > 0 && maxSalary > 0) {
            return `₹${minSalary.toLocaleString()} - ₹${maxSalary.toLocaleString()}`;
        } else if (minSalary > 0) {
            return `₹${minSalary.toLocaleString()}+`;
        } else if (maxSalary > 0) {
            return `Up to ₹${maxSalary.toLocaleString()}`;
        }
        return "Salary not disclosed";
    };

    const formatPostedDate = (dateString) => {
        if (!dateString) return "Recently";
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    const getCategoryIcon = () => {
        if (!job) return { icon: 'work', color: 'bg-blue-50' };

        switch (job.jobCategory) {
            case 'DISCOVER':
                return { icon: 'explore', color: 'bg-blue-50 dark:bg-blue-900/20' };
            case 'RECOMMENDED':
                return { icon: 'stars', color: 'bg-purple-50 dark:bg-purple-900/20' };
            case 'TRENDING':
                return { icon: 'trending_up', color: 'bg-green-50 dark:bg-green-900/20' };
            default:
                return { icon: 'work', color: 'bg-blue-50 dark:bg-blue-900/20' };
        }
    };

    const getStatusDisplay = () => {
        if (!applied) return {
            label: 'Apply Now',
            icon: 'send',
            bgColor: 'bg-primary',
            hoverColor: 'hover:bg-blue-700'
        };

        const currentStatus = statusOptions.find(s => s.value === applicationStatus);
        if (!currentStatus) return {
            label: 'Applied',
            icon: 'check_circle',
            bgColor: 'bg-blue-600',
            hoverColor: 'hover:bg-blue-700'
        };

        return {
            label: currentStatus.label,
            icon: currentStatus.icon,
            bgColor: applicationStatus === 'APPLIED' ? 'bg-blue-600' :
                applicationStatus === 'INTERVIEW' ? 'bg-amber-600' :
                    applicationStatus === 'OFFER' ? 'bg-green-600' : 'bg-red-600',
            hoverColor: applicationStatus === 'APPLIED' ? 'hover:bg-blue-700' :
                applicationStatus === 'INTERVIEW' ? 'hover:bg-amber-700' :
                    applicationStatus === 'OFFER' ? 'hover:bg-green-700' : 'hover:bg-red-700'
        };
    };

    if (loading) {
        return (
            <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased h-screen flex overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <span className="material-icons-round animate-spin text-4xl text-primary">refresh</span>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased h-screen flex overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold mb-4">Job not found</h2>
                    <button onClick={() => navigate('/jobs')} className="text-primary hover:underline">Back to Jobs</button>
                </div>
            </div>
        );
    }

    const categoryIcon = getCategoryIcon();
    const statusDisplay = getStatusDisplay();
    const tags = [job.employmentType, job.jobCategory].filter(Boolean);

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased h-screen flex overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div className="max-w-4xl mx-auto">
                        <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                            <span className="material-icons-round mr-2">arrow_back</span>
                            Back
                        </button>

                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 mb-8">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                <div className="flex gap-4">
                                    <div className={`w-16 h-16 rounded-xl ${categoryIcon.color} flex items-center justify-center shrink-0`}>
                                        <span className="material-icons-round text-3xl text-primary">{categoryIcon.icon}</span>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{job.title}</h1>
                                        <div className="flex items-center gap-2 text-slate-500 mb-4">
                                            <span className="font-semibold text-primary">{job.company}</span>
                                            <span>•</span>
                                            <span>{job.location}</span>
                                            <span>•</span>
                                            <span>{formatPostedDate(job.postedAt)}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map((tag, i) => (
                                                <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold uppercase text-slate-600 dark:text-slate-400">
                                                    {tag}
                                                </span>
                                            ))}
                                            <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs font-bold uppercase">
                                                {formatSalary()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 w-full md:w-auto">
                                    <button
                                        onClick={handleSaveToggle}
                                        className={`flex-1 md:flex-none p-3 rounded-xl border-2 transition-colors flex items-center justify-center gap-2 font-semibold
                                            ${saved
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-primary text-slate-600 dark:text-slate-400 hover:text-primary'
                                            }`}
                                    >
                                        <span className="material-icons-round">{saved ? 'bookmark' : 'bookmark_border'}</span>
                                        {saved ? 'Saved' : 'Save'}
                                    </button>

                                    <div className="relative flex-1 md:flex-none" ref={dropdownRef}>
                                        <button
                                            onClick={handleApplyClick}
                                            className={`w-full px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
                                                ${statusDisplay.bgColor} ${statusDisplay.hoverColor}`}
                                        >
                                            <span className="material-icons-round">{statusDisplay.icon}</span>
                                            {statusDisplay.label}
                                            {applied && <span className="material-icons-round text-sm">expand_more</span>}
                                        </button>

                                        {showStatusDropdown && applied && (
                                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-10">
                                                <div className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                                    Update Status
                                                </div>
                                                {statusOptions.map((option) => (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => handleStatusChange(option.value)}
                                                        className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors
                                                            ${applicationStatus === option.value ? 'bg-slate-50 dark:bg-slate-700' : ''}`}
                                                    >
                                                        <span className={`material-icons-round text-xl ${option.color}`}>{option.icon}</span>
                                                        <span className="font-medium text-slate-900 dark:text-white">{option.label}</span>
                                                        {applicationStatus === option.value && (
                                                            <span className="material-icons-round text-primary ml-auto">check</span>
                                                        )}
                                                    </button>
                                                ))}
                                                <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">
                                                    <button
                                                        onClick={handleWithdrawApplication}
                                                        className="w-full px-4 py-3 text-left flex items-center gap-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    >
                                                        <span className="material-icons-round text-xl">delete_outline</span>
                                                        <span className="font-medium">Withdraw Application</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-8">
                                <div className="prose dark:prose-invert max-w-none">
                                    <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Description</h3>
                                    <div className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                        {job.description || "No description provided."}
                                    </div>
                                </div>

                                {job.applyUrl && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                                        <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">External Application</h3>
                                        <p className="text-slate-600 dark:text-slate-400 mb-4">This job requires applying through the company's website.</p>

                                        <a href={job.applyUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                        >
                                            Apply on Company Site
                                            <span className="material-icons-round text-sm">open_in_new</span>
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                                    <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Job Overview</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <span className="material-icons-round text-slate-400">calendar_today</span>
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-bold">Posted Date</div>
                                                <div className="font-medium text-slate-900 dark:text-white">{formatPostedDate(job.postedAt)}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="material-icons-round text-slate-400">work_outline</span>
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-bold">Type</div>
                                                <div className="font-medium text-slate-900 dark:text-white">{job.employmentType || 'Full Time'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="material-icons-round text-slate-400">payments</span>
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-bold">Salary Range</div>
                                                <div className="font-medium text-slate-900 dark:text-white">{formatSalary()}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="material-icons-round text-slate-400">category</span>
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-bold">Category</div>
                                                <div className="font-medium text-slate-900 dark:text-white">{job.jobCategory}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="material-icons-round text-slate-400">source</span>
                                            <div>
                                                <div className="text-xs text-slate-500 uppercase font-bold">Source</div>
                                                <div className="font-medium text-slate-900 dark:text-white">{job.source || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
};

export default JobPage;