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

        // Progress messages
        const progressSteps = [
            'Analyzing topic semantics...',
            'Structuring headings and flow...',
            'Drafting content with selected tone...',
            'Optimizing for search intent...'
        ];

        progressSteps.forEach((msg, i) => {
            setTimeout(() => setLoadingMessage(msg), (i + 1) * 1500);
        });

        try {
            const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
            if (!GROQ_API_KEY) throw new Error("Missing Groq API Key (VITE_GROQ_API_KEY)");

            const prompt = `
                Act as a Top-1% SEO Specialist and Subject Matter Expert. Write a 'Power Page' that is designed to outrank the current TOP-3 Google results for the given topic.
                
                TOPIC: ${topic}
                KEYWORDS: ${keywords || 'SEO basics, quality content'}
                TONE: ${tone || 'Professional'}
                
                GOAL: Give the user a UNIQUE perspective. Don't just repeat what's on Wikipedia. Add "Expert Secrets," "Common Myths," and "Future Predictions" related to the topic.
                
                OUTPUT REQUIREMENTS:
                1. Title: Catchy, search-optimized, and high-CTR.
                2. Content: Structure it like a professional long-form guide. Use H2/H3 tags, bold important concepts, and use bullet points for readability.
                3. Engagement: Use 'Bucket Brigades' (short, punchy lines) to keep the reader scrolling.
                4. Length: Minimum 1200 words of pure utility and value.
                
                Output ONLY this JSON structure:
                {
                    "title": "Powerful Headline Here",
                    "content": "HTML_STRING_WITH_TAGS_AND_FORMATTING",
                    "wordCount": 1200,
                    "seoScore": 98
                }
            `;

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: 'You are a professional SEO writer. Output ONLY strict JSON.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to generate content');
            }

            const data = await response.json();
            const resultStr = data.choices[0].message.content;
            setResult(JSON.parse(resultStr));
        } catch (error) {
            console.error('Error:', error);
            setResult({
                title: "Error Generating Post",
                content: `<div class="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                    <h3>AI Generation Failed</h3>
                    <p>${error.message}. Please verify your API key and network connection.</p>
                </div>`,
                wordCount: 0,
                seoScore: 0
            });
        } finally {
            setLoading(false);
        }
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
