import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';

const Home = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
            <SEOHead
                title="Home"
                description="Flamerscoal: Elite SEO intelligence tools for digital creators. Audits, keyword research, and rank tracking built for speed."
            />
            {/* Minimalist Background Decoration */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#ff4d00]/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-orange-900/5 rounded-full blur-[120px]" />
            </div>

            <main className="relative z-10">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-5xl"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff4d00]/10 border border-[#ff4d00]/20 text-[#ff4d00] text-xs font-bold uppercase tracking-widest mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4d00] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff4d00]"></span>
                            </span>
                            Blaze Edition v2.0
                        </div>

                        <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tightest leading-[0.9] text-white">
                            Search Intelligence <br />
                            <span className="text-[#ff4d00]">Perfected.</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                            The professional's choice for SEO monitoring, content generation, and rank tracking. Light, fast, and remarkably accurate.
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to={user ? "/dashboard" : "/signup"} className="px-10 py-4 bg-[#ff4d00] text-white font-extrabold text-lg rounded-xl hover:brightness-110 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-[#ff4d00]/20">
                                {user ? "Go to Dashboard" : "Start for Free"}
                            </Link>
                            <Link to="/seo-tools" className="px-10 py-4 bg-[#121212] text-white font-extrabold text-lg rounded-xl border border-white/5 hover:bg-[#1a1a1a] transition-all hover:scale-[1.02] active:scale-95">
                                Explore Tools
                            </Link>
                        </div>
                    </motion.div>
                </section>

                <AdBanner size="leaderboard" />

                {/* Features Section */}
                <section className="py-24 px-6 relative">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
                        >
                            <div className="max-w-2xl text-left">
                                <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Built for Performance.</h2>
                                <p className="text-gray-400 text-lg font-medium">Everything you need to dominate the SERPs, contained in one lightning-fast interface.</p>
                            </div>
                            <div className="text-right">
                                <Link to="/about" className="text-[#ff4d00] font-bold hover:underline inline-flex items-center gap-2">
                                    Our Philosophy <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </Link>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6"
                        >
                            {[
                                {
                                    title: "Rank Tracker",
                                    desc: "Native localized scraping with GL/HL support. Accuracy without the enterprise cost.",
                                    icon: "🎯",
                                    tag: "ACCURACY"
                                },
                                {
                                    title: "AI Blog Writer",
                                    desc: "Generate professional-grade content with Vertex AI. Structured, semantic, and human-ready.",
                                    icon: "✍️",
                                    tag: "AI POWERED"
                                },
                                {
                                    title: "Site Auditor",
                                    desc: "12+ technical SEO checks performed in seconds. Deep crawl analysis with zero bloat.",
                                    icon: "🔍",
                                    tag: "CLEAN CODE"
                                }
                            ].map((feature, index) => (
                                <motion.div
                                    key={index}
                                    variants={fadeInUp}
                                    className="modrinth-card p-10 flex flex-col items-start group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <div className="text-8xl font-black grayscale">{feature.icon}</div>
                                    </div>

                                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-black tracking-widest text-[#ff4d00] mb-6">
                                        {feature.tag}
                                    </span>

                                    <div className="text-4xl mb-6 bg-[#050505] p-4 rounded-2xl border border-white/5 shadow-inner">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-2xl font-black mb-4 text-white group-hover:text-[#ff4d00] transition-colors">{feature.title}</h3>
                                    <p className="text-gray-400 font-medium leading-relaxed mb-8">{feature.desc}</p>

                                    <div className="mt-auto pt-4 flex items-center gap-2 text-sm font-bold text-gray-500 group-hover:text-white transition-colors">
                                        Learn more <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                <AdBanner size="leaderboard" />

                {/* Light Trust Section */}
                <section className="py-20 border-y border-white/5 bg-[#050505]">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                            {[
                                { number: "10k+", label: "Reports Generated" },
                                { number: "500+", label: "Daily Users" },
                                { number: "0.2s", label: "Latency" },
                                { number: "24/7", label: "Uptime" }
                            ].map((stat, i) => (
                                <div key={i} className="text-center group">
                                    <div className="text-4xl md:text-5xl font-black text-white mb-2 group-hover:text-[#ff4d00] transition-colors">{stat.number}</div>
                                    <div className="text-gray-600 font-bold uppercase tracking-widest text-xs">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-32 text-center px-6 relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#ff4d00]/5 blur-[150px] pointer-events-none" />
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-3xl mx-auto relative z-10"
                    >
                        <h2 className="text-4xl md:text-7xl font-black mb-8 tracking-tightest leading-tight">Elite SEO. <br /><span className="text-[#ff4d00]">Simplified.</span></h2>
                        <p className="text-xl text-gray-400 font-medium mb-12 leading-relaxed">Join the next generation of digital creators using Flamers Coal to scale their presence with precision.</p>
                        <Link to={user ? "/dashboard" : "/signup"} className="inline-block px-12 py-5 bg-white text-black font-black text-xl rounded-xl hover:bg-gray-200 transition-all hover:scale-[1.05] active:scale-95 shadow-2xl">
                            Create Account
                        </Link>
                    </motion.div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Home;
