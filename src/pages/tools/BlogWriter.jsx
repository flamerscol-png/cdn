import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { deductPowers } from '../../utils/db';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Footer from '../../components/Footer';
import AdBanner from '../../components/AdBanner';
import SEOHead from '../../components/SEOHead';
import RelatedSeoTools from '../../components/RelatedSeoTools';
import Breadcrumbs from '../../components/Breadcrumbs';
import API_BASE_URL from '../../utils/api';
import { callGemini } from '../../utils/ai';

const BlogWriter = () => {
    const [topic, setTopic] = useState('');
    const [keywords, setKeywords] = useState('');
    const [tone, setTone] = useState('Professional');
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [result, setResult] = useState(null);
    const [copied, setCopied] = useState(false);
    const resultRef = React.useRef(null);
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const TOOL_COST = 40;

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                const userRef = ref(database, `users/${user.uid}`);
                onValue(userRef, (snapshot) => {
                    setUserData(snapshot.val());
                });
            } else {
                setUserData(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const generateBlog = async () => {
        if (!topic.trim()) return;

        if (!auth.currentUser) {
            navigate('/login');
            return;
        }

        if (!userData || (userData.powers || 0) < TOOL_COST) {
            setResult({
                title: "Access Denied",
                content: `<div class="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                    <h3>Insufficient Coal!</h3>
                    <p>You need ${TOOL_COST} 🔥 to use this tool but have ${userData?.powers || 0} 🔥.</p>
                </div>`,
                wordCount: 0,
                seoScore: 0
            });
            return;
        }

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
            await deductPowers(auth.currentUser.uid, TOOL_COST);

            const systemMsg = `You are a world-class SEO content strategist and expert writer with 15+ years of experience. You have studied the top-ranking articles for thousands of competitive keywords and you know exactly what makes content outrank competitors on Google. Your writing style is authoritative, clear, engaging, and human — NOT robotic or keyword-stuffed. You follow Google E-E-A-T guidelines strictly. You NEVER stuff keywords. You always output ONLY strict JSON.`;

            const userMsg = `You are writing a LEGENDARY, competition-crushing blog post. Mentally analyze what the TOP-3 Google results for this topic contain, then write something dramatically better — more detailed, more human, more insightful.

TOPIC: ${topic}
TARGET KEYWORDS: ${keywords || 'related to the main topic'}
WRITING TONE: ${tone || 'Professional'}

CONTENT STRUCTURE (follow exactly):
1. <h2>Hook + What Is [Topic]</h2> — Open with a bold statement or surprising fact. Then give a concrete expert-level definition. State who this is for and what they will learn.
2. <h2>Why [Topic] Matters Right Now</h2> — Build urgency, use trends/data.
3. <h2>The Mistakes 90% of People Make with [Topic]</h2> — Address misconceptions readers have.
4. <h2>[Core How-To Guide: Main Actionable Steps]</h2> with <h3> sub-sections — Step-by-step, genuinely actionable. This is the longest section.
5. <h2>Expert Secrets: What High Performers Do Differently</h2> — Advanced insider insights that 99% of articles miss. Go deep.
6. <h2>Conclusion</h2> — Summarize key takeaways. End with a motivating call to action. NO FAQ SECTION.

SEO RULES:
- Use the primary keyword naturally in H1 equivalent, first 150 words, at least 2 H2s, conclusion
- Use related semantic keywords throughout — do NOT repeat the exact same phrase more than 3 times
- ZERO keyword stuffing — write naturally as an expert human
- Use <strong> for genuinely important terms only
- Minimum 2000 words total — every section must be substantial (no thin filler)

CRITICAL FORMATTING (DO NOT BREAK JSON):
- Use ONLY single quotes inside HTML: class='box' NOT class="box"
- Never use raw double-quotes inside the content string
- Output content as ONE continuous HTML string

Output ONLY this JSON — nothing else before or after:
{"title": "Power Headline Here", "content": "FULL_HTML_AS_SINGLE_STRING", "wordCount": 2000, "seoScore": 97}`;

            const data = await callGemini(systemMsg, userMsg, true, 'llama-3.3-70b-versatile');
            
            // Gracefully unwrap if AI nested the JSON
            let finalData = data;
            if (finalData && !finalData.title && !finalData.content) {
                const keys = Object.keys(finalData);
                if (keys.length === 1 && typeof finalData[keys[0]] === 'object') {
                    finalData = finalData[keys[0]];
                }
            }
            
            if (!finalData || (!finalData.title && !finalData.content)) {
                throw new Error("AI returned an empty or unrecognized format: " + JSON.stringify(data).substring(0, 50));
            }

            setResult(finalData);
            // Auto-scroll to result, especially on mobile
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
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
                title="AI SEO Blog Writer & Content Engine"
                description="Instantly generate structured, professional, and search-optimized search-intent content using FlamerCoal's advanced AI writing suite."
                keywords="AI blog writer, SEO content generator, AI article writer, automated blogging tool, SEO copywriter"
                isTool={true}
            />

            <div className="flex-grow max-w-5xl mx-auto w-full px-6 pt-32 pb-24">
                <Breadcrumbs 
                    items={[
                        { name: 'SEO TOOLS', path: '/seo-tools' },
                        { name: 'AI BLOG WRITER' }
                    ]} 
                />

                <div className="mb-12">
                    <div className="inline-block px-3 py-1 rounded-lg bg-[#ff4d00]/10 border border-[#ff4d00]/20 text-[#ff4d00] text-[10px] font-black uppercase tracking-widest mb-4">
                        Content Generation AI
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">AI Blog <span className="text-[#ff4d00]">Writer.</span></h1>
                    <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl mb-6">
                        Instantly generate professional, structured, and search-optimized long-form content.
                    </p>
                    <Link to="/tools/keyword-research" className="inline-flex items-center gap-2 text-[#ff4d00] hover:text-[#ff4d00]/80 transition-all font-bold text-sm bg-[#ff4d00]/10 px-4 py-2 rounded-lg border border-[#ff4d00]/20 hover:scale-[1.02] active:scale-95">
                        <span className="text-base">🔍</span> Need keywords? Research first
                    </Link>
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
                                    Costs 40 🔥 Coal
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="lg:col-span-7" ref={resultRef}>
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
                                className="modrinth-card p-8"
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
                                    className="prose prose-invert prose-orange max-w-none prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300 prose-strong:text-white prose-h2:text-2xl prose-h3:text-xl"
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
                        {/* Ads below result */}
                        <div className="mt-6">
                            <AdBanner size="leaderboard" className="mb-4" />
                            <div className="flex flex-wrap justify-center gap-4">
                                <AdBanner size="rectangle" />
                                <AdBanner size="rectangle" />
                                <AdBanner size="rectangle" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <RelatedSeoTools currentToolPath="/tools/blog-writer" />

            <Footer />
        </div>
    );
};

export default BlogWriter;
