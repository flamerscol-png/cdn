import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaTimes, FaFire, FaGem, FaRocket } from 'react-icons/fa';

const PromoPopup = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const hasBeenShown = sessionStorage.getItem('promo_popup_shown');
        if (!hasBeenShown) {
            const timer = setTimeout(() => {
                setIsVisible(true);
                sessionStorage.setItem('promo_popup_shown', 'true');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, []);

    const closePopup = () => setIsVisible(false);

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closePopup}
                        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-[#0a0a0a] border border-[#ff4d00]/30 rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(255,77,0,0.2)] z-10"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#ff4d00]/10 blur-[80px] rounded-full -mr-20 -mt-20" />
                        
                        <button 
                            onClick={closePopup}
                            className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors z-30 p-2"
                        >
                            <FaTimes size={20} />
                        </button>

                        <div className="relative z-20 p-10 md:p-14 flex flex-col items-center text-center">
                            <motion.div 
                                initial={{ rotate: -10, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="w-20 h-20 bg-gradient-to-br from-[#ff4d00]/20 to-[#ff4d00]/5 border border-[#ff4d00]/30 rounded-[2rem] flex items-center justify-center mb-8"
                            >
                                <FaFire className="text-[#ff4d00] text-4xl" />
                            </motion.div>

                            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tighter leading-none">
                                Ignite Your <br />
                                <span className="text-[#ff4d00]">Strategy 🔥</span>
                            </h2>
                            
                            <p className="text-gray-400 font-medium text-lg mb-8 leading-relaxed max-w-sm">
                                Get <span className="text-white font-black">500 🔥 Coal</span> for just <span className="text-white font-black text-xl ml-1">₹250 / $3</span>
                            </p>

                            <div className="grid grid-cols-2 gap-4 w-full mb-10">
                                <div className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-3 rounded-2xl">
                                    <FaRocket className="text-[#ff4d00] text-xs" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Fast Pass</span>
                                </div>
                                <div className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-3 rounded-2xl">
                                    <FaGem className="text-[#ff4d00] text-xs" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Premium Tool</span>
                                </div>
                            </div>

                            <Link 
                                to="/pricing" 
                                onClick={closePopup}
                                className="w-full bg-[#ff4d00] text-white py-5 rounded-2xl font-black text-xl tracking-tight hover:brightness-110 active:scale-[0.98] transition-all shadow-xl shadow-[#ff4d00]/30 flex items-center justify-center gap-3 group"
                            >
                                Claim Offer Now
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                            
                            <button 
                                onClick={closePopup}
                                className="mt-6 text-gray-600 hover:text-gray-400 font-bold text-xs uppercase tracking-widest transition-colors"
                            >
                                No thanks, I'll pay more later
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PromoPopup;
