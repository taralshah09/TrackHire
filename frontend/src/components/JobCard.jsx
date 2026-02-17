import React from 'react';
import { Link } from 'react-router-dom';

const JobCard = ({ job }) => {
    // Map API data to component needs
    const {
        id,
        title = "Software Engineer",
        company = "Tech Company",
        location = "Remote",
        minSalary = 0,
        maxSalary = 0,
        employmentType = "Full-time",
        postedAt = "Recently",
        isApplied = false,
        isSaved = false,
        applicationStatus = null,
        jobCategory = "DISCOVER"
    } = job || {};

    // Format salary display
    const formatSalary = () => {
        if (minSalary > 0 && maxSalary > 0) {
            return `₹${minSalary.toLocaleString()} - ₹${maxSalary.toLocaleString()}`;
        } else if (minSalary > 0) {
            return `₹${minSalary.toLocaleString()}+`;
        } else if (maxSalary > 0) {
            return `Up to ₹${maxSalary.toLocaleString()}`;
        }
        return "Salary not disclosed";
    };

    // Format posted date
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

    // Determine status display
    const getStatusInfo = () => {
        if (isApplied && applicationStatus) {
            switch (applicationStatus) {
                case 'APPLIED':
                    return { text: 'Applied', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' };
                case 'INTERVIEW':
                    return { text: 'Interview', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' };
                case 'OFFER':
                    return { text: 'Offer', color: 'text-green-500 bg-green-50 dark:bg-green-900/20' };
                case 'REJECTED':
                    return { text: 'Rejected', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' };
                default:
                    return { text: 'Applied', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' };
            }
        }
        return { text: 'Not Applied', color: 'text-slate-500 bg-slate-50 dark:bg-slate-800' };
    };

    const statusInfo = getStatusInfo();

    // Get icon and color based on category
    const getCategoryIcon = () => {
        switch (jobCategory) {
            case 'DISCOVER':
                return { icon: 'explore', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' };
            case 'STARTUP_LAUNCHPAD':
                return { icon: 'stars', color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' };
        }
    };

    const categoryIcon = getCategoryIcon();

    // Build tags array
    const tags = [
        employmentType || 'Full-time',
        jobCategory
    ].filter(Boolean);

    return (
        <div className="job-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md flex flex-col transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-lg ${categoryIcon.color} flex items-center justify-center`}>
                    <span className="material-icons-round text-2xl">{categoryIcon.icon}</span>
                </div>
                <div className={`${isSaved ? 'text-primary' : 'text-slate-400'}`}>
                    <span className="material-icons-round">{isSaved ? 'bookmark' : 'bookmark_border'}</span>
                </div>
            </div>
            <div className="mb-4">
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors text-slate-900 dark:text-white line-clamp-2">
                    {title}
                </h3>
                <p className="text-primary font-medium text-sm mt-1">{company}</p>
            </div>
            <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="material-icons-round text-sm">location_on</span>
                    {location}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="material-icons-round text-sm">payments</span>
                    {formatSalary()}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                    {tags.map((tag, index) => (
                        <span key={index} className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                        <span className="material-icons-round text-[14px]">schedule</span>
                        {formatPostedDate(postedAt)}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${statusInfo.color}`}>
                        {statusInfo.text}
                    </span>
                </div>
                <Link
                    to={`/jobs/${id}`}
                    className="block w-full text-center bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    View Details
                </Link>
            </div>
        </div>
    );
};

export default JobCard;