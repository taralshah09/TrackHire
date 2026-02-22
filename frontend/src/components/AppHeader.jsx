import React from 'react';
import Cookies from 'js-cookie';
import { useAuth } from '../context/AuthContext';

/**
 * AppHeader — shared sticky header for all authenticated pages.
 *
 * Props:
 *   left  – JSX rendered on the left side (breadcrumb, back button, etc.)
 *           Defaults to the TrackHire wordmark.
 */
export default function AppHeader({ left }) {
    const { user } = useAuth?.() || {};
    const name = user?.fullName || user?.username || Cookies.get('username') || 'User';
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f97316&color=000&bold=true&size=72`;

    const defaultLeft = (
        <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: '20px', color: 'var(--color-white)',
            letterSpacing: '-0.02em',
        }}>
            Track<span style={{ color: 'var(--color-orange)' }}>H</span>ire
        </div>
    );

    return (
        <header style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            background: 'var(--color-surface-1)',
            borderBottom: '1px solid var(--color-border)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            flexShrink: 0,
        }}>
            {/* Left slot */}
            {left ?? defaultLeft}

            {/* Right — user identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <p style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700,
                    fontSize: '13px', color: 'var(--color-white)',
                    margin: 0,
                }}>
                    {name}
                </p>
                <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    border: '2px solid var(--color-orange-border)',
                    overflow: 'hidden', flexShrink: 0,
                }}>
                    <img
                        src={avatarUrl}
                        alt={name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </div>
            </div>
        </header>
    );
}
