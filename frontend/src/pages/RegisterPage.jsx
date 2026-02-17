import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const calculatePasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
        return Math.min(strength, 4);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        if (name === 'password') {
            setPasswordStrength(calculatePasswordStrength(value));
        }

        // setError(''); // Clear error when user types
    };

    const validateForm = () => {
        if (!formData.username.trim()) {
            toast.error('Username is required');
            return false;
        }
        if (!formData.email.trim()) {
            toast.error('Email is required');
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            toast.error('Please enter a valid email address');
            return false;
        }
        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return false;
        }
        if (!agreedToTerms) {
            toast.error('You must agree to the Terms of Service and Privacy Policy');
            return false;
        }
        return true;
    };

    const handleRegister = async () => {
        setLoading(true);

        try {
            const registerData = {
                username: formData.username,
                email: formData.email,
                phoneNumber: formData.phoneNumber || null,
                password: formData.password
            };

            const response = await fetch('http://localhost:8081/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(registerData)
            });

            const data = await response.json();
            console.log(data)

            if (response.ok) {
                await handleAutoLogin();
            } else {
                toast.error(data.message || 'Registration failed');
                setLoading(false);
            }
        } catch (err) {
            console.error('Registration error:', err);
            toast.error('Unable to connect to server. Please try again.');
            setLoading(false);
        }
    };

    const handleAutoLogin = async () => {
        try {
            const loginData = {
                loginIdentifier: formData.username,
                password: formData.password
            };

            console.log('Auto-login request:', loginData);

            const response = await fetch('http://localhost:8081/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();
            console.log('Auto-login response:', data);

            if (response.ok) {
                // Verify that we have the required fields
                if (data.token && data.refreshToken) {
                    // Login successful - save tokens and user data
                    login(data);
                    // Redirect to dashboard
                    navigate('/dashboard');
                } else {
                    console.error('Missing tokens in auto-login response:', data);
                    toast.success('Registration successful! Please log in.');
                    setTimeout(() => {
                        navigate('/login');
                    }, 2000);
                }
            } else {
                // Auto-login failed, redirect to login page
                toast.success('Registration successful! Please log in.');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (err) {
            console.error('Auto-login error:', err);
            toast.success('Registration successful! Please log in.');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            await handleRegister();
        }
    };

    const getPasswordStrengthText = () => {
        const strengths = ['Weak', 'Fair', 'Medium', 'Strong', 'Very Strong'];
        return strengths[passwordStrength] || 'Weak';
    };

    const getPasswordStrengthColor = () => {
        const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];
        return colors[passwordStrength] || 'bg-red-500';
    };

    return (
        <div className="bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
            {/* Main Card Container */}
            <div className="max-w-5xl w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] max-h-[700px]">
                {/* Left Side: Illustration & Branding */}
                <div className="hidden md:flex md:w-1/2 bg-primary/10 dark:bg-primary/5 flex-col justify-between p-12 relative overflow-hidden">
                    {/* Background Decorative Element */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full"></div>
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-primary/10 rounded-full"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                <span className="material-icons text-white">explore</span>
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">CareerPilot</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
                            Elevate your career journey.
                        </h1>
                        <p className="text-mg text-slate-600 dark:text-slate-400">
                            Join thousands of professionals tracking their path to success with our intuitive job tracking platform.
                        </p>
                    </div>
                    <div className="relative z-10">
                        <img
                            alt="Professional team collaborating"
                            className="mt-3 h-[350px] rounded-xl shadow-lg border border-primary/10"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2Zc1GR_MF9jUQHgz-HUqu5FhgmL5BErUH4O-qqvGZSEJN1beovZlfhHmhK1R1spOKMT1_2OQ6Bb3e_IjOnH35Sit6cX5GZzXCSnrTjmBdPRuiToS1YoClldi1v59TYUlgJrKttSbr2HFUL73H8bQNHUQ9uRC6b5X2V-45-T_cl8MQ_KSAsZlX9u0mUV6w3LNiiTLGIq3QGBAxhDpLPuPLKeC9qYbzRtrWZ8_6CUZZCqJB-sMyfrspPrWDwej09TpXU6AI2tgDrFhE"
                        />
                        <div className="mt-8 flex items-center space-x-4">
                            <div className="flex -space-x-2">
                                <img alt="User 1" className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-slate-900" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC57Zii-VZZhuljpyFI2PyZp1CIWRbU9g4qVS_R_L7PbIZILEetjqWi_acCeADRY8RiGzXrmv47ZaAtY3l63Px-SOIIKJLtfNrfwmuYsZ7PcBOxsgVUUFEj7zU38I_lI8f6LFaXw7Rj09tyFXUTqJ_WdI7-_vAwGRD-acqOLutjgdXO2kHatq0UwBJOVNj1wTjmwr70VrutMFjapBXAP7-_lG4QcGCx5RnScSTZ8w-VvipslzOp11a6Bmp7h_Kc-w1Hu4AL1YEfBo1k" />
                                <img alt="User 2" className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-slate-900" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAyVMMKgsgjaELbCx_GRYJE6axqEjQWUWppX9QeXd7TSpuQRa5KDS_JS9XnmQ0teq08fr1FuL5Os5fMfwsf_RE9idsYVXaNzhcZvHmMqpWqFR9CdZf8XmraJbNecDezplzcVUYKvYwyL5r4DFacdsyaybqKMNKtt9X0P0quvJDh3gm8gaUhvrQwZixT_AWByIOhJ6b9hfX5kYRUSse_uTSD-eYYgZ9OL1Q2AgNDMAT7h8IBq5MGDwgk_JMiXz_TjTfKJlsMq39K66-" />
                                <img alt="User 3" className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-slate-900" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAK1ANkyaxB8MTjaJTpSS72xiSkqt2NevIH1ik8hyOFF0MqHT2Rib9JCYQ4R9-iNG1_lzALsg87NO6bMYwPVoCJ5-6XJvEJy1kepSPZupEVp1eySrvgwM-YTux8C2yGcIGcwtMAGeRXdyPO8ugNYY9lZYjR_S-iJQxW0oTmT-k2--sKbIdVk-ffYqupyXzeV0UXIFMoMrliN7KjUhJIFbmGel9HF6jXCG92dfz-QMml6VN9_VTlZC-miQAd77Gg49SiaB7lJc1Hihdh" />
                            </div>
                            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Joined by 10k+ users this month</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                    <div className="mb-6 text-center md:text-left">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create an account</h2>
                    </div>

                    {/* Error Message - Removed as we use toast now */}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 gap-5">
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="username">
                                    Username
                                </label>
                                <input
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200"
                                    id="username"
                                    name="username"
                                    placeholder="johndoe"
                                    type="text"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200"
                                    id="email"
                                    name="email"
                                    placeholder="john@company.com"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Phone Number (Optional) */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="phoneNumber">
                                    Phone Number
                                </label>
                                <input
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    placeholder="+91 1234567890"
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">
                                        Create Password
                                    </label>
                                </div>
                                <input
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                {/* Password Strength Indicator */}
                                {formData.password && (
                                    <div className="mt-2.5">
                                        <div className="flex space-x-1.5 h-1.5 w-full">
                                            {[...Array(4)].map((_, index) => (
                                                <div
                                                    key={index}
                                                    className={`w-1/4 rounded-full ${index < passwordStrength
                                                        ? getPasswordStrengthColor()
                                                        : 'bg-slate-200 dark:bg-slate-700'
                                                        }`}
                                                ></div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between mt-1.5">
                                            <span className="text-[10px] font-semibold text-primary uppercase">
                                                Strength: {getPasswordStrengthText()}
                                            </span>
                                            <span className="text-[10px] text-slate-400">Min. 8 characters</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="confirmPassword">
                                    Confirm Password
                                </label>
                                <input
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    placeholder="••••••••"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Terms and Conditions */}
                        <div className="flex items-start mt-2">
                            <div className="flex items-center h-5">
                                <input
                                    className="h-4 w-4 text-primary border-slate-300 dark:border-slate-600 rounded focus:ring-primary"
                                    id="terms"
                                    name="terms"
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label className="text-slate-500 dark:text-slate-400" htmlFor="terms">
                                    I agree to the <a className="text-primary hover:underline font-medium" href="#">Terms of Service</a> and <a className="text-primary hover:underline font-medium" href="#">Privacy Policy</a>.
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 transition duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="material-icons animate-spin mr-2">refresh</span>
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>

                        {/* Login Link */}
                        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
                            Already have an account?
                            <Link to="/login" className="text-primary font-bold hover:underline ml-1">Log in here</Link>
                        </p>
                    </form>
                </div>
            </div>

            {/* Background Decoration for the whole page */}
            <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-50">
                <div className="absolute top-[10%] left-[5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
};

export default Register;