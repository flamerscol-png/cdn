import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import AdBanner from '../components/AdBanner';
import PromoAd from '../components/PromoAd';
import SlideAd from '../components/SlideAd';

const YoutubeTools = () => {
    const tools = [
        {
            icon: "📹",
            title: "Thumbnail Downloader",
            desc: "Extract and download any YouTube thumbnail in 4K MaxRes instantly.",
            link: "/tools/youtube-thumbnail-downloader",
            active: true,
            tag: "YOUTUBE",
            price: 5
        },
        {
            icon: "🏷️",
            title: "Tag Generator",
            desc: "Algorithmically generate high-traffic SEO tags for video discoverability.",
            link: "/tools/youtube-tag-generator",
            active: true,
            tag: "YOUTUBE",
            price: 10
        },
        {
            icon: "📝",
            title: "Title Generator",
            desc: "Synthesize high CTR clickbait titles proven to maximize views.",
            link: "/tools/youtube-title-generator",
            active: true,
            tag: "YOUTUBE",
            price: 10
        },
        {
            icon: "📜",
            title: "Description Builder",
            desc: "Format perfectly optimized video descriptions with timestamps and links.",
            link: "/tools/youtube-description-generator",
            active: true,
            tag: "YOUTUBE",
            price: 10
        },
        {
            icon: "🎨",
            title: "Thumbnail Suggester",
            desc: "AI-generated visual concepts, high-impact text, and color palettes for viral thumbnails.",
            link: "/tools/youtube-thumbnail-suggester",
            active: true,
            tag: "AI POWERED",
            price: 35
        },
        {
            icon: "🗺️",
            title: "Strategy Builder",
            desc: "Generate a actionable YouTube growth plan with psychology logic.",
            link: "/tools/youtube-strategy-builder",
            active: true,
            tag: "YOUTUBE",
            price: 25
        }
    ];

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
            <SEOHead
                title="YouTube SEO Intelligence"
                description="Precision-engineered YouTube SEO tools to generate high-CTR titles, semantic descriptions, and viral-ready tags."
            />
            {/* Minimalist Background Decoration */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#ff0000]/5 rounded-full blur-[120px]" />
            </div>

            <main className="flex-grow relative z-10 px-6 pt-32 pb-24 max-w-7xl mx-auto w-full">
                <SlideAd />
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                    className="mb-16 text-left"
                >
                    <div className="inline-block px-3 py-1 rounded-lg bg-[#ff0000]/10 border border-[#ff0000]/20 text-[#ff0000] text-xs font-bold uppercase tracking-widest mb-4">
                        Creator Toolkit
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">YouTube <span className="text-[#ff0000]">SEO Tools</span></h1>
                    <p className="text-xl text-gray-400 max-w-2xl font-medium leading-relaxed mb-6">
                        Algorithmically optimize your YouTube videos with our specialized tools. Generate high-CTR titles, semantic descriptions, and discoverability tags.
                    </p>
                    <Link to="/seo-tools" className="inline-flex items-center gap-2 text-[#ff0000] hover:text-[#ff0000]/80 transition-all font-bold text-sm bg-[#ff0000]/10 px-4 py-2 rounded-lg border border-[#ff0000]/20 hover:scale-[1.02] active:scale-95">
                        <span className="text-base">🔍</span> Switch to SEO Suite
                    </Link>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tools.map((tool, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            {tool.active ? (
                                <Link to={tool.link} className="block h-full">
                                    <ToolCard tool={tool} />
                                </Link>
                            ) : (
                                <div className="h-full opacity-60">
                                    <ToolCard tool={tool} badge="Coming Soon" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                <PromoAd variant="strip" className="mt-8" />
            </main>

            <Footer />
        </div>
    );
};

const ToolCard = ({ tool, badge }) => (
    <div className="modrinth-card p-10 h-full flex flex-col items-start group relative overflow-hidden transition-all hover:border-[#ff0000]/30 hover:shadow-[0_0_30px_rgba(255,0,0,0.05)]">
        {badge && (
            <div className="absolute top-6 right-6 bg-white/5 border border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">
                {badge}
            </div>
        )}

        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-black tracking-widest text-[#ff0000] mb-6">
            {tool.tag || "UTILITY"}
        </span>

        <div className="flex w-full items-start justify-between mb-6">
            <div className="text-4xl bg-[#050505] p-4 rounded-2xl border border-white/5 shadow-inner transition-transform group-hover:scale-110">
                {tool.icon}
            </div>
            {tool.price && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff0000]/10 border border-[#ff0000]/20 text-[#ff0000] text-[10px] font-black uppercase tracking-widest">
                    <span>{tool.price}</span>
                    <span className="text-xs">🔥</span>
                </div>
            )}
        </div>
        <h3 className="text-2xl font-black mb-4 group-hover:text-[#ff0000] transition-colors leading-tight">
            {tool.title}
        </h3>
        <p className="text-gray-400 font-medium leading-relaxed mb-8">
            {tool.desc}
        </p>
        <div className="mt-auto pt-4 flex items-center gap-2 text-sm font-bold text-gray-500 group-hover:text-[#ff0000] transition-all">
            {badge ? "In Development" : "Launch Tool"} <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
        </div>
    </div>
);

export default YoutubeTools;
