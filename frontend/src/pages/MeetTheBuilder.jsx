import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./MeetTheBuilder.css";

// ─── DATA ──────────────────────────────────────────────────────────────────
const PLATFORMS = [
    {
        id: "codeforces",
        name: "Codeforces",
        handle: "taralshah992005",
        color: "#f97316",
        metrics: [
            { label: "Rating", value: 1479, suffix: "" },
        ],
        rank: "Specialist",
        url: "https://codeforces.com/profile/taralshah992005",
    },
    {
        id: "leetcode",
        name: "LeetCode",
        handle: "taralshah99",
        color: "#fbbf24",
        metrics: [
            { label: "Ranking", value: 2099, suffix: "" },
            { label: "Top", value: 1, suffix: "%" },
        ],
        rank: "Knight",
        url: "https://leetcode.com/u/taralshah99",
    }
];

const TECH = [
    "React", "Next.js", "Node.js", "Spring Boot", "PostgreSQL",
    "Docker", "AWS S3", "Redis", "TypeScript", "Java", "Python",
    "WebSockets", "REST APIs", "GraphQL", "JWT", "Kubernetes", "CI/CD",
];

const PROJECTS = [
    {
        id: "trackhire",
        title: "TrackHire",
        tech: ["Spring Boot", "Node.js", "React"],
        live: "https://trackkhire.vercel.app/",
        repo: "https://github.com/taralshah09/TrackHire",
        desc: "A massive job aggregator collecting 10K+ listings daily via automated scrapers. Featuring JWT auth and smart alert systems.",
    },
    {
        id: "webos",
        title: "WebOS",
        tech: ["Express", "React", "MongoDB"],
        live: "https://webos-five-eosin.vercel.app/",
        repo: "https://github.com/taralshah09/webOS/",
        desc: "A collaborative browser-based OS with draggable windows and a real Linux terminal. Built for massive scale and zero lag.",
    },
];

const EXPERIENCE = [
    {
        company: "First Draft",
        role: "Software Intern",
        dates: "Jun 2025 – Aug 2025",
        desc: "Contributed to an LLM-powered journalism platform. Scaled APIs to 10K+ requests and reduced query times by 40%.",
    },
    {
        company: "MatchMyCV",
        role: "Software Intern",
        dates: "Aug 2024 – Dec 2024",
        desc: "Contributed to a resume refinement microservice using OpenAI and revamped the existing html legacy frontend to React. Maintained 99.9% uptime for 500+ active users.",
    },
];

// ─── ANIMATED COUNTER ──────────────────────────────────────────────────────
function Counter({ to, suffix = "", duration = 1200 }) {
    const [val, setVal] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);

    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !started.current) {
                started.current = true;
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

// ─── IMPROVED HEATMAP (7x52) ──────────────────────────────────────────────
function Heatmap({ seed = 0 }) {
    const cells = Array.from({ length: 52 * 7 }, (_, i) => {
        const r = Math.abs(Math.sin(seed * 31 + i * 7.3));
        const level = r < 0.5 ? 0 : r < 0.7 ? 1 : r < 0.85 ? 2 : r < 0.95 ? 3 : 4;
        return level;
    });

    return (
        <div className="heatmap-container" aria-hidden="true">
            {cells.map((l, i) => (
                <div key={i} className={`hm-cell hm-${l}`} />
            ))}
        </div>
    );
}

// ─── MARQUEE ───────────────────────────────────────────────────────────────
function Marquee() {
    const items = [...TECH, ...TECH];
    return (
        <div className="marquee-track" aria-hidden="true">
            <div className="marquee-inner">
                {items.map((t, i) => (
                    <span key={i} className="marquee-item">
                        <span className="marquee-dot" />
                        {t}
                    </span>
                ))}
            </div>
        </div>
    );
}

// ─── GLITCH TEXT ───────────────────────────────────────────────────────────
function GlitchName({ name }) {
    return (
        <div className="glitch-wrap" data-text={name} aria-label={name}>
            <span className="glitch-main">{name}</span>
            <span className="glitch-clone glitch-1" aria-hidden="true">{name}</span>
            <span className="glitch-clone glitch-2" aria-hidden="true">{name}</span>
        </div>
    );
}

// ─── CURSOR BLOB ───────────────────────────────────────────────────────────
function CursorBlob() {
    const ref = useRef(null);
    useEffect(() => {
        const move = (e) => {
            if (ref.current) {
                ref.current.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
            }
        };
        window.addEventListener("mousemove", move);
        return () => window.removeEventListener("mousemove", move);
    }, []);
    return <div className="cursor-blob" ref={ref} aria-hidden="true" />;
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function MeetTheBuilder() {
    const [stats, setStats] = useState({
        leetcode: { ranking: null, solved: 0, easy: 0, med: 0, hard: 0, loading: true },
        codeforces: { rating: null, rank: null, loading: true }
    });

    useEffect(() => {
        // Fetch LeetCode
        const fetchLC = async () => {
            try {
                const res = await fetch("https://leetcode.com/graphql", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query: `
                        query userProfile($username: String!) {
                          matchedUser(username: $username) {
                            username
                            profile { ranking }
                            submitStats {
                              acSubmissionNum { difficulty count }
                            }
                          }
                        }`,
                        variables: { username: "taralshah99" }
                    })
                });
                const data = await res.json();
                const user = data.data.matchedUser;
                const subs = user.submitStats.acSubmissionNum;
                setStats(prev => ({
                    ...prev,
                    leetcode: {
                        ranking: user.profile.ranking,
                        solved: subs.find(s => s.difficulty === "All").count,
                        easy: subs.find(s => s.difficulty === "Easy").count,
                        med: subs.find(s => s.difficulty === "Medium").count,
                        hard: subs.find(s => s.difficulty === "Hard").count,
                        loading: false
                    }
                }));
            } catch (err) {
                console.error("LC Fetch Error:", err);
                setStats(prev => ({ ...prev, leetcode: { ...prev.leetcode, loading: false } }));
            }
        };

        // Fetch Codeforces
        const fetchCF = async () => {
            try {
                const res = await fetch("https://codeforces.com/api/user.info?handles=taralshah992005");
                const data = await res.json();
                if (data.status === "OK") {
                    const user = data.result[0];
                    setStats(prev => ({
                        ...prev,
                        codeforces: {
                            rating: user.rating,
                            maxRating: user.maxRating,
                            rank: user.rank,
                            maxRank: user.maxRank,
                            loading: false
                        }
                    }));
                }
            } catch (err) {
                console.error("CF Fetch Error:", err);
                setStats(prev => ({ ...prev, codeforces: { ...prev.codeforces, loading: false } }));
            }
        };

        fetchLC();
        fetchCF();
    }, []);

    return (
        <div className="hm-root">
            <CursorBlob />
            <div className="noise-overlay" aria-hidden="true" />
            <div className="grid-bg" aria-hidden="true" />

            <Link to="/dashboard" className="back-link">
                <span>Back to Dashboard</span>
            </Link>

            {/* ── HERO ───────────────────────────────────────────────── */}
            <section className="hero-section" style={{ marginTop: "50px" }}>
                <div className="hero-pill">
                    <span className="pulse-dot" />
                    Available for <span style={{ color: "#fff" }}>Internships</span> & <span style={{ color: "#fff" }}>Freelancing</span>
                </div>

                <GlitchName name="Taral Shah" />


                <p className="hero-tagline">
                    <span className="tag-accent">Full-Stack</span> Engineer ·{" "}
                    <span className="tag-accent">Competitive</span> Programmer  .{" "}
                    <span className="tag-accent">Freelancer</span>{" "}
                </p>


                <div className="hero-actions">
                    <a className="btn-primary" href="mailto:hitmeup.taral@gmail.com">
                        <span>Let's Ship It</span>
                    </a>
                    <a className="btn-ghost" target="_blank" href="https://drive.google.com/file/d/1NzA01Db9Us1uiQR8HdXVK0-SdKnd8O4a/view?usp=sharing">Resume</a>
                </div>
            </section>

            <Marquee />

            {/* ── STATS SECTION ────────────────────────────── */}
            <section className="section cp-section" style={{ marginTop: "100px" }}>
                <div className="section-header">
                    <span className="section-label">01 — Performance</span>
                    <h2 className="section-h2">Competitive<br /><em>Stats</em></h2>
                </div>

                <div className="bento-grid">
                    {/* LEETCODE CARD */}
                    <article className="bento-card cp-card bento-wide" style={{ "--accent": "#fbbf24" }}>
                        <div className="cp-head">
                            <div>
                                <div className="cp-name">LeetCode</div>
                                <div className="cp-handle">@taralshah99</div>
                            </div>
                            <span className="cp-rank-badge">Knight</span>
                        </div>

                        <div className="cp-main-metrics">
                            <div className="cp-metric big">
                                <div className="cp-metric-val">
                                    {stats.leetcode.loading ? "..." : "2099"}
                                </div>
                                <div className="cp-metric-label">Rating</div>
                            </div>
                            <div className="cp-metric big">
                                <div className="cp-metric-val">
                                    {stats.leetcode.loading ? "..." : "1.52%"}
                                </div>
                                <div className="cp-metric-label">Ranking</div>
                            </div>
                        </div>

                        <div className="lc-difficulty-bar">
                            <div className="lc-diff easy">
                                <span>Easy</span>
                                <strong>213</strong>
                            </div>
                            <div className="lc-diff med">
                                <span>Med</span>
                                <strong>429</strong>
                            </div>
                            <div className="lc-diff hard">
                                <span>Hard</span>
                                <strong>128</strong>
                            </div>
                        </div>

                    </article>

                    {/* CODEFORCES CARD */}
                    <article className="bento-card cp-card" style={{ "--accent": "#f97316" }}>
                        <div className="cp-head">
                            <div>
                                <div className="cp-name">Codeforces</div>
                                <div className="cp-handle">@taralshah992005</div>
                            </div>
                        </div>

                        <div className="cf-rank-display">
                            <div className="cf-rank-label">{stats.codeforces.rank || "..."}</div>
                            <div className="cf-rating">
                                {stats.codeforces.loading ? "..." : <Counter to={stats.codeforces.rating} />}
                            </div>
                        </div>

                        <div className="cp-metrics min">
                            <div className="cp-metric">
                                <div className="cp-metric-val">
                                    {stats.codeforces.loading ? "..." : <Counter to={stats.codeforces.maxRating} />}
                                </div>
                                <div className="cp-metric-label">Max Rating</div>
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            {/* ── DUAL SECTION ────────────────────────────── */}
            <div className="dual-section" style={{ marginTop: "100px" }}>
                {/* ── PROJECTS ── */}
                <section className="projects-mini-column">
                    <div className="section-header">
                        <span className="section-label">02 — Work</span>
                        <h2 className="section-h2">Featured<br /><em>Projects</em></h2>
                    </div>

                    <div className="projects-mini-list">
                        {PROJECTS.map((p) => (
                            <article key={p.id} className="proj-card">
                                <div className="proj-top">
                                    <h3 className="proj-title">{p.title}</h3>
                                    <div className="proj-links">
                                        <a className="proj-btn-orange" href={p.live} target="_blank" rel="noreferrer">Live</a>
                                        <a className="proj-btn-ghost" href={p.repo} target="_blank" rel="noreferrer">Code</a>
                                    </div>
                                </div>
                                <div className="proj-tech-row">
                                    {p.tech.map(t => <span key={t} className="proj-chip">{t}</span>)}
                                </div>
                                <p className="proj-desc">{p.desc}</p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ── EXPERIENCE ── */}
                <section className="exp-mini-column">
                    <div className="section-header">
                        <span className="section-label">03 — History</span>
                        <h2 className="section-h2">Professional<br /><em>History</em></h2>
                    </div>

                    <div className="exp-mini-list">
                        {EXPERIENCE.map((e, i) => (
                            <article className="exp-card" key={i}>
                                <div className="exp-header">
                                    <span className="exp-role">{e.role}</span>
                                    <span className="exp-dates">{e.dates}</span>
                                </div>
                                <span className="exp-company">@ {e.company}</span>
                                <p className="exp-desc">{e.desc}</p>
                            </article>
                        ))}
                    </div>
                </section>
            </div>

            <Marquee />

            {/* ── FINAL CTA ──────────────────────────── */}
            <section className="cta-section" id="contact">
                <div className="cta-inner">
                    <h2 className="cta-h2">Let's build<br />something <em>legendary.</em></h2>
                    <div className="cta-actions">
                        <a className="btn-primary" href="mailto:hitmeup.taral@gmail.com">
                            <span>Drop an Email</span>
                        </a>
                        <a className="btn-ghost" href="https://www.linkedin.com/in/taralshah9/" target="_blank" rel="noreferrer">LinkedIn</a>
                        <a className="btn-ghost" href="https://github.com/taralshah09" target="_blank" rel="noreferrer">GitHub</a>
                        <a className="btn-ghost" href="https://x.com/taralshah995" target="_blank" rel="noreferrer">Twitter</a>
                    </div>
                </div>
            </section>
        </div>
    );
}
