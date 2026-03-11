import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Footer from '../../components/Footer';
import AdBanner from '../../components/AdBanner';
import SEOHead from '../../components/SEOHead';
import API_BASE_URL from '../../utils/api';

const ThumbnailGen = () => {
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const generateIdeas = async () => {
        if (!topic.trim()) return;

        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
            if (!GROQ_API_KEY) throw new Error("Missing Groq API Key (VITE_GROQ_API_KEY)");

            const prompt = `
                Act as a YouTube Thumbnail Psychologist and Expert Designer. 
                Provide 3 distinct 'High-CTR' Thumbnail Concepts for this video topic: "${topic}".
                
                FOR EACH CONCEPT, PROVIDE:
                1. Visual Layout: Describe exactly what should be on the screen (colors, focal point, background).
                2. Text Overlay: Exactly 1-3 words of high-impact text.
                3. Psychology: Why will a human being feel COMPELLED to click this?
                4. Color Palette: HEX codes for a high-contrast scheme.
                
                Output ONLY this JSON structure:
                {
                    "concepts": [
                        {
                            "style": "The Curiosity Gap / The Mystery",
                            "visual": "...",
                            "text": "...",
                            "psychology": "...",
                            "colors": ["#...", "#..."]
                        },
                        {
                            "style": "The Extreme Contrast / Before & After",
                            "visual": "...",
                            "text": "...",
                            "psychology": "...",
                            "colors": ["#...", "#..."]
                        },
                        {
                            "style": "The Authority / Scale",
                            "visual": "...",
                            "text": "...",
                            "psychology": "...",
                            "colors": ["#...", "#..."]
                        }
                    ]
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
                        { role: 'system', content: 'You are a YouTube viral design expert. Output ONLY strict JSON.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to generate ideas');
            }

            const data = await response.json();
            const resultStr = data.choices[0].message.content;
            setResult(JSON.parse(resultStr));
        } catch (err) {
            console.error('Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#ff0000]/30 flex flex-col">
            <SEOHead
                title="AI Thumbnail Suggester"
                description="Get viral, high-CTR thumbnail concepts, text overlays, and color palettes designed by AI."
            />

            <div className="flex-grow max-w-6xl mx-auto w-full px-6 pt-32 pb-24">
                <Link to="/youtube-tools" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#ff0000] transition-colors mb-8 font-bold text-sm uppercase tracking-widest">
                    &larr; Back to YT Tools
                </Link>

                <div className="mb-12">
                    <div className="inline-block px-3 py-1 rounded-lg bg-[#ff0000]/10 border border-[#ff0000]/20 text-[#ff0000] text-[10px] font-black uppercase tracking-widest mb-4">
                        Visual Strategy AI
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">Thumbnail <span className="text-[#ff0000]">Suggester.</span></h1>
                    <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl">
                        Stop guessing. Use psychological triggers and viral design patterns to create thumbnails that get clicked.
                    </p>
                </div>

                <AdBanner size="leaderboard" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
                    {/* Controls */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="modrinth-card p-6 border-[#ff0000]/10">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">What is your video about?</label>
                            <textarea
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., I spent 24 hours in a haunted forest with only a flashlight..."
                                rows={4}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff0000]/50 transition-colors mb-6 font-medium resize-none shadow-inner"
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && generateIdeas()}
                            />

                            <button
                                onClick={generateIdeas}
                                disabled={loading || !topic.trim()}
                                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${loading || !topic.trim() ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5' : 'bg-[#ff0000] text-white hover:brightness-110 active:scale-95 shadow-xl shadow-[#ff0000]/20'}`}
                            >
                                {loading ? 'Analyzing Psychology...' : 'Generate 3 Concepts'}
                            </button>

                            <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest justify-center">
                                <span>Costs 50 🔥 Coal</span>
                                <span className="w-1 h-1 rounded-full bg-gray-800"></span>
                                <span className="text-[#ff0000]">Llama 3.3 Power</span>
                            </div>
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="modrinth-card p-12 h-full flex flex-col items-center justify-center min-h-[400px] text-center"
                                >
                                    <div className="w-16 h-16 border-4 border-white/5 border-t-[#ff0000] rounded-full animate-spin mb-8"></div>
                                    <h3 className="text-xl font-black mb-2 animate-pulse text-[#ff0000]">DECODING VIRAL PATTERNS</h3>
                                    <p className="text-gray-500 font-medium text-sm">Matching your topic against millions of high-CTR data points...</p>
                                </motion.div>
                            ) : error ? (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="modrinth-card p-12 h-full flex flex-col items-center justify-center min-h-[400px] text-center"
                                >
                                    <div className="text-4xl mb-6">❌</div>
                                    <h3 className="text-xl font-black mb-2 text-red-500">Generation Failed</h3>
                                    <p className="text-gray-400 font-medium">{error}</p>
                                </motion.div>
                            ) : result ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {result.concepts.map((concept, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="modrinth-card p-8 group hover:border-[#ff0000]/20 transition-all"
                                        >
                                            <div className="flex flex-col md:flex-row gap-8">
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <span className="w-8 h-8 rounded-lg bg-[#ff0000]/10 border border-[#ff0000]/20 text-[#ff0000] flex items-center justify-center font-black text-sm">{idx + 1}</span>
                                                        <h3 className="text-xl font-black uppercase tracking-tight">{concept.style}</h3>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <div>
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ff0000] mb-2">Visual Composition</h4>
                                                            <p className="text-gray-300 font-medium leading-relaxed">{concept.visual}</p>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div>
                                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ff0000] mb-2">Psychological Trigger</h4>
                                                                <p className="text-gray-400 text-sm font-medium italic">"{concept.psychology}"</p>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ff0000] mb-2">Color Palette</h4>
                                                                <div className="flex gap-2">
                                                                    {concept.colors.map((c, i) => (
                                                                        <div key={i} className="flex flex-col items-center gap-1">
                                                                            <div className="w-8 h-8 rounded-lg border border-white/10" style={{ backgroundColor: c }}></div>
                                                                            <span className="text-[8px] font-black text-gray-500">{c}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="md:w-48 flex flex-col items-center justify-center bg-black/40 border border-white/5 rounded-2xl p-6 text-center shrink-0">
                                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Text Overlay</h4>
                                                    <div className="text-2xl font-black text-white leading-tight uppercase tracking-tighter drop-shadow-lg scale-110 group-hover:scale-125 transition-transform duration-500">
                                                        {concept.text}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                <div className="modrinth-card p-12 h-full flex flex-col items-center justify-center text-center opacity-50 min-h-[400px]">
                                    <div className="text-6xl mb-6 grayscale">🎨</div>
                                    <h3 className="text-xl font-black mb-2">Visualize Content</h3>
                                    <p className="text-gray-400 font-medium max-w-sm">
                                        Describe your video topic on the left to get premium thumbnail concepts and visual layouts.
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ThumbnailGen;
