import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-background-dark">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
                                <span className="material-icons text-white text-sm">explore</span>
                            </div>
                            <span className="text-lg font-bold text-slate-900 dark:text-white">CareerPilot</span>
                        </div>
                        <p className="max-w-xs text-sm text-slate-600 dark:text-slate-400">
                            Helping professionals navigate their career paths with smart tracking and data-driven insights.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Platform</h3>
                        <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li><Link to="/jobs" className="hover:text-primary transition-colors">Job Tracker</Link></li>
                            <li><a className="hover:text-primary transition-colors" href="#">AI Resume</a></li>
                            <li><a className="hover:text-primary transition-colors" href="#">Extension</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Company</h3>
                        <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li><a className="hover:text-primary transition-colors" href="#">About Us</a></li>
                            <li><a className="hover:text-primary transition-colors" href="#">Careers</a></li>
                            <li><a className="hover:text-primary transition-colors" href="#">Blog</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Legal</h3>
                        <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li><a className="hover:text-primary transition-colors" href="#">Privacy</a></li>
                            <li><a className="hover:text-primary transition-colors" href="#">Terms</a></li>
                            <li><a className="hover:text-primary transition-colors" href="#">Cookie Policy</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-800">
                    <p className="text-center text-xs text-slate-500 dark:text-slate-500">
                        © 2024 CareerPilot Inc. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
