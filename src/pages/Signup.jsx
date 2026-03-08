import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { createUserProfile } from '../utils/db';
import { motion } from 'framer-motion';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleGoogleSignup = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            navigate('/dashboard');
            // Run DB creation in background
            createUserProfile(result.user).catch(e => console.error("BG Profile Create Error:", e));
        } catch (err) {
            setError('Failed to sign up with Google. ' + err.message);
            console.error(err);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            navigate('/dashboard');
            // Run DB creation in background
            createUserProfile(result.user).catch(e => console.error("BG Profile Create Error:", e));
        } catch (err) {
            setError('Failed to create an account. ' + err.message);
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#ff4d00]/5 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md bg-[#121212]/50 p-10 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl relative z-10"
            >
                <div className="text-center mb-8">
                    <motion.h2
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-black mb-2 tracking-tight"
                    >
                        Create <span className="text-[#ff4d00]">Account</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-400"
                    >
                        Join Flamers Coal today
                    </motion.p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSignup} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#ff4d00] focus:ring-1 focus:ring-[#ff4d00] transition-all placeholder-gray-700"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#ff4d00] focus:ring-1 focus:ring-[#ff4d00] transition-all placeholder-gray-700"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Confirm Password</label>
                        <input
                            type="password"
                            required
                            className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#ff4d00] focus:ring-1 focus:ring-[#ff4d00] transition-all placeholder-gray-700"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-[#ff4d00] text-white font-black py-4 rounded-xl hover:brightness-110 transition-all shadow-xl shadow-[#ff4d00]/20"
                    >
                        Sign Up
                    </motion.button>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-800"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-black/0 text-gray-500 bg-gray-900/0 backdrop-blur-sm">Or continue with</span>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGoogleSignup}
                        className="mt-6 w-full bg-transparent border border-gray-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                        Google
                    </motion.button>
                </div>

                <p className="mt-8 text-center text-xs font-black uppercase tracking-widest text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-[#ff4d00] hover:text-white transition-colors">
                        Log in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Signup;
