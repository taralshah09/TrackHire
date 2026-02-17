import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../service/ApiService';
import Cookies from 'js-cookie';

export default function Profile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userId, setUserId] = useState(null);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        location: '',
        experience: 0,
        website: '',
        github: '',
        linkedin: '',
    });

    const [preferences, setPreferences] = useState([]);
    const [skills, setSkills] = useState([]);
    const [stats, setStats] = useState({
        memberSince: 'Oct 12, 2023', // Default or fetch if available
        isVerified: true,
        completion: 85
    });
    const [userObj, setUserObj] = useState({})

    // Fetch user data
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                // Get username from cookies if not in context immediately (page refresh)
                const username = user?.username || Cookies.get('username');

                if (!username) {
                    toast.error("Could not identify user. Please login again.");
                    return;
                }

                const response = await api.getUserByUsername(username);
                const userData = await response.json();
                setUserObj(userData)
                setUserId(userData.id);
                console.log(userData)
                // Map backend data to frontend state
                const profile = userData.profile || {};

                setFormData({
                    fullName: profile.name || userData.username || '',
                    email: userData.email || '',
                    location: profile.currentLocation || '',
                    experience: profile.yearsOfExperience || 0,
                    website: profile.socialProfileLinks?.website || '',
                    github: profile.socialProfileLinks?.github || '',
                    linkedin: profile.socialProfileLinks?.linkedin || '',
                });

                setPreferences(profile.openToWorkTypes || []);
                setSkills(profile.skills || []);

                // Update stats if available in response
                if (userData.createdAt) {
                    const date = new Date(userData.createdAt);
                    setStats(prev => ({
                        ...prev,
                        memberSince: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        isVerified: userData.emailVerified
                    }));
                }

            } catch (error) {
                console.error("Error fetching profile:", error);
                toast.error("Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Construct payload matching UpdateUserRequest and UserProfileDTO
            const payload = {
                username: user?.username || Cookies.get('username'), // Required by DTO validation
                email: formData.email,
                profile: {
                    name: formData.fullName,
                    currentLocation: formData.location,
                    yearsOfExperience: parseInt(formData.experience),
                    openToWorkTypes: preferences,
                    skills: skills,
                    socialProfileLinks: {
                        website: formData.website,
                        github: formData.github,
                        linkedin: formData.linkedin
                    }
                }
            };

            const response = await api.updateUser(userId, payload);

            if (response.ok) {
                toast.success("Profile updated successfully!");
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Failed to update profile.");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    // Helper to add/remove skills/preferences
    const togglePreference = (pref) => {
        setPreferences(prev =>
            prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
        );
    };

    const removeSkill = (skillToRemove) => {
        setSkills(prev => prev.filter(skill => skill !== skillToRemove));
    };

    const addSkill = () => {
        const skill = prompt("Enter a new skill:");
        if (skill && !skills.includes(skill)) {
            setSkills(prev => [...prev, skill]);
        }
    };

    const addPreference = () => {
        // Should ideally be a dropdown or modal selection for Enum values
        const possibleTypes = ['REMOTE', 'HYBRID', 'ONSITE'];
        const type = prompt(`Enter work type (${possibleTypes.join(', ')}):`);
        if (type) {
            const refinedType = type.toUpperCase();
            if (possibleTypes.includes(refinedType) && !preferences.includes(refinedType)) {
                setPreferences(prev => [...prev, refinedType]);
            } else {
                toast.error("Invalid work type or already added.");
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="text-center">
                    <span className="material-icons animate-spin text-primary text-5xl">refresh</span>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-display transition-colors duration-200 min-h-screen flex">
            <Sidebar />

            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md flex items-center justify-between px-8 z-10 sticky top-0">
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                        <span>Settings</span>
                        <span className="material-icons text-base mx-2">chevron_right</span>
                        <span className="text-slate-900 dark:text-white font-medium">Profile Settings</span>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{formData.fullName || 'User'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">PRO MEMBER</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                            <img src={`https://ui-avatars.com/api/?name=${formData.fullName || 'User'}&background=random`} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <button className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                            <span className="material-icons">expand_more</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-5xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">Profile Settings</h1>
                            <p className="text-slate-500 dark:text-slate-400">Manage your professional identity and job hunt preferences.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column - Main Info */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Personal Information */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 relative overflow-hidden">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                                            <span className="material-icons text-primary mr-2">badge</span>
                                            Personal Information
                                        </h2>
                                        {/* Optional: Add modification indicator logic */}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="fullName"
                                                    value={formData.fullName}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full"></span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Location</label>
                                            <div className="relative">
                                                <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">location_on</span>
                                                <input
                                                    type="text"
                                                    name="location"
                                                    value={formData.location}
                                                    onChange={handleChange}
                                                    className="w-full bg-slate-50 dark:bg-slate-700/50 border border-primary dark:border-primary rounded-lg pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 transition-all outline-none bg-white dark:bg-slate-800"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full"></span>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Years of Experience</label>
                                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm font-bold">{formData.experience}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="40"
                                                step="1"
                                                value={formData.experience}
                                                onChange={(e) => setFormData(prev => ({ ...prev, experience: parseInt(e.target.value) }))}
                                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Career Alignment */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                                            <span className="material-icons text-primary mr-2">tune</span>
                                            Career Alignment
                                        </h2>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Work Preferences</label>
                                                <span className="text-xs text-slate-400">Click to remove</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {preferences.map(pref => (
                                                    <span key={pref} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium flex items-center shadow-sm shadow-blue-600/20">
                                                        {pref}
                                                        <button
                                                            onClick={() => togglePreference(pref)}
                                                            className="ml-2 hover:text-blue-200"
                                                        >
                                                            <span className="material-icons text-sm">close</span>
                                                        </button>
                                                    </span>
                                                ))}
                                                <button
                                                    onClick={addPreference}
                                                    className="px-3 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center"
                                                >
                                                    <span className="material-icons text-sm mr-1">add</span> Add Preference
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Top Skills</label>
                                            <div className="flex flex-wrap gap-2">
                                                {skills.map(skill => (
                                                    <span key={skill} className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium flex items-center border border-slate-200 dark:border-slate-600">
                                                        {skill}
                                                        <button
                                                            onClick={() => removeSkill(skill)}
                                                            className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                        >
                                                            <span className="material-icons text-sm">close</span>
                                                        </button>
                                                    </span>
                                                ))}
                                                <button
                                                    onClick={addSkill}
                                                    className="px-3 py-1.5 rounded-full border border-dashed border-blue-300 text-blue-600 dark:text-blue-400 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors flex items-center"
                                                >
                                                    <span className="material-icons text-sm mr-1">add</span> Add Skill
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Portfolio & Socials */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                                            <span className="material-icons text-primary mr-2">link</span>
                                            Portfolio & Socials
                                        </h2>
                                        {/* <button className="text-sm text-primary font-bold flex items-center hover:underline">
                                            <span className="material-icons text-sm mr-1">add_circle</span> Add Row
                                        </button> */}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-slate-500">
                                                <span className="material-icons">public</span>
                                            </div>
                                            <input
                                                type="text"
                                                name="website"
                                                value={formData.website}
                                                onChange={handleChange}
                                                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                                placeholder="https://yourwebsite.com"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-slate-500">
                                                <span className="material-icons">code</span>
                                            </div>
                                            <input
                                                type="text"
                                                name="github"
                                                value={formData.github}
                                                onChange={handleChange}
                                                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                                placeholder="https://github.com/username"
                                            />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-slate-500">
                                                <span className="material-icons">share</span>
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    name="linkedin"
                                                    value={formData.linkedin}
                                                    onChange={handleChange}
                                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                                    placeholder="Enter LinkedIn URL"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Account Overview & Actions */}
                            <div className="space-y-6">
                                {/* Account Overview */}
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                    <div className="mb-6">
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account Overview</h2>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Read Only</p>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mr-3">
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-4 h-4" />
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Auth Provider</span>
                                            </div>
                                            <span className="text-sm text-slate-500 dark:text-slate-400">{userObj.authProvider === "LOCAL" ? "EMAIL" : "GOOGLE"}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mr-3 text-slate-500">
                                                    <span className="material-icons text-lg">calendar_today</span>
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Member Since</span>
                                            </div>
                                            <span className="text-sm text-slate-500 dark:text-slate-400">{stats.memberSince}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mr-3 text-slate-500">
                                                    <span className="material-icons text-lg">verified_user</span>
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Verification</span>
                                            </div>
                                            {stats.isVerified ? (
                                                <span className="text-xs font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded">Verified</span>
                                            ) : (
                                                <span className="text-xs font-bold bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded">Pending</span>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium text-slate-900 dark:text-white">Profile Completion</span>
                                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.completion}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${stats.completion}%` }}></div>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-3 italic">
                                                Add a portfolio link to reach 100% and unlock featured placement in recruiter searches.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Save Actions */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-blue-100 dark:border-slate-700 p-6">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">Need help with your profile?</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Chat with our career experts to optimize your presence.</p>
                                    <button className="text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center hover:text-blue-700">
                                        Contact Support <span className="material-icons text-sm ml-1">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Save Button */}
                <div className="absolute bottom-8 right-8 z-20">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30 font-bold flex items-center transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <span className="material-icons animate-spin mr-2">refresh</span>
                        ) : (
                            <span className="material-icons mr-2">save</span>
                        )}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </main>
        </div>
    );
}