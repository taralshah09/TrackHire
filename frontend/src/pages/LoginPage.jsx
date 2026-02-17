import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const location = useLocation();
    const Navigate = useNavigate();

    const [formData, setFormData] = useState({
        loginIdentifier: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // setError(''); // Clear error when user types
    };

    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     setLoading(true);

    //     try {
    //         const response = await fetch('http://localhost:8081/api/auth/login', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(formData)
    //         });

    //         const data = await response.json();

    //         // Debug: Log the response to see what we're getting
    //         // console.log('Login response:', data);

    //         if (response.ok) {
    //             if (data.token && data.refreshToken) {
    //                 console.log('Login successful, data received:', data);
    //                 login(data);
    //                 navigate('/dashboard');
    //             } else {
    //                 console.error('Missing tokens in response:', data);
    //                 toast.error('Invalid response from server. Please try again.');
    //             }
    //         } else {
    //             toast.error(data.message || 'Invalid credentials');
    //         }
    //     } catch (err) {
    //         console.error('Login error:', err);
    //         toast.error('Unable to connect to server. Please try again.');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8081/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                if (data.token && data.refreshToken) {
                    console.log('✅ Login successful');
                    const loginSuccess = login(data);

                    if (loginSuccess !== false) {
                        toast.success('Login successful!');

                        // Redirect to the page they were trying to access, or dashboard
                        const from = location.state?.from?.pathname || '/dashboard';
                        navigate(from, { replace: true });
                    } else {
                        toast.error('Failed to save login session');
                    }
                } else {
                    console.error('❌ Missing tokens in response');
                    toast.error('Invalid response from server. Please try again.');
                }
            } else {
                toast.error(data.message || 'Invalid credentials');
            }
        } catch (err) {
            console.error('❌ Login error:', err);
            toast.error('Unable to connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
            {/* Central Auth Card */}
            <main className="w-full max-w-5xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                {/* Left Panel: Brand & Illustration */}
                <section className="hidden md:flex md:w-1/2 bg-primary/10 dark:bg-primary/5 p-12 flex-col justify-between relative overflow-hidden">
                    {/* Background Decorative Elements */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/10"></div>
                    <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 rounded-full bg-primary/5"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                <span className="material-icons text-white">explore</span>
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">CareerPilot</span>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
                            Take the captain's seat in your <span className="text-primary">career journey.</span>
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            The all-in-one platform to organize, track, and land your next big role.
                        </p>
                    </div>
                    <div className="relative z-10 mt-5">
                        <img
                            alt="Dashboard preview showing job tracking metrics"
                            className="rounded-xl shadow-lg border border-white/20 h-[350px] w-full"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeQUeNONcvSVIYOoy3n6ozX4mP-WcIHFgNn80Bky9AkkP42CS7odE9wSXsXKoGsNexg9Qpl0QFthfpsWmoEQJkxDWGZ1oloDWKzZhabH9pYfnG2UZsGnD3OkWTJkcS4Uhy3qIlZyIIU9sjQdN3pqaMbbK8c9K3LrvEWhffjzRU_9xfdBnia9pTxS_xrr6ctEgyHNH-ouAso7Na-_WaOFm57HDPUb6s6kKZ_HiyIeF2F_f64B0Cqy1AHI22bcQlLwHLkk_NZvNy8cMg"
                        />
                    </div>
                </section>

                {/* Right Panel: Login Form */}
                <section className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
                    <div className="max-w-md mx-auto w-full">
                        {/* Mobile Logo */}
                        <div className="flex md:hidden items-center gap-2 mb-8">
                            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                                <span className="material-icons text-white text-sm">explore</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">CareerPilot</span>
                        </div>
                        <div className="mb-10">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
                            <p className="text-gray-500 dark:text-gray-400">Please enter your details to login.</p>
                        </div>

                        {/* Error Message - Removed as we use toast now */}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email/Username Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="loginIdentifier">
                                    Email or Username
                                </label>
                                <input
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                    id="loginIdentifier"
                                    name="loginIdentifier"
                                    placeholder="name@company.com"
                                    required
                                    type="text"
                                    value={formData.loginIdentifier}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Password Input */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">
                                        Password
                                    </label>
                                </div>
                                <div className="relative">
                                    <input
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                        id="password"
                                        name="password"
                                        placeholder="••••••••"
                                        required
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <span className="material-icons text-xl">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Login Button */}
                            <button
                                className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="material-icons animate-spin mr-2">refresh</span>
                                        Signing in...
                                    </>
                                ) : (
                                    'Login'
                                )}
                            </button>

                            {/* Divider */}
                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                                <span className="flex-shrink mx-4 text-gray-400 text-sm font-medium">Or continue with</span>
                                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                            </div>
                        </form>

                        {/* Footer Sign Up Link */}
                        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
                            Don't have an account?
                            <Link to="/register" className="font-bold text-primary hover:underline ml-1">Register</Link>
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default LoginPage;