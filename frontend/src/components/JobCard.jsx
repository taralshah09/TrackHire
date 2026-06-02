import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaBriefcase, FaBookmark, FaRegBookmark, FaCheck, FaChevronDown } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import api from '../service/ApiService';
import MatchBadge from './MatchBadge';

/* Brand-accurate status badge styles per guidelines */
const STATUS_STYLES = {
    SAVED: { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', border: 'rgba(168,85,247,0.20)' },
    APPLIED: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.20)' },
    PHONE_SCREEN: { bg: 'rgba(20,184,166,0.12)', color: '#2dd4bf', border: 'rgba(20,184,166,0.20)' },
    INTERVIEW: { bg: 'rgba(249,115,22,0.12)', color: '#f97316', border: 'rgba(249,115,22,0.22)' },
    OFFER: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'rgba(34,197,94,0.20)' },
    REJECTED: { bg: 'rgba(239,68,68,0.10)', color: '#f87171', border: 'rgba(239,68,68,0.18)' },
    WITHDRAWN: { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.20)' },
};

function getStatusStyle(status) {
    if (!status) return null;
    return STATUS_STYLES[status.toUpperCase().replace(' ', '_')] || STATUS_STYLES.APPLIED;
}



function formatPostedDate(dateString) {
    if (!dateString) return 'Recently';
    const diff = Math.floor((Date.now() - new Date(dateString)) / 86400000);
    if (diff < 1) return 'Today';
    if (diff === 1) return '1 day ago';
    if (diff < 7) return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
    return `${Math.floor(diff / 30)} months ago`;
}

export default function JobCard({ job, onAppliedChange, onBookmarkChange, score, reasons }) {
    const [hovered, setHovered] = useState(false);

    const {
        id,
        title = 'Software Engineer',
        company, companyName,
        location = 'Remote',

        employmentType,
        postedAt,
        isApplied = false,
        isSaved = false,
        applicationStatus,
        applyUrl,
    } = job || {};

    const companyLabel = companyName || company || 'Company';

    const [saved, setSaved] = useState(isSaved);
    const [applied, setApplied] = useState(isApplied);
    const [statusState, setStatusState] = useState(applicationStatus);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);
    const [applyLoading, setApplyLoading] = useState(false);

    useEffect(() => {
        setSaved(isSaved);
        setApplied(isApplied);
        setStatusState(applicationStatus);
    }, [isSaved, isApplied, applicationStatus]);

    const statusStyle = applied && statusState ? getStatusStyle(statusState) : null;


    const [followed, setFollowed] = useState(job.isFollowed || false);
    const [followLoading, setFollowLoading] = useState(false);

    const handleBookmarkClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (bookmarkLoading) return;

        setBookmarkLoading(true);
        try {
            if (saved) {
                await api.unsaveJob(id);
                setSaved(false);
                toast.success('Job removed from Saved');
                if (onBookmarkChange) onBookmarkChange(id, false);
            } else {
                await api.saveJob(id);
                setSaved(true);
                toast.success('Job saved!');
                if (onBookmarkChange) onBookmarkChange(id, true);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to update bookmark');
        } finally {
            setBookmarkLoading(false);
        }
    };

    const handleAppliedCheckboxChange = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (applyLoading) return;

        setApplyLoading(true);
        try {
            if (applied) {
                await api.withdrawApplication(id);
                setApplied(false);
                setStatusState(null);
                toast.success('Application withdrawn');
                if (onAppliedChange) onAppliedChange(id, false);
            } else {
                await api.updateJobStatus(id, 'APPLIED');
                setApplied(true);
                setStatusState('APPLIED');
                toast.success('Marked as Applied!');
                if (onAppliedChange) onAppliedChange(id, true);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to update application');
        } finally {
            setApplyLoading(false);
        }
    };

    const handleDropdownChange = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const newStatus = e.target.value;

        if (applyLoading || bookmarkLoading) return;

        setApplyLoading(true);
        try {
            if (newStatus === 'NOT_APPLIED') {
                if (applied) {
                    await api.withdrawApplication(id);
                }
                if (saved) {
                    await api.unsaveJob(id);
                }
                setApplied(false);
                setSaved(false);
                setStatusState(null);
                toast.success('Job reset (not saved, not applied)');
                if (onAppliedChange) onAppliedChange(id, false);
                if (onBookmarkChange) onBookmarkChange(id, false);
            } else if (newStatus === 'SAVED') {
                if (!saved) {
                    await api.saveJob(id);
                }
                if (applied) {
                    await api.withdrawApplication(id);
                }
                setApplied(false);
                setSaved(true);
                setStatusState(null);
                toast.success('Job moved to Saved');
                if (onAppliedChange) onAppliedChange(id, false);
                if (onBookmarkChange) onBookmarkChange(id, true);
            } else {
                await api.updateJobStatus(id, newStatus);
                setApplied(true);
                setStatusState(newStatus);
                toast.success(`Job marked as ${newStatus.toLowerCase().replace('_', ' ')}`);
                if (onAppliedChange) onAppliedChange(id, true);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to update job status');
        } finally {
            setApplyLoading(false);
        }
    };

    const handleFollowToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (followLoading) return;

        setFollowLoading(true);
        try {
            const res = await api.getPreferredCompanies();
            const prefs = res.json ? await res.json() : res;
            let newPrefs;
            if (!followed) {
                newPrefs = [...prefs, companyLabel];
            } else {
                newPrefs = prefs.filter(c => c !== companyLabel);
            }
            await api.savePreferredCompanies(newPrefs);
            setFollowed(!followed);
        } catch (err) {
            console.error(err);
        } finally {
            setFollowLoading(false);
        }
    };

    return (
        <div
            style={{ "padding": "15px" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`bg-pure-white border-[4px] border-brutalist-black p-8 flex flex-col gap-0 transition-all duration-200 shadow-[4px_4px_0px_0px_#060608] relative group hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[0px_0px_0px_0px_#060608] w-full`}
        >
            {followed && (
                <div className="absolute -top-3 right-4 bg-vibrant-orange text-pure-white font-label-mono font-bold text-xs uppercase px-3 py-1 border-[2px] border-brutalist-black shadow-[2px_2px_0px_0px_#060608] z-10" style={{ "paddingLeft": "12px", "paddingRight": "12px", "paddingTop": "4px", "paddingBottom": "4px" }}>
                    Prioritized
                </div>
            )}
            {/* Match badge — only rendered in the For You feed */}
            {score != null && <MatchBadge score={score} reasons={reasons} />}

            {/* Top row: company initial + bookmark button */}
            <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 bg-[#F4F4F5] border-[3px] border-brutalist-black flex items-center justify-center font-headline-md font-bold text-2xl text-brutalist-black shadow-[2px_2px_0px_0px_#060608]">
                    {companyLabel.charAt(0).toUpperCase()}
                </div>
                <button
                    onClick={handleBookmarkClick}
                    disabled={bookmarkLoading}
                    title={saved ? "Remove Bookmark" : "Bookmark Job"}
                    className={`bg-pure-white border-[3px] border-brutalist-black p-3 text-lg cursor-pointer transition-all ${saved ? 'text-pure-white bg-brutalist-black' : 'text-brutalist-black'} hover:bg-vibrant-orange hover:text-pure-white shadow-[2px_2px_0px_0px_#060608]`}
                    style={{ "padding": "12px" }}>
                    {saved ? <FaBookmark /> : <FaRegBookmark />}
                </button>
            </div>

            {/* Title + company */}
            <h3 className="font-headline-md font-black uppercase text-xl text-brutalist-black m-0 mb-3 line-clamp-2 leading-tight">
                {title}
            </h3>
            <div className="flex items-center justify-between mb-6">
                <p className="font-label-mono font-bold text-base text-vibrant-orange m-0">
                    {companyLabel}
                </p>
                <button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`font-label-mono font-bold text-xs uppercase px-4 py-2 border-[2px] border-brutalist-black transition-all cursor-pointer shadow-[2px_2px_0px_0px_#060608] ${followed ? 'bg-brutalist-black text-pure-white' : 'bg-pure-white text-brutalist-black'} hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${followLoading ? 'opacity-50' : ''}`}
                    style={{ "paddingLeft": "16px", "paddingRight": "16px", "paddingTop": "8px", "paddingBottom": "8px" }}>
                    {followLoading ? '...' : followed ? 'Following' : 'Follow'}
                </button>
            </div>

            {/* Meta: location, type */}
            <div className="flex flex-col gap-3 mb-6 flex-1">
                <div className="flex items-center gap-3">
                    <span className="text-brutalist-black text-sm"><FaMapMarkerAlt /></span>
                    <span className="font-label-mono font-bold text-sm text-brutalist-black">{location}</span>
                </div>
                {employmentType && (
                    <div className="flex items-center gap-3">
                        <span className="text-brutalist-black text-sm"><FaBriefcase /></span>
                        <span className="font-label-mono font-bold text-sm text-brutalist-black">{employmentType}</span>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="border-t-[4px] border-brutalist-black mb-6" />

            {/* Interactive Actions Row */}
            <div className="flex items-center justify-between gap-4 mb-6 bg-[#F4F4F5] border-[3px] border-brutalist-black p-4 shadow-[2px_2px_0px_0px_#060608]" style={{ "padding": "16px" }}>
                <div
                    onClick={handleAppliedCheckboxChange}
                    className={`flex items-center gap-3 cursor-pointer select-none font-label-mono font-bold text-xs uppercase transition-colors ${applied ? 'text-vibrant-orange' : 'text-brutalist-black'}`}
                >
                    <div className={`w-6 h-6 border-[2px] border-brutalist-black flex items-center justify-center text-xs transition-colors ${applied ? 'bg-vibrant-orange text-pure-white' : 'bg-pure-white'}`}>
                        {applied && <FaCheck />}
                    </div>
                    <span>Applied</span>
                </div>

                <div className="relative flex items-center">
                    <select
                        value={applied ? (statusState || 'APPLIED') : (saved ? 'SAVED' : 'NOT_APPLIED')}
                        disabled={applyLoading || bookmarkLoading}
                        onChange={handleDropdownChange}
                        className="appearance-none bg-pure-white border-[2px] border-brutalist-black px-4 py-2 pr-8 font-label-mono font-bold text-xs uppercase text-brutalist-black cursor-pointer outline-none focus:border-vibrant-orange shadow-[2px_2px_0px_0px_#060608]"
                        style={{ "paddingLeft": "16px", "paddingRight": "32px", "paddingTop": "8px", "paddingBottom": "8px" }}>
                        <option value="NOT_APPLIED">Not Applied</option>
                        <option value="SAVED">Saved</option>
                        <option value="APPLIED">Applied</option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="OFFER">Offer</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                    <FaChevronDown className="absolute right-3 pointer-events-none text-xs text-brutalist-black" />
                </div>
            </div>

            {/* Footer: date + status */}
            <div className="flex items-center justify-between gap-2 flex-wrap mb-6">
                <span className="font-label-mono font-bold text-sm text-brutalist-black">
                    {formatPostedDate(postedAt)}
                </span>
                {statusStyle && (
                    <span className="font-label-mono font-bold text-xs uppercase px-4 py-2 bg-[#F4F4F5] text-brutalist-black border-[3px] border-brutalist-black shadow-[2px_2px_0px_0px_#060608]" style={{ "paddingLeft": "16px", "paddingRight": "16px", "paddingTop": "8px", "paddingBottom": "8px" }}>
                        {applicationStatus}
                    </span>
                )}
            </div>

            {/* Bottom CTAs */}
            <div className="flex gap-4 mt-auto">
                <Link
                    to={`/jobs/${id}`}
                    className="flex-1 text-center py-4 bg-pure-white border-[3px] border-brutalist-black text-brutalist-black font-label-mono font-bold text-sm uppercase no-underline transition-all hover:bg-brutalist-black hover:text-pure-white shadow-[2px_2px_0px_0px_#060608] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                    style={{ "paddingTop": "16px", "paddingBottom": "16px" }}>
                    View Details
                </Link>

                {applyUrl && (
                    <a
                        href={applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center py-4 bg-vibrant-orange border-[3px] border-brutalist-black text-pure-white font-label-mono font-bold text-sm uppercase no-underline transition-all shadow-[2px_2px_0px_0px_#060608] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                        style={{ "paddingTop": "16px", "paddingBottom": "16px" }}>
                        Apply
                    </a>
                )}
            </div>
        </div>
    );
}