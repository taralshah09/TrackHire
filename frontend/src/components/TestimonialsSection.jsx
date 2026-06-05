import React, { useEffect, useState } from 'react';
import testimonialsData from '../testimonials.json';
import TestimonialCard from './TestimonialCard';

/* ─── Keyframe CSS injected once (keyframes can't be inline) ─────────── */
const MARQUEE_CSS = `
@keyframes marquee-left {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
}
@keyframes marquee-right {
    0%   { transform: translateX(-50%); }
    100% { transform: translateX(0); }
}
@media (prefers-reduced-motion: reduce) {
    .marquee-track-left,
    .marquee-track-right {
        animation: none !important;
    }
}
`;

function MarqueeStyles() {
    useEffect(() => {
        const id = 'trackhire-marquee-styles';
        if (!document.getElementById(id)) {
            const el = document.createElement('style');
            el.id = id;
            el.textContent = MARQUEE_CSS;
            document.head.appendChild(el);
        }
    }, []);
    return null;
}

/* ─── Responsive size config by breakpoint ───────────────────────────── */
function getSizeConfig(width) {
    if (width < 420) {
        // ~400px screens
        return {
            cardWidth: 160,
            padding: 12,
            quoteSize: 24,
            reviewSize: 10,
            nameSize: 11,
            roleSize: 9,
            avatarSize: 26,
            gap: 8,
            rowGap: 16,
            edgeFade: 40,
            sectionPaddingV: '48px',
            headerPadding: '0 16px',
            headerMarginBottom: '32px',
            animationDuration: '40s',
        };
    }
    if (width < 720) {
        // ~700px screens
        return {
            cardWidth: 210,
            padding: 14,
            quoteSize: 30,
            reviewSize: 11,
            nameSize: 12,
            roleSize: 9,
            avatarSize: 30,
            gap: 10,
            rowGap: 18,
            edgeFade: 56,
            sectionPaddingV: '64px',
            headerPadding: '0 20px',
            headerMarginBottom: '40px',
            animationDuration: '50s',
        };
    }
    // ≥720px — default desktop
    return {
        cardWidth: 300,
        padding: 20,
        quoteSize: 40,
        reviewSize: 12,
        nameSize: 13,
        roleSize: 10,
        avatarSize: 36,
        gap: 12,
        rowGap: 20,
        edgeFade: 96,
        sectionPaddingV: '96px',
        headerPadding: '0 32px',
        headerMarginBottom: '56px',
        animationDuration: '60s',
    };
}

/* ─── Window width hook ───────────────────────────────────────────────── */
function useWindowWidth() {
    const [width, setWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1024
    );
    useEffect(() => {
        const handler = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return width;
}

/* ─── Marquee Row ─────────────────────────────────────────────────────── */
function MarqueeRow({ items, direction = 'left', cardSize, paused = false }) {
    const doubled = [...items, ...items];

    const trackStyle = {
        display: 'flex',
        width: 'max-content',
        animationName: direction === 'left' ? 'marquee-left' : 'marquee-right',
        animationDuration: cardSize.animationDuration,
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
        animationPlayState: paused ? 'paused' : 'running',
        willChange: 'transform',
        gap: `${cardSize.gap + 8}px`,  // inter-card gap = internal gap + a bit extra
    };

    return (
        <div
            role="region"
            aria-label="Testimonials"
            style={{ overflow: 'hidden', width: '100%', cursor: 'default' }}
        >
            <div style={trackStyle}>
                {doubled.map((item, idx) => (
                    <TestimonialCard
                        key={`${item.name}-${idx}`}
                        name={item.name}
                        role={item.role}
                        company={item.company}
                        avatar={item.avatar}
                        review={item.review}
                        size={cardSize}
                    />
                ))}
            </div>
        </div>
    );
}

/* ─── Play / Pause Button ─────────────────────────────────────────────── */
function PlayPauseButton({ playing, onToggle }) {
    const [hovered, setHovered] = useState(false);

    const btnStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: hovered ? '#FF6B00' : '#060608',
        color: '#FFFFFF',
        border: '3px solid #060608',
        padding: '8px 18px',
        fontFamily: "'Space Mono', monospace",
        fontSize: '12px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        cursor: 'pointer',
        boxShadow: hovered ? '2px 2px 0px 0px #FF6B00' : '4px 4px 0px 0px #FF6B00',
        transform: hovered ? 'translate(2px, 2px)' : 'translate(0, 0)',
        transition: 'background-color 0.15s, box-shadow 0.15s, transform 0.15s',
        userSelect: 'none',
        outline: 'none',
        flexShrink: 0,
    };

    const PauseIcon = (
        <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
            <rect x="0" y="0" width="4" height="14" rx="1" />
            <rect x="8" y="0" width="4" height="14" rx="1" />
        </svg>
    );
    const PlayIcon = (
        <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
            <polygon points="0,0 12,7 0,14" />
        </svg>
    );

    return (
        <button
            onClick={onToggle}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label={playing ? 'Pause testimonials' : 'Play testimonials'}
            style={btnStyle}
        >
            {playing ? PauseIcon : PlayIcon}
            {playing ? 'Pause' : 'Play'}
        </button>
    );
}

/* ─── Main Section ────────────────────────────────────────────────────── */
export default function TestimonialsSection() {
    const [playing, setPlaying] = useState(true);
    const width = useWindowWidth();
    const cfg = getSizeConfig(width);

    const allTestimonials = testimonialsData;
    const mid = Math.ceil(allTestimonials.length / 2);
    const rowTop    = allTestimonials.slice(0, mid);
    const rowBottom = allTestimonials.slice(mid);

    return (
        <section
            aria-labelledby="testimonials-heading"
            style={{
                paddingTop: cfg.sectionPaddingV,
                paddingBottom: cfg.sectionPaddingV,
                backgroundColor: '#F4F4F4',
                borderTop: '6px solid #060608',
                overflow: 'hidden',
            }}
        >
            <MarqueeStyles />

            {/* ── Header row: heading + play/pause button ── */}
            <div
                style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: cfg.headerPadding,
                    marginBottom: cfg.headerMarginBottom,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                }}
            >
                {/* Left: label + heading */}
                <div>
                    <span
                        style={{
                            fontFamily: "'Space Mono', monospace",
                            fontWeight: 700,
                            fontSize: '12px',
                            color: '#FF6B00',
                            display: 'block',
                            textTransform: 'uppercase',
                            marginBottom: '12px',
                            letterSpacing: '0.05em',
                        }}
                    >
                        // What people say
                    </span>
                    <h2
                        id="testimonials-heading"
                        style={{
                            fontWeight: 900,
                            fontSize: 'clamp(28px, 5vw, 64px)',
                            textTransform: 'uppercase',
                            lineHeight: 0.9,
                            color: '#060608',
                            letterSpacing: '-0.04em',
                            margin: 0,
                        }}
                    >
                        The feedback that
                        <br />
                        keeps us building.
                    </h2>
                </div>

                {/* Right: play/pause button */}
                <PlayPauseButton playing={playing} onToggle={() => setPlaying((p) => !p)} />
            </div>

            {/* ── Marquee rows ── */}
            <div style={{ position: 'relative' }}>
                {/* Left edge fade */}
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${cfg.edgeFade}px`,
                        zIndex: 10,
                        pointerEvents: 'none',
                        background: 'linear-gradient(to right, #F4F4F4 0%, transparent 100%)',
                    }}
                />
                {/* Right edge fade */}
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: `${cfg.edgeFade}px`,
                        zIndex: 10,
                        pointerEvents: 'none',
                        background: 'linear-gradient(to left, #F4F4F4 0%, transparent 100%)',
                    }}
                />

                {/* Row 1 — left → right */}
                <div style={{ marginTop: `${cfg.rowGap}px`, marginBottom: `${cfg.rowGap}px` }}>
                    <MarqueeRow
                        items={rowTop}
                        direction="right"
                        cardSize={cfg}
                        paused={!playing}
                    />
                </div>

                {/* Row 2 — right → left */}
                <div style={{ marginTop: `${cfg.rowGap}px`, marginBottom: `${cfg.rowGap}px` }}>
                    <MarqueeRow
                        items={rowBottom}
                        direction="left"
                        cardSize={cfg}
                        paused={!playing}
                    />
                </div>
            </div>
        </section>
    );
}
