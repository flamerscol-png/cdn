import React from 'react';
import { Link } from 'react-router-dom';

/**
 * PromoAd - Internal self-promotional ad banners for FlamerCoal pricing.
 * 
 * Props:
 *   variant: "leaderboard" (728x90) | "rectangle" (300x250) | "banner" (468x60) | "strip"
 */
const PromoAd = ({ variant = "leaderboard", className = "" }) => {

    if (variant === "rectangle") {
        return (
            <div className={`flex justify-center my-6 ${className}`}>
                <Link to="/pricing" className="block w-[300px] group">
                    <div className="relative h-[250px] rounded-2xl overflow-hidden border border-[#ff4d00]/20 bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#0a0a0a] flex flex-col items-center justify-center text-center p-6 transition-all duration-300 group-hover:border-[#ff4d00]/40 group-hover:shadow-lg group-hover:shadow-[#ff4d00]/10">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#ff4d00] to-transparent opacity-60" />
                        <div className="absolute inset-0 bg-[#ff4d00]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="text-4xl mb-3">🔥</div>
                            <h3 className="text-xl font-black text-white mb-2 tracking-tight">Unlock Premium</h3>
                            <p className="text-xs text-gray-400 font-medium mb-4 leading-relaxed">Get unlimited access to all SEO & YouTube tools</p>
                            <div className="inline-block px-5 py-2 bg-[#ff4d00] text-white text-xs font-black uppercase tracking-widest rounded-lg group-hover:brightness-110 transition-all">
                                View Plans →
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        );
    }

    if (variant === "strip") {
        return (
            <div className={`my-6 ${className}`}>
                <Link to="/pricing" className="block group">
                    <div className="relative w-full rounded-2xl overflow-hidden border border-[#ff4d00]/15 bg-gradient-to-r from-[#ff4d00]/5 via-[#0a0a0a] to-[#ff4d00]/5 py-4 px-6 flex items-center justify-between transition-all duration-300 group-hover:border-[#ff4d00]/30 group-hover:shadow-lg group-hover:shadow-[#ff4d00]/5">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#ff4d00]/40 to-transparent" />
                        <div className="flex items-center gap-4">
                            <span className="text-2xl">⚡</span>
                            <div>
                                <span className="text-sm font-black text-white">Supercharge your workflow</span>
                                <span className="text-xs text-gray-500 font-bold ml-2">• Starting at just ₹250 / $3</span>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#ff4d00]/10 border border-[#ff4d00]/20 rounded-lg text-[#ff4d00] text-xs font-black uppercase tracking-widest group-hover:bg-[#ff4d00] group-hover:text-white transition-all">
                            Upgrade Now 🔥
                        </div>
                    </div>
                </Link>
            </div>
        );
    }

    if (variant === "banner") {
        return (
            <div className={`flex justify-center my-6 ${className}`}>
                <Link to="/pricing" className="block w-full max-w-[468px] group">
                    <div className="relative h-[60px] rounded-xl overflow-hidden border border-[#ff4d00]/20 bg-gradient-to-r from-[#ff4d00]/10 via-[#0a0a0a] to-[#ff4d00]/10 flex items-center justify-center gap-4 px-6 transition-all duration-300 group-hover:border-[#ff4d00]/40">
                        <span className="text-lg">🔥</span>
                        <span className="text-sm font-black text-white tracking-tight">Get More Coal — Upgrade Your Plan</span>
                        <span className="px-3 py-1 bg-[#ff4d00] text-white text-[10px] font-black uppercase tracking-widest rounded group-hover:brightness-110 transition-all">Go</span>
                    </div>
                </Link>
            </div>
        );
    }

    // Default: leaderboard (728x90)
    return (
        <div className={`flex justify-center my-6 ${className}`}>
            <Link to="/pricing" className="block w-full max-w-[728px] group">
                <div className="relative h-[90px] rounded-2xl overflow-hidden border border-[#ff4d00]/15 bg-gradient-to-r from-[#0a0a0a] via-[#121212] to-[#0a0a0a] flex items-center justify-between px-8 transition-all duration-300 group-hover:border-[#ff4d00]/30 group-hover:shadow-lg group-hover:shadow-[#ff4d00]/10">
                    {/* Top gradient line */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#ff4d00] to-transparent opacity-50" />
                    {/* Hover glow */}
                    <div className="absolute inset-0 bg-[#ff4d00]/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10 flex items-center gap-5">
                        <div className="w-12 h-12 bg-[#ff4d00]/10 rounded-xl flex items-center justify-center border border-[#ff4d00]/20 flex-shrink-0">
                            <span className="text-2xl">🔥</span>
                        </div>
                        <div>
                            <h4 className="text-base font-black text-white tracking-tight leading-tight">Need More Coal? Upgrade to Premium</h4>
                            <p className="text-[11px] text-gray-500 font-bold mt-0.5">Unlimited AI blog posts, strategy reports, and priority access — starting at ₹250 / $3</p>
                        </div>
                    </div>

                    <div className="relative z-10 hidden sm:flex items-center gap-2 px-5 py-2.5 bg-[#ff4d00] text-white text-xs font-black uppercase tracking-widest rounded-xl group-hover:brightness-110 transition-all flex-shrink-0 shadow-lg shadow-[#ff4d00]/20">
                        View Plans →
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default PromoAd;
