import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaBolt, FaBullseye, FaClipboardList, FaChartBar, FaGithub, FaStar } from 'react-icons/fa';
import Cookies from 'js-cookie';

const GITHUB_REPO = 'https://github.com/taralshah09/TrackHire';
const AUTHOR_URL = '/meet-the-builder';
const SCENE_URL = 'https://prod.spline.design/xNV9ygjcVERzejEQ/scene.splinecode';
const Spline = lazy(() => import('@splinetool/react-spline'));

/* ─── TOKENS ────────────────────────────────────────────────────────────── */
const T = {
    bg: '#060608',
    s1: '#0d0d10',
    s2: '#141418',
    s3: '#1c1c22',
    border: 'rgba(255,255,255,0.07)',
    border2: 'rgba(249,115,22,0.20)',
    orange: '#f97316',
    orangeD: '#ea580c',
    orangeDim: 'rgba(249,115,22,0.08)',
    orangeGlow: 'rgba(249,115,22,0.32)',
    white: '#ffffff',
    w65: 'rgba(255,255,255,0.65)',
    w40: 'rgba(255,255,255,0.38)',
    w15: 'rgba(255,255,255,0.08)',
};

/* ─── GLOBAL STYLES ─────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&family=Space+Mono&display=swap');

  :root {
    --color-bg:            #060608;
    --color-surface-1:     #0d0d10;
    --color-surface-2:     #141418;
    --color-surface-3:     #1c1c22;
    --color-border:        rgba(255,255,255,0.07);
    --color-orange:        #f97316;
    --color-orange-hover:  #ea580c;
    --color-orange-dim:    rgba(249,115,22,0.08);
    --color-orange-border: rgba(249,115,22,0.20);
    --color-white:         #ffffff;
    --color-white-65:      rgba(255,255,255,0.65);
    --color-white-40:      rgba(255,255,255,0.38);
    --color-white-20:      rgba(255,255,255,0.12);
    --font-display:        'Syne', sans-serif;
    --font-body:           'DM Sans', sans-serif;
    --font-mono:           'Space Mono', monospace;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { margin: 0; padding: 0; background: #060608; }
  a    { text-decoration: none; }
  ul   { list-style: none; padding: 0; margin: 0; }

  /* Hide Spline watermark */
  canvas ~ div[style*="position: fixed"],
  canvas ~ a[style*="position: fixed"],
  [class*="logo"][style*="position: fixed"],
  div[style*="z-index: 2147483647"] { display: none !important; }

  /* ── Marquee ── */
  .lp-marquee-inner {
    display: flex;
    width: max-content;
    animation: lpMarquee 28s linear infinite;
  }
  @keyframes lpMarquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }

  /* ── Glitch ── */
  .lp-glitch-wrap { position: relative; display: inline-block; cursor: default; }
  .lp-glitch-clone {
    position: absolute; top: 0; left: 0;
    width: 100%; pointer-events: none; opacity: 0;
  }
  .lp-glitch-wrap:hover .lp-gc1 {
    animation: lpG1 0.42s steps(2) both;
    color: #f97316; opacity: 0.8;
    clip-path: polygon(0 18%, 100% 18%, 100% 38%, 0 38%);
  }
  .lp-glitch-wrap:hover .lp-gc2 {
    animation: lpG2 0.42s steps(2) 0.06s both;
    color: #67e8f9; opacity: 0.7;
    clip-path: polygon(0 58%, 100% 58%, 100% 78%, 0 78%);
  }
  @keyframes lpG1 {
    0%   { transform: translate(-4px,0); opacity:.8 }
    25%  { transform: translate(4px,0) }
    50%  { transform: translate(-2px,1px) }
    75%  { transform: translate(2px,-1px) }
    100% { transform: translate(0,0); opacity:0 }
  }
  @keyframes lpG2 {
    0%   { transform: translate(4px,0); opacity:.7 }
    25%  { transform: translate(-4px,0) }
    50%  { transform: translate(2px,-1px) }
    75%  { transform: translate(-2px,1px) }
    100% { transform: translate(0,0); opacity:0 }
  }

  /* ── Heatmap pop ── */
  .lp-hm {
    width: 9px; height: 9px; border-radius: 2px;
    animation: lpHmPop 0.3s ease both;
  }
  @keyframes lpHmPop {
    from { opacity:0; transform: scale(0.4); }
    to   { opacity:1; transform: scale(1); }
  }

  /* ── Fade animations ── */
  @keyframes lpFadeDown {
    from { opacity:0; transform:translateY(-18px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes lpFadeUp {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes lpPulse {
    0%,100% { opacity:1; transform:scale(1); }
    50%     { opacity:.45; transform:scale(.65); }
  }
  @keyframes lpSpinePulse {
    from { opacity:.6; }
    to   { opacity:1; }
  }

  /* ── Nav links hidden on mobile ── */
  @media (max-width: 785px) {
    .lp-nav-links { display: none !important; }
  }
  @media (max-width: 600px) {
    .lp-hero-actions { flex-direction: column; align-items: center; }
    .lp-strip-divider { display: none !important; }
  }
`;

function GlobalStyles() {
    useEffect(() => {
        const id = 'trackhire-genz-styles';
        if (!document.getElementById(id)) {
            const el = document.createElement('style');
            el.id = id;
            el.textContent = GLOBAL_CSS;
            document.head.insertBefore(el, document.head.firstChild);
        }
    }, []);
    return null;
}

/* ─── CURSOR BLOB ────────────────────────────────────────────────────────── */
function CursorBlob() {
    const ref = useRef(null);
    useEffect(() => {
        const move = (e) => {
            if (ref.current) {
                ref.current.style.transform = `translate(${e.clientX - 200}px,${e.clientY - 200}px)`;
            }
        };
        window.addEventListener('mousemove', move);
        return () => window.removeEventListener('mousemove', move);
    }, []);
    return (
        <div ref={ref} aria-hidden="true" style={{
            position: 'fixed', top: 0, left: 0,
            width: '400px', height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.11) 0%, transparent 70%)',
            pointerEvents: 'none', zIndex: 0,
            transition: 'transform 0.12s ease-out',
            willChange: 'transform',
        }} />
    );
}

/* ─── ANIMATED COUNTER ───────────────────────────────────────────────────── */
function Counter({ to, suffix = '', duration = 1300 }) {
    const [val, setVal] = useState(0);
    const ref = useRef(null);
    const done = useRef(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !done.current) {
                done.current = true;
                const start = performance.now();
                const tick = (now) => {
                    const t = Math.min((now - start) / duration, 1);
                    const ease = 1 - Math.pow(1 - t, 3);
                    setVal(Math.round(ease * to));
                    if (t < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            }
        }, { threshold: 0.3 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [to, duration]);
    return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── MARQUEE STRIP ──────────────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
    'Job Aggregation', 'Smart Matching', 'Instant Alerts', 'Pipeline Tracking',
    'Real Analytics', '500+ Companies', 'JWT Auth', 'Email Notifications',
    'Cron Scraping', 'Daily Updates', 'React', 'Spring Boot', 'Node.js', 'PostgreSQL',
];

function MarqueeStrip() {
    const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
    return (
        <div style={{
            overflow: 'hidden', padding: '14px 0',
            background: T.s2,
            borderTop: `1px solid ${T.border}`,
            borderBottom: `1px solid ${T.border}`,
            WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)',
            maskImage: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)',
            position: 'relative', zIndex: 1,
        }}>
            <div className="lp-marquee-inner">
                {items.map((t, i) => (
                    <span key={i} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '10px',
                        fontFamily: 'var(--font-display)', fontWeight: 700,
                        fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: T.w40, padding: '0 22px', whiteSpace: 'nowrap',
                    }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: T.orange, opacity: 0.5, flexShrink: 0 }} />
                        {t}
                    </span>
                ))}
            </div>
        </div>
    );
}

/* ─── SECTION LABEL ──────────────────────────────────────────────────────── */
function SectionEye({ label }) {
    return (
        <p style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em',
            textTransform: 'uppercase', color: T.orange, marginBottom: '12px',
        }}>{label}</p>
    );
}

function SectionH2({ children, center = false }) {
    return (
        <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 'clamp(32px, 4.5vw, 52px)', letterSpacing: '-0.03em',
            lineHeight: 1.1, color: T.white,
            textAlign: center ? 'center' : 'left',
            margin: center ? '0 auto 56px' : '0 0 56px',
            maxWidth: center ? '640px' : 'unset',
        }}>{children}</h2>
    );
}

/* ─── NOISE OVERLAY + GRID BG ────────────────────────────────────────────── */
function Atmosphere() {
    return (
        <>
            <div aria-hidden="true" style={{
                position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.022,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: '200px 200px',
            }} />
        </>
    );
}

/* ─── SPLINE HERO (RETAINED FROM ORIGINAL) ───────────────────────────────── */
function SplineHero() {
    const [loaded, setLoaded] = useState(false);
    return (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
            {!loaded && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse 80% 60% at 60% 40%, rgba(249,115,22,0.12) 0%, #060608 70%)',
                    animation: 'lpSpinePulse 2s ease-in-out infinite alternate',
                }} />
            )}
            <Suspense fallback={null}>
                <Spline
                    scene={SCENE_URL}
                    onLoad={() => setLoaded(true)}
                    style={{
                        width: '100%', height: '100%',
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 0.8s ease',
                        pointerEvents: loaded ? 'auto' : 'none',
                    }}
                />
            </Suspense>
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(6,6,8,0.72) 0%, rgba(6,6,8,0.28) 50%, rgba(6,6,8,0.55) 100%)',
                zIndex: 1, pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '220px',
                background: `linear-gradient(to bottom, transparent, ${T.bg})`,
                zIndex: 2, pointerEvents: 'none',
            }} />
            {/* Watermark cover */}
            <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '160px', height: '72px',
                background: T.bg, zIndex: 20, pointerEvents: 'none',
            }} />
        </div>
    );
}

/* ─── NAVBAR ─────────────────────────────────────────────────────────────── */
function Navbar({ scrolled }) {
    const isLoggedIn = Boolean(Cookies.get('token') || Cookies.get('username') || Cookies.get('accessToken'));

    const linkStyle = {
        fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px',
        color: T.w65, transition: 'color 0.2s',
    };

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 40px', height: '64px',
            background: scrolled ? 'rgba(6,6,8,0.88)' : 'transparent',
            backdropFilter: scrolled ? 'blur(14px)' : 'none',
            borderBottom: scrolled ? `1px solid ${T.border}` : '1px solid transparent',
            transition: 'all 0.3s ease',
        }}>
            {/* Logo */}
            <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px',
                color: T.white, letterSpacing: '-0.02em',
                display: 'flex', alignItems: 'center',
            }}>
                Track<span style={{ color: T.orange }}>H</span>ire
            </div>

            {/* Links */}
            <div className="lp-nav-links" style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                {[['#features', 'Features'], ['#how-it-works', 'How It Works'], ['#testimonials', 'Testimonials']].map(([href, label]) => (
                    <a key={label} href={href} style={linkStyle}
                        onMouseEnter={e => e.currentTarget.style.color = T.white}
                        onMouseLeave={e => e.currentTarget.style.color = T.w65}>{label}</a>
                ))}
                <Link to="/meet-the-builder" style={linkStyle}
                    onMouseEnter={e => e.currentTarget.style.color = T.white}
                    onMouseLeave={e => e.currentTarget.style.color = T.w65}>Builder</Link>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
                    color: T.w65, background: T.s2, border: `1px solid ${T.border}`,
                    borderRadius: '8px', padding: '7px 14px', transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.orange; e.currentTarget.style.background = T.orangeDim; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.w65; e.currentTarget.style.background = T.s2; }}
                >
                    <FaStar style={{ fontSize: '11px' }} /> Star on GitHub
                </a>

                {isLoggedIn ? (
                    <Link to="/dashboard" style={primaryBtn}
                        onMouseEnter={e => { e.currentTarget.style.background = T.orangeD; e.currentTarget.style.transform = 'scale(1.02)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = 'scale(1)'; }}>
                        Dashboard
                    </Link>
                ) : (
                    <>
                        <Link to="/login" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: T.w65, transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = T.white}
                            onMouseLeave={e => e.currentTarget.style.color = T.w65}>
                            Log in
                        </Link>
                        <Link to="/register" style={primaryBtn}
                            onMouseEnter={e => { e.currentTarget.style.background = T.orangeD; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${T.orangeGlow}`; }}
                            onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                            Get Started →
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}

/* ─── SHARED BUTTON STYLES ───────────────────────────────────────────────── */
const primaryBtn = {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px',
    color: '#000', background: T.orange, padding: '11px 22px',
    borderRadius: '9px', border: 'none', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    transition: 'all 0.2s', letterSpacing: '0.01em',
};

const ghostBtn = {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px',
    color: T.white, background: 'transparent', padding: '11px 22px',
    borderRadius: '9px', border: `1px solid ${T.border}`, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    transition: 'all 0.2s',
};

/* ─── SECTION: HERO (RETAINED + GLITCH) ──────────────────────────────────── */
function HeroSection() {
    const STATS = [
        { stat: '500', suffix: '+', label: 'Companies Tracked' },
        { stat: 5, suffix: ' min', label: 'Alert Delivery' },
        { stat: 9, suffix: ' min', label: 'Avg Daily Time' },
        { stat: 67, suffix: '%', label: 'Miss By Being Late' },
    ];

    return (
        <section style={{
            position: 'relative', height: '100svh', minHeight: '640px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', background: '#000',
        }}>
            <SplineHero />

            <div style={{
                position: 'relative', zIndex: 10, textAlign: 'center',
                padding: '0 24px', maxWidth: '880px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '26px',
                marginTop: '64px',
            }}>
                {/* Pill */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '11px',
                    letterSpacing: '0.12em', textTransform: 'uppercase', color: T.orange,
                    background: T.orangeDim, border: `1px solid ${T.border2}`,
                    padding: '7px 18px', borderRadius: '999px',
                    animation: 'lpFadeDown 0.6s ease both',
                }}>
                    <span style={{
                        width: '7px', height: '7px', borderRadius: '50%', background: T.orange,
                        animation: 'lpPulse 2s ease-in-out infinite',
                    }} />
                    500+ companies monitored · live
                </div>

                {/* Glitch Headline */}
                <div style={{ animation: 'lpFadeDown 0.6s 0.1s ease both' }}>
                    <div className="lp-glitch-wrap" style={{
                        fontFamily: 'var(--font-display)', fontWeight: 800,
                        fontSize: 'clamp(42px, 7.5vw, 78px)', lineHeight: 1.05,
                        letterSpacing: '-0.035em', color: T.white,
                    }}>
                        <span style={{ position: 'relative', zIndex: 2 }}>
                            Stop Hunting.{' '}
                            <span style={{ color: T.orange }}>Start Landing.</span>
                        </span>
                        <span className="lp-glitch-clone lp-gc1" aria-hidden="true">
                            Stop Hunting. <span style={{ color: T.orange }}>Start Landing.</span>
                        </span>
                        <span className="lp-glitch-clone lp-gc2" aria-hidden="true">
                            Stop Hunting. <span style={{ color: '#67e8f9' }}>Start Landing.</span>
                        </span>
                    </div>
                </div>

                {/* Sub-copy */}
                <p style={{
                    fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: '18px',
                    lineHeight: 1.7, color: T.w65, maxWidth: '540px', margin: 0,
                    animation: 'lpFadeDown 0.6s 0.2s ease both',
                }}>
                    We watch every career page you care about, 24/7 — so you apply first,
                    every&nbsp;single&nbsp;time.
                </p>

                {/* CTAs */}
                <div className="lp-hero-actions" style={{
                    display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center',
                    animation: 'lpFadeDown 0.6s 0.3s ease both',
                }}>
                    <Link to="/jobs" style={{ ...primaryBtn, padding: '15px 30px', fontSize: '15px' }}
                        onMouseEnter={e => { e.currentTarget.style.background = T.orangeD; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${T.orangeGlow}`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                        Browse Jobs
                    </Link>
                    <a href="#how-it-works" style={{ ...ghostBtn, padding: '15px 30px', fontSize: '15px' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = T.w15; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'transparent'; }}>
                        See How It Works ↓
                    </a>
                </div>

                {/* Stats strip */}
                <div style={{
                    display: 'flex', gap: '0', flexWrap: 'wrap', justifyContent: 'center',
                    padding: '20px 32px',
                    background: 'rgba(6,6,8,0.58)',
                    backdropFilter: 'blur(18px)',
                    border: `1px solid ${T.border}`,
                    borderRadius: '16px',
                    animation: 'lpFadeUp 0.6s 0.4s ease both',
                }}>
                    {STATS.map(({ stat, suffix, label }, i) => (
                        <React.Fragment key={label}>
                            <div style={{ textAlign: 'center', padding: '0 28px' }}>
                                <div style={{
                                    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '24px',
                                    color: T.orange, letterSpacing: '-0.02em', lineHeight: 1,
                                }}>
                                    <Counter to={parseInt(stat)} suffix={suffix} />
                                </div>
                                <div style={{
                                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '10px',
                                    letterSpacing: '0.12em', color: T.w40, textTransform: 'uppercase', marginTop: '6px',
                                }}>{label}</div>
                            </div>
                            {i < STATS.length - 1 && (
                                <div className="lp-strip-divider" style={{ width: '1px', background: T.border, flexShrink: 0, margin: '4px 0' }} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── SECTION: PAIN (BENTO CARDS) ────────────────────────────────────────── */
function PainSection() {
    const [hovered, setHovered] = useState(null);

    const lines = [
        { number: 45, suffix: 'min', color: '#f87171', desc: 'wasted every day checking career pages manually', span: 1 },
        { number: 23, suffix: 'hrs', color: '#fb923c', desc: 'lost every month to the same exhausting routine', span: 1 },
        { number: 67, suffix: '%', color: '#f97316', desc: 'of job seekers miss roles by applying too late', span: 2 },
    ];

    return (
        <section style={{ background: T.bg, padding: '96px 24px', position: 'relative', zIndex: 1 }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                    <SectionEye label="00 — The Real Cost" />
                    <SectionH2 center>
                        Every morning.<br /><span style={{ color: T.orange }}>The same routine.</span>
                    </SectionH2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {lines.map(({ number, suffix, color, desc, span }, i) => (
                        <div key={i}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                                gridColumn: `span ${span}`,
                                background: T.s2,
                                border: hovered === i ? `1px solid ${T.border2}` : `1px solid ${T.border}`,
                                borderRadius: '18px', padding: '40px',
                                transition: 'all 0.25s',
                                transform: hovered === i ? 'translateY(-4px)' : 'translateY(0)',
                                boxShadow: hovered === i ? `0 16px 48px rgba(249,115,22,0.1)` : 'none',
                                position: 'relative', overflow: 'hidden',
                            }}>
                            <div style={{
                                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'clamp(48px,6vw,72px)',
                                color, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '16px',
                            }}>
                                <Counter to={number} suffix={suffix} />
                            </div>
                            <p style={{
                                fontFamily: 'var(--font-body)', fontSize: '15px',
                                color: T.w65, lineHeight: 1.7, margin: 0,
                            }}>{desc}</p>
                            {/* Corner glow */}
                            <div style={{
                                position: 'absolute', bottom: '-60px', right: '-40px',
                                width: '160px', height: '160px', borderRadius: '50%',
                                background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
                                opacity: hovered === i ? 0.7 : 0,
                                transition: 'opacity 0.4s', pointerEvents: 'none',
                            }} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── SECTION: FEATURES (BENTO GRID) ─────────────────────────────────────── */
const FEATURES = [
    { icon: <FaBolt />, title: 'Instant Alerts', desc: 'Get notified in < 5 min when a match goes live. Apply before the crowd.', span: 1 },
    { icon: <FaBullseye />, title: 'Smart Matching', desc: 'Filter by role, skill, location. See only what actually matters to you.', span: 1 },
    { icon: <FaClipboardList />, title: 'Track Pipeline', desc: 'One kanban board for every application — saved to offer, no spreadsheets.', span: 1 },
    { icon: <FaChartBar />, title: 'Real Analytics', desc: 'Know your response rate, best companies, and exactly where to focus next.', span: 1 },
];

function FeaturesSection() {
    const [hovered, setHovered] = useState(null);

    return (
        <section id="features" style={{ background: T.s1, padding: '96px 24px', position: 'relative', zIndex: 1 }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <SectionEye label="01 — Features" />
                <SectionH2>Everything you need<br /><span style={{ color: T.orange }}>to land faster.</span></SectionH2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {FEATURES.map(({ icon, title, desc, span }, i) => (
                        <div key={i}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                                gridColumn: `span ${span}`,
                                background: T.s2,
                                border: hovered === i ? `1px solid ${T.border2}` : `1px solid ${T.border}`,
                                borderRadius: '18px', padding: '36px 32px',
                                transition: 'all 0.25s',
                                transform: hovered === i ? 'translateY(-4px) rotate(-0.3deg)' : 'translateY(0) rotate(0)',
                                boxShadow: hovered === i ? `0 20px 52px rgba(249,115,22,0.09)` : 'none',
                                position: 'relative', overflow: 'hidden', cursor: 'default',
                            }}>
                            {/* Icon */}
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: hovered === i ? T.orange : T.orangeDim,
                                border: `1px solid ${T.border2}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '20px', color: hovered === i ? '#000' : T.orange,
                                marginBottom: '22px', transition: 'all 0.25s',
                            }}>{icon}</div>

                            <h3 style={{
                                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '19px',
                                color: T.white, marginBottom: '10px', letterSpacing: '-0.01em',
                            }}>{title}</h3>
                            <p style={{
                                fontFamily: 'var(--font-body)', fontSize: '14px',
                                color: T.w65, lineHeight: 1.65,
                            }}>{desc}</p>

                            {/* Glow */}
                            <div style={{
                                position: 'absolute', bottom: '-50px', right: '-30px',
                                width: '140px', height: '140px', borderRadius: '50%',
                                background: `radial-gradient(circle, ${T.orangeGlow} 0%, transparent 70%)`,
                                opacity: hovered === i ? 0.5 : 0, transition: 'opacity 0.4s', pointerEvents: 'none',
                            }} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── SECTION: HOW IT WORKS (TIMELINE) ───────────────────────────────────── */
const STEPS = [
    { n: '01', title: 'Set Up in 3 Minutes', desc: "Create your account and tell us what roles, skills, and locations matter to you." },
    { n: '02', title: 'We Watch 24/7', desc: "TrackHire monitors 500+ company career pages around the clock — so you don't have to." },
    { n: '03', title: 'Apply First', desc: "Get an instant alert, review the match score, and apply before the rush even starts." },
];

function HowItWorksSection() {
    const [hovered, setHovered] = useState(null);

    return (
        <section id="how-it-works" style={{ background: T.bg, padding: '96px 24px', position: 'relative', zIndex: 1 }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <SectionEye label="02 — Process" />
                <SectionH2>Three steps to<br /><span style={{ color: T.orange }}>your next role.</span></SectionH2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {STEPS.map(({ n, title, desc }, i) => (
                        <div key={n} style={{ display: 'flex', gap: 0 }}>
                            {/* Timeline spine */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingRight: '28px', paddingBottom: '24px', flexShrink: 0 }}>
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: '50%',
                                    background: T.orangeDim, border: `1px solid ${T.border2}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: 'var(--font-mono)', fontSize: '12px', color: T.orange,
                                    flexShrink: 0, zIndex: 1,
                                }}>{n}</div>
                                {i < STEPS.length - 1 && (
                                    <div style={{
                                        width: '1px', flex: 1, marginTop: '8px',
                                        background: `linear-gradient(to bottom, ${T.border2}, transparent)`,
                                    }} />
                                )}
                            </div>

                            {/* Card */}
                            <div onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
                                style={{
                                    flex: 1, marginBottom: '20px',
                                    background: T.s2, border: hovered === i ? `1px solid ${T.border2}` : `1px solid ${T.border}`,
                                    borderRadius: '16px', padding: '28px 32px',
                                    transition: 'all 0.25s',
                                    transform: hovered === i ? 'translateX(6px)' : 'translateX(0)',
                                    boxShadow: hovered === i ? `0 12px 36px rgba(249,115,22,0.08)` : 'none',
                                }}>
                                <h3 style={{
                                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '19px',
                                    color: T.white, marginBottom: '10px', letterSpacing: '-0.01em',
                                }}>{title}</h3>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: T.w65, lineHeight: 1.7 }}>
                                    {desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── SECTION: TESTIMONIALS ──────────────────────────────────────────────── */
const TESTIMONIALS = [
    { quote: "I applied to my current role 11 minutes after it went live. TrackHire's alert was why I even knew it existed.", name: 'Priya S.', role: 'Product Designer @ Stripe', wide: false },
    { quote: "I was spending 45 minutes every morning clicking through career pages. Now I spend 9. That's not an exaggeration.", name: 'Marcus T.', role: 'SWE @ Notion', wide: false },
    { quote: "The pipeline view alone is worth it. I finally stopped tracking applications in a spreadsheet.", name: 'Aisha K.', role: 'Data Analyst @ Figma', wide: false },
];

function TestimonialsSection() {
    const [hovered, setHovered] = useState(null);

    return (
        <section id="testimonials" style={{ background: T.s1, padding: '96px 24px', position: 'relative', zIndex: 1 }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                    <SectionEye label="03 — Social Proof" />
                    <SectionH2 center>
                        Real results.<br /><span style={{ color: T.orange }}>No fluff.</span>
                    </SectionH2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {TESTIMONIALS.map(({ quote, name, role }, i) => (
                        <div key={i}
                            onMouseEnter={() => setHovered(i)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                                background: T.s2,
                                border: hovered === i ? `1px solid ${T.border2}` : `1px solid ${T.border}`,
                                borderRadius: '18px', padding: '32px',
                                transition: 'all 0.25s',
                                transform: hovered === i ? 'translateY(-4px) rotate(0.3deg)' : 'translateY(0)',
                                boxShadow: hovered === i ? `0 16px 48px rgba(249,115,22,0.10)` : 'none',
                                position: 'relative', overflow: 'hidden',
                            }}>
                            {/* Quote mark */}
                            <div style={{
                                fontFamily: 'var(--font-display)', fontSize: '64px', lineHeight: 1,
                                color: T.orangeDim, marginBottom: '-16px', marginTop: '-8px',
                            }}>"</div>
                            <p style={{
                                fontFamily: 'var(--font-body)', fontSize: '14px',
                                color: T.w65, lineHeight: 1.7, margin: '0 0 24px',
                            }}>{quote}</p>
                            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '16px' }}>
                                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: T.white, margin: '0 0 2px' }}>{name}</p>
                                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: T.orange, margin: 0 }}>{role}</p>
                            </div>
                            <div style={{
                                position: 'absolute', bottom: '-40px', right: '-30px',
                                width: '120px', height: '120px', borderRadius: '50%',
                                background: `radial-gradient(circle, ${T.orangeGlow} 0%, transparent 70%)`,
                                opacity: hovered === i ? 0.4 : 0, transition: 'opacity 0.4s', pointerEvents: 'none',
                            }} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── SECTION: FINAL CTA ─────────────────────────────────────────────────── */
function CTASection() {
    return (
        <section style={{ background: T.bg, padding: '96px 24px', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
            {/* Big bg text */}
            <div aria-hidden="true" style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)',
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: 'clamp(100px, 18vw, 220px)',
                color: 'rgba(249,115,22,0.04)',
                letterSpacing: '-0.06em', whiteSpace: 'nowrap',
                pointerEvents: 'none', userSelect: 'none', zIndex: 0,
            }}>APPLY</div>

            <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                <div style={{
                    background: `linear-gradient(135deg, rgba(249,115,22,0.14) 0%, rgba(249,115,22,0.04) 100%)`,
                    border: `1px solid ${T.border2}`,
                    borderRadius: '24px', padding: '80px 40px', textAlign: 'center',
                    position: 'relative', overflow: 'hidden',
                }}>
                    {/* Radial glow top */}
                    <div style={{
                        position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
                        width: '500px', height: '500px', borderRadius: '50%',
                        background: `radial-gradient(circle, rgba(249,115,22,0.16) 0%, transparent 70%)`,
                        pointerEvents: 'none',
                    }} />

                    <p style={{
                        fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.16em',
                        textTransform: 'uppercase', color: T.orange, marginBottom: '20px',
                    }}>Ready to ship?</p>

                    <h2 style={{
                        fontFamily: 'var(--font-display)', fontWeight: 800,
                        fontSize: 'clamp(32px, 5vw, 60px)', letterSpacing: '-0.04em', lineHeight: 1.08,
                        color: T.white, maxWidth: '620px', margin: '0 auto 20px',
                    }}>
                        Miss nothing.<br /><span style={{ color: T.orange }}>Apply smarter.</span>
                    </h2>

                    <p style={{
                        fontFamily: 'var(--font-body)', fontSize: '17px', color: T.w65,
                        maxWidth: '420px', margin: '0 auto 40px', lineHeight: 1.7,
                    }}>
                        Set up in 3 minutes. Free forever. No credit card required.
                    </p>

                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Link to="/register" style={{ ...primaryBtn, padding: '16px 34px', fontSize: '16px' }}
                            onMouseEnter={e => { e.currentTarget.style.background = T.orangeD; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${T.orangeGlow}`; }}
                            onMouseLeave={e => { e.currentTarget.style.background = T.orange; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                            Create Free Account
                        </Link>
                        <Link to="/jobs" style={{ ...ghostBtn, padding: '16px 34px', fontSize: '16px' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'; e.currentTarget.style.background = T.w15; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'transparent'; }}>
                            Browse Jobs
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─── SECTION: FOOTER ────────────────────────────────────────────────────── */
function Footer() {
    return (
        <footer style={{
            background: T.s1, borderTop: `1px solid ${T.border}`, padding: '64px 24px 40px',
            position: 'relative', zIndex: 1,
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '60px', flexWrap: 'wrap', marginBottom: '48px' }}>
                    <div style={{ maxWidth: '400px' }}>
                        <div style={{
                            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px',
                            color: T.white, marginBottom: '12px',
                        }}>Track<span style={{ color: T.orange }}>H</span>ire</div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: T.w40, lineHeight: 1.65, margin: '0 0 20px' }}>
                            Track every opportunity.<br />Miss nothing. Apply smarter.
                        </p>
                        <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
                            color: T.w65, background: T.s3, border: `1px solid ${T.border}`,
                            borderRadius: '8px', padding: '9px 16px', transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.orange; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.w65; }}>
                            <FaGithub style={{ fontSize: '15px' }} /> View on GitHub
                        </a>
                    </div>
                    <div style={{
                        maxWidth: '480px', fontFamily: 'var(--font-body)', fontSize: '14px',
                        lineHeight: 1.7, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic',
                    }}>
                        "Change will not come if we wait for some other person or some other time.
                        We are the ones we've been waiting for. We are the change that we seek."
                        <div style={{ marginTop: '12px', fontStyle: 'normal', fontWeight: 600, color: T.w65 }}>— Barack Obama</div>
                    </div>
                </div>

                <div style={{
                    paddingTop: '24px', borderTop: `1px solid ${T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: '12px',
                }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'rgba(255,255,255,0.18)', margin: 0 }}>
                        © 2026 TrackHire. All rights reserved.
                    </p>
                    <Link to={AUTHOR_URL} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '12px',
                        color: T.w65, background: T.s3, border: `1px solid ${T.border}`,
                        borderRadius: '7px', padding: '7px 14px', transition: 'all 0.2s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.orange; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.w65; }}>
                        Meet the Builder →
                    </Link>
                </div>
            </div>
        </footer>
    );
}

/* ─── ROOT ───────────────────────────────────────────────────────────────── */
export default function NewLandingPage() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
            <GlobalStyles />
            <CursorBlob />
            <Atmosphere />

            <Navbar scrolled={scrolled} />
            <HeroSection />
            <MarqueeStrip />
            <PainSection />
            <MarqueeStrip />
            <FeaturesSection />
            <HowItWorksSection />
            <TestimonialsSection />
            <CTASection />
            <Footer />
        </div>
    );
}