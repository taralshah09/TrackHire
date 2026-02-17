import React from 'react';
import Sidebar from '../components/Sidebar';

const LaunchpadPage = () => {
    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            <div className="flex min-h-screen">
                <Sidebar />

                {/* Main Content Area */}
                <main className="flex-1 ml-64">
                    {/* Header Bar */}
                    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-primary/10 flex items-center justify-between px-8 sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            <nav aria-label="Breadcrumb" className="flex text-xs font-medium text-slate-500">
                                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                                    <li className="inline-flex items-center">
                                        <a className="hover:text-primary" href="#">Jobs</a>
                                    </li>
                                    <li>
                                        <div className="flex items-center">
                                            <span className="material-icons text-base">chevron_right</span>
                                            <span className="ml-1 md:ml-2 text-slate-900 dark:text-white font-semibold">Startups</span>
                                        </div>
                                    </li>
                                </ol>
                            </nav>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                <input className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary/50 transition-all outline-none" placeholder="Search startups or roles..." type="text" />
                            </div>
                            <button className="relative text-slate-500 hover:text-primary transition-colors">
                                <span className="material-icons">notifications</span>
                                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                            </button>
                        </div>
                    </header>

                    {/* Hero Section */}
                    <div className="px-8 pt-8">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight mb-2">Startup Launchpad</h1>
                                <p className="text-slate-500 flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold">142</span>
                                    Active high-growth roles available today
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex items-center gap-2 px-4 py-2 border border-primary/20 rounded-lg text-sm font-semibold hover:bg-primary/5 transition-colors">
                                    <span className="material-icons text-sm">tune</span> Filter
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-shadow shadow-sm">
                                    <span className="material-icons text-sm">bolt</span> New Matches
                                </button>
                            </div>
                        </div>

                        {/* Filter Ribbon */}
                        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 hide-scrollbar">
                            <div className="flex flex-col gap-1.5 min-w-[140px]">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Funding Stage</label>
                                <select className="text-sm bg-white dark:bg-slate-800 border-primary/10 rounded-lg focus:ring-primary py-1.5 outline-none">
                                    <option>All Stages</option>
                                    <option>Seed</option>
                                    <option>Series A</option>
                                    <option>Series B</option>
                                    <option>Series C+</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5 min-w-[140px]">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Team Size</label>
                                <select className="text-sm bg-white dark:bg-slate-800 border-primary/10 rounded-lg focus:ring-primary py-1.5 outline-none">
                                    <option>Any Size</option>
                                    <option>&lt; 10</option>
                                    <option>11-50</option>
                                    <option>51-200</option>
                                    <option>201+</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5 min-w-[140px]">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Role Type</label>
                                <select className="text-sm bg-white dark:bg-slate-800 border-primary/10 rounded-lg focus:ring-primary py-1.5 outline-none">
                                    <option>All Roles</option>
                                    <option>Engineering</option>
                                    <option>Product</option>
                                    <option>Design</option>
                                    <option>Marketing</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5 min-w-[140px]">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Salary Range</label>
                                <select className="text-sm bg-white dark:bg-slate-800 border-primary/10 rounded-lg focus:ring-primary py-1.5 outline-none">
                                    <option>$100k - $150k</option>
                                    <option>$150k - $200k</option>
                                    <option>$200k+</option>
                                </select>
                            </div>
                        </div>

                        {/* Job Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 mb-12">
                            {/* Job Card 1 */}
                            <div className="bg-white dark:bg-slate-900 border border-primary/10 rounded-xl p-5 hover:border-primary/40 hover:shadow-lg transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center border border-indigo-100 dark:border-indigo-800 overflow-hidden">
                                            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAe0hH9Pgyys-Vhll7v_DXZ0Dlr_ZTsiZbpYVm9N3abR4k_gQ_OYM5fK5JvrDImypjuFzho0vTZgsBtr4lu2MGhGla0GxJzxRhCx_eTdDwvCMx608N1ByOf-ixUL3VnivP1V1GxajRA2L42r47OtQCEe11HRVY2VD5vESoVRh62v758VdMOayMorwCSbYsdglY8b-NwTM6qIAc6dhTKtOKZyOupDF9cQZ8wMfk5uBuvo7x8OGxf_8SybjDa6VSJdB7qvw38A0FMH8yR" alt="Startup Logo" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-primary transition-colors">Senior Product Designer</h3>
                                            <p className="text-sm text-slate-500 font-medium">Lumina AI</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold rounded uppercase">Remote-friendly</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-background-light dark:bg-slate-800 rounded-md text-xs font-medium border border-primary/5">
                                        <span className="material-icons text-[14px] text-primary">payments</span> Series B
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-background-light dark:bg-slate-800 rounded-md text-xs font-medium border border-primary/5">
                                        <span className="material-icons text-[14px] text-primary">groups</span> 51-200
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-background-light dark:bg-slate-800 rounded-md text-xs font-medium border border-primary/5">
                                        <span className="material-icons text-[14px] text-primary">location_on</span> San Francisco
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 border-t border-primary/5 pt-4">
                                    <button className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">Quick Apply</button>
                                    <select className="w-auto text-xs bg-slate-50 dark:bg-slate-800 border-primary/10 rounded-lg py-2 pl-3 pr-8 focus:ring-primary outline-none">
                                        <option>Status: Interested</option>
                                        <option>Status: Applied</option>
                                        <option>Status: Interviewing</option>
                                    </select>
                                </div>
                            </div>

                            {/* Job Card 2 */}
                            <div className="bg-white dark:bg-slate-900 border border-primary/10 rounded-xl p-5 hover:border-primary/40 hover:shadow-lg transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 rounded-lg flex items-center justify-center border border-rose-100 dark:border-rose-800 overflow-hidden">
                                            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDB6shxHnrZeBHtijWdQ5RnITqWFzUOzU95V7sEKib1PpafRv9mqE18_sRoRFH6HpIBavwBiPnUKyhJBULUV2e8dctJqc7fXGv1r0WsI3zBUUQLpuXTuqMUY1WpsOweNWd0UlQC-i3cnhCONI5aeNCNUovJ1FusULUnwUW9pFzZdVmdznff2zLQXTOtncJKGJKbHfudeNArN3SaX05rEoyEXKrcfwDrNS878Uw-mZB9rW_1wr_uyhn_4rU7F6Mwf987dWUkZwBzeo9r" alt="Startup Logo" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-primary transition-colors">Full-stack Engineer</h3>
                                            <p className="text-sm text-slate-500 font-medium">Quantify Finance</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded uppercase">Work Anywhere</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-background-light dark:bg-slate-800 rounded-md text-xs font-medium border border-primary/5">
                                        <span className="material-icons text-[14px] text-primary">payments</span> Series A
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-background-light dark:bg-slate-800 rounded-md text-xs font-medium border border-primary/5">
                                        <span className="material-icons text-[14px] text-primary">groups</span> 11-50
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-background-light dark:bg-slate-800 rounded-md text-xs font-medium border border-primary/5">
                                        <span className="material-icons text-[14px] text-primary">location_on</span> Remote
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 border-t border-primary/5 pt-4">
                                    <button className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">Quick Apply</button>
                                    <select className="w-auto text-xs bg-slate-50 dark:bg-slate-800 border-primary/10 rounded-lg py-2 pl-3 pr-8 focus:ring-primary outline-none">
                                        <option>Status: Interested</option>
                                        <option>Status: Applied</option>
                                        <option>Status: Interviewing</option>
                                    </select>
                                </div>
                            </div>

                            {/* Job Card 3 */}
                            <div className="bg-white dark:bg-slate-900 border border-primary/10 rounded-xl p-5 hover:border-primary/40 hover:shadow-lg transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center border border-amber-100 dark:border-amber-800 overflow-hidden">
                                            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5cj_EqU2u0Wdtl76MveOSKmidRv814geTSc3skcA6bxvRNCr_h8j9_4-tJioD_yaoldYN67LDSQyDLAyQwC6D1pbyAC9PuTQQn4TrGmMtjLrdVjQQbcru-pd5hmULZ29QhpwWci5XhAxUxY6xd9oWQ_vaCpLsDfuk0PuQYjSErEGwRyNg33e89sEpbCfCdNljWTp8QUnr2S72HeIBb-hWjVQQ7h-UbNj6z6fly31djIRo2_Szl7F0iIjz5_6_z7EvrRVM1sWVjhnz" alt="Startup Logo" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-primary transition-colors">Head of Growth</h3>
                                            <p className="text-sm text-slate-500 font-medium">VentureStream</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded uppercase">Hybrid</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-background-light dark:bg-slate-800 rounded-md text-xs font-medium border border-primary/5">
                                        <span className="material-icons text-[14px] text-primary">payments</span> Seed
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-background-light dark:bg-slate-800 rounded-md text-xs font-medium border border-primary/5">
                                        <span className="material-icons text-[14px] text-primary">groups</span> &lt; 10
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-background-light dark:bg-slate-800 rounded-md text-xs font-medium border border-primary/5">
                                        <span className="material-icons text-[14px] text-primary">location_on</span> New York
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 border-t border-primary/5 pt-4">
                                    <button className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">Quick Apply</button>
                                    <select className="w-auto text-xs bg-slate-50 dark:bg-slate-800 border-primary/10 rounded-lg py-2 pl-3 pr-8 focus:ring-primary outline-none">
                                        <option>Status: Interested</option>
                                        <option>Status: Applied</option>
                                        <option>Status: Interviewing</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Load More / Empty State Footer */}
                        <div className="flex flex-col items-center justify-center py-12 border-t border-primary/5">
                            <button className="px-8 py-3 border border-primary/20 rounded-lg font-semibold text-primary hover:bg-primary/5 transition-all">
                                Load More Startups
                            </button>
                            <p className="mt-4 text-xs text-slate-400">Showing 6 of 142 opportunities</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default LaunchpadPage;
