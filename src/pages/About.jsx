import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';

const About = () => {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-[#ff4d00]/30">
            <SEOHead 
                title="About FlamerCoal | Our Mission & Search Intelligence Philosophy" 
                description="Learn about FlamerCoal, the next-gen search intelligence platform built for digital creators, SEO experts, and growth hackers."
                keywords="about flamercoal, SEO tool mission, search intelligence platform, youtube growth experts"
            />
            <Navbar />
            <main className="pt-32 pb-24 px-6 md:px-12 max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-20"
                >
                    <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tightest">
                        We build <span className="text-[#ff4d00]">Intelligence.</span>
                    </h1>
                    <p className="text-gray-500 text-xl max-w-2xl mx-auto font-medium">
                        FlamerCoal is a precision-engineered platform for SEO experts, marketers, and business owners.
                    </p>
                </motion.div>

                <AdBanner size="leaderboard" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-black text-white">Our Mission</h2>
                        <p className="text-gray-400 leading-relaxed">
                            In an era of bloated software and complex interfaces, we chose a different path. FlamerCoal was born out of the need for speed and precision. Every tool we build is designed to deliver maximum insight with minimum friction.
                        </p>
                        <p className="text-gray-400 leading-relaxed">
                            Whether you're auditing a site, tracking rankings, or generating content, we ensure your data is accurate and your workflow is seamless.
                        </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-10 flex flex-col justify-center">
                        <div className="text-5xl mb-6">⚙️</div>
                        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">Performance First</h3>
                        <p className="text-sm text-gray-500 font-bold italic">"We believe that the best tools are the ones that get out of your way and let you focus on what matters: growth."</p>
                    </div>
                </div>

                <div className="modrinth-card p-12 text-center border-[#ff4d00]/20 bg-gradient-to-b from-[#ff4d00]/5 to-transparent">
                    <h2 className="text-4xl font-black mb-4">Join the Elite.</h2>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">Ready to scale your search engine performance with data you can trust?</p>
                    <a href="/signup" className="inline-block bg-[#ff4d00] text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-transform">
                        Get Started for Free
                    </a>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default About;
