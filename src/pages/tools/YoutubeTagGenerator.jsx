import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { deductPowers } from '../../utils/db';
import { motion } from 'framer-motion';
import Footer from '../../components/Footer';
import SEOHead from '../../components/SEOHead';
import { FaYoutube, FaTags, FaCopy, FaCheck, FaMagic } from 'react-icons/fa';
import AdBanner from '../../components/AdBanner';
import RelatedYoutubeTools from '../../components/RelatedYoutubeTools';

const YoutubeTagGenerator = () => {
    const [keyword, setKeyword] = useState('');
    const [tags, setTags] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
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

    const generateTags = async (e) => {
        e.preventDefault();
        if (!keyword.trim()) return;

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

            const prompt = `Generate the best SEO tags for a YouTube video about: "${keyword}". Focus on high search volume and low competition keywords.`;

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: "You are an expert YouTube SEO specialist. Your goal is to generate high-traffic, relevant tags for videos. Always return exactly 15 to 20 tags separated by commas. Do not include numbers at the start. Do not include any explanations, just the tags." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7
                })
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message || "Failed to generate constraints.");
            }

            const text = data.choices[0].message.content;

            // Clean and parse tags
            const generatedTags = text.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0)
                .map(tag => tag.replace(/^\d+\.\s*/, '')); // Remove "1. " style numbering if present

            setTags(generatedTags);
            setCopied(false);
        } catch (err) {
            console.error("AI Tag Generation Error:", err);
            setError(err.message || "Failed to generate AI tags. Please try again.");

            // Fallback to simple algorithm if AI fails
            const base = keyword.trim().toLowerCase();
            setTags([base, `${base} tutorial`, `how to ${base}`, `${base} 2024`]);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        const textToCopy = tags.join(', ');
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
            <SEOHead
                title="YouTube Tag Generator - Optimize YouTube SEO"
                description="Generate SEO-optimized YouTube tags for your videos instantly to boost views, rankings, and algorithmic growth."
            />

            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-[#ff0000]/5 rounded-full blur-[100px]" />
            </div>

            <main className="flex-grow relative z-10 px-6 pt-32 pb-24 max-w-4xl mx-auto w-full">
            <AdBanner size="leaderboard" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 text-center"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#ff0000]/10 border border-[#ff0000]/20 text-[#ff0000] text-xs font-bold uppercase tracking-widest mb-4">
                        <FaYoutube /> Video Marketing
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Rapid <span className="text-[#ff0000]">Tag</span> Generator</h1>
                    <p className="text-gray-400 text-lg">Extract the most relevant tags for maximum discoverability.</p>
                </motion.div>

                <div className="modrinth-card p-8 mb-8 relative overflow-hidden text-center max-w-2xl mx-auto">
                    <form onSubmit={generateTags} className="flex flex-col gap-4 relative z-10">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#ff0000]/50 transition-colors flex items-center">
                            <FaTags className="text-gray-500 mr-3" />
                            <input
                                type="text"
                                required
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder="Enter main topic (e.g., 'React JS Tutorial')"
                                className="w-full bg-transparent text-white outline-none font-medium placeholder-gray-600"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isGenerating}
                            className={`w-full bg-[#ff0000] hover:bg-[#ff1a1a] text-white font-black px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,0,0,0.3)] hover:shadow-[0_0_30px_rgba(255,0,0,0.5)] flex items-center justify-center gap-2 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    AI is Thinking...
                                </>
                            ) : (
                                <>
                                    <FaMagic /> Generate AI Tags (10 🔥)
                                </>
                            )}
                        </button>
                    </form>
                    {error && <p className="mt-4 text-red-500 text-sm font-medium">{error}</p>}
                </div>

                {tags.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="modrinth-card p-8 border border-[#ff0000]/30 shadow-[0_0_30px_rgba(255,0,0,0.05)] bg-[#111] relative"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black flex items-center gap-2">
                                <span className="w-2 h-8 bg-[#ff0000] rounded-full inline-block"></span>
                                Extracted Keywords
                            </h3>
                            <button
                                onClick={copyToClipboard}
                                className={`text-sm px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${copied ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                            >
                                {copied ? <><FaCheck /> Copied to Clipboard!</> : <><FaCopy /> Copy All Tags</>}
                            </button>
                        </div>

                        <div className="bg-[#050505] p-5 rounded-xl border border-white/5 font-mono text-sm text-gray-300 leading-relaxed break-words mb-6 select-all">
                            {tags.join(', ')}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, i) => (
                                <span key={i} className="px-3 py-1.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-sm font-medium hover:border-[#ff0000]/50 hover:bg-[#ff0000]/5 transition-colors cursor-default">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}
            </main>
            <RelatedYoutubeTools currentToolPath="/tools/youtube-tag-generator" />
            <Footer />
        </div>
    );
};

export default YoutubeTagGenerator;
