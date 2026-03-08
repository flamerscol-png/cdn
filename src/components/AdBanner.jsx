import React from 'react';

/**
 * AdBanner - Reusable ad placeholder.
 * Replace the inner <div> with your real ad <script> tag when ready.
 * 
 * Props:
 *   size: "leaderboard" (728x90) | "rectangle" (300x250) | "banner" (468x60)
 */
const AdBanner = ({ size = "leaderboard", className = "" }) => {
    const sizes = {
        leaderboard: { w: "w-full max-w-[728px]", h: "h-[90px]", label: "728 × 90 — Leaderboard" },
        rectangle: { w: "w-[300px]", h: "h-[250px]", label: "300 × 250 — Rectangle" },
        banner: { w: "w-full max-w-[468px]", h: "h-[60px]", label: "468 × 60 — Banner" },
    };

    const { w, h, label } = sizes[size] || sizes.leaderboard;

    return (
        <div className={`flex justify-center my-6 ${className}`}>
            <div className={`${w} ${h} flex items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-gray-700 text-xs font-bold uppercase tracking-widest select-none`}>
                {/* ── REPLACE THIS BLOCK WITH YOUR REAL AD SCRIPT ── */}
                <span>AD · {label}</span>
            </div>
        </div>
    );
};

export default AdBanner;
