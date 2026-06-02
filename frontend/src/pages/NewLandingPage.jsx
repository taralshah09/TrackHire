import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import { ScribbleArrow, ScribbleLine } from "../components/scribble-ui";

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

    return (
        <div className="bg-surface text-brutalist-black font-body-lg overflow-x-hidden selection:bg-vibrant-orange selection:text-pure-white">
            <GlobalStyles />
            {/* TopNavBar */}
            <nav className="w-full sticky top-0 z-50 bg-surface border-b-4 border-brutalist-black px-8 md:px-12 lg:px-16">
                <div className="w-full flex justify-between items-center py-6 gap-4">
                    {/* Brand */}
                    <Link to="/" className="font-headline-md text-headline-md uppercase tracking-tighter text-brutalist-black shrink-0">
                        TRACK<span className="text-vibrant-orange">HIRE</span>
                    </Link>

                    {/* Center: Builder + Product Hunt */}
                    <div className="hidden md:flex gap-6 items-center">
                        <Link className="font-body-lg text-body-lg text-brutalist-black hover:text-vibrant-orange transition-colors" to="/meet-the-builder">Builder</Link>
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

            <header className="relative min-h-[calc(100vh-84px)] flex flex-col justify-center items-center px-4 md:px-8 py-16 overflow-hidden bg-pure-white">
                {/* Faint background grid */}
                <div className="hero-grid-bg absolute inset-0 pointer-events-none"></div>
                {/* Top fade so the grid melts into the surface */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-pure-white/40 via-transparent to-pure-white/5"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10 w-full flex flex-col items-center mt-12">
                    <h1 className="font-black text-[60px] md:text-[120px] uppercase leading-[0.85] mb-6 text-brutalist-black tracking-tighter text-center">
                        Stop Hunting.<br />Start Landing.
                    </h1>
                    <p className="font-bold text-lg md:text-2xl mb-12 max-w-2xl mx-auto text-brutalist-black text-center">
                        We watch every career page you care about, 24/7; so you apply first, every single time.
                    </p>
                    <div className="mb-10 md:mb-0 flex flex-col md:flex-row gap-6 justify-center items-center w-full">
                        <Link
                            to="/jobs"
                            className="w-full md:w-auto font-label-mono bg-vibrant-orange text-brutalist-black border-4 border-brutalist-black rounded-full px-16 py-6 brutalist-shadow active-btn text-center block uppercase font-black text-xl md:text-2xl transition-transform"
                        >
                            Browse Jobs
                        </Link>
                        <a
                            href="#features"
                            className="w-full md:w-auto font-label-mono bg-brutalist-black text-pure-white border-4 border-brutalist-black rounded-full px-16 py-6 brutalist-shadow active-btn text-center block uppercase font-black text-xl md:text-2xl transition-transform"
                        >
                            Learn More
                        </a>
                    </div>
                </div>

                {/* KPI Cards Row — Stepped Brutalist Layout */}
                <div className="relative z-10 mt-40 md:mt-56 w-full max-w-[1200px] mx-auto flex justify-center pb-16">

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
            <section className="py-24 px-4 md:px-8 bg-[#F4F4F4] border-t-[6px] border-brutalist-black overflow-hidden flex justify-center">
                <div className="max-w-[1100px] w-full grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center justify-items-center">

                    {/* Left Column */}
                    <div className="relative flex flex-col items-center text-center w-full">
                        <div className="absolute -top-10 font-label-mono font-black text-sm bg-brutalist-black text-pure-white px-4 py-2 sticker-rotate-neg z-20 shadow-[4px_4px_0px_0px_#FF6B00]">PROBLEMS WE SOLVE</div>

                        <h2 className="w-[100%] font-black text-[48px] md:text-[64px] uppercase mb-12 leading-[0.9] text-brutalist-black tracking-tighter text-center">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 w-full">

                        {/* Instant Alerts */}
                        <div className="border-[5px] border-brutalist-black bg-pure-white p-8 md:p-10 flex flex-col aspect-square justify-center transition-transform hover:scale-[1.02]" style={{ boxShadow: '12px 12px 0px 0px #060608' }}>
                            <div className="flex flex-col items-center text-center gap-4">
                                <span className="material-symbols-outlined text-[48px] md:text-[56px] text-brutalist-black">notifications_active</span>
                                <h4 className="font-black text-2xl md:text-3xl mt-2">Instant Alerts</h4>
                                <p className="font-label-mono font-bold text-sm mt-4 text-center">14 new matches in the last hour. Efficiency is key.</p>
                            </div>
                        </div>

                        {/* Smart Match */}
                        <div className="border-[5px] border-brutalist-black bg-vibrant-orange p-8 md:p-10 flex flex-col aspect-square justify-center text-pure-white transition-transform hover:scale-[1.02]" style={{ boxShadow: '12px 12px 0px 0px #060608' }}>
                            <div className="flex flex-col items-center text-center gap-4">
                                <span className="material-symbols-outlined text-[48px] md:text-[56px] text-pure-white">person_search</span>
                                <h4 className="font-black text-2xl md:text-3xl text-pure-white mt-2">Smart Match</h4>
                                <p className="font-label-mono font-bold text-sm mt-4 text-pure-white text-center">AI-driven sorting based on historical performance data.</p>
                            </div>
                        </div>

                        {/* Pipeline Health */}
                        <div className="col-span-1 md:col-span-2 border-[5px] border-brutalist-black bg-brutalist-black text-pure-white p-8 md:p-10 relative overflow-hidden flex flex-col items-center" style={{ boxShadow: '12px 12px 0px 0px #060608' }}>
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
            <section id="features" className="py-24 px-4 md:px-8 bg-[#E5E5E5] border-t-[6px] border-brutalist-black overflow-hidden flex flex-col items-center justify-center min-h-[80vh]">
                <div className="max-w-[1200px] w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8">
                        <div>
                            <span className="font-label-mono font-black text-sm text-vibrant-orange mb-4 block uppercase">// Capabilities</span>
                            <h2 className="font-black text-[48px] md:text-[64px] uppercase leading-[0.9] text-brutalist-black tracking-tighter max-w-2xl">
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
            <section className="py-block-gap px-grid-margin bg-surface border-t-4 border-brutalist-black border-b-4 relative overflow-hidden min-h-[60vh] flex items-center justify-center">
                {/* SVG Doodle Arrow */}
                <svg className="absolute hidden lg:block left-[15%] top-1/2 -translate-y-1/2 w-32 h-32 opacity-20" viewBox="0 0 100 100">
                    <path d="M10,50 Q40,10 90,50" fill="none" stroke="black" strokeWidth="2"></path>
                    <path d="M80,40 L90,50 L80,60" fill="none" stroke="black" strokeWidth="2"></path>
                </svg>
                <div className="max-w-7xl mx-auto w-full">
                    <h2 className="font-headline-xl text-headline-xl uppercase mb-16">Process Section</h2>
                    <div className="mt-1 grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
                        {/* Timeline Connectors for Desktop */}
                        <div className="hidden lg:block absolute top-12 left-0 w-full h-1 bg-vibrant-orange z-0"></div>
                        {/* Step 1 */}
                        <div className="relative z-10 bg-surface">
                            <div className="w-24 h-24 border-4 border-brutalist-black bg-pure-white text-display-lg flex items-center justify-center font-bold mb-8 brutalist-shadow">1.</div>
                            <h3 className="font-headline-md text-headline-md mb-4 uppercase">Get in 3 Minutes</h3>
                            <p className="font-body-lg text-body-lg text-secondary">No complex forms. Just drag and drop your data and let our parser handle the rest.</p>
                        </div>
                        {/* Step 2 */}
                        <div className="relative z-10 bg-surface">
                            <div className="w-24 h-24 border-4 border-brutalist-black bg-vibrant-orange text-pure-white text-display-lg flex items-center justify-center font-bold mb-8 brutalist-shadow sticker-rotate-pos">2.</div>
                            <h3 className="font-headline-md text-headline-md mb-4 uppercase">Auto-Apply</h3>
                            <p className="font-body-lg text-body-lg text-secondary">Our engine finds the best matching slots and queues your applications for approval.</p>
                        </div>
                        {/* Step 3 */}
                        <div className="relative z-10 bg-surface">
                            <div className="w-24 h-24 border-4 border-brutalist-black bg-brutalist-black text-pure-white text-display-lg flex items-center justify-center font-bold mb-8 brutalist-shadow-orange">3.</div>
                            <h3 className="font-headline-md text-headline-md mb-4 uppercase">Track Analytics</h3>
                            <h4 className="font-label-mono text-label-mono mb-4 text-vibrant-orange">BRUTALIST GRID PROCESS</h4>
                            <p className="font-body-lg text-body-lg text-secondary">Watch your dashboard light up as responses come back in record time.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            {/* <section className="py-block-gap px-grid-margin bg-surface-bright relative min-h-[60vh] flex flex-col justify-center">
                <div className="max-w-7xl mx-auto w-full">
                    <h2 className="font-headline-xl text-headline-xl uppercase mb-16 text-center">Testimonials</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-5 relative">
                            <div className="absolute -top-8 left-4 bg-vibrant-orange text-pure-white px-4 py-2 font-label-mono sticker-rotate-neg z-20">STICKER AGENT</div>
                            <div className="border-4 border-brutalist-black bg-pure-white p-12 brutalist-shadow-lg relative overflow-hidden">
                                <span className="material-symbols-outlined text-8xl absolute top-4 left-4 opacity-10">format_quote</span>
                                <p className="font-headline-md text-headline-md mb-8 relative z-10">
                                    "Everything changed when we swapped our legacy system for TrackHire. The speed is absolutely ruthless."
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="font-label-mono text-label-mono uppercase font-bold">— PTRA</div>
                                    <div className="h-1 w-12 bg-brutalist-black"></div>
                                </div>
                            </div>
                            <div className="absolute -bottom-16 -right-8 hidden md:block">
                                <span className="font-label-mono text-vibrant-orange sticker-rotate-pos">HAND-DRAWN ARROW</span>
                                <span className="material-symbols-outlined text-5xl">trending_flat</span>
                            </div>
                        </div>
                        <div className="lg:col-span-4 flex justify-center relative py-12">
                            <div className="relative w-64 h-80 bg-pure-white border-2 border-brutalist-black p-4 brutalist-shadow sticker-rotate-neg z-10">
                                <img className="w-full h-56 object-cover border-2 border-brutalist-black mb-4 grayscale" data-alt="A striking black and white portrait of a modern professional in a minimalist city setting. The person has a determined, tech-forward look, wearing high-contrast editorial clothing. The lighting is harsh and direct, creating deep blacks and bright whites to match the brutalist aesthetic of the website." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdtmi0xLRgNatFpqCkz7ElOdMgzan-R2i039iH-1OR7X6xISoTx5OcJKfBb4WEQsW1uxnn2EBxAwOaQLijflb9QHCzjc_9feV1uy_fZFp5q0UQ0UGPrR4A5UITiTuN8thvER1WLawgTEiIMC22PQJJpPkOeq-P-RpawjvLJ-3TnMaGFVIphEK91E3X59aEUPMbJKxd_onfWWKKE8y4w8jfgrpb56rBSCDM6svWF4Vdmnlts1NlPIgCRYvPyc5OgIOqwCvlt4NQCL7b" alt="Sarah" />
                                <span className="font-label-mono text-label-mono block text-center">— Sarah</span>
                            </div>
                            <div className="absolute w-64 h-80 bg-pure-white border-2 border-brutalist-black p-4 brutalist-shadow-orange sticker-rotate-pos -right-4 top-20">
                                <img className="w-full h-56 object-cover border-2 border-brutalist-black mb-4 grayscale" data-alt="A portrait of a male tech leader with a raw, high-impact gaze. The photo is styled like a polaroid with a thick white border. The background is an industrial concrete space that reflects structural rawness and transparency. The image is high-contrast and sharp, fitting the neo-brutalist design movement." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpdqXmn6bbnIoNuU0sZn1_vuSfm9A2BYAfXvZ36FafvhYpvY8kpzsrbOnVSaZJR4imKvNQ4J-Kmidun4YtDJg-_d-orfPIr6M7UcqEpBpRSNvZbbTNrcv7SUutmEvW5-NVIEWXXVoMHVj04wSz5BFDh6HduB3CYeEF5x9JtH525tvhIhAGxQ_pXxynLPwzouzAqkoJqCbwxaYdfUflOeYt2VqHwDowJFL1vbWqPjSRvq7R9DKEsNBSH_uzoJ0ykg2uyGtX2EytJUDL" alt="James" />
                                <span className="font-label-mono text-label-mono block text-center">— James</span>
                            </div>
                        </div>
                        <div className="lg:col-span-3 space-y-4">
                            <div className="bg-vibrant-orange text-pure-white p-6 border-4 border-brutalist-black brutalist-shadow sticker-rotate-neg">
                                <p className="font-label-mono text-label-mono">"Too useful to ignore. Best tool in our stack."</p>
                            </div>
                            <div className="bg-pure-white text-brutalist-black p-6 border-4 border-brutalist-black brutalist-shadow-orange sticker-rotate-pos">
                                <p className="font-label-mono text-label-mono">"The UI is a breath of fresh air. Bold and unapologetic."</p>
                            </div>
                            <div className="bg-brutalist-black text-pure-white p-6 border-4 border-brutalist-black brutalist-shadow sticker-rotate-neg">
                                <p className="font-label-mono text-label-mono">"Finally, a tool that respects our time and intelligence."</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section> */}

            {/* Final CTA */}
            <section className="py-block-gap px-grid-margin bg-surface-container-highest border-t-4 border-brutalist-black relative overflow-hidden min-h-[60vh] flex flex-col justify-center">
                <div className="flex flex-col md:flex-row gap-8 justify-center items-center w-full">
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none">
                        <span className="font-display-lg text-[20vw] font-bold uppercase whitespace-nowrap">TRACKHIRE</span>
                    </div>
                    <div className="max-w-5xl mx-auto relative z-10 w-full flex flex-col items-center justify-center text-center">
                        <span className="font-label-mono text-label-mono uppercase mb-4 block text-center">// THE LAST STEP</span>
                        <h2 className="font-headline-xl text-headline-xl md:text-[120px] uppercase leading-none mb-12 tracking-tighter text-center w-full">
                            MISS NOTHING.<br />APPLY SMARTER.
                        </h2>
                        <div className="flex flex-col md:flex-row gap-8 justify-center items-center w-full">
                            <div className="relative w-full md:w-auto flex justify-center">
                                <Link to="/login" className="w-full md:w-auto font-display-lg text-headline-md bg-vibrant-orange text-pure-white border-4 border-brutalist-black px-16 py-8 brutalist-shadow-lg active-btn block text-center">GET STARTED NOW</Link>
                                {/* <svg className="absolute -left-12 top-0 w-16 h-16 hidden md:block" viewBox="0 0 100 100">
                                    <path d="M90,50 Q50,90 10,50" fill="none" stroke="#FF6B00" strokeWidth="4"></path>
                                    <path d="M20,60 L10,50 L20,40" fill="none" stroke="#FF6B00" strokeWidth="4"></path>
                                    </svg> */}
                            </div>
                            <Link to="/meet-the-builder" className="w-full md:w-auto font-headline-md text-headline-md bg-pure-white text-brutalist-black border-4 border-brutalist-black px-16 py-8 brutalist-shadow active-btn block text-center">LEARN MORE</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="w-full bg-brutalist-black text-pure-white border-t-4 border-brutalist-black min-h-[50vh] flex flex-col justify-center items-center">
                <div className="max-w-7xl mx-auto py-block-gap px-grid-margin grid grid-cols-1 md:grid-cols-12 gap-12 w-full place-items-center text-center">
                    <div className="md:col-span-5 flex flex-col items-center">
                        <div className="font-headline-xl text-headline-xl text-pure-white mb-6 text-center">TrackHire</div>
                        <p className="font-body-lg text-body-lg opacity-80 max-w-md mb-8 text-center">
                            The job market is an 8h/day game. Play it strategically. TrackHire is built for those who value speed, honesty, and raw performance.
                        </p>
                    </div>
                    <div className="md:col-span-3 flex flex-col items-center">
                        <h4 className="font-label-mono text-label-mono uppercase mb-8 border-b-2 border-pure-white inline-block">START</h4>
                        <nav className="flex flex-col gap-4 items-center">
                            <Link className="font-label-mono text-label-mono opacity-80 hover:opacity-100 hover:text-vibrant-orange transition-opacity" to="/meet-the-builder">About</Link>
                            <Link className="font-label-mono text-label-mono opacity-80 hover:opacity-100 hover:text-vibrant-orange transition-opacity" to="/meet-the-builder">Learn Next</Link>
                            <Link className="font-label-mono text-label-mono opacity-80 hover:opacity-100 hover:text-vibrant-orange transition-opacity" to="/login">Sign In</Link>
                            <a className="font-label-mono text-label-mono opacity-80 hover:opacity-100 hover:text-vibrant-orange transition-opacity" href="mailto:support@trackhire.com">Contact Us</a>
                        </nav>
                    </div>
                    <div className="md:col-span-4 border-4 border-vibrant-orange p-8 sticker-rotate-pos flex flex-col items-center">
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