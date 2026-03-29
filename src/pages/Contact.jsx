import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';

const Contact = () => {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-[#ff4d00]/30">
            <SEOHead 
                title="Contact Support" 
                description="Get in touch with the FlamerCoal team for support, business inquiries, or feature requests." 
            />
            <Navbar />
            <main className="pt-32 pb-24 px-6 md:px-12 max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black mb-6 tracking-tightest leading-none"
                    >
                        Get in <span className="text-[#ff4d00]">Touch.</span>
                    </motion.h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto font-medium leading-relaxed">
                        Have questions about our tools or need support with your account? Our team is ready to help.
                    </p>
                </div>

                <div className="modrinth-card p-12 border-white/5 bg-gradient-to-br from-[#ff4d00]/5 to-transparent relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#ff4d00]" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#ff4d00] mb-2">Direct Contact</h3>
                                <p className="text-2xl font-black text-white hover:text-[#ff4d00] transition-colors break-all">
                                    support@flamercoal.com
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Office Hours</h3>
                                <p className="text-lg font-bold text-gray-400">Monday — Friday<br />09:00 — 18:00 EST</p>
                            </div>
                        </div>

                        <div className="bg-black/40 border border-white/5 rounded-2xl p-8 flex flex-col justify-center items-center text-center">
                            <div className="w-16 h-16 bg-[#ff4d00]/10 rounded-full flex items-center justify-center mb-6 border border-[#ff4d00]/20">
                                <span className="text-3xl">📧</span>
                            </div>
                            <h4 className="text-xl font-black mb-2 tracking-tight">Email Support</h4>
                            <p className="text-sm text-gray-500 font-bold mb-6">Average response time: 2-4 hours during business hours.</p>
                            <a
                                href="mailto:support@flamercoal.com"
                                className="w-full bg-[#ff4d00] text-white py-4 rounded-xl font-black uppercase tracking-widest text-center hover:brightness-110 active:scale-[0.98] transition-all"
                            >
                                Send Message
                            </a>
                        </div>
                    </div>
                </div>

                <AdBanner size="leaderboard" className="mt-8" />

                <div className="mt-12 text-center text-gray-600 text-[10px] font-black uppercase tracking-tighter">
                    FlamerCoal — Precision Search Intelligence • Built for the Fast Lane
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Contact;
