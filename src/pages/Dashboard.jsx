import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { onValue, ref } from 'firebase/database';
import { auth, database } from '../firebase';
import { addPowers } from '../utils/db';
import { signOut } from 'firebase/auth';
import { motion } from 'framer-motion';
import AdBanner from '../components/AdBanner';
import PromoAd from '../components/PromoAd';
import SlideAd from '../components/SlideAd';
import SEOHead from '../components/SEOHead';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2000);

        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userRef = ref(database, `users/${currentUser.uid}`);
                onValue(userRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) setUserData(data);
                    setLoading(false);
                }, (error) => {
                    console.error("Database read failed (Check Rules):", error);
                    setLoading(false);
                });
            } else {
                navigate('/login');
            }
        });

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, [navigate]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-sans">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="w-10 h-10 border-4 border-white/5 border-t-[#ff4d00] rounded-full animate-spin mb-6"></div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Syncing with FlamerCoal...</p>
                </motion.div>
            </div>
        );
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-[#ff4d00]/30">
            <SEOHead 
                title="Dashboard" 
                description="Manage your FlamerCoal account, track your coal balance, and access intelligent SEO tools." 
            />
            {/* Background Decoration */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#ff4d00]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-30%] right-[-15%] w-[40%] h-[40%] bg-orange-900/3 rounded-full blur-[100px]" />
            </div>

            <main className="relative z-10 p-6 pt-24 md:pt-32 max-w-7xl mx-auto w-full">
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="mb-16"
                >
                    {/* Personalized Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <motion.p variants={item} className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-2">
                                {getGreeting()}, {userData?.displayName || user.email.split('@')[0]}
                            </motion.p>
                            <motion.h1 variants={item} className="text-4xl md:text-6xl font-black tracking-tight">
                                System <span className="gradient-text">Dashboard</span>
                            </motion.h1>
                        </div>
                        <motion.div variants={item} className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-full bg-[#121212] border border-white/10 flex items-center justify-center text-[#ff4d00] font-black">
                                {user.email[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="text-sm font-black text-white">{userData?.displayName || user.email.split('@')[0]}</div>
                                <div className="text-[10px] uppercase font-black tracking-widest text-[#ff4d00] flex items-center gap-2">
                                    {userData?.plan || 'Standard'} Account
                                    {userData?.paymentStatus === 'pending_verification' && (
                                        <span className="bg-[#ff4d00]/10 text-[#ff4d00] px-2 py-0.5 rounded border border-[#ff4d00]/20 animate-pulse">
                                            Pending Verification
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Quick Stats Row */}
                    <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-center">
                            <div className="text-2xl font-black text-[#ff4d00]">{userData?.powers || 0}</div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Coal Balance</div>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-center">
                            <div className="text-2xl font-black text-green-400">{userData?.plan || 'Free'}</div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Active Plan</div>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-green-400 pulse-dot"></div>
                                <span className="text-2xl font-black text-white">Live</span>
                            </div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">System Status</div>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-center">
                            <div className="text-2xl font-black text-white">5</div>
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Tools Available</div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Coal Card */}
                        <motion.div variants={item} className="modrinth-card p-8 flex flex-col items-start relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-6xl text-[#ff4d00]">🔥</span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">Coal Reserve</span>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-4xl font-black text-[#ff4d00]">{userData?.powers || 0}</span>
                                <span className="text-xl">🔥</span>
                            </div>
                            <p className="text-sm text-gray-400 font-medium mb-8">Ready for combustion.</p>
                            <button
                                onClick={() => navigate('/earn-coal')}
                                className="mt-auto px-6 py-2.5 bg-[#ff4d00]/10 border border-[#ff4d00]/20 text-[#ff4d00] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#ff4d00] hover:text-white transition-all active:scale-95 shadow-lg shadow-[#ff4d00]/5"
                            >
                                Refuel & Mine 🔥
                            </button>
                        </motion.div>

                        {/* Plan Card */}
                        <motion.div variants={item} className="modrinth-card p-8 flex flex-col items-start relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">Service Tier</span>
                            <h3 className="text-3xl font-black text-white mb-2">{userData?.plan || 'Free'}</h3>
                            <p className="text-sm text-gray-400 font-medium mb-8">Access level across all SEO modules.</p>
                            <Link to="/pricing" className="mt-auto flex items-center gap-2 text-sm font-black text-[#ff4d00] hover:text-white transition-colors group/btn">
                                Upgrade Plan <span className="transition-transform group-hover/btn:translate-x-1">&rarr;</span>
                            </Link>
                        </motion.div>

                        {/* Support Card */}
                        <motion.div variants={item} className="modrinth-card p-8 flex flex-col items-start relative overflow-hidden group">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">Concierge</span>
                            <h3 className="text-xl font-black text-white mb-2">Need Assistance?</h3>
                            <p className="text-sm text-gray-400 font-medium mb-8">Report missing Coal or system issues.</p>
                            <Link
                                to="/support"
                                className="mt-auto px-6 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                            >
                                Open Support Ticket
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>

                <SlideAd />

                {/* Navigation Tools */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-2xl font-black tracking-tight">Active <span className="text-[#ff4d00]">Modules</span></h2>
                        <div className="h-[1px] flex-grow bg-white/5"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: "✍️", title: "AI Blog Writer", desc: "Generate professional SEO content instantly.", cost: 150, link: "/tools/blog-writer", tag: "AI POWERED" },
                            { icon: "🎨", title: "Thumbnail Suggester", desc: "AI-powered viral visual concepts and psychology.", cost: 50, link: "/tools/youtube-thumbnail-suggester", tag: "CREATIVE AI" },
                            { icon: "🗺️", title: "Strategy Builder", desc: "Scale with human-viral psychology logic.", cost: 100, link: "/tools/youtube-strategy-builder", tag: "STRATEGIC" },
                            { icon: "🛡️", title: "Site Auditor", desc: "Deep crawl analysis and technical health.", cost: 50, link: "/tools/site-auditor", tag: "TECHNICAL" }
                        ].map((tool, index) => (
                            <Link to={tool.link} key={index} className="h-full">
                                <motion.div
                                    whileHover={{ y: -4 }}
                                    className="modrinth-card p-10 h-full flex flex-col items-start group relative"
                                >
                                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-black tracking-widest text-[#ff4d00] mb-6">
                                        {tool.tag}
                                    </span>
                                    <div className="text-4xl mb-6 bg-[#050505] p-4 rounded-2xl border border-white/5 shadow-inner transition-transform group-hover:scale-110">
                                        {tool.icon}
                                    </div>
                                    <h3 className="text-2xl font-black mb-4 group-hover:text-[#ff4d00] transition-colors">{tool.title}</h3>
                                    <p className="text-gray-400 font-medium leading-relaxed mb-8">{tool.desc}</p>
                                    <div className="mt-auto pt-4 flex justify-between items-center w-full uppercase tracking-widest text-[10px] font-black">
                                        <span className="text-gray-600">Cost: {tool.cost} 🔥</span>
                                        <span className="text-[#ff4d00]">Initialize &rarr;</span>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </motion.div>

                {/* Utility & Business Tools */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-16"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-2xl font-black tracking-tight">Utility & <span className="text-blue-500">Business</span></h2>
                        <div className="h-[1px] flex-grow bg-white/5"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link to="/converters">
                            <motion.div
                                whileHover={{ y: -4 }}
                                className="modrinth-card p-10 h-full flex items-center gap-8 group relative"
                            >
                                <div className="text-4xl bg-[#050505] p-5 rounded-2xl border border-white/5 shadow-inner transition-transform group-hover:scale-110">
                                    🔄
                                </div>
                                <div className="flex-grow">
                                    <h3 className="text-2xl font-black mb-1 group-hover:text-blue-400 transition-colors">Format Converters</h3>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">JSON to CSV · Data Size · Units</p>
                                </div>
                                <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</div>
                            </motion.div>
                        </Link>

                        <Link to="/calculators">
                            <motion.div
                                whileHover={{ y: -4 }}
                                className="modrinth-card p-10 h-full flex items-center gap-8 group relative"
                            >
                                <div className="text-4xl bg-[#050505] p-5 rounded-2xl border border-white/5 shadow-inner transition-transform group-hover:scale-110">
                                    📊
                                </div>
                                <div className="flex-grow">
                                    <h3 className="text-2xl font-black mb-1 group-hover:text-green-400 transition-colors">Business Calculators</h3>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">ROI · Profit Margin · BMI</p>
                                </div>
                                <div className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</div>
                            </motion.div>
                        </Link>
                    </div>
                </motion.div>

                <PromoAd variant="strip" className="mt-8" />
            </main>
        </div>
    );
};

export default Dashboard;
