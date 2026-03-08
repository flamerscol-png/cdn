import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Footer from '../../components/Footer';
import SEOHead from '../../components/SEOHead';
import { FaYoutube, FaFileAlt, FaCopy, FaCheck, FaLink, FaAlignLeft } from 'react-icons/fa';
import AdBanner from '../../components/AdBanner';

const YoutubeDescriptionGenerator = () => {
    const [title, setTitle] = useState('');
    const [about, setAbout] = useState('');
    const [links, setLinks] = useState('');
    const [description, setDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(null);

    const generateDescription = async (e) => {
        e.preventDefault();
        if (!title.trim() || !about.trim()) return;

        setIsGenerating(true);
        setError(null);

        try {
            const apiKey = import.meta.env.VITE_GROQ_API_KEY;
            if (!apiKey || apiKey.includes("_YOUR_API_KEY_HERE")) {
                throw new Error("Groq API Key is missing. Please check your .env file.");
            }

            const prompt = `Write a YouTube video description for:
            TITLE: "${title}"
            ABOUT: "${about}"
            LINKS to include: ${links || "None provided"}

            Structure the response as follows:
            1. An engaging opening hook using keywords from the title.
            2. A 2-paragraph detailed summary based on the 'ABOUT' section.
            3. A section called '🔗 RESOURCES & LINKS' featuring the provided links.
            4. A section for '📌 TIMESTAMPS' with placeholders based on the content.
            5. 5-7 relevant hashtags at the bottom.

            Do not include any other meta-text or explanations.`;

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: "You are an expert YouTube content strategist. Your goal is to write highly optimized video descriptions that include a hook, a detailed summary based on user context, formatted links, and relevant SEO hashtags. Use emojis to make it professional and engaging." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7
                })
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error.message || "Failed to generate description.");
            }

            const text = data.choices[0].message.content;

            setDescription(text.trim());
            setCopied(false);
        } catch (err) {
            console.error("AI Description Error:", err);
            setError(err.message || "Failed to generate AI description. Please try again.");

            // Fallback
            const formattedLinks = links.split('\n').map(l => l.trim()).filter(l => l !== '').map(l => `🔗 ${l}`).join('\n');
            setDescription(`🔥 ${title.toUpperCase()} 🔥\n\n${about}\n\n${formattedLinks}\n\n#youtube #seo`);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(description);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
            <SEOHead
                title="YouTube Description Generator - Optimize SEO metadata"
                description="Generate highly optimizing YouTube descriptions with timestamps, links, and SEO tags to rank higher instantly."
            />

            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute bottom-[0%] left-[-10%] w-[70%] h-[70%] bg-[#ff0000]/3 rounded-full blur-[150px]" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-[#ff0000]/5 rounded-full blur-[120px]" />
            </div>

            <main className="flex-grow relative z-10 px-6 pt-32 pb-24 max-w-6xl mx-auto w-full">
            <AdBanner size="leaderboard" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-12 text-center"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#ff0000]/10 border border-[#ff0000]/20 text-[#ff0000] text-xs font-bold uppercase tracking-widest mb-4">
                        <FaYoutube /> Retention Engineering
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight">Description <span className="text-[#ff0000]">Synthesizer</span></h1>
                    <p className="text-gray-400 text-xl font-medium max-w-3xl mx-auto">Create perfect, standard-compliant YouTube descriptions optimized for both viewers and the search algorithm.</p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Form Section */}
                    <div className="modrinth-card p-8 border border-white/5 shadow-2xl bg-[#0a0a0a]/80 backdrop-blur-xl relative h-fit">
                        <form onSubmit={generateDescription} className="flex flex-col gap-6 relative z-10">
                            <div className="bg-[#050505] border border-white/10 rounded-2xl p-4 focus-within:border-[#ff0000]/50 transition-colors shadow-inner">
                                <label className="text-gray-500 font-bold text-xs tracking-widest uppercase mb-2 flex items-center gap-2">
                                    <FaFileAlt /> Video Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter exactly as written"
                                    className="w-full bg-transparent text-white text-lg outline-none font-bold placeholder-gray-700"
                                />
                            </div>

                            <div className="bg-[#050505] border border-white/10 rounded-2xl p-4 focus-within:border-[#ff0000]/50 transition-colors shadow-inner">
                                <label className="text-gray-500 font-bold text-xs tracking-widest uppercase mb-2 flex items-center gap-2">
                                    <FaAlignLeft /> Quick Summary (2-3 sentences)
                                </label>
                                <textarea
                                    required
                                    rows="4"
                                    value={about}
                                    onChange={(e) => setAbout(e.target.value)}
                                    placeholder="In this video, I explain how..."
                                    className="w-full bg-transparent text-white outline-none font-medium placeholder-gray-700 resize-none"
                                />
                            </div>

                            <div className="bg-[#050505] border border-white/10 rounded-2xl p-4 focus-within:border-[#ff0000]/50 transition-colors shadow-inner">
                                <label className="text-gray-500 font-bold text-xs tracking-widest uppercase mb-2 flex items-center gap-2">
                                    <FaLink /> Important Links (One per line)
                                </label>
                                <textarea
                                    rows="3"
                                    value={links}
                                    onChange={(e) => setLinks(e.target.value)}
                                    placeholder="https://instagram.com/yourname&#10;https://yourwebsite.com"
                                    className="w-full bg-transparent text-white outline-none font-medium placeholder-gray-700 resize-none font-mono text-sm leading-relaxed"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isGenerating}
                                className={`w-full bg-[#ff0000] hover:bg-[#ff1a1a] text-white font-black px-8 py-4 rounded-xl text-lg transition-all shadow-[0_0_20px_rgba(255,0,0,0.3)] hover:shadow-[0_0_30px_rgba(255,0,0,0.5)] flex items-center justify-center gap-3 ${isGenerating ? 'opacity-50 cursor-not-allowed shadow-none' : 'hover:scale-[1.02]'}`}
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        AI is Writing...
                                    </>
                                ) : (
                                    'Generate AI Description'
                                )}
                            </button>
                        </form>
                        {error && <p className="mt-4 text-red-500 text-sm font-medium">{error}</p>}
                    </div>

                    {/* Output Section */}
                    {description && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="modrinth-card p-8 border border-[#ff0000]/30 shadow-[0_0_50px_rgba(255,0,0,0.08)] bg-[#111] relative flex flex-col h-full"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-white">Generated Output</h3>
                                <button
                                    onClick={copyToClipboard}
                                    className={`text-sm px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all ${copied ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(72,187,120,0.2)]' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                                >
                                    {copied ? <><FaCheck /> Copied!</> : <><FaCopy /> Copy Text</>}
                                </button>
                            </div>

                            <div className="bg-[#050505] p-6 rounded-xl border border-white/5 flex-grow font-mono text-sm text-gray-300 whitespace-pre-wrap leading-loose shadow-inner overflow-y-auto max-h-[600px] selection:bg-[#ff0000]/30 selection:text-white">
                                {description}
                            </div>
                        </motion.div>
                    )}
                    {!description && (
                        <div className="hidden lg:flex modrinth-card border border-white/5 border-dashed bg-transparent items-center justify-center h-full text-center p-12">
                            <div>
                                <div className="text-6xl text-white/5 mb-6 flex justify-center"><FaFileAlt /></div>
                                <h3 className="text-2xl font-black text-gray-500 mb-2">Awaiting Input</h3>
                                <p className="text-gray-600 font-medium">Fill out the parameters to generate a semantic HTML structure.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default YoutubeDescriptionGenerator;
