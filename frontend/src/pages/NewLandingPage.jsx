import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import { ScribbleArrow, ScribbleLine } from "../components/scribble-ui";
import TestimonialsSection from "../components/TestimonialsSection";

/* ─── Shared responsive config (mirrors TestimonialsSection) ───────── */
function getSectionConfig(width) {
    if (width < 420) {
        return {
            paddingV: '48px',
            paddingH: '16px',
            maxWidth: '100%',
            headerMarginBottom: '32px',
        };
    }
    if (width < 720) {
        return {
            paddingV: '64px',
            paddingH: '20px',
            maxWidth: '100%',
            headerMarginBottom: '40px',
        };
    }
    return {
        paddingV: '96px',
        paddingH: '32px',
        maxWidth: '1200px',
        headerMarginBottom: '56px',
    };
}

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

const GLOBAL_CSS = `
    .brutalist-shadow {
        box-shadow: 4px 4px 0px 0px #060608;
    }
    .brutalist-shadow-lg {
        box-shadow: 8px 8px 0px 0px #060608;
    }
    .brutalist-shadow-orange {
        box-shadow: 4px 4px 0px 0px #FF6B00;
    }
    .active-btn:active {
        transform: translate(2px, 2px);
        box-shadow: 0px 0px 0px 0px #060608;
    }
    .sticker-rotate-pos { transform: rotate(3deg); }
    .sticker-rotate-neg { transform: rotate(-3deg); }
    .grid-line-overlay {
        background-image: linear-gradient(to right, #060608 1px, transparent 1px);
        background-size: calc(100% / 12) 100%;
        pointer-events: none;
    }
    .marker-font { font-family: 'Space Mono', monospace; }
    .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
    .hero-headline {
        -webkit-text-stroke: 2.5px #060608;
        text-stroke: 2.5px #060608;
    }
    .hero-grid-bg {
        background-image:
            linear-gradient(to right, rgba(6,6,8,0.2) 2px, transparent 2px),
            linear-gradient(to bottom, rgba(6,6,8,0.2) 2px, transparent 2px);
        background-size: 64px 64px;
    }
    
    /* Custom Responsive Fixes */
    @media (max-width: 860px) {
        .kpi-section-container {
            display: none !important;
        }
    }

    @media (max-width: 900px) {
        .problems-grid-container {
            display: flex !important;
            flex-direction: column !important;
        }
        .problems-right-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 16px !important;
        }
        .problem-pipeline-box {
            grid-column: span 2 !important;
        }
        .problem-box {
            padding: 16px !important;
            box-shadow: 6px 6px 0px 0px #060608 !important;
        }
        .problem-icon {
            font-size: 32px !important;
        }
        .problem-title {
            font-size: 16px !important;
        }
        .problem-desc {
            font-size: 10px !important;
        }
    }
    
    @media (max-width: 420px) {
        .problems-right-grid {
            display: flex !important;
            flex-direction: column !important;
        }
    }

    .process-step-block {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        text-align: center !important;
    }

    .footer-weekly-sprint {
        margin-top: -30px !important;
    }
`;

function GlobalStyles() {
    useEffect(() => {
        const id = 'trackhire-brutalist-styles';
        if (!document.getElementById(id)) {
            const el = document.createElement('style');
            el.id = id;
            el.textContent = GLOBAL_CSS;
            document.head.insertBefore(el, document.head.firstChild);
        }
    }, []);
    return null;
}

export default function NewLandingPage() {
    const isLoggedIn = Boolean(Cookies.get('token') || Cookies.get('username') || Cookies.get('accessToken'));
    const width = useWindowWidth();
    const cfg = getSectionConfig(width);

    return (
        <div className="bg-surface text-brutalist-black font-body-lg overflow-x-hidden selection:bg-vibrant-orange selection:text-pure-white">
            <GlobalStyles />
            {/* TopNavBar */}
            <nav
                style={{
                    width: '100%',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                    backgroundColor: '#FFFFFF',
                    borderBottom: '4px solid #060608',
                    paddingLeft: cfg.paddingH,
                    paddingRight: cfg.paddingH,
                    // paddingTop: '8px',
                    // paddingBottom: '8px',
                }}
            >
                <div style={{ maxWidth: cfg.maxWidth, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', paddingBottom: '16px', gap: '16px' }}>
                    {/* Brand */}
                    <Link to="/" className="font-headline-md text-headline-md uppercase tracking-tighter text-brutalist-black shrink-0">
                        TRACK<span className="text-vibrant-orange">HIRE</span>
                    </Link>

                    {/* Center: Builder + Product Hunt */}
                    <div className="hidden md:flex gap-6 items-center">
                        <a className="font-body-lg text-body-lg text-brutalist-black hover:text-vibrant-orange transition-colors" href="https://taralshah.xyz" target="_blank" rel="noreferrer">Builder</a>
                        <a
                            className="font-body-lg text-body-lg text-brutalist-black hover:text-vibrant-orange transition-colors flex items-center gap-2"
                            href="https://www.producthunt.com/products/trackhire"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Product Hunt
                        </a>
                    </div>

                    {/* Right: Auth + Star on GitHub */}
                    <div className="flex gap-3 items-center shrink-0">
                        <a
                            href="https://github.com/taralshah09/TrackHire"
                            target="_blank"
                            rel="noreferrer"
                            className="hidden sm:flex font-label-mono text-label-mono uppercase items-center justify-center gap-2 bg-pure-white text-brutalist-black border-2 border-brutalist-black w-36 h-12 brutalist-shadow active-btn"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.18.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.21.7.82.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z" />
                            </svg>
                            Star
                        </a>
                        {isLoggedIn ? (
                            <Link to="/dashboard" className="font-body-lg text-body-lg bg-vibrant-orange text-pure-white border-2 border-brutalist-black w-36 h-12 brutalist-shadow active-btn flex items-center justify-center">
                                Dashboard
                            </Link>
                        ) : (
                            <Link to="/login" className="font-body-lg text-body-lg bg-vibrant-orange text-pure-white border-2 border-brutalist-black w-36 h-12 brutalist-shadow active-btn flex items-center justify-center">
                                Sign In
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header
                style={{
                    position: 'relative',
                    minHeight: 'calc(100vh - 84px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingLeft: cfg.paddingH,
                    paddingRight: cfg.paddingH,
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                }}
            >
                {/* Faint background grid */}
                <div className="hero-grid-bg absolute inset-0 pointer-events-none"></div>
                {/* Top fade so the grid melts into the surface */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-pure-white/40 via-transparent to-pure-white/5"></div>

                <div style={{ maxWidth: cfg.maxWidth, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h1 className="font-black text-[48px] sm:text-[64px] md:text-[90px] lg:text-[120px] uppercase leading-[0.85] mb-4 md:mb-6 text-brutalist-black tracking-tighter text-center">
                        Stop Hunting.<br />Start Landing.
                    </h1>
                    <p className="font-bold text-base md:text-2xl mb-8 md:mb-12 max-w-2xl mx-auto text-brutalist-black text-center px-4">
                        We watch every career page you care about, 24/7; so you apply first, every single time.
                    </p>
                    <div className="mb-10 md:mb-0 flex flex-col md:flex-row gap-4 md:gap-6 justify-center items-center w-full px-4">
                        <Link
                            to="/jobs"
                            className="w-full md:w-auto font-label-mono bg-vibrant-orange text-brutalist-black border-4 border-brutalist-black rounded-full px-8 py-4 md:px-16 md:py-6 brutalist-shadow active-btn text-center block uppercase font-black text-lg md:text-2xl transition-transform"
                        >
                            Browse Jobs
                        </Link>
                        <a
                            href="#features"
                            className="w-full md:w-auto font-label-mono bg-brutalist-black text-pure-white border-4 border-brutalist-black rounded-full px-8 py-4 md:px-16 md:py-6 brutalist-shadow active-btn text-center block uppercase font-black text-lg md:text-2xl transition-transform"
                        >
                            Learn More
                        </a>
                    </div>
                </div>

                {/* KPI Cards Row — Stepped Brutalist Layout */}
                <div className="kpi-section-container" style={{ position: 'relative', zIndex: 10, marginTop: '160px', width: '100%', maxWidth: cfg.maxWidth, margin: `160px auto 0`, display: 'flex', justifyContent: 'center', paddingBottom: '64px' }}>

                    {/* Left Orange Starburst */}
                    <div className="absolute left-0 md:left-12 bottom-4 md:bottom-12 z-30 sticker-rotate-neg pointer-events-none hidden md:block">
                        <svg width="64" height="64" viewBox="0 0 100 100" className="fill-vibrant-orange stroke-brutalist-black stroke-[4px]">
                            <polygon points="50,5 60,35 95,35 65,55 75,90 50,70 25,90 35,55 5,35 40,35" strokeLinejoin="round" />
                        </svg>
                    </div>

                    {/* Right White Starburst */}
                    <div className="absolute right-4 md:right-16 top-0 md:-top-8 z-30 sticker-rotate-pos pointer-events-none hidden md:block">
                        <svg width="48" height="48" viewBox="0 0 100 100" className="fill-pure-white stroke-brutalist-black stroke-[4px]">
                            <polygon points="50,5 62,38 95,50 62,62 50,95 38,62 5,50 38,38" strokeLinejoin="round" />
                        </svg>
                    </div>

                    {/* The Staggered Connected Row */}
                    <div
                        className="flex flex-col md:flex-row justify-center items-start w-full relative z-20 px-4"
                        style={{ filter: 'drop-shadow(8px 8px 0px #060608)' }}
                    >
                        {/* Grouped box: 500+ and 1 min */}
                        <div className="flex flex-row bg-pure-white border-4 border-brutalist-black w-full md:w-auto z-10">
                            <div className="px-4 py-6 md:px-8 flex flex-col justify-center items-center text-center border-r-4 border-brutalist-black w-1/2 md:min-w-[150px]">
                                <span className="font-display-lg text-[32px] md:text-[48px] font-black block leading-none">500+</span>
                                <span className="font-label-mono text-[10px] md:text-[12px] font-bold uppercase mt-2">Profiles</span>
                            </div>
                            <div className="px-4 py-6 md:px-8 flex flex-col justify-center items-center text-center w-1/2 md:min-w-[150px]">
                                <span className="font-display-lg text-[32px] md:text-[48px] font-black block leading-none">1 min</span>
                                <span className="font-label-mono text-[10px] md:text-[12px] font-bold uppercase mt-2">To insight</span>
                            </div>
                        </div>

                        {/* 0 Instant Alerts (Stepped Down) */}
                        <div className="bg-pure-white border-4 border-brutalist-black md:-ml-1 md:mt-6 px-4 py-6 md:px-8 flex flex-col justify-center items-center text-center min-w-[140px] md:min-w-[150px] w-full md:w-auto z-20">
                            <span className="font-display-lg text-[32px] md:text-[48px] font-black block leading-none">0</span>
                            <span className="font-label-mono text-[10px] md:text-[12px] font-bold uppercase mt-2">Instant Alerts</span>
                        </div>

                        {/* 0% Downtime (Baseline) */}
                        <div className="bg-pure-white border-4 border-brutalist-black md:-ml-1 px-4 py-6 md:px-8 flex flex-col justify-center items-center text-center min-w-[140px] md:min-w-[150px] w-full md:w-auto z-30">
                            <span className="font-display-lg text-[32px] md:text-[48px] font-black block leading-none">0%</span>
                            <span className="font-label-mono text-[10px] md:text-[12px] font-bold uppercase mt-2">Downtime</span>
                        </div>

                        {/* 9 min (Stepped Down) */}
                        <div className="bg-pure-white border-4 border-brutalist-black md:-ml-1 md:mt-6 px-4 py-6 md:px-8 flex flex-col justify-center items-center text-center min-w-[140px] md:min-w-[150px] w-full md:w-auto z-40">
                            <span className="font-display-lg text-[32px] md:text-[48px] font-black block leading-none">9 min</span>
                            <span className="font-label-mono text-[10px] md:text-[12px] font-bold uppercase mt-2 text-center">Total Best Rice</span>
                        </div>

                        {/* 67% (Baseline) */}
                        <div className="bg-pure-white border-4 border-brutalist-black md:-ml-1 px-4 py-6 md:px-8 flex flex-col justify-center items-center text-center min-w-[140px] md:min-w-[150px] w-full md:w-auto z-50">
                            <span className="font-display-lg text-[32px] md:text-[48px] font-black block leading-none">67%</span>
                            <span className="font-label-mono text-[10px] md:text-[12px] font-bold uppercase mt-2 text-center">Higher success rate</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Problem Section */}
            <section
                style={{
                    paddingTop: cfg.paddingV,
                    paddingBottom: cfg.paddingV,
                    paddingLeft: cfg.paddingH,
                    paddingRight: cfg.paddingH,
                    backgroundColor: '#F4F4F4',
                    borderTop: '6px solid #060608',
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <div className="problems-grid-container" style={{ maxWidth: cfg.maxWidth, width: '100%', display: 'grid', gridTemplateColumns: width >= 900 ? '1fr 1fr' : '1fr', gap: width >= 720 ? '96px' : '48px', alignItems: 'center', justifyItems: 'center' }}>

                    {/* Left Column */}
                    <div className="relative flex flex-col items-center text-center w-full">
                        <div className="absolute -top-10 font-label-mono font-black text-sm bg-brutalist-black text-pure-white px-4 py-2 sticker-rotate-neg z-20 shadow-[4px_4px_0px_0px_#FF6B00]">PROBLEMS WE SOLVE</div>

                        <h2 className="w-[100%] font-black text-[36px] sm:text-[48px] md:text-[64px] uppercase mb-8 md:mb-12 leading-[0.9] text-brutalist-black tracking-tighter text-center">
                            Every Morning.<br />The Same Routine.
                        </h2>

                        <div className="space-y-10 w-full flex flex-col items-center">
                            {/* Card 1 */}
                            <div className="w-full p-8 md:p-10 border-[5px] border-brutalist-black bg-pure-white relative group cursor-pointer transition-transform hover:-translate-y-1 flex flex-col items-center text-center" style={{ boxShadow: '12px 12px 0px 0px #FF6B00' }}>
                                <h3 className="font-black text-3xl md:text-4xl mb-4">Infinite Scrolling</h3>
                                <p className="font-label-mono font-bold text-sm md:text-base leading-relaxed max-w-[85%]">
                                    Stop wasting hours manually checking career pages. Our engine does it in 300ms.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="w-full p-8 md:p-10 border-[5px] border-brutalist-black bg-pure-white relative sticker-rotate-pos flex flex-col items-center text-center" style={{ boxShadow: '12px 12px 0px 0px #FF6B00' }}>
                                <h3 className="font-black text-3xl md:text-4xl mb-4">Zero Updates</h3>
                                <p className="font-label-mono font-bold text-sm md:text-base leading-relaxed max-w-[85%]">
                                    Don't rely on random emails. Our automated alert loop keeps you in the know.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 w-full problems-right-grid">

                        {/* Instant Alerts */}
                        <div className="border-[5px] border-brutalist-black bg-pure-white p-8 md:p-10 flex flex-col aspect-square justify-center transition-transform hover:scale-[1.02] problem-box" style={{ boxShadow: '12px 12px 0px 0px #060608' }}>
                            <div className="flex flex-col items-center text-center gap-4">
                                <span className="material-symbols-outlined text-[48px] md:text-[56px] text-brutalist-black problem-icon">notifications_active</span>
                                <h4 className="font-black text-2xl md:text-3xl mt-2 problem-title">Instant Alerts</h4>
                                <p className="font-label-mono font-bold text-sm mt-4 text-center problem-desc">14 new matches in the last hour. Efficiency is key.</p>
                            </div>
                        </div>

                        {/* Smart Match */}
                        <div className="border-[5px] border-brutalist-black bg-vibrant-orange p-8 md:p-10 flex flex-col aspect-square justify-center text-pure-white transition-transform hover:scale-[1.02] problem-box" style={{ boxShadow: '12px 12px 0px 0px #060608' }}>
                            <div className="flex flex-col items-center text-center gap-4">
                                <span className="material-symbols-outlined text-[48px] md:text-[56px] text-pure-white problem-icon">person_search</span>
                                <h4 className="font-black text-2xl md:text-3xl text-pure-white mt-2 problem-title">Smart Match</h4>
                                <p className="font-label-mono font-bold text-sm mt-4 text-pure-white text-center problem-desc">AI-driven sorting based on historical performance data.</p>
                            </div>
                        </div>

                        {/* Pipeline Health */}
                        <div className="col-span-1 md:col-span-2 border-[5px] border-brutalist-black bg-brutalist-black text-pure-white p-8 md:p-10 relative overflow-hidden flex flex-col items-center problem-box problem-pipeline-box" style={{ boxShadow: '12px 12px 0px 0px #060608' }}>
                            <div className="flex flex-col items-center text-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-vibrant-orange border-2 border-brutalist-black rounded-xl flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#FFFFFF]">
                                    <span className="material-symbols-outlined text-pure-white text-3xl">insights</span>
                                </div>
                                <h4 className="font-black text-3xl md:text-4xl text-pure-white">Pipeline Health</h4>
                            </div>

                            {/* Bar Chart Mockup */}
                            <div className="h-32 md:h-40 w-full bg-[#E5E5E5] flex items-end gap-1 p-2 md:p-3 border-[4px] border-brutalist-black relative">
                                <div className="h-[40%] flex-1 bg-vibrant-orange border-2 border-brutalist-black"></div>
                                <div className="h-[60%] flex-1 bg-vibrant-orange border-2 border-brutalist-black"></div>
                                <div className="h-[50%] flex-1 bg-vibrant-orange border-2 border-brutalist-black"></div>
                                <div className="h-[90%] flex-1 bg-vibrant-orange border-2 border-brutalist-black"></div>
                                <div className="h-[75%] flex-1 bg-vibrant-orange border-2 border-brutalist-black"></div>
                            </div>

                            {/* Sticker overlap */}
                            <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 bg-pure-white text-brutalist-black font-label-mono font-black text-xs md:text-sm px-3 py-1 sticker-rotate-neg border-[3px] border-brutalist-black z-10 shadow-[3px_3px_0px_0px_#FF6B00]">v2.0 LIVE</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Bento Grid Section */}
            <section
                id="features"
                style={{
                    paddingTop: cfg.paddingV,
                    paddingBottom: cfg.paddingV,
                    paddingLeft: cfg.paddingH,
                    paddingRight: cfg.paddingH,
                    backgroundColor: '#E5E5E5',
                    borderTop: '6px solid #060608',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '80vh',
                }}
            >
                <div style={{ maxWidth: cfg.maxWidth, width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: width < 720 ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: cfg.headerMarginBottom, gap: '32px' }}>
                        <div>
                            <span className="font-label-mono font-black text-sm text-vibrant-orange mb-4 block uppercase">// Capabilities</span>
                            <h2 className="font-black text-[36px] sm:text-[48px] md:text-[64px] uppercase leading-[0.9] text-brutalist-black tracking-tighter max-w-2xl">
                                Everything you need to land faster.
                            </h2>
                        </div>
                        <div className="hidden md:flex flex-col items-center relative mt-4">
                            <div className="bg-vibrant-orange text-pure-white font-label-mono font-black text-xs px-3 py-1 mb-1">v2</div>
                            <svg width="48" height="32" viewBox="0 0 48 32" className="stroke-brutalist-black fill-none stroke-[3px] stroke-linejoin-round stroke-linecap-round">
                                {/* Crosses */}
                                <path d="M6,14 L12,14 M9,11 L9,17" />
                                <path d="M16,22 L22,22 M19,19 L19,25" />
                                {/* Zig Zag */}
                                <path d="M24,24 L32,16 L40,24 L48,16" />
                                {/* Arrowhead */}
                                <path d="M40,16 L48,16 L48,24" />
                            </svg>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-6">
                        {/* Top Row */}
                        {/* Feature 1 */}
                        <div className="md:col-span-1 lg:col-span-4 border-[5px] border-brutalist-black bg-pure-white p-8 md:p-10 flex flex-col">
                            <span className="material-symbols-outlined text-[40px] text-brutalist-black mb-8">dynamic_feed</span>
                            <h3 className="font-black text-2xl md:text-3xl mb-4">Instant Alerts</h3>
                            <p className="font-label-mono font-bold text-sm leading-relaxed text-brutalist-black">
                                Customizable triggers for email, slack, or push notifications.
                            </p>
                        </div>
                        {/* Feature 2 */}
                        <div className="md:col-span-1 lg:col-span-4 border-[5px] border-brutalist-black bg-pure-white p-8 md:p-10 flex flex-col">
                            <span className="material-symbols-outlined text-[40px] text-brutalist-black mb-8">groups</span>
                            <h3 className="font-black text-2xl md:text-3xl mb-4">Smart Matching</h3>
                            <p className="font-label-mono font-bold text-sm leading-relaxed text-brutalist-black">
                                Tactile responses to your talent pool interactions.
                            </p>
                        </div>
                        {/* Feature 3 */}
                        <div className="md:col-span-1 lg:col-span-4 border-[5px] border-brutalist-black bg-pure-white p-8 md:p-10 flex flex-col relative">
                            <div className="absolute -top-3 -right-3 bg-brutalist-black text-pure-white font-label-mono font-black text-xs px-3 py-1">NEW</div>
                            <span className="material-symbols-outlined text-[40px] text-brutalist-black mb-8">timeline</span>
                            <h3 className="font-black text-2xl md:text-3xl mb-4">Track Pipeline</h3>
                            <p className="font-label-mono font-bold text-sm leading-relaxed text-brutalist-black">
                                Real-time status updates for every single candidate in play.
                            </p>
                        </div>

                        {/* Bottom Row */}
                        {/* Feature 4 (Black) */}
                        <div className="md:col-span-3 lg:col-span-6 border-[5px] border-brutalist-black bg-brutalist-black text-pure-white p-8 md:p-10 flex flex-col justify-center relative overflow-hidden">
                            <div className="relative z-10 w-full md:w-[65%]">
                                <h3 className="font-black text-2xl md:text-3xl mb-4 text-pure-white">Track Analytics</h3>
                                <p className="font-label-mono font-bold text-sm leading-relaxed text-pure-white mb-8">
                                    Data-driven feedback loops that help you refine your job descriptions and targeting parameters.
                                </p>
                                <Link to="/login" className="bg-vibrant-orange text-pure-white border-[3px] border-pure-white px-6 py-3 font-black text-lg uppercase inline-block text-center hover:scale-[1.02] transition-transform">
                                    VIEW REPORTS
                                </Link>
                            </div>
                            <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-32 h-44 bg-vibrant-orange border-[4px] border-pure-white rounded-lg sticker-rotate-pos items-center justify-center">
                                <span className="material-symbols-outlined text-[64px] text-pure-white">bar_chart</span>
                            </div>
                        </div>

                        {/* Feature 5 */}
                        <div className="md:col-span-1 lg:col-span-3 border-[5px] border-brutalist-black bg-pure-white p-8 md:p-10 flex flex-col">
                            <span className="material-symbols-outlined text-[40px] text-brutalist-black mb-8">key</span>
                            <h3 className="font-black text-2xl md:text-3xl mb-4">Secure Access</h3>
                            <p className="font-label-mono font-bold text-sm leading-relaxed text-brutalist-black">
                                Enterprise-grade encryption for all sensitive data.
                            </p>
                        </div>
                        {/* Feature 6 */}
                        <div className="md:col-span-1 lg:col-span-3 border-[5px] border-brutalist-black bg-pure-white p-8 md:p-10 flex flex-col">
                            <span className="material-symbols-outlined text-[40px] text-brutalist-black mb-8">groups</span>
                            <h3 className="font-black text-2xl md:text-3xl mb-4">Team Collab</h3>
                            <p className="font-label-mono font-bold text-sm leading-relaxed text-brutalist-black">
                                Shared notes and decision trees for faster hiring.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section
                style={{
                    paddingTop: cfg.paddingV,
                    paddingBottom: cfg.paddingV,
                    paddingLeft: cfg.paddingH,
                    paddingRight: cfg.paddingH,
                    backgroundColor: '#FFFFFF',
                    borderTop: '4px solid #060608',
                    borderBottom: '4px solid #060608',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '60vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {/* SVG Doodle Arrow */}
                <svg style={{ position: 'absolute', display: width >= 1024 ? 'block' : 'none', left: '15%', top: '50%', transform: 'translateY(-50%)', width: '128px', height: '128px', opacity: 0.2 }} viewBox="0 0 100 100">
                    <path d="M10,50 Q40,10 90,50" fill="none" stroke="black" strokeWidth="2"></path>
                    <path d="M80,40 L90,50 L80,60" fill="none" stroke="black" strokeWidth="2"></path>
                </svg>
                <div style={{ maxWidth: cfg.maxWidth, margin: '0 auto', width: '100%' }}>
                    <h2 style={{ fontWeight: 900, fontSize: width < 420 ? '36px' : width < 720 ? '48px' : '64px', textAlign: width < 720 ? 'center' : 'left', textTransform: 'uppercase', marginBottom: cfg.headerMarginBottom }}>Process Section</h2>
                    <div className="mt-1 grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
                        {/* Timeline Connectors for Desktop */}
                        <div className="hidden lg:block absolute top-12 left-0 w-full h-1 bg-vibrant-orange z-0"></div>
                        {/* Step 1 */}
                        <div className="relative z-10 bg-surface process-step-block">
                            <div className="w-24 h-24 border-4 border-brutalist-black bg-pure-white text-display-lg flex items-center justify-center font-bold mb-8 brutalist-shadow">1.</div>
                            <h3 className="font-headline-md text-headline-md mb-4 uppercase">Get in 3 Minutes</h3>
                            <p className="font-body-lg text-body-lg text-secondary">No complex forms. Just drag and drop your data and let our parser handle the rest.</p>
                        </div>
                        {/* Step 2 */}
                        <div className="relative z-10 bg-surface process-step-block">
                            <div className="w-24 h-24 border-4 border-brutalist-black bg-vibrant-orange text-pure-white text-display-lg flex items-center justify-center font-bold mb-8 brutalist-shadow sticker-rotate-pos">2.</div>
                            <h3 className="font-headline-md text-headline-md mb-4 uppercase">Auto-Apply</h3>
                            <p className="font-body-lg text-body-lg text-secondary">Our engine finds the best matching slots and queues your applications for approval.</p>
                        </div>
                        {/* Step 3 */}
                        <div className="relative z-10 bg-surface process-step-block">
                            <div className="w-24 h-24 border-4 border-brutalist-black bg-brutalist-black text-pure-white text-display-lg flex items-center justify-center font-bold mb-8 brutalist-shadow-orange">3.</div>
                            <h3 className="font-headline-md text-headline-md mb-4 uppercase">Track Analytics</h3>
                            <h4 className="font-label-mono text-label-mono mb-4 text-vibrant-orange">BRUTALIST GRID PROCESS</h4>
                            <p className="font-body-lg text-body-lg text-secondary">Watch your dashboard light up as responses come back in record time.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <TestimonialsSection />

            {/* Final CTA */}
            <section
                style={{
                    paddingTop: cfg.paddingV,
                    paddingBottom: cfg.paddingV,
                    paddingLeft: cfg.paddingH,
                    paddingRight: cfg.paddingH,
                    backgroundColor: '#F4F4F4',
                    borderTop: '4px solid #060608',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '60vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                }}
            >
                <div style={{ display: 'flex', flexDirection: width < 720 ? 'column' : 'row', gap: '32px', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none">
                        <span className="font-display-lg text-[20vw] font-bold uppercase whitespace-nowrap">TRACKHIRE</span>
                    </div>
                    <div style={{ maxWidth: cfg.maxWidth, margin: '0 auto', position: 'relative', zIndex: 10, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <span className="font-label-mono text-label-mono uppercase mb-4 block text-center">// THE LAST STEP</span>
                        <h2 className="font-black text-[40px] sm:text-[60px] md:text-[90px] lg:text-[120px] uppercase leading-[0.9] mb-8 md:mb-12 tracking-tighter text-center w-full px-4">
                            MISS NOTHING.<br />APPLY SMARTER.
                        </h2>
                        <div className="flex flex-col md:flex-row gap-4 md:gap-8 justify-center items-center w-full px-6">
                            <div className="relative w-full md:w-auto flex justify-center">
                                <Link to="/login" className="w-full md:w-auto font-black text-[20px] md:text-[32px] bg-vibrant-orange text-pure-white border-4 border-brutalist-black px-8 py-4 md:px-16 md:py-8 brutalist-shadow-lg active-btn block text-center">GET STARTED NOW</Link>
                            </div>
                            <a href="https://taralshah.xyz" target="_blank" rel="noreferrer" className="w-full md:w-auto font-black text-[20px] md:text-[32px] bg-pure-white text-brutalist-black border-4 border-brutalist-black px-8 py-4 md:px-16 md:py-8 brutalist-shadow active-btn block text-center">LEARN MORE</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer
                style={{
                    width: '100%',
                    backgroundColor: '#060608',
                    color: '#FFFFFF',
                    borderTop: '4px solid #060608',
                    paddingTop: cfg.paddingV,
                    paddingBottom: cfg.paddingV,
                    paddingLeft: cfg.paddingH,
                    paddingRight: cfg.paddingH,
                    overflow: 'hidden',
                }}
            >
                <div style={{
                    maxWidth: cfg.maxWidth,
                    margin: '0 auto',
                    width: '100%',
                    display: 'flex',
                    flexDirection: width < 720 ? 'column' : 'row',
                    alignItems: width < 720 ? 'center' : 'flex-start',
                    justifyContent: 'space-between',
                    gap: '48px',
                    textAlign: width < 720 ? 'center' : 'left',
                }}>
                    <div className="md:col-span-5 flex flex-col items-center">
                        <div className="font-headline-xl text-headline-xl text-pure-white mb-6 text-center">TrackHire</div>
                        <p className="font-body-lg text-body-lg opacity-80 max-w-md mb-8 text-center">
                            The job market is an 8h/day game. Play it strategically. TrackHire is built for those who value speed, honesty, and raw performance.
                        </p>
                    </div>
                    {/* <div className="md:col-span-3 flex flex-col items-center">
                        <h4 className="font-label-mono text-label-mono uppercase mb-8 border-b-2 border-pure-white inline-block">START</h4>
                        <nav className="flex flex-col gap-4 items-center">
                            <a className="font-label-mono text-label-mono opacity-80 hover:opacity-100 hover:text-vibrant-orange transition-opacity" href="https://taralshah.xyz" target="_blank" rel="noreferrer">About</a>
                            <a className="font-label-mono text-label-mono opacity-80 hover:opacity-100 hover:text-vibrant-orange transition-opacity" href="https://taralshah.xyz" target="_blank" rel="noreferrer">Learn Next</a>
                            <Link className="font-label-mono text-label-mono opacity-80 hover:opacity-100 hover:text-vibrant-orange transition-opacity" to="/login">Sign In</Link>
                            <a className="font-label-mono text-label-mono opacity-80 hover:opacity-100 hover:text-vibrant-orange transition-opacity" href="mailto:support@trackhire.com">Contact Us</a>
                        </nav>
                    </div> */}
                    <div className="md:col-span-4 border-4 border-vibrant-orange p-8 sticker-rotate-pos flex flex-col items-center footer-weekly-sprint">
                        <h4 className="font-headline-md text-headline-md mb-4 text-vibrant-orange text-center">Weekly Sprint</h4>
                        <p className="font-body-sm text-body-sm mb-6 opacity-80 text-center">Get the best job signals delivered every Monday morning. No spam, just high-quality leads.</p>
                        <div className="flex flex-col gap-4 w-full">
                            <Link to="/login" className="bg-vibrant-orange text-pure-white font-bold py-3 active-btn block text-center w-full">JOIN NOW</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}