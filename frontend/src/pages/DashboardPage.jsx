import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AppHeader from '../components/AppHeader';
import StatCard from '../components/StatCard';
import api from '../service/ApiService';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';
import Cookies from 'js-cookie';
import { FiSend, FiCalendar, FiAward, FiBookmark, FiSmile } from 'react-icons/fi';

const STATUS_STYLES = {
    SAVED: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-700' },
    APPLIED: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-700' },
    PHONE_SCREEN: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-700' },
    INTERVIEW: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-700' },
    OFFER: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-700' },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-700' },
    WITHDRAWN: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-700' },
};

function getStatus(status) {
    if (!status) return STATUS_STYLES.APPLIED;
    return STATUS_STYLES[status.toUpperCase().replace(' ', '_')] || STATUS_STYLES.APPLIED;
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function DashboardPage() {
    const [stats, setStats] = useState({});
    const [appliedJobs, setAppliedJobs] = useState([]);
    const [savedJobs, setSavedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const username = Cookies.get('username') || 'there';
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    useEffect(() => {
        const fetch = async () => {
            try {
                const [sr, ar, svr] = await Promise.all([
                    api.getUserStats(),
                    api.getAppliedJobs({ page: 0, size: 5, sort: 'appliedAt', direction: 'DESC' }),
                    api.getSavedJobs({ page: 0, size: 4, sort: 'savedAt', direction: 'DESC' }),
                ]);
                setStats(sr.json ? await sr.json() : sr);
                const ad = ar.json ? await ar.json() : ar;
                const sd = svr.json ? await svr.json() : svr;
                setAppliedJobs(ad.content || (Array.isArray(ad) ? ad : []));
                setSavedJobs(sd.content || (Array.isArray(sd) ? sd : []));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const breakdown = stats.applicationStatusBreakdown || {};

    return (
        <div className="flex min-h-screen bg-[#F4F4F5] relative">
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0" style={{ backgroundImage: 'linear-gradient(to right, #060608 1px, transparent 1px), linear-gradient(to bottom, #060608 1px, transparent 1px)', backgroundSize: '64px 64px' }} />

            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden relative z-10">
                <AppHeader left={
                    <div className="font-label-mono font-bold uppercase text-sm text-brutalist-black bg-pure-white border-[3px] border-brutalist-black px-8 py-4 shadow-[4px_4px_0px_0px_#060608] inline-block" style={{"paddingLeft":"32px","paddingRight":"32px","paddingTop":"16px","paddingBottom":"16px"}}>
                        {today}
                    </div>
                } />

                {/* ↑ px-8 py-4 (was px-6 py-3) */}
                <div style={{ "padding": "00px 10px" , "padding":"80px"}} className="flex-1 overflow-y-auto p-8 md:p-14 lg:p-20 dashboard-main-content">
                    {/* ↑ p-8 / p-14 / p-20 (was p-6 / p-12 / p-16) */}
                    <div className="max-w-7xl mx-auto">

                        {/* Greeting */}
                        <div className="bg-pure-white border-[4px] border-brutalist-black p-12 md:p-16 shadow-[4px_4px_0px_0px_#060608] dashboard-header-block" style={{ margin: "20px 0", padding: "0 10px" , "padding":"64px"}}>
                            {/* ↑ mb-14, p-12 / p-16 (was mb-12, p-10 / p-14) */}
                            <h1 className="font-headline-md font-black uppercase tracking-tighter text-3xl md:text-5xl text-brutalist-black m-0 flex items-center flex-wrap gap-4 dashboard-greeting">
                                {getGreeting()}, {username}
                                <FiSmile className="text-vibrant-orange w-10 h-10 inline-block" />
                            </h1>
                            <p className="font-label-mono font-bold uppercase text-sm mt-8 text-brutalist-black bg-vibrant-orange text-pure-white inline-block px-6 py-3 border-[3px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608]" style={{"paddingLeft":"24px","paddingRight":"24px","paddingTop":"12px","paddingBottom":"12px"}}>
                                {/* ↑ mt-8, px-6 py-3 (was mt-6, px-5 py-2) */}
                                Let's get to work
                            </p>
                        </div>

                        {/* Stat cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" style={{ margin: "20px 0", padding: "0 10px" }}>
                            {/* ↑ gap-8 (was gap-6 mb-14) */}
                            <StatCard title="Total Applied" value={stats.totalApplied || 0} icon={<FiSend />} />
                            <StatCard title="Interviews Scheduled" value={breakdown.INTERVIEW || 0} icon={<FiCalendar />} />
                            <StatCard title="Offers Received" value={breakdown.OFFER || 0} icon={<FiAward />} accentColor="green" />
                            <StatCard title="Saved Jobs" value={stats.totalSaved || 0} icon={<FiBookmark />} />
                        </div>

                        {/* Bottom row */}
                        <div style={{ "padding": "00px 10px" }} className="flex flex-col lg:flex-row gap-12 items-stretch tables-container">
                            {/* ↑ items-stretch (was items-start) */}

                            {/* Applied jobs table */}
                            <div className="flex-1 w-full bg-pure-white border-[4px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608] overflow-hidden flex flex-col">
                                <div className="p-10 border-b-[4px] border-brutalist-black flex items-center justify-between bg-vibrant-orange table-header-block" style={{"padding":"40px"}}>
                                    {/* ↑ p-10 (was p-8) */}
                                    <h2 className="font-headline-md font-black uppercase tracking-tighter text-2xl text-pure-white m-0">Recent Activity</h2>
                                </div>
                                <div className="overflow-x-auto flex-1">
                                    <table className="w-full border-collapse min-w-[600px]">
                                        <thead>
                                            <tr className="border-b-[4px] border-brutalist-black bg-[#F4F4F5]">
                                                {['Job Title', 'Company', 'Status', 'Date Applied'].map(h => (
                                                    <th key={h} className="px-8 py-7 font-label-mono font-bold uppercase text-sm text-brutalist-black text-left whitespace-nowrap border-r-[4px] border-brutalist-black last:border-r-0 table-header" style={{"paddingLeft":"32px","paddingRight":"32px","paddingTop":"28px","paddingBottom":"28px"}}>
                                                        {/* ↑ px-8 py-7 (was p-6) */}
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan="4" className="px-8 py-14 text-center font-label-mono font-bold uppercase text-sm text-brutalist-black" style={{"paddingLeft":"32px","paddingRight":"32px","paddingTop":"56px","paddingBottom":"56px"}}>Loading…</td></tr>
                                            ) : appliedJobs.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="px-8 py-16 text-center" style={{"paddingLeft":"32px","paddingRight":"32px","paddingTop":"64px","paddingBottom":"64px"}}>
                                                        {/* ↑ py-16 (was p-12) */}
                                                        <p className="font-label-mono font-bold uppercase text-sm text-brutalist-black mb-2">No activity yet.</p>
                                                        <p className="font-label-mono text-sm text-gray-500 m-0">Add your first application to get started.</p>
                                                    </td>
                                                </tr>
                                            ) : appliedJobs.map((job, index) => {
                                                const s = getStatus(job.applicationStatus);
                                                return (
                                                    <tr key={job.id} className={`${index !== appliedJobs.length - 1 ? 'border-b-[4px] border-brutalist-black' : ''} transition-colors hover:bg-gray-100`}>
                                                        <td className="px-8 py-7 border-r-[4px] border-brutalist-black table-cell" style={{"paddingLeft":"32px","paddingRight":"32px","paddingTop":"28px","paddingBottom":"28px"}}>
                                                            {/* ↑ px-8 py-7 (was p-6) */}
                                                            <Link to={`/jobs/${job.id}`} className="font-headline-md font-bold text-lg text-brutalist-black no-underline hover:text-vibrant-orange hover:underline decoration-4 underline-offset-4 transition-colors">
                                                                {job.title || job.role}
                                                            </Link>
                                                        </td>
                                                        <td className="px-8 py-7 border-r-[4px] border-brutalist-black font-label-mono text-sm text-brutalist-black font-bold table-cell" style={{"paddingLeft":"32px","paddingRight":"32px","paddingTop":"28px","paddingBottom":"28px"}}>
                                                            {job.companyName || job.company}
                                                        </td>
                                                        <td className="px-8 py-7 border-r-[4px] border-brutalist-black table-cell" style={{"paddingLeft":"32px","paddingRight":"32px","paddingTop":"28px","paddingBottom":"28px"}}>
                                                            <span className={`font-label-mono font-bold uppercase text-xs tracking-wider px-5 py-3 border-[3px] shadow-[2px_2px_0px_0px_#060608] inline-block ${s.bg} ${s.text} ${s.border}`} style={{"paddingLeft":"20px","paddingRight":"20px","paddingTop":"12px","paddingBottom":"12px"}}>
                                                                {/* ↑ px-5 py-3 (was px-4 py-2) */}
                                                                {job.applicationStatus || 'Applied'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-7 font-label-mono text-sm text-brutalist-black font-bold table-cell" style={{"paddingLeft":"32px","paddingRight":"32px","paddingTop":"28px","paddingBottom":"28px"}}>
                                                            {formatDate(job.appliedAt)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-8 py-7 border-t-[4px] border-brutalist-black bg-[#F4F4F5]" style={{"paddingLeft":"32px","paddingRight":"32px","paddingTop":"28px","paddingBottom":"28px"}}>
                                    <Link to="/applied-all" className="block w-full text-center font-label-mono font-bold uppercase text-sm text-pure-white bg-brutalist-black border-[3px] border-brutalist-black py-6 shadow-[4px_4px_0px_0px_#FF6B00] transition-all duration-200 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none no-underline" style={{"paddingTop":"24px","paddingBottom":"24px"}}>
                                        View All Recent Activity →
                                    </Link>
                                </div>
                            </div>

                            {/* Saved jobs panel */}
                            <div className="w-full lg:w-[380px] shrink-0 bg-pure-white border-[4px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608] overflow-hidden flex flex-col saved-jobs-panel">
                                {/* ↑ w-[380px] (was w-[360px]) */}
                                <div className="p-10 border-b-[4px] border-brutalist-black bg-brutalist-black table-header-block" style={{"padding":"40px"}}>
                                    {/* ↑ p-10 (was p-8) */}
                                    <h2 className="font-headline-md font-black uppercase tracking-tighter text-xl text-pure-white m-0">Saved Jobs</h2>
                                </div>
                                <div className="p-8 flex flex-col gap-6 flex-1 overflow-y-auto" style={{"padding":"32px"}}>
                                    {/* ↑ p-8 (was p-6) */}
                                    {loading ? (
                                        <p className="py-8 text-center font-label-mono font-bold uppercase text-sm text-brutalist-black" style={{"paddingTop":"32px","paddingBottom":"32px"}}>Loading…</p>
                                    ) : savedJobs.length === 0 ? (
                                        <div className="px-8 py-10 text-center border-[3px] border-dashed border-brutalist-black" style={{"paddingLeft":"32px","paddingRight":"32px","paddingTop":"40px","paddingBottom":"40px"}}>
                                            {/* ↑ px-8 py-10 (was p-8) */}
                                            <p className="font-label-mono font-bold uppercase text-sm text-brutalist-black mb-2">No saved jobs yet.</p>
                                            <p className="font-label-mono text-xs text-gray-500 m-0">Browse jobs to start saving opportunities.</p>
                                        </div>
                                    ) : savedJobs.map((job) => (
                                        <Link key={job.id} to={`/jobs/${job.id}`} className="no-underline block">
                                            <div className="px-8 py-7 bg-[#F4F4F5] border-[3px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608] transition-all duration-200 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none hover:bg-vibrant-orange group" style={{"paddingLeft":"32px","paddingRight":"32px","paddingTop":"28px","paddingBottom":"28px"}}>
                                                {/* ↑ px-8 py-7 (was p-6) */}
                                                <p className="font-headline-md font-bold text-base text-brutalist-black m-0 mb-2 group-hover:text-pure-white">
                                                    {job.title || job.role}
                                                </p>
                                                <p className="font-label-mono text-sm text-brutalist-black m-0 font-bold group-hover:text-pure-white">
                                                    {job.companyName || job.company}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <div className="px-8 py-7 border-t-[4px] border-brutalist-black bg-[#F4F4F5]" style={{"paddingLeft":"32px","paddingRight":"32px","paddingTop":"28px","paddingBottom":"28px"}}>
                                    {/* ↑ px-8 py-7 (was p-6) */}
                                    <Link to="/saved-all" className="block w-full text-center font-label-mono font-bold uppercase text-sm text-pure-white bg-brutalist-black border-[3px] border-brutalist-black py-6 shadow-[4px_4px_0px_0px_#FF6B00] transition-all duration-200 hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none no-underline" style={{"paddingTop":"24px","paddingBottom":"24px"}}>
                                        {/* ↑ py-6 (was py-5) */}
                                        View All Saved Jobs →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}