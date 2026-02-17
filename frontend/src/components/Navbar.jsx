import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-background-dark/80">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                        <span className="material-icons text-white">explore</span>
                    </div>
                    <Link to="/" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">CareerPilot</Link>
                </div>
                <div className="hidden md:flex items-center space-x-8">
                    <a className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors" href="/#features">Features</a>
                    <a className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors" href="/#how-it-works">How it Works</a>
                    <Link to="/launchpad" className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-white transition-colors">Launchpad</Link>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors">Login</Link>
                    <Link to="/signup" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all">
                        Sign Up Free
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
