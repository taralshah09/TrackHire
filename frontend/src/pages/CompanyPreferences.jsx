import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AppHeader from '../components/AppHeader';
import api from '../service/ApiService';
import { FaSearch, FaCheck, FaBuilding, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import availableCompaniesData from '../data/available_companies.json';

// Extract and clean company names from JSON
const jsonDataCompanies = [...new Set(availableCompaniesData.map(item => item.company.trim()))];

export default function CompanyPreferences() {
    const [allCompanies, setAllCompanies] = useState([]);
    const [preferredCompanies, setPreferredCompanies] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [companiesRes, prefsRes] = await Promise.all([
                    api.getCompanies(),
                    api.getPreferredCompanies()
                ]);

                const companiesData = companiesRes.ok ? (companiesRes.json ? await companiesRes.json() : companiesRes) : [];
                const prefsData = prefsRes.ok ? (prefsRes.json ? await prefsRes.json() : prefsRes) : [];

                setAllCompanies(Array.isArray(companiesData) ? companiesData : []);
                setPreferredCompanies(Array.isArray(prefsData) ? prefsData : []);

                if (!companiesRes.ok || !prefsRes.ok) {
                    setMessage('Failed to load some data. Please check if the backend is running.');
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setMessage('Error connecting to Server.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const toggleCompany = (company) => {
        if (preferredCompanies.includes(company)) {
            setPreferredCompanies(prev => prev.filter(c => c !== company));
        } else {
            setPreferredCompanies(prev => [...prev, company]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            await api.savePreferredCompanies(preferredCompanies);
            setMessage('Preferences saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Error saving preferences:', error);
            setMessage('Failed to save preferences.');
        } finally {
            setSaving(false);
        }
    };

    const filteredCompanies = [
        ...new Set([
            ...allCompanies,
            ...jsonDataCompanies
        ])
    ].filter(c =>
        c.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5000); // Show all/more matching companies

    return (
        <div className="flex h-screen overflow-hidden bg-background-light">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden relative z-10">
                <AppHeader left={
                    <div className="font-label-mono font-bold uppercase text-sm text-brutalist-black bg-pure-white border-[3px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608] inline-block" style={{ padding: "16px 32px" }}>
                        Preferred Companies
                    </div>
                } />

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-4xl mx-auto" style={{ padding: "40px 10px" }}>
                        <div className="bg-pure-white border-[4px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608] mb-12" style={{ padding: "48px" }}>
                            <h1 className="font-headline-md font-black uppercase tracking-tighter text-3xl md:text-5xl text-brutalist-black m-0 mb-4">
                                Preferred Companies
                            </h1>
                            <p className="font-label-mono font-bold uppercase text-sm text-gray-500 m-0">
                                Select companies you're most interested in. Jobs from these companies will be prioritized in your feed.
                            </p>
                        </div>

                        {loading ? (
                            <div className="font-label-mono font-bold uppercase text-center text-gray-500" style={{ padding: "40px" }}>Loading companies...</div>
                        ) : (
                            <>
                                {/* Selection Summary */}
                                <div className="bg-[#F4F4F5] border-[4px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608] mb-12" style={{ padding: "32px" }}>
                                    <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                                        <h3 className="font-headline-md font-bold uppercase text-xl text-brutalist-black m-0">
                                            Selected Companies ({preferredCompanies.length})
                                        </h3>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="bg-vibrant-orange border-[3px] border-brutalist-black text-pure-white font-label-mono font-bold text-sm uppercase transition-all shadow-[2px_2px_0px_0px_#060608] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer disabled:opacity-50"
                                            style={{ padding: "12px 24px" }}
                                        >
                                            {saving ? 'Saving...' : 'Save Preferences'}
                                        </button>
                                    </div>

                                    {message && (
                                        <div className={`font-label-mono font-bold text-sm uppercase border-[3px] border-brutalist-black mb-6 ${message.includes('success') ? 'bg-[#22c55e] text-pure-white' : 'bg-[#ef4444] text-pure-white'}`} style={{ padding: "16px" }}>
                                            {message}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-3">
                                        {preferredCompanies.length === 0 ? (
                                            <span className="font-label-mono font-bold text-sm uppercase text-gray-500">No companies selected yet.</span>
                                        ) : (
                                            preferredCompanies.map(company => (
                                                <div key={company} className="flex items-center gap-2 bg-pure-white border-[2px] border-brutalist-black text-brutalist-black font-label-mono font-bold text-xs uppercase shadow-[2px_2px_0px_0px_#060608]" style={{ padding: "6px 12px" }}>
                                                    {company}
                                                    <span
                                                        onClick={() => toggleCompany(company)}
                                                        className="cursor-pointer text-gray-400 hover:text-[#ef4444] transition-colors text-lg leading-none"
                                                    >×</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Search and List */}
                                <div className="relative mb-8 border-[4px] border-brutalist-black shadow-[4px_4px_0px_0px_#060608] bg-pure-white flex items-center">
                                    <div style={{ padding: "0 0 0 16px" }} className="text-brutalist-black text-xl"><FaSearch /></div>
                                    <input
                                        type="text"
                                        placeholder="Search companies (e.g. Google, Amazon...)"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-transparent border-none text-brutalist-black font-label-mono font-bold uppercase text-sm outline-none"
                                        style={{ padding: "16px" }}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-h-[500px] overflow-y-auto" style={{ padding: "10px" }}>
                                    {filteredCompanies.map(company => {
                                        const isSelected = preferredCompanies.includes(company);
                                        return (
                                            <div
                                                key={company}
                                                onClick={() => toggleCompany(company)}
                                                className={`flex items-center justify-between border-[3px] border-brutalist-black cursor-pointer transition-all shadow-[2px_2px_0px_0px_#060608] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${isSelected ? 'bg-vibrant-orange text-pure-white' : 'bg-pure-white text-brutalist-black'}`}
                                                style={{ padding: "16px" }}
                                            >
                                                <span className="font-label-mono font-bold text-sm uppercase">{company}</span>
                                                {isSelected ? <FaCheck /> : <FaPlus className="opacity-40" />}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-12 text-center" style={{ padding: "0 0 40px 0" }}>
                                    <button
                                        onClick={() => navigate('/preferred-jobs')}
                                        className="bg-pure-white border-[3px] border-brutalist-black text-brutalist-black font-label-mono font-bold text-sm uppercase transition-all shadow-[4px_4px_0px_0px_#060608] hover:bg-brutalist-black hover:text-pure-white hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none cursor-pointer"
                                        style={{ padding: "16px 32px" }}
                                    >
                                        Go to Preferred Jobs →
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
