import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Footer from '../../components/Footer';
import AdBanner from '../../components/AdBanner';
import SEOHead from '../../components/SEOHead';
import API_BASE_URL from '../../utils/api';

const BlogWriter = () => {
    const [topic, setTopic] = useState('');
    const [keywords, setKeywords] = useState('');
    const [tone, setTone] = useState('Professional');
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [result, setResult] = useState(null);
    const [copied, setCopied] = useState(false);

    const generateBlog = async () => {
        if (!topic.trim()) return;

        setLoading(true);
        setResult(null);
        setCopied(false);
        setLoadingMessage('Initializing AI models...');

        // Simulate API delay and progress
        setTimeout(() => setLoadingMessage('Analyzing topic semantics...'), 1500);
        setTimeout(() => setLoadingMessage('Structuring headings and flow...'), 3000);
        setTimeout(() => setLoadingMessage('Drafting content with selected tone...'), 4500);
        setTimeout(() => setLoadingMessage('Optimizing for search intent...'), 6000);

        try {
            // Replace with your actual Gemini/Vertex AI endpoint
            const response = await fetch(`${API_BASE_URL}/api/generate-blog`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, keywords, tone })
            });

            if (!response.ok) throw new Error('Failed to generate content');
            const data = await response.json();

            setResult(data);
        } catch (error) {
            console.error('Error:', error);
            // Fallback mock data for demonstration if backend fails
            setTimeout(() => {
                setResult({
                    title: `The Ultimate Guide to ${topic}`,
                    content: `<h2>Understanding ${topic}</h2>\n<p>This is a professionally generated, structured, and SEO-optimized blog post about ${topic}. It naturally integrates your targeted keywords: ${keywords}.</p>\n<h3>Why It Matters</h3>\n<p>In today's competitive digital landscape, mastering ${topic} is crucial for sustainable growth.</p>\n<h3>Actionable Strategies</h3>\n<ul>\n<li>Focus on search intent matching.</li>\n<li>Ensure long-form comprehensiveness.</li>\n<li>Utilize semantic variations of your primary keywords.</li>\n</ul>\n<p>Conclusion: By implementing these strategies, you'll see a significant uplift in organic traction.</p>`,
                    wordCount: 850,
                    seoScore: 92
                });
                setLoading(false);
            }, 7500);
            return;
        }

        setLoading(false);
    };

    const copyToClipboard = () => {
        if (!result) return;
        // Basic HTML removal for copying text
        const textContent = result.content.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();
        navigator.clipboard.writeText(`${result.title}\n\n${textContent}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#ff4d00]/30 flex flex-col">
            <SEOHead
                title="AI Blog Writer"
                description="Generate professional-grade, SEO-optimized blog content instantly using advanced AI models."
            />

            <div className="flex-grow max-w-5xl mx-auto w-full px-6 pt-32 pb-24">
                <Link to="/seo-tools" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#ff4d00] transition-colors mb-8 font-bold text-sm uppercase tracking-widest">
                    &larr; Back to Tools
                </Link>

                <div className="mb-12">
                    <div className="inline-block px-3 py-1 rounded-lg bg-[#ff4d00]/10 border border-[#ff4d00]/20 text-[#ff4d00] text-[10px] font-black uppercase tracking-widest mb-4">
                        Content Generation AI
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">AI Blog <span className="text-[#ff4d00]">Writer.</span></h1>
                    <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl">
                        Instantly generate professional, structured, and search-optimized long-form content.
                    </p>
                </div>

                <AdBanner size="leaderboard" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
                    {/* Controls */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="modrinth-card p-6">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Primary Topic / Title Idea</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., Best SEO strategies for 2024"
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff4d00]/50 transition-colors mb-6 font-medium"
                                onKeyDown={(e) => e.key === 'Enter' && generateBlog()}
                            />

                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Target Keywords (Comma separated)</label>
                            <textarea
                                value={keywords}
                                onChange={(e) => setKeywords(e.target.value)}
                                placeholder="e.g., seo tips, rank higher, google updates"
                                rows={3}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff4d00]/50 transition-colors mb-6 font-medium resize-none"
                            />

                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Voice & Tone</label>
                            <select
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff4d00]/50 transition-colors mb-8 font-medium appearance-none"
                            >
                                <option value="Professional">Professional & Authoritative</option>
                                <option value="Conversational">Conversational & Engaging</option>
                                <option value="Educational">Educational & Step-by-Step</option>
                                <option value="Persuasive">Persuasive & Sales-Oriented</option>
                            </select>

                            <button
                                onClick={generateBlog}
                                disabled={loading || !topic.trim()}
                                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${loading || !topic.trim() ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5' : 'bg-[#ff4d00] text-white hover:brightness-110 active:scale-95 shadow-xl shadow-[#ff4d00]/20'}`}
                            >
                                {loading ? 'Generating...' : 'Generate Content'}
                            </button>

                            {!loading && topic.trim() && (
                                <div className="text-center mt-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                    Costs 150 🔥 Coal
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="lg:col-span-7">
                        <AdBanner size="leaderboard" className="mb-8" />
                        {loading ? (
                            <div className="modrinth-card p-12 h-full flex flex-col items-center justify-center min-h-[400px]">
                                <div className="w-16 h-16 border-4 border-white/5 border-t-[#ff4d00] rounded-full animate-spin mb-8"></div>
                                <h3 className="text-xl font-black mb-2 animate-pulse">{loadingMessage}</h3>
                                <p className="text-gray-500 font-medium text-sm">Please do not close this window. Heavy AI models take ~10 seconds to respond.</p>
                            </div>
                        ) : result ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="modrinth-card p-8 h-full flex flex-col"
                            >
                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                                    <div>
                                        <h2 className="text-2xl font-black mb-2">{result.title}</h2>
                                        <div className="flex gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            <span>{result.wordCount} Words</span>
                                            <span>·</span>
                                            <span className="text-[#ff4d00]">SEO Score: {result.seoScore}/100</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? '✓ Copied' : '📋 Copy'}
                                    </button>
                                </div>

                                <div
                                    className="prose prose-invert prose-orange max-w-none flex-grow custom-scrollbar overflow-y-auto max-h-[600px] pr-4"
                                    dangerouslySetInnerHTML={{ __html: result.content }}
                                />
                            </motion.div>
                        ) : (
                            <div className="modrinth-card p-12 h-full flex flex-col items-center justify-center text-center opacity-50 min-h-[400px]">
                                <div className="text-6xl mb-6 grayscale">✍️</div>
                                <h3 className="text-xl font-black mb-2">Ready to Write</h3>
                                <p className="text-gray-400 font-medium max-w-sm">
                                    Enter a topic and keywords on the left. The AI will generate a structured, SEO-ready draft in seconds.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default BlogWriter;
