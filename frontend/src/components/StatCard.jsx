import React from 'react';

export default function StatCard({ title, value, icon, accentColor = 'var(--color-orange)' }) {
    return (
        <div style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: '14px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <p style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--color-white-40)',
                    margin: 0,
                }}>
                    {title}
                </p>
                {icon && (
                    <div style={{
                        width: '32px', height: '32px',
                        background: `rgba(${accentColor === 'var(--color-orange)' ? '249,115,22' : '96,165,250'}, 0.10)`,
                        border: `1px solid rgba(${accentColor === 'var(--color-orange)' ? '249,115,22' : '96,165,250'}, 0.18)`,
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px',
                    }}>
                        {icon}
                    </div>
                )}
            </div>
            <p style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '32px',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                color: 'var(--color-white)',
                margin: 0,
            }}>
                {value ?? 0}
            </p>
        </div>
    );
}
