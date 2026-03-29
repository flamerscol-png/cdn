import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import AdBanner from '../components/AdBanner';
import PromoAd from '../components/PromoAd';
import SlideAd from '../components/SlideAd';

const SeoTools = () => {
    const tools = [

        {
            icon: "✍️",
            title: "AI Blog Writer",
            desc: "Generate professional-grade SEO content instantly. Structured, semantic, and human-ready.",
            link: "/tools/blog-writer",
            active: true,
            tag: "AI POWERED",
            price: 40
        },
        {
            icon: "🛡️",
            title: "Site Auditor",
            desc: "16-point technical SEO audit. Deep crawl analysis with zero bloat and clear health scores.",
            link: "/tools/site-auditor",
            active: true,
            tag: "TECHNICAL",
            price: 30
        },
        {
            icon: "🔍",
            title: "Keyword Researcher",
            desc: "Data-driven keyword discovery using live Google Trends and SERP completions.",
            link: "/tools/keyword-research",
            active: true,
            tag: "INSIGHTS",
            price: 15
        }
    ];

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
            <SEOHead
                title="Professional SEO Suite"
                description="Precision-engineered SEO tools to track rankings, generate content, and audit technical performance. Blaze Edition v2.0."
            />
            {/* Minimalist Background Decoration */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#ff4d00]/5 rounded-full blur-[120px]" />
            </div>

            <main className="flex-grow relative z-10 px-6 pt-32 pb-24 max-w-7xl mx-auto w-full">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeInUp}
                    className="mb-16 text-left"
                >
                    <div className="inline-block px-3 py-1 rounded-lg bg-[#ff4d00]/10 border border-[#ff4d00]/20 text-[#ff4d00] text-xs font-bold uppercase tracking-widest mb-4">
                        Professional Toolkit
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">SEO <span className="text-[#ff4d00]">Intelligence</span></h1>
                    <p className="text-xl text-gray-400 max-w-2xl font-medium leading-relaxed mb-6">
                        Precision-engineered tools to track rankings, generate content, and audit technical performance. Built for speed.
                    </p>
                    <Link to="/youtube-tools" className="inline-flex items-center gap-2 text-[#ff4d00] hover:text-[#ff4d00]/80 transition-all font-bold text-sm bg-[#ff4d00]/10 px-4 py-2 rounded-lg border border-[#ff4d00]/20 hover:scale-[1.02] active:scale-95">
                        <span className="text-base">📹</span> Switch to YouTube Suite
                    </Link>
                </motion.div>

                <SlideAd />

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
    <div className="modrinth-card p-10 h-full flex flex-col items-start group relative overflow-hidden">
        {badge && (
            <div className="absolute top-6 right-6 bg-white/5 border border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">
                {badge}
            </div>
        )}

        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-black tracking-widest text-[#ff4d00] mb-6">
            {tool.tag || "UTILITY"}
        </span>

        <div className="flex w-full items-start justify-between mb-6">
            <div className="text-4xl bg-[#050505] p-4 rounded-2xl border border-white/5 shadow-inner transition-transform group-hover:scale-110">
                {tool.icon}
            </div>
            {tool.price && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff4d00]/10 border border-[#ff4d00]/20 text-[#ff4d00] text-[10px] font-black uppercase tracking-widest">
                    <span>{tool.price}</span>
                    <span className="text-xs">🔥</span>
                </div>
            )}
        </div>
        <h3 className="text-2xl font-black mb-4 group-hover:text-[#ff4d00] transition-colors leading-tight">
            {tool.title}
        </h3>
        <p className="text-gray-400 font-medium leading-relaxed mb-8">
            {tool.desc}
        </p>
        <div className="mt-auto pt-4 flex items-center gap-2 text-sm font-bold text-gray-500 group-hover:text-[#ff4d00] transition-all">
            {badge ? "In Development" : "Launch Tool"} <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
        </div>
    </div>
);

export default SeoTools;
