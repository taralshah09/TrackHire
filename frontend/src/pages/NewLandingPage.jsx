import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBolt, FaBullseye, FaClipboardList, FaChartBar } from 'react-icons/fa';
import Cookies from 'js-cookie';

/* ─────────────────────────────────────────
   Lazy-load Spline to avoid blocking render
───────────────────────────────────────────*/
const Spline = lazy(() => import('@splinetool/react-spline'));

const SCENE_URL = 'https://prod.spline.design/xNV9ygjcVERzejEQ/scene.splinecode';

/* ─────────────────────────────────────────
   CSS tokens + global styles (injected once)
───────────────────────────────────────────*/
const GLOBAL_STYLES = `
  :root {
    --color-bg:             #080808;
    --color-surface-1:      #101010;
    --color-surface-2:      #181818;
    --color-surface-3:      #222222;
    --color-border:         #2e2e2e;
    --color-orange:         #f97316;
    --color-orange-hover:   #ea580c;
    --color-orange-dim:     rgba(249,115,22,0.10);
    --color-orange-border:  rgba(249,115,22,0.22);
    --color-white:          #ffffff;
    --color-white-65:       rgba(255,255,255,0.65);
    --color-white-40:       rgba(255,255,255,0.40);
    --color-white-20:       rgba(255,255,255,0.20);
    --font-display:         'DM Sans', sans-serif;
    --font-body:            'DM Sans', sans-serif;
    --font-mono:            'DM Sans', sans-serif;
  }

  /* Hide Spline watermark */
  canvas ~ div[style*="position: fixed"],
  canvas ~ a[style*="position: fixed"],
  [class*="logo"][style*="position: fixed"],
  div[style*="z-index: 2147483647"] { display: none !important; }

  @media (max-width: 785px) {
    .nav-links { display: none !important; }
    .nav-links-mobile { display: flex !important; }
  }
`;

function GlobalStyles() {
    useEffect(() => {
        const id = 'trackhire-landing-styles';
        if (!document.getElementById(id)) {
            const style = document.createElement('style');
            style.id = id;
            style.textContent = GLOBAL_STYLES;
            document.head.insertBefore(style, document.head.firstChild);
        }
        // Inject Google Fonts <link> tag
        const fontId = 'trackhire-google-fonts';
        if (!document.getElementById(fontId)) {
            const link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&family=Space+Mono:wght@400;700&display=swap';
            document.head.appendChild(link);
        }
    }, []);
    return null;
}

/* ─────────────────────────────────────────
   Spline Scene Loader
───────────────────────────────────────────*/
function SplineHero() {
    const [loaded, setLoaded] = useState(false);

    return (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
            {/* Fade-in skeleton while loading */}
            {!loaded && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse 80% 60% at 60% 40%, rgba(249,115,22,0.12) 0%, #080808 70%)',
                    animation: 'spinePulse 2s ease-in-out infinite alternate',
                }} />
            )}
            <Suspense fallback={null}>
                <Spline
                    scene={SCENE_URL}
                    onLoad={() => setLoaded(true)}
                    style={{
                        width: '100%',
                        height: '100%',
                        opacity: loaded ? 1 : 0,
                        transition: 'opacity 0.8s ease',
                        pointerEvents: loaded ? 'auto' : 'none',
                    }}
                />
            </Suspense>

            {/* Gradient overlay so text stays readable */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(8,8,8,0.72) 0%, rgba(8,8,8,0.30) 50%, rgba(8,8,8,0.55) 100%)',
                zIndex: 1,
                pointerEvents: 'none',
            }} />
            {/* Bottom fade into page */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '220px',
                background: 'linear-gradient(to bottom, transparent, #080808)',
                zIndex: 2, pointerEvents: 'none',
            }} />

            <style>{`
        @keyframes spinePulse {
          from { opacity: 0.6; }
          to   { opacity: 1; }
        }
      `}</style>

            {/* Watermark cover — matches page background */}
            <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '160px', height: '72px',
                background: 'var(--color-bg)',
                zIndex: 20,
                pointerEvents: 'none',
            }} />
        </div>
    );
}

/* ─────────────────────────────────────────
   Navbar
───────────────────────────────────────────*/
function Navbar({ scrolled }) {
    const isLoggedIn = Boolean(Cookies.get('token') || Cookies.get('username') || Cookies.get('accessToken'));

    const navStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px',
        height: '64px',
        background: scrolled ? 'rgba(8,8,8,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
        transition: 'all 0.3s ease',
    };

    return (
        <nav style={navStyle}>
            {/* Logo */}
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '22px', color: 'var(--color-white)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '1px' }}>
                Track<span style={{ color: 'var(--color-orange)' }}>H</span>ire
            </div>

            {/* Nav links — desktop */}
            <div className="nav-links" style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                <a href="#features" style={navLinkStyle}>Features</a>
                <a href="#how-it-works" style={navLinkStyle}>How It Works</a>
                <a href="#testimonials" style={navLinkStyle}>Testimonials</a>
            </div>

            {/* Auth actions — swap based on login state */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {isLoggedIn ? (
                    <Link
                        to="/dashboard"
                        style={primaryBtnStyle}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-orange-hover)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-orange)'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        Browse Jobs →
                    </Link>
                ) : (
                    <>
                        <Link to="/login" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: 'var(--color-white-65)', textDecoration: 'none', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.target.style.color = 'var(--color-white)'}
                            onMouseLeave={e => e.target.style.color = 'var(--color-white-65)'}>
                            Log in
                        </Link>
                        <Link to="/register" style={primaryBtnStyle}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-orange-hover)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-orange)'; }}
                        >
                            Get Started →
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}

const navLinkStyle = {
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '14px',
    color: 'var(--color-white-65)',
    textDecoration: 'none',
    transition: 'color 0.2s',
};

/* ─────────────────────────────────────────
   Shared button styles
───────────────────────────────────────────*/
const primaryBtnStyle = {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '14px',
    color: '#000',
    background: 'var(--color-orange)',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'background 0.2s, transform 0.15s',
    letterSpacing: '0.01em',
};

const ghostBtnStyle = {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '14px',
    color: 'var(--color-white)',
    background: 'transparent',
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'border-color 0.2s, background 0.2s',
};

/* ─────────────────────────────────────────
   SECTION: Hero
───────────────────────────────────────────*/
function HeroSection() {
    return (
        <section style={{
            position: 'relative',
            height: '100svh',
            minHeight: '640px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            // background: 'var(--color-bg)',
            background: "#000",
        }}>
            {/* 3D Background */}
            <SplineHero />

            {/* Foreground content */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                textAlign: 'center',
                padding: '0 24px',
                maxWidth: '860px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
                marginTop: '64px', /* offset navbar */
            }}>
                {/* Eyebrow */}
                <div style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    color: 'var(--color-orange)',
                    textTransform: 'uppercase',
                    background: 'var(--color-orange-dim)',
                    border: '1px solid var(--color-orange-border)',
                    padding: '6px 16px',
                    borderRadius: '999px',
                }}>
                    500+ companies monitored · live
                </div>

                {/* Headline */}
                <h1 style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 'clamp(40px, 7vw, 72px)',
                    lineHeight: 1.05,
                    letterSpacing: '-0.03em',
                    color: 'var(--color-white)',
                    margin: 0,
                }}>
                    Stop Hunting.{' '}
                    <span style={{ color: 'var(--color-orange)' }}>Start Landing.</span>
                </h1>

                {/* Sub-copy */}
                <p style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 400,
                    fontSize: '18px',
                    lineHeight: 1.7,
                    color: 'var(--color-white-65)',
                    maxWidth: '560px',
                    margin: 0,
                }}>
                    We watch every career page you care about, 24/7 — so you apply first,
                    every&nbsp;single&nbsp;time.
                </p>

                {/* CTA row */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
                    <Link to="/jobs"
                        style={{ ...primaryBtnStyle, padding: '14px 28px', fontSize: '15px' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-orange-hover)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-orange)'; e.currentTarget.style.transform = 'scale(1)'; }}>
                        Browse Jobs
                    </Link>
                    <a href="#how-it-works"
                        style={{ ...ghostBtnStyle, padding: '14px 28px', fontSize: '15px' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'transparent'; }}>
                        See How It Works ↓
                    </a>
                </div>

                {/* Stats bar */}
                <div style={{
                    display: 'flex',
                    gap: '24px',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    marginTop: '16px',
                    padding: '20px 32px',
                    background: 'rgba(8,8,8,0.55)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '14px',
                }}>
                    {[
                        { stat: '500+', label: 'Companies Tracked' },
                        { stat: '< 5 min', label: 'Alert Delivery' },
                        { stat: '9 min', label: 'Avg Daily Time' },
                        { stat: '67%', label: 'Miss By Being Late' },
                    ].map(({ stat, label }) => (
                        <div key={label} style={{ textAlign: 'center', padding: '0 16px' }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '22px', color: 'var(--color-orange)', letterSpacing: '-0.02em' }}>
                                {stat}
                            </div>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '10px', letterSpacing: '0.12em', color: 'var(--color-white-40)', textTransform: 'uppercase', marginTop: '4px' }}>
                                {label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────
   SECTION: Pain
───────────────────────────────────────────*/
function PainSection() {
    const lines = [
        { number: '45min', desc: 'wasted every day checking career pages manually' },
        { number: '23hrs', desc: 'lost every month to the same exhausting routine' },
        { number: '67%', desc: 'of job seekers miss roles by applying too late' },
    ];

    return (
        <section style={{ background: 'var(--color-bg)', padding: '96px 24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Eyebrow */}
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-orange)', marginBottom: '16px', textAlign: 'center' }}>
                    The Real Cost
                </p>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-0.025em', lineHeight: 1.15, color: 'var(--color-white)', textAlign: 'center', maxWidth: '640px', margin: '0 auto 64px' }}>
                    Every morning. The same exhausting routine.
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                    {lines.map(({ number, desc }) => (
                        <div key={number} style={{
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '14px',
                            padding: '32px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                        }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '40px', color: '#f87171', letterSpacing: '-0.02em', lineHeight: 1 }}>
                                {number}
                            </div>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-white-65)', lineHeight: 1.7, margin: 0 }}>
                                {desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────
   SECTION: Features
───────────────────────────────────────────*/
function FeaturesSection() {
    const features = [
        {
            icon: <FaBolt />,
            title: 'Instant Alerts',
            desc: 'Get notified in < 5 min when a match goes live. Apply before anyone else.',
        },
        {
            icon: <FaBullseye />,
            title: 'Smart Matching',
            desc: 'Filter by role, skill, and location. See only what matters to you.',
        },
        {
            icon: <FaClipboardList />,
            title: 'Track Pipeline',
            desc: 'One kanban board for every application — saved to offer.',
        },
        {
            icon: <FaChartBar />,
            title: 'Real Analytics',
            desc: 'Know your response rate, best companies, and where to focus.',
        },
    ];

    return (
        <section id="features" style={{ background: 'var(--color-surface-1)', padding: '96px 24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-orange)', marginBottom: '16px', textAlign: 'center' }}>
                    Features
                </p>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(26px, 3.5vw, 36px)', letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--color-white)', textAlign: 'center', maxWidth: '520px', margin: '0 auto 64px' }}>
                    Everything you need to land faster
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                    {features.map(({ icon, title, desc }) => (
                        <FeatureCard key={title} icon={icon} title={title} desc={desc} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function FeatureCard({ icon, title, desc }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'var(--color-surface-2)',
                border: hovered ? '1px solid var(--color-orange-border)' : '1px solid var(--color-border)',
                borderRadius: '14px',
                padding: '32px 24px',
                transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.2s',
                boxShadow: hovered ? '0 0 32px rgba(249,115,22,0.10)' : 'none',
                transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
                cursor: 'default',
            }}
        >
            <div style={{
                width: '48px', height: '48px',
                background: hovered ? 'var(--color-orange)' : 'var(--color-orange-dim)',
                border: '1px solid var(--color-orange-border)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px',
                marginBottom: '20px',
                transition: 'background 0.25s',
            }}>
                {icon}
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', color: 'var(--color-white)', margin: '0 0 10px', letterSpacing: '-0.01em' }}>
                {title}
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-white-65)', lineHeight: 1.65, margin: 0 }}>
                {desc}
            </p>
        </div>
    );
}

/* ─────────────────────────────────────────
   SECTION: How It Works
───────────────────────────────────────────*/
function HowItWorksSection() {
    const steps = [
        { n: '01', title: 'Set Up in 3 Minutes', desc: 'Create your account and tell us what roles, skills, and locations matter to you.' },
        { n: '02', title: 'We Watch 24/7', desc: 'TrackHire monitors 500+ company career pages around the clock — so you don\'t have to.' },
        { n: '03', title: 'Apply First', desc: 'Get an instant alert, review the match score, and apply before the rush starts.' },
    ];

    return (
        <section id="how-it-works" style={{ background: 'var(--color-bg)', padding: '96px 24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-orange)', marginBottom: '16px', textAlign: 'center' }}>
                    How It Works
                </p>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(26px, 3.5vw, 36px)', letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--color-white)', textAlign: 'center', maxWidth: '480px', margin: '0 auto 72px' }}>
                    Three steps to your next role
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', position: 'relative' }}>
                    {steps.map(({ n, title, desc }) => (
                        <div key={n} style={{
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '14px',
                            padding: '40px 28px',
                            position: 'relative',
                        }}>
                            {/* Step number */}
                            <div style={{
                                fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px',
                                color: 'var(--color-orange)', letterSpacing: '0.04em',
                                background: 'var(--color-orange-dim)', border: '1px solid var(--color-orange-border)',
                                borderRadius: '999px', padding: '4px 12px',
                                display: 'inline-block', marginBottom: '24px',
                            }}>
                                {n}
                            </div>
                            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', color: 'var(--color-white)', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
                                {title}
                            </h3>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-white-65)', lineHeight: 1.7, margin: 0 }}>
                                {desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────
   SECTION: Testimonials
───────────────────────────────────────────*/
function TestimonialsSection() {
    const testimonials = [
        { quote: "I applied to my current role 11 minutes after it went live. TrackHire's alert was why I even knew it existed.", name: 'Priya S.', role: 'Product Designer @ Stripe' },
        { quote: "I was spending 45 minutes every morning clicking through career pages. Now I spend 9. That's not an exaggeration.", name: 'Marcus T.', role: 'SWE @ Notion' },
        { quote: "The pipeline view alone is worth it. I finally stopped tracking applications in a spreadsheet.", name: 'Aisha K.', role: 'Data Analyst @ Figma' },
    ];

    return (
        <section id="testimonials" style={{ background: 'var(--color-surface-1)', padding: '96px 24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-orange)', marginBottom: '16px', textAlign: 'center' }}>
                    Testimonials
                </p>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(26px, 3.5vw, 36px)', letterSpacing: '-0.02em', color: 'var(--color-white)', textAlign: 'center', maxWidth: '480px', margin: '0 auto 64px' }}>
                    Real results. No fluff.
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {testimonials.map(({ quote, name, role }) => (
                        <div key={name} style={{
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '14px',
                            padding: '32px',
                        }}>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-white-65)', lineHeight: 1.7, margin: '0 0 24px' }}>
                                "{quote}"
                            </p>
                            <div>
                                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: 'var(--color-white)', margin: '0 0 2px' }}>{name}</p>
                                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-white-40)', margin: 0 }}>{role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────
   SECTION: Final CTA
───────────────────────────────────────────*/
function CTASection() {
    return (
        <section style={{ background: 'var(--color-bg)', padding: '96px 24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(249,115,22,0.18) 0%, rgba(249,115,22,0.06) 100%)',
                    border: '1px solid var(--color-orange-border)',
                    borderRadius: '20px',
                    padding: '72px 40px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Glow orbs */}
                    <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-0.025em', lineHeight: 1.15, color: 'var(--color-white)', maxWidth: '640px', margin: '0 auto 16px' }}>
                        Miss nothing.{' '}
                        <span style={{ color: 'var(--color-orange)' }}>Apply smarter.</span>
                    </h2>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-white-65)', maxWidth: '440px', margin: '0 auto 40px', lineHeight: 1.7 }}>
                        Set up in 3 minutes. Free forever. No credit card required.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Link to="/register"
                            style={{ ...primaryBtnStyle, padding: '16px 32px', fontSize: '16px' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-orange-hover)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-orange)'; e.currentTarget.style.transform = 'scale(1)'; }}>
                            Create Free Account
                        </Link>
                        <Link to="/jobs"
                            style={{ ...ghostBtnStyle, padding: '16px 32px', fontSize: '16px' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}>
                            Browse Jobs
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────
   SECTION: Footer
───────────────────────────────────────────*/
function Footer() {
    return (
        <footer style={{
            background: 'var(--color-surface-1)',
            borderTop: '1px solid var(--color-border)',
            padding: '64px 24px 40px'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* Top Section */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '60px',
                    flexWrap: 'wrap',
                    marginBottom: '48px'
                }}>

                    {/* Left — Brand */}
                    <div style={{ maxWidth: '420px' }}>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontWeight: 800,
                            fontSize: '20px',
                            color: 'var(--color-white)',
                            marginBottom: '12px'
                        }}>
                            Track<span style={{ color: 'var(--color-orange)' }}>H</span>ire
                        </div>

                        <p style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            color: 'var(--color-white-40)',
                            lineHeight: 1.65,
                            margin: '0 0 16px'
                        }}>
                            Track every opportunity.<br />Miss nothing. Apply smarter.
                        </p>

                        <p style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            color: 'var(--color-white-20)',
                            margin: 0
                        }}>
                            © 2026 TrackHire. All rights reserved.
                        </p>
                    </div>

                    {/* Right — Quote */}
                    <div style={{
                        maxWidth: '520px',
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                        lineHeight: 1.7,
                        color: 'var(--color-white-60)',
                        fontStyle: 'italic'
                    }}>
                        “Change will not come if we wait for some other person or some other time.
                        We are the ones we’ve been waiting for. We are the change that we seek.”
                        <div style={{
                            marginTop: '12px',
                            fontStyle: 'normal',
                            fontWeight: 600,
                            color: 'var(--color-white-80)'
                        }}>
                            — Barack Obama
                        </div>
                    </div>

                </div>

            </div>
        </footer>
    );
}

/* ─────────────────────────────────────────
   Responsive CSS overrides
───────────────────────────────────────────*/
const RESPONSIVE_CSS = `
  /* Mobile — stacked layout */
  @media (max-width: 639px) {
    .nav-links { display: none !important; }
  }

  /* Smooth scroll */
  html { scroll-behavior: smooth; }

  /* Remove default margins/padding from body for this page */
  body { margin: 0; padding: 0; background: #080808; }
`;

/* ─────────────────────────────────────────
   ROOT COMPONENT
───────────────────────────────────────────*/
export default function NewLandingPage() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div style={{ background: 'var(--color-bg)', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
            <GlobalStyles />
            <style>{RESPONSIVE_CSS}</style>

            <Navbar scrolled={scrolled} />
            <HeroSection />
            <PainSection />
            <FeaturesSection />
            <HowItWorksSection />
            <TestimonialsSection />
            <CTASection />
            <Footer />
        </div>
    );
}
