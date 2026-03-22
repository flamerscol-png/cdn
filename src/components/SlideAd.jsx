import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * SlideAd - Auto-rotating slideshow ad showcasing pricing features.
 * Works like a "video" ad but is pure CSS + React. Zero dependencies.
 */
const SlideAd = ({ className = "" }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const slides = [
        {
            emoji: "🔥",
            headline: "500 Coal for just ₹250 / $3",
            sub: "Power all your SEO & YouTube tools instantly",
            accent: "#ff4d00",
            tag: "BEST VALUE"
        },
        {
            emoji: "✍️",
            headline: "AI Blog Writer",
            sub: "Generate 2000+ word SEO articles in seconds",
            accent: "#ff6b00",
            tag: "AI POWERED"
        },
        {
            emoji: "🎯",
            headline: "Live Rank Tracker",
            sub: "Track Google positions by country in real-time",
            accent: "#ff4d00",
            tag: "ACCURATE"
        },
        {
            emoji: "🗺️",
            headline: "YouTube Strategy Builder",
            sub: "AI-powered growth plans with viral psychology",
            accent: "#ff8c00",
            tag: "STRATEGIC"
        },
        {
            emoji: "🛡️",
            headline: "16-Point Site Auditor",
            sub: "Deep technical SEO health check for any domain",
            accent: "#ff4d00",
            tag: "TECHNICAL"
        },
        {
            emoji: "💎",
            headline: "Premium Access",
            sub: "All tools unlocked • Priority queue • 24hr support",
            accent: "#ff6b00",
            tag: "UPGRADE NOW"
        }
    ];

    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [isPaused, slides.length]);

    const slide = slides[currentSlide];

    return (
        <div className={`flex justify-center my-6 ${className}`}>
            <Link
                to="/pricing"
                className="block w-full max-w-[728px] group"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div className="relative h-[110px] md:h-[100px] rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a] transition-all duration-500 group-hover:border-[#ff4d00]/30 group-hover:shadow-lg group-hover:shadow-[#ff4d00]/10">
                    {/* Animated gradient top line */}
                    <div
                        className="absolute top-0 left-0 h-[2px] transition-all duration-700 ease-out"
                        style={{
                            width: `${((currentSlide + 1) / slides.length) * 100}%`,
                            background: `linear-gradient(90deg, ${slide.accent}, ${slide.accent}80)`
                        }}
                    />

                    {/* Background glow */}
                    <div
                        className="absolute inset-0 opacity-5 transition-all duration-700"
                        style={{
                            background: `radial-gradient(ellipse at 20% 50%, ${slide.accent}, transparent 70%)`
                        }}
                    />

                    {/* Content */}
                    <div className="relative z-10 h-full flex items-center justify-between px-6 md:px-8 gap-4">
                        {/* Left: Slide content */}
                        <div className="flex items-center gap-4 md:gap-5 min-w-0">
                            <div
                                className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all duration-500"
                                style={{
                                    backgroundColor: `${slide.accent}10`,
                                    borderColor: `${slide.accent}30`
                                }}
                            >
                                <span className="text-2xl md:text-3xl" key={currentSlide} style={{ animation: 'fadeScale 0.4s ease-out' }}>
                                    {slide.emoji}
                                </span>
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span
                                        className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border transition-all duration-500"
                                        style={{
                                            color: slide.accent,
                                            backgroundColor: `${slide.accent}10`,
                                            borderColor: `${slide.accent}20`
                                        }}
                                    >
                                        {slide.tag}
                                    </span>
                                </div>
                                <h4
                                    className="text-sm md:text-base font-black text-white tracking-tight leading-tight truncate transition-all duration-300"
                                    key={`h-${currentSlide}`}
                                    style={{ animation: 'slideUp 0.4s ease-out' }}
                                >
                                    {slide.headline}
                                </h4>
                                <p
                                    className="text-[11px] text-gray-500 font-bold mt-0.5 truncate transition-all duration-300"
                                    key={`p-${currentSlide}`}
                                    style={{ animation: 'slideUp 0.5s ease-out' }}
                                >
                                    {slide.sub}
                                </p>
                            </div>
                        </div>

                        {/* Right: CTA + Dots */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#ff4d00] text-white text-[10px] font-black uppercase tracking-widest rounded-lg group-hover:brightness-110 transition-all shadow-lg shadow-[#ff4d00]/20 flex-shrink-0">
                                View Plans →
                            </div>
                            {/* Slide indicators */}
                            <div className="flex gap-1">
                                {slides.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={(e) => { e.preventDefault(); setCurrentSlide(i); }}
                                        className="transition-all duration-300"
                                        style={{
                                            width: i === currentSlide ? '16px' : '4px',
                                            height: '4px',
                                            borderRadius: '2px',
                                            backgroundColor: i === currentSlide ? slide.accent : 'rgba(255,255,255,0.1)'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Inline keyframe animations */}
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeScale {
                    from { opacity: 0; transform: scale(0.7); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default SlideAd;
