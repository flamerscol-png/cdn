import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase';
import { submitSupportRequest } from '../utils/db';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import AdBanner from '../components/AdBanner';
import { useNavigate } from 'react-router-dom';

const Support = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        type: 'Missing Coal',
        details: '',
        transactionId: ''
    });

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u) => {
            if (u) {
                setUser(u);
                setFormData(prev => ({ ...prev, email: u.email }));
            }
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("[Support] 🚀 Submission started (Text-only Mode)");

        if (!user) {
            setError("Please log in to submit a support request.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log("[Support] 💾 Writing to database...");
            await submitSupportRequest(user.uid, formData);
            console.log("[Support] 🎉 Successfully submitted!");
            setSuccess(true);
            setLoading(false);
        } catch (err) {
            console.error("[Support] ❌ Submission FAILED:", err);
            setError(`Submission Failed: ${err.message}`);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#ff4d00]/30">
            <SEOHead 
                title="Support Center"
                description="Report missing coal or payment issues to the FlamerCoal support team."
            />
            <Navbar />
            
            <main className="relative z-10 pt-32 pb-24 px-6 md:px-12 max-w-4xl mx-auto">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[#ff4d00]/5 blur-[120px] pointer-events-none" />

                <div className="text-center mb-16 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="inline-block px-3 py-1 rounded-lg bg-[#ff4d00]/10 border border-[#ff4d00]/20 text-[#ff4d00] text-xs font-black uppercase tracking-widest mb-4">
                            Support Center
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 text-white">
                            Missing <span className="text-[#ff4d00]">Coal?</span>
                        </h1>
                        <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
                            Report missing Coal rewards or payment issues. Our team verifies all claims against transaction logs manually.
                        </p>
                    </motion.div>
                </div>

                <AnimatePresence mode="wait">
                    {success ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="modrinth-card p-12 text-center border-[#ff4d00]/20"
                        >
                            <div className="text-6xl mb-6">✅</div>
                            <h2 className="text-3xl font-black mb-4">Claim Received</h2>
                            <p className="text-gray-400 font-medium mb-8">We've logged your request. Please allow up to 24 hours for manual verification and Coal release.</p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-8 py-3 bg-[#ff4d00] text-white font-black rounded-xl hover:brightness-110 transition-all active:scale-95"
                            >
                                Return to Dashboard
                            </button>
                        </motion.div>
                    ) : (
                        <motion.form
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onSubmit={handleSubmit}
                            className="modrinth-card p-8 md:p-12 border-white/5 space-y-8"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Account Email</label>
                                    <input
                                        type="email"
                                        required
                                        disabled
                                        value={formData.email}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-gray-400 font-bold opacity-60"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Issue Category</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-4 text-white font-bold focus:border-[#ff4d00] outline-none transition-colors appearance-none"
                                    >
                                        <option>Missing Coal</option>
                                        <option>Payment Error</option>
                                        <option>Account Sync Issue</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Transaction ID / UPI Ref</label>
                                <input
                                    type="text"
                                    placeholder="Enter your transaction reference number"
                                    value={formData.transactionId}
                                    onChange={(e) => setFormData({...formData, transactionId: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-bold focus:border-[#ff4d00] outline-none transition-colors placeholder:text-gray-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Message Details</label>
                                <textarea
                                    required
                                    rows="5"
                                    placeholder="Please describe exactly what happened..."
                                    value={formData.details}
                                    onChange={(e) => setFormData({...formData, details: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-bold focus:border-[#ff4d00] outline-none transition-colors placeholder:text-gray-700 resize-none"
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold rounded-xl text-center">
                                    ⚠️ {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-5 bg-[#ff4d00] text-white font-black text-lg rounded-xl transition-all shadow-xl shadow-[#ff4d00]/20 flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.98]'}`}
                            >
                                {loading ? 'Submitting...' : 'Submit Support Ticket 🔥'}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                <AdBanner size="leaderboard" className="mt-8" />

                <div className="mt-12 text-center">
                    <p className="text-gray-600 text-xs font-black uppercase tracking-widest">
                        FlamerCoal Support System v1.1 • Response time: &lt;24h
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Support;
