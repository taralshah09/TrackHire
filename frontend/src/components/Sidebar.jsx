import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../service/ApiService';
import {
    FiGrid,
    FiSearch,
    FiSend,
    FiBookmark,
    FiUser,
    FiPower,
    FiMenu,
    FiChevronLeft,
    FiChevronRight,
    FiBriefcase,
    FiCode,
} from 'react-icons/fi';

const NAV_ITEMS = [
    { label: 'Dashboard', path: '/dashboard', icon: <FiGrid /> },
    { label: 'Browse Jobs', path: '/jobs', icon: <FiSearch /> },
    { label: 'For You', path: '/preferred-jobs', icon: <FiUser /> },
    { label: 'Applied', path: '/applied-all', icon: <FiSend /> },
    { label: 'Saved Jobs', path: '/saved-all', icon: <FiBookmark /> },
    { label: 'Preferences', path: '/company-preferences', icon: <FiBriefcase /> },
    { label: 'Profile', path: '/profile', icon: <FiUser /> },
    { label: 'Meet the Builder', path: '/meet-the-builder', icon: <FiCode /> },
];

export default function Sidebar() {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    const sidebarWidth = collapsed ? 'w-[80px]' : 'w-[240px]';

    return (
        <>
            {/* Mobile hamburger */}
            <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="md:hidden fixed top-3 left-3 z-[200] bg-pure-white border-[3px] border-brutalist-black w-10 h-10 flex items-center justify-center cursor-pointer text-brutalist-black text-xl shadow-[4px_4px_0px_0px_#060608] transition-all duration-200 active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
            >
                <FiMenu />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 bg-brutalist-black bg-opacity-60 z-[199] backdrop-blur-sm md:hidden"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed md:sticky top-0 h-screen bg-pure-white border-r-[4px] border-brutalist-black flex flex-col shrink-0 z-[100] transition-all duration-300 ease-in-out ${mobileOpen ? 'left-0' : '-left-full'} md:left-0 ${sidebarWidth}`}
                style={mobileOpen ? { width: '260px' } : {}}
            >
                {/* Logo + collapse toggle */}
                <div className={`p-8 border-b-[4px] border-brutalist-black flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-4 h-[100px]`} style={{"padding":"32px"}}>
                    {!collapsed && (
                        <Link to="/" className="font-headline-md font-black uppercase tracking-tighter text-3xl text-brutalist-black no-underline">
                            Track<span className="text-vibrant-orange">H</span>ire
                        </Link>
                    )}
                    <button
                        onClick={() => {
                            if (window.innerWidth <= 768) {
                                setMobileOpen(false);
                            } else {
                                setCollapsed(c => !c);
                            }
                        }}
                        aria-label="Toggle sidebar"
                        className="bg-pure-white border-[3px] border-brutalist-black cursor-pointer text-brutalist-black text-xl p-2.5 flex items-center justify-center transition-all duration-200 shadow-[4px_4px_0px_0px_#060608] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                    >
                        {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
                    </button>
                </div>

                {/* Nav items */}
                <nav className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto" style={{"padding":"24px"}}>
                    {NAV_ITEMS.map(({ label, path, icon }) => {
                        const active = isActive(path);
                        return (
                            <Link
                                key={path}
                                to={path}
                                onClick={() => setMobileOpen(false)}
                                title={collapsed ? label : undefined}
                                className={`flex items-center gap-4 p-4 rounded-none border-[3px] font-label-mono font-bold uppercase text-sm no-underline transition-all duration-200 ${collapsed ? 'justify-center' : 'justify-start'
                                    } ${active
                                        ? 'bg-vibrant-orange text-pure-white border-brutalist-black shadow-[4px_4px_0px_0px_#060608] translate-x-[-2px] translate-y-[-2px]'
                                        : 'bg-pure-white text-brutalist-black border-transparent hover:border-brutalist-black hover:shadow-[4px_4px_0px_0px_#060608] hover:translate-x-[-2px] hover:translate-y-[-2px]'
                                    }`}
                            >
                                <span className="text-xl shrink-0">{icon}</span>
                                {!collapsed && <span>{label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="p-6 border-t-[4px] border-brutalist-black" style={{"padding":"24px"}}>
                    <button
                        onClick={() => api.logout()}
                        className={`flex items-center gap-4 p-4 w-full border-[3px] font-label-mono font-bold uppercase text-sm cursor-pointer transition-all duration-200 ${collapsed ? 'justify-center' : 'justify-start'
                            } bg-pure-white text-brutalist-black border-brutalist-black hover:bg-red-500 hover:text-pure-white shadow-[4px_4px_0px_0px_#060608] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none`}
                    >
                        <span className="text-xl shrink-0"><FiPower /></span>
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
