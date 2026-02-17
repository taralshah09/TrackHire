import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../service/ApiService';

const Sidebar = () => {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ?
            "bg-primary/10 text-primary font-semibold" :
            "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium";
    };

    return (
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 sticky top-0 h-screen">
            <div className="p-6">
                <div className="flex items-center gap-2 text-primary font-bold text-xl">
                    <span className="material-icons-round text-3xl">explore</span>
                    <span>CareerPilot</span>
                </div>
            </div>
            <nav className="flex-1 px-4 space-y-1">
                <Link to="/dashboard" className={`sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/dashboard')}`}>
                    <span className="material-icons-round text-[20px]">dashboard</span>
                    <span>Dashboard</span>
                </Link>
                <Link to="/jobs" className={`sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/jobs')}`}>
                    <span className="material-icons-round text-[20px]">work_outline</span>
                    <span>Jobs</span>
                </Link>
                <Link to="/profile" className={`sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/profile')}`}>
                    <span className="material-icons-round text-[20px]">person_outline</span>
                    <span>Profile</span>
                </Link>
                {/* <a href="#" className={`sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive('/reports')}`}>
                    <span className="material-icons-round text-[20px]">analytics</span>
                    <span>Reports</span>
                </a> */}
            </nav>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <button onClick={() => api.logout()} className="sidebar-link flex items-center gap-3 px-3 py-2 rounded-lg text-rose-500 font-medium transition-colors w-full text-left">
                    <span className="material-icons-round text-[20px]">logout</span>
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
