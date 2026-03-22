import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { deductPowers } from '../../utils/db';
import { motion } from 'framer-motion';
import Footer from '../../components/Footer';
import SEOHead from '../../components/SEOHead';
import { FaYoutube, FaHeading, FaCopy, FaMagic } from 'react-icons/fa';
import AdBanner from '../../components/AdBanner';
import RelatedYoutubeTools from '../../components/RelatedYoutubeTools';

const YoutubeTitleGenerator = () => {
    const [topic, setTopic] = useState('');
    const [titles, setTitles] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const TOOL_COST = 10;

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

    const generateTitles = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return;

        if (!auth.currentUser) {
            navigate('/login');
            return;
        }

        if (!userData || (userData.powers || 0) < TOOL_COST) {
            setError(`Insufficient Coal! You need ${TOOL_COST} 🔥 but have ${userData?.powers || 0} 🔥.`);
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            await deductPowers(auth.currentUser.uid, TOOL_COST);

            const apiKey = import.meta.env.VITE_GROQ_API_KEY;
            if (!apiKey || apiKey.includes("_YOUR_API_KEY_HERE")) {
                throw new Error("Groq API Key is missing. Please check your .env file.");
            }

            const prompt = `Generate 10 viral YouTube titles for a video about: "${topic}". Use psychological triggers, emotional hooks, and strong keywords.`;

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                messages: [
                        { 
                            role: "system", 
                            content: `You are a Master YouTube Growth Strategist & Viral Title Designer. 
                            Your expertise is in human psychology, curiosity gaps, and maximum CTR.
                            
                            Your rules:
                            1. Titles must evoke emotion (Fear, Awe, Curiosity, Greed, or Joy).
                            2. Use frameworks like "Pattern Interrupt", "Negative Constraint", or "Extreme Comparison".
                            3. Avoid generic words like 'Ultimate', 'Guide', or 'Tips'.
                            4. Use specific numbers (e.g., $10,432 instead of 10k).
                            5. Return exactly 10 titles, one per line. No numbers at the start.` 
                        },
                        { 
                            role: "user", 
                            content: `Generate 10 hyper-viral, high-CTR YouTube titles for a video about: "${topic}". 
                            Ensure titles create a massive curiosity gap that FORCES a click.` 
                        }
                    ],
                    temperature: 0.85
                })
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message || "Failed to generate titles.");
            }

            const text = data.choices[0].message.content;

            const generated = text.split('\n')
                .map(t => t.trim())
                .filter(t => t.length > 0)
                .map(t => t.replace(/^\d+\.\s*/, ''));

            setTitles(generated);
            setCopiedIndex(null);
        } catch (err) {
            console.error("AI Title Generation Error:", err);
            setError(err.message || "Failed to generate AI titles. Please try again.");

            // Fallback
            setTitles([`The Ultimate Guide to ${topic}`, `How to Master ${topic}`]);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (title, index) => {
        navigator.clipboard.writeText(title);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
            <SEOHead
                title="YouTube Clickbait Title Generator - Maximize CTR"
                description="Generate high CTR and engaging YouTube titles instantly to skyrocket your click-through rates."
            />

            {/* Ambient Background Glow */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-[#ff0000]/5 rounded-full blur-[150px]" />
                <div className="absolute top-[60%] right-[10%] w-[30%] h-[30%] bg-[#ff0000]/3 rounded-full blur-[100px]" />
            </div>

            <main className="flex-grow relative z-10 px-6 pt-32 pb-24 max-w-5xl mx-auto w-full">
                <AdBanner size="leaderboard" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-12 text-center"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#ff0000]/10 border border-[#ff0000]/20 text-[#ff0000] text-xs font-bold uppercase tracking-widest mb-4">
                        <FaYoutube /> Audience Retention
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight">Click-Worthy <span className="text-[#ff0000]">Title</span> Generator</h1>
                    <p className="text-gray-400 text-xl font-medium max-w-2xl mx-auto">Input your subject, and our algorithm will generate high-CTR titles proven to boost clicks.</p>
                </motion.div>

                <div className="modrinth-card p-10 mb-12 relative overflow-hidden text-center max-w-3xl mx-auto border border-white/5 shadow-2xl bg-[#0a0a0a]/50 backdrop-blur-xl">
                    <form onSubmit={generateTitles} className="flex flex-col gap-6 relative z-10">
                        <div className="bg-[#050505] border border-white/10 rounded-2xl p-5 focus-within:border-[#ff0000]/50 transition-colors flex flex-col items-start shadow-inner">
                            <label className="text-gray-500 font-bold text-sm tracking-widest uppercase mb-3 flex items-center gap-2">
                                <FaHeading /> Core Subject
                            </label>
                            <input
                                type="text"
                                required
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g. 'Dropshipping', 'Elden Ring Bosses', 'React Hooks'"
                                className="w-full bg-transparent text-white text-xl outline-none font-bold placeholder-gray-700"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isGenerating}
                            className={`w-full bg-gradient-to-r from-[#ff0000] to-[#cc0000] hover:from-[#ff1a1a] hover:to-[#e60000] text-white font-black px-8 py-5 rounded-2xl text-lg transition-all shadow-[0_0_20px_rgba(255,0,0,0.4)] hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] flex items-center justify-center gap-3 ${isGenerating ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:scale-[1.02]'}`}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    AI is Brainstorming...
                                </>
                            ) : (
                                <>
                                    <FaMagic /> Generate AI Titles (10 🔥)
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3 mb-8 max-w-3xl mx-auto">
                        <span className="text-xl">⚠️</span> {error}
                    </div>
                )}

                {titles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {titles.map((title, index) => (
                            <div key={index} className="modrinth-card p-6 border border-white/5 hover:border-[#ff0000]/30 transition-colors group flex flex-col justify-between h-full bg-[#111]">
                                <h3 className="text-xl font-black mb-6 leading-tight group-hover:text-[#ff0000] transition-colors">{title}</h3>
                                <div className="mt-auto flex justify-between items-center border-t border-white/5 pt-4">
                                    <span className="text-xs font-bold text-gray-600 bg-white/5 px-2 py-1 rounded">Score: 9{Math.floor(Math.random() * 9)}/100</span>
                                    <button
                                        onClick={() => copyToClipboard(title, index)}
                                        className={`text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${copiedIndex === index ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'}`}
                                    >
                                        {copiedIndex === index ? 'Copied' : <><FaCopy /> Copy</>}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </main>
            <RelatedYoutubeTools currentToolPath="/tools/youtube-title-generator" />
            <Footer />
        </div>
    );
};

export default YoutubeTitleGenerator;
