import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import JobCard from '../components/JobCard';
import api from '../service/ApiService';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    const [stats, setStats] = useState(null);
    const [featuredJobs, setFeaturedJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, jobsRes] = await Promise.all([
                    api.getPlatformStats(),
                    api.getFeaturedJobs('DISCOVER')
                ]);

                // Inspect response structure - assuming standard API response or direct data
                const statsData = statsRes.json ? await statsRes.json() : statsRes;
                const jobsData = jobsRes.json ? await jobsRes.json() : jobsRes;

                setStats(statsData);
                // Handle pagination wrapper if exists (content/data/etc)
                setFeaturedJobs(jobsData.content || jobsData || []);
            } catch (error) {
                console.error('Error fetching landing page data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
            <Navbar />

            {/* Hero Section */}
            <header className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center">
                        <div className="mx-auto mb-6 flex max-w-fit items-center space-x-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold leading-6 text-primary ring-1 ring-inset ring-primary/20">
                            <span>New feature: AI Resume Optimizer</span>
                            <span className="material-icons text-sm">chevron_right</span>
                        </div>
                        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-7xl">
                            Chart Your <span className="text-primary">Career Path</span>
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400">
                            The all-in-one platform to track applications, organize notes, and land your dream job without the stress. Stop juggling spreadsheets and start making moves.
                        </p>

                        {/* Stats Bar */}
                        {stats && (
                            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 max-w-3xl mx-auto">
                                <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                                    <div className="text-2xl font-bold text-primary">{stats.totalJobs || '2.5k+'}</div>
                                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Jobs</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                                    <div className="text-2xl font-bold text-primary">{stats.totalCompanies || '150+'}</div>
                                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Companies</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                                    <div className="text-2xl font-bold text-primary">{stats.totalUsers || '10k+'}</div>
                                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Job Seekers</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                                    <div className="text-2xl font-bold text-primary">{stats.dailyNewJobs || '500+'}</div>
                                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">New Daily</div>
                                </div>
                            </div>
                        )}
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link to="/signup" className="rounded-xl bg-primary px-8 py-4 text-lg font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-[1.02] transition-all">
                                Get Started
                            </Link>
                            <Link to="/jobs" className="flex items-center gap-2 text-lg font-semibold leading-6 text-slate-900 dark:text-white hover:text-primary transition-colors">
                                Browse Jobs <span aria-hidden="true">→</span>
                            </Link>
                        </div>
                    </div>
                </div>
                {/* Decorative Background Element */}
                <div className="absolute top-0 -z-10 h-full w-full opacity-20 dark:opacity-10">
                    <div className="absolute left-1/2 top-0 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary to-blue-300 blur-3xl"></div>
                </div>
            </header>

            {/* Hero Visual */}
            <div className="mx-auto max-w-6xl px-4 -mt-12 mb-24 lg:-mt-20">
                <div className="relative rounded-2xl bg-slate-900 p-2 shadow-2xl ring-1 ring-slate-900/10">
                    <img
                        alt="Dashboard Preview"
                        className="rounded-xl object-cover w-full h-[300px] md:h-[500px]"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaRJqmabz_ObIHZ8qTGyRVBifgY06tMOkG3vhFvxsPBu08o922BsdjVkdM4qZJ5GfxVgwN49ToW5u72_zkTvnNxWT6wZbManiSQzPuiEx1FvFwGTF6OmgGrwQvnELvvCE3RPRinsvatFoEAxV6U-FoCESN7lhGIjiNP8kIgl_Ge9Z-KHWRMDIl41XgTbVHQ4W-cZ5suompA30H6bqUI8pqDZhImlH8aBOOQRCaXOwGJ3ol4iFCzJI6VBVhBl9N2wb2J1qWyED6LhWf"
                    />
                </div>
            </div>

            {/* Featured Jobs Section */}
            {!loading && featuredJobs.length > 0 && (
                <section className="py-24 bg-slate-50 dark:bg-background-dark/30">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-12 text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Featured Opportunities</h2>
                            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Top picks for you based on trending skills.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {featuredJobs.slice(0, 6).map((job, index) => (
                                <JobCard key={job.id || index} job={job} />
                            ))}
                        </div>
                        <div className="mt-12 text-center">
                            <Link to="/jobs" className="text-primary font-semibold hover:text-blue-700 flex items-center justify-center gap-2">
                                View All Jobs <span className="material-icons-round text-sm">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Features Section */}
            <section className="py-24 bg-white dark:bg-background-dark/50" id="features">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 text-center">
                        <h2 className="text-base font-semibold uppercase tracking-wider text-primary">Features</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Everything you need to level up</p>
                    </div>
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Card 1 */}
                        <div className="group relative rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-primary/50 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-icons">assignment</span>
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Track Applications</h3>
                            <p className="text-slate-600 dark:text-slate-400">Keep tabs on every application stage, from first contact to the final offer letter.</p>
                        </div>
                        {/* Card 2 */}
                        <div className="group relative rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-primary/50 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-icons">search</span>
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Discover Jobs</h3>
                            <p className="text-slate-600 dark:text-slate-400">AI-powered recommendations tailored to your skills and preferences across 50+ boards.</p>
                        </div>
                        {/* Card 3 */}
                        <div className="group relative rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-primary/50 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-icons">event_note</span>
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Organize Notes</h3>
                            <p className="text-slate-600 dark:text-slate-400">Centralized interview preparation. Save talking points, company research, and questions.</p>
                        </div>
                        {/* Card 4 */}
                        <div className="group relative rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-primary/50 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-icons">trending_up</span>
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Monitor Progress</h3>
                            <p className="text-slate-600 dark:text-slate-400">Visual analytics of your hunt. Identify where you're succeeding and what needs work.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section className="py-24" id="how-it-works">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-20 text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">How it Works</h2>
                        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Three simple steps to your next career milestone.</p>
                    </div>
                    <div className="relative">
                        {/* Connector Line (Desktop) */}
                        <div className="absolute top-12 left-0 hidden h-0.5 w-full bg-slate-200 dark:bg-slate-800 lg:block"></div>
                        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                            {/* Step 1 */}
                            <div className="relative text-center">
                                <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white ring-8 ring-background-light dark:bg-slate-900 dark:ring-background-dark">
                                    <span className="text-3xl font-black text-primary">1</span>
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Create Profile</h4>
                                <p className="mt-2 text-slate-600 dark:text-slate-400">Import your LinkedIn or upload your resume to get started in seconds.</p>
                            </div>
                            {/* Step 2 */}
                            <div className="relative text-center">
                                <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white ring-8 ring-background-light dark:bg-slate-900 dark:ring-background-dark">
                                    <span className="text-3xl font-black text-primary">2</span>
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Add Applications</h4>
                                <p className="mt-2 text-slate-600 dark:text-slate-400">Use our browser extension to save jobs with one click from any job board.</p>
                            </div>
                            {/* Step 3 */}
                            <div className="relative text-center">
                                <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white ring-8 ring-background-light dark:bg-slate-900 dark:ring-background-dark">
                                    <span className="text-3xl font-black text-primary">3</span>
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Land the Job</h4>
                                <p className="mt-2 text-slate-600 dark:text-slate-400">Stay organized through interview rounds and negotiate your best offer.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-20 text-center shadow-2xl sm:px-12">
                    <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Ready to take control of your career journey?
                    </h2>
                    <p className="mx-auto mt-6 max-w-xl text-lg text-blue-100">
                        Join 10,000+ professionals who have optimized their job search with CareerPilot.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link to="/signup" className="rounded-xl bg-white px-8 py-4 text-lg font-bold text-primary shadow-sm hover:bg-blue-50 transition-all">
                            Start Your Free Trial
                        </Link>
                    </div>
                    {/* Abstract background shape */}
                    <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute -top-12 -left-12 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default LandingPage;
