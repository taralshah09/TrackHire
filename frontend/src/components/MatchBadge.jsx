import React from 'react';

function scoreTheme(score) {
    if (score >= 70) return {
        color: '#22c55e',
        chipBg: 'rgba(34,197,94,0.08)',
        chipBorder: 'rgba(34,197,94,0.20)',
    };
    if (score >= 50) return {
        color: 'var(--color-orange)',
        chipBg: 'rgba(249,115,22,0.08)',
        chipBorder: 'rgba(249,115,22,0.20)',
    };
    return {
        color: '#94a3b8',
        chipBg: 'rgba(148,163,184,0.08)',
        chipBorder: 'rgba(148,163,184,0.20)',
    };
}

function buildChips(reasons) {
    if (!reasons) return [];
    const chips = [];

    const skills = reasons.skillMatches || [];
    skills.slice(0, 2).forEach(skill => chips.push({ label: skill, key: `skill-${skill}` }));
    if (skills.length > 2) chips.push({ label: `+${skills.length - 2} skills`, key: 'skills-more', dim: true });

    if (reasons.companyMatch) chips.push({ label: 'Preferred company', key: 'company' });
    if (reasons.titleMatch)   chips.push({ label: 'Role fit', key: 'title' });

    if (reasons.freshness === '< 24 hours') chips.push({ label: 'Just posted', key: 'fresh' });
    else if (reasons.freshness === '< 3 days') chips.push({ label: 'Recently posted', key: 'fresh' });

    return chips.slice(0, 5);
}

export default function MatchBadge({ score, reasons }) {
    const { color, chipBg, chipBorder } = scoreTheme(score);
    const chips = buildChips(reasons);

    return (
        <div style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid var(--color-border)' }}>
            {/* Score label + progress bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: '13px',
                    color,
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                }}>
                    {score}% Match
                </span>
                <div style={{
                    flex: 1,
                    height: '3px',
                    borderRadius: '2px',
                    background: 'var(--color-surface-3)',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        width: `${score}%`,
                        height: '100%',
                        background: color,
                        borderRadius: '2px',
                    }} />
                </div>
            </div>

            {/* Reason chips */}
            {chips.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {chips.map(chip => (
                        <span
                            key={chip.key}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontSize: '10px',
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                letterSpacing: '0.02em',
                                background: chip.dim ? 'rgba(148,163,184,0.08)' : chipBg,
                                color: chip.dim ? '#94a3b8' : color,
                                border: `1px solid ${chip.dim ? 'rgba(148,163,184,0.20)' : chipBorder}`,
                            }}
                        >
                            {!chip.dim && <span style={{ fontSize: '8px' }}>✓</span>}
                            {chip.label}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
