import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';

const NotFound = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            <SEOHead 
                title="404 - Page Not Found" 
                description="The page you are looking for does not exist on FlamerCoal. Return to home for elite SEO and YouTube tools." 
            />
            
            {/* Background Mesh */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#ff4d00]/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-900/10 rounded-full blur-[150px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 max-w-2xl px-4"
            >
                <div className="text-[#ff4d00] font-black text-9xl mb-8 tracking-tighter opacity-80 select-none">
                    404
                </div>
                
                <h1 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tight">
                    Lost in the <br />
                    <span className="gradient-text">Search Abyss?</span>
                </h1>

                <p className="text-xl text-gray-500 mb-12 font-medium max-w-lg mx-auto leading-relaxed">
                    The intelligence you are looking for has been moved or purged. <br />
                    Let's get you back to the command center.
                </p>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/" className="px-10 py-4 bg-[#ff4d00] text-white font-extrabold text-lg rounded-xl hover:brightness-110 transition-all hover:scale-[1.05] active:scale-95 shadow-2xl shadow-[#ff4d00]/20">
                        Return Home
                    </Link>
                    <Link to="/seo-tools" className="px-10 py-4 bg-[#121212] text-white font-extrabold text-lg rounded-xl border border-white/5 hover:bg-[#1a1a1a] transition-all hover:scale-[1.05] active:scale-95">
                        Back to Tools
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default NotFound;
