import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AppHeader from '../components/AppHeader';
import api from '../service/ApiService';
import { FaSearch, FaCheck, FaBuilding, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

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

    const filteredCompanies = allCompanies.filter(c =>
        c.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 50); // Show only top 50 matches for performance

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Sidebar />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <AppHeader left={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-white-40)' }}>
                        <span>Preferred Companies</span>
                    </div>
                } />

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
                        <div style={{ marginBottom: '32px' }}>
                            <h1 style={{
                                fontFamily: 'var(--font-display)', fontWeight: 800,
                                fontSize: '32px', letterSpacing: '-0.025em',
                                color: 'var(--color-white)', margin: 0,
                            }}>Preferred Companies</h1>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-white-40)', marginTop: '8px' }}>
                                Select companies you're most interested in. Jobs from these companies will be prioritized in your feed.
                            </p>
                        </div>

                        {loading ? (
                            <div style={{ color: 'var(--color-white-40)', textAlign: 'center', padding: '40px' }}>Loading companies...</div>
                        ) : (
                            <>
                                {/* Selection Summary */}
                                <div style={{
                                    background: 'var(--color-surface-2)',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--color-border)',
                                    marginBottom: '24px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h3 style={{ margin: 0, color: 'var(--color-white)', fontFamily: 'var(--font-display)', fontSize: '16px' }}>
                                            Selected Companies ({preferredCompanies.length})
                                        </h3>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            style={{
                                                background: 'var(--color-orange)',
                                                border: 'none', borderRadius: '6px',
                                                color: '#000', fontFamily: 'var(--font-display)', fontWeight: 700,
                                                padding: '8px 20px', cursor: 'pointer',
                                                opacity: saving ? 0.6 : 1, transition: 'all 0.2s'
                                            }}
                                        >
                                            {saving ? 'Saving...' : 'Save Preferences'}
                                        </button>
                                    </div>

                                    {message && (
                                        <div style={{
                                            padding: '10px',
                                            borderRadius: '6px',
                                            backgroundColor: message.includes('success') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: message.includes('success') ? '#22c55e' : '#ef4444',
                                            fontSize: '14px', marginBottom: '16px', border: '1px solid currentColor'
                                        }}>
                                            {message}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {preferredCompanies.length === 0 ? (
                                            <span style={{ color: 'var(--color-white-40)', fontSize: '14px' }}>No companies selected yet.</span>
                                        ) : (
                                            preferredCompanies.map(company => (
                                                <div key={company} style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    background: 'var(--color-orange)', color: '#000',
                                                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600
                                                }}>
                                                    {company}
                                                    <span
                                                        onClick={() => toggleCompany(company)}
                                                        style={{ cursor: 'pointer', opacity: 0.6, fontSize: '14px' }}
                                                    >×</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Search and List */}
                                <div style={{ marginBottom: '20px', position: 'relative' }}>
                                    <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-white-40)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search companies (e.g. Google, Amazon...)"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px 12px 12px 40px',
                                            background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                                            borderRadius: '8px', color: 'white', outline: 'none', boxSizing: 'border-box'
                                        }}
                                    />
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                    gap: '12px',
                                    maxHeight: '500px',
                                    overflowY: 'auto',
                                    paddingRight: '10px'
                                }}>
                                    {filteredCompanies.map(company => {
                                        const isSelected = preferredCompanies.includes(company);
                                        return (
                                            <div
                                                key={company}
                                                onClick={() => toggleCompany(company)}
                                                style={{
                                                    padding: '12px',
                                                    background: isSelected ? 'rgba(249, 115, 22, 0.1)' : 'var(--color-surface-2)',
                                                    border: `1px solid ${isSelected ? 'var(--color-orange)' : 'var(--color-border)'}`,
                                                    borderRadius: '8px', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <span style={{ color: 'var(--color-white)', fontSize: '14px', fontWeight: isSelected ? 600 : 400 }}>{company}</span>
                                                {isSelected ? <FaCheck color="var(--color-orange)" /> : <FaPlus color="var(--color-white-20)" />}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                                    <button
                                        onClick={() => navigate('/preferred-jobs')}
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid var(--color-border)', borderRadius: '8px',
                                            color: 'var(--color-white-65)', fontFamily: 'var(--font-display)', fontWeight: 600,
                                            padding: '12px 24px', cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-white-40)'}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
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
