import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../service/ApiService';
import {
    FaTh,
    FaSearch,
    FaPaperPlane,
    FaBookmark,
    FaUser,
    FaPowerOff,
    FaBars,
    FaChevronLeft,
    FaChevronRight,
    FaBuilding,
} from 'react-icons/fa';

const NAV_ITEMS = [
    { label: 'Dashboard', path: '/dashboard', icon: <FaTh /> },
    { label: 'Browse Jobs', path: '/jobs', icon: <FaSearch /> },
    { label: 'For You', path: '/preferred-jobs', icon: <FaUser /> },
    { label: 'Applied', path: '/applied-all', icon: <FaPaperPlane /> },
    { label: 'Saved Jobs', path: '/saved-all', icon: <FaBookmark /> },
    { label: 'Preferences', path: '/company-preferences', icon: <FaBuilding /> },
    { label: 'Profile', path: '/profile', icon: <FaUser /> },
];

export default function Sidebar() {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (path) => location.pathname === path;

    const sidebarWidth = collapsed ? '64px' : '240px';

    return (
        <>
            {/* Mobile hamburger */}
            <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                style={{
                    display: 'none',
                    position: 'fixed', top: '12px', left: '12px', zIndex: 200,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    width: '40px', height: '40px',
                    alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--color-white-65)',
                    fontSize: '20px',
                }}
                className="sidebar-mobile-btn"
            >
                <FaBars />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                        zIndex: 199, backdropFilter: 'blur(4px)',
                    }}
                />
            )}

            {/* Sidebar */}
            <aside
                className="trackhire-sidebar"
                style={{
                    width: sidebarWidth,
                    minHeight: '100vh',
                    background: 'var(--color-surface-1)',
                    borderRight: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    flexShrink: 0,
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    overflow: 'hidden',
                    transition: 'width 0.25s ease',
                    zIndex: 100,
                }}
            >
                {/* Logo + collapse toggle */}
                <div style={{
                    padding: collapsed ? '20px 0' : '20px 16px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    gap: '8px',
                    height: '64px',
                }}>
                    {!collapsed && (
                        <Link to="/" style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 800,
                            fontSize: '20px',
                            color: 'var(--color-white)',
                            textDecoration: 'none',
                            letterSpacing: '-0.02em',
                        }}>
                            Track<span style={{ color: 'var(--color-orange)' }}>H</span>ire
                        </Link>
                    )}
                    <button
                        onClick={() => setCollapsed(c => !c)}
                        aria-label="Toggle sidebar"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-white-40)',
                            fontSize: '16px',
                            padding: '4px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--color-white)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--color-white-40)'}
                    >
                        {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
                    </button>
                </div>

                {/* Nav items */}
                <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {NAV_ITEMS.map(({ label, path, icon }) => {
                        const active = isActive(path);
                        return (
                            <Link
                                key={path}
                                to={path}
                                onClick={() => setMobileOpen(false)}
                                title={collapsed ? label : undefined}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: collapsed ? '10px 0' : '10px 12px',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontFamily: 'var(--font-display)',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    color: active ? 'var(--color-orange)' : 'var(--color-white-65)',
                                    background: active ? 'var(--color-orange-dim)' : 'transparent',
                                    border: active ? '1px solid var(--color-orange-border)' : '1px solid transparent',
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={e => {
                                    if (!active) {
                                        e.currentTarget.style.background = 'var(--color-surface-2)';
                                        e.currentTarget.style.color = 'var(--color-white)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!active) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'var(--color-white-65)';
                                    }
                                }}
                            >
                                <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
                                {!collapsed && <span>{label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div style={{ padding: '8px', borderTop: '1px solid var(--color-border)' }}>
                    <button
                        onClick={() => api.logout()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: collapsed ? '10px 0' : '10px 12px',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            width: '100%',
                            borderRadius: '8px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-display)',
                            fontWeight: 600,
                            fontSize: '14px',
                            color: 'rgba(248,113,113,0.8)',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)';
                            e.currentTarget.style.color = '#f87171';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'transparent';
                            e.currentTarget.style.color = 'rgba(248,113,113,0.8)';
                        }}
                    >
                        <span style={{ fontSize: '16px', flexShrink: 0 }}><FaPowerOff /></span>
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Responsive styles injected once */}
            <style>{`
                @media (max-width: 768px) {
                    .trackhire-sidebar {
                        position: fixed !important;
                        top: 0; left: ${mobileOpen ? '0' : '-260px'} !important;
                        width: 240px !important;
                        z-index: 200;
                        transition: left 0.3s ease, width 0.25s ease !important;
                        box-shadow: ${mobileOpen ? '4px 0 40px rgba(0,0,0,0.6)' : 'none'};
                    }
                    .sidebar-mobile-btn {
                        display: flex !important;
                    }
                }
            `}</style>
        </>
    );
}
