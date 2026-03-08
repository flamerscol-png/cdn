import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Footer from '../../components/Footer';
import API_BASE_URL from '../../utils/api';
import AdBanner from '../../components/AdBanner';

const PositionTracker = () => {
    const [keyword, setKeyword] = useState('');
    const [domain, setDomain] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);
    const [region, setRegion] = useState('us');

    // Load history on mount
    React.useEffect(() => {
        const saved = localStorage.getItem('flamercoal_rank_history');
        if (saved) setHistory(JSON.parse(saved));
    }, []);

    // Save history helper
    const addToHistory = (item) => {
        const newHistory = [item, ...history.slice(0, 9)];
        setHistory(newHistory);
        localStorage.setItem('flamercoal_rank_history', JSON.stringify(newHistory));
    };

    const regions = [
        { id: 'us', name: 'United States (Google.com)', gl: 'us', hl: 'en' },
        { id: 'in', name: 'India (Google.co.in)', gl: 'in', hl: 'en' },
        { id: 'uk', name: 'United Kingdom (Google.co.uk)', gl: 'uk', hl: 'en' },
        { id: 'ca', name: 'Canada (Google.ca)', gl: 'ca', hl: 'en' },
        { id: 'au', name: 'Australia (Google.com.au)', gl: 'au', hl: 'en' },
    ];

    const handleCheck = async (e) => {
        e.preventDefault();

        let targetKeyword = keyword.trim();
        let targetDomain = domain.trim();
        if (!targetKeyword || !targetDomain) return;

        // Clean up domain input logically (remove http://, www., paths)
        try {
            if (targetDomain.startsWith('http')) {
                const urlObj = new URL(targetDomain);
                targetDomain = urlObj.hostname;
            }
            targetDomain = targetDomain.replace(/^www\./, '').toLowerCase();
        } catch (e) {
            // Let it pass, string might just be "example.com"
        }

        setIsChecking(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/track-position`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    keyword: targetKeyword,
                    domain: targetDomain,
                    region: region
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to track position');
            }

            const data = await response.json();
            setResult(data);
            addToHistory({
                keyword: targetKeyword,
                domain: targetDomain,
                rank: data.rank,
                date: new Date().toLocaleDateString()
            });
        } catch (err) {
            console.error("Position tracker error:", err);
            setError(err.message || 'An error occurred while tracking position.');
        } finally {
            setIsChecking(false);
        }
    };

    const getStatusText = (rank) => {
        if (!rank) return { text: "Not in Top 50", color: "text-red-400", bg: "bg-red-500/10" };
        if (rank <= 3) return { text: "Top 3 Ranking", color: "text-green-400", bg: "bg-green-500/10" };
        if (rank <= 10) return { text: "Page 1 - Excellent", color: "text-emerald-400", bg: "bg-emerald-500/10" };
        if (rank <= 20) return { text: "Page 2 - Good", color: "text-blue-400", bg: "bg-blue-500/10" };
        if (rank <= 30) return { text: "Page 3 - Fair", color: "text-yellow-400", bg: "bg-yellow-500/10" };
        return { text: "Deep Ranking", color: "text-orange-400", bg: "bg-orange-500/10" };
    };

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-blue-500/30">
            {/* Subtle background glow */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-900/10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                <AdBanner size="leaderboard" />
                {/* Header */}
                <div className="text-center mb-12">
                    <Link to="/seo-tools" className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors mb-6">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Back to SEO Tools
                    </Link>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-block">
                        <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                            Rank Intelligence
                        </span>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                            SERP <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Position Tracker</span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Instantly find your website's exact organic ranking on search engines and see exactly who is outranking you.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left: Tracker Form */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Input Area */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gray-900/80 border border-gray-800 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl"
                        >
                            <form onSubmit={handleCheck} className="flex flex-col gap-6">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Keyword Input */}
                                    <div className="flex-1 relative">
                                        <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Target Keyword</label>
                                        <div className="absolute top-[38px] left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                            placeholder="e.g., youtube seo tips"
                                            className="w-full bg-black/50 border border-gray-700 rounded-xl pl-11 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-lg"
                                            required
                                        />
                                    </div>

                                    {/* Domain Input */}
                                    <div className="flex-1 relative">
                                        <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Your Domain</label>
                                        <div className="absolute top-[38px] left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={domain}
                                            onChange={(e) => setDomain(e.target.value)}
                                            placeholder="e.g., yoursite.com"
                                            className="w-full bg-black/50 border border-gray-700 rounded-xl pl-11 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-lg"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Region Selector */}
                                <div className="relative">
                                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">Search Region</label>
                                    <select
                                        value={region}
                                        onChange={(e) => setRegion(e.target.value)}
                                        className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-lg appearance-none cursor-pointer"
                                    >
                                        {regions.map((reg) => (
                                            <option key={reg.id} value={reg.id} className="bg-gray-900 text-white">
                                                {reg.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute top-[42px] right-4 pointer-events-none text-gray-400">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isChecking || !keyword.trim() || !domain.trim()}
                                    className={`px-8 py-4 font-bold rounded-xl transition-all flex justify-center items-center gap-2 w-full ${isChecking || !keyword.trim() || !domain.trim()
                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.99]'
                                        }`}
                                >
                                    {isChecking ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Scraping...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                            Track Position
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>

                        <AdBanner size="leaderboard" className="mt-8 mb-4" />

                        {/* Results Area */}
                        <AnimatePresence mode="wait">
                            {isChecking && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 text-center"
                                >
                                    <div className="w-12 h-12 relative mx-auto mb-4 scale-150">
                                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Analyzing SERP Data...</h3>
                                    <p className="text-gray-400 text-sm">Searching Google Rank for "{keyword}"</p>
                                </motion.div>
                            )}

                            {error && !isChecking && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 bg-red-900/20 border border-red-500/30 rounded-2xl text-red-200 flex items-start gap-4"
                                >
                                    <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                    <div>
                                        <h3 className="font-bold text-red-400 text-lg mb-1">Tracker Failed</h3>
                                        <p className="text-red-200/80">{error}</p>
                                    </div>
                                </motion.div>
                            )}

                            {result && !error && !isChecking && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Big Rank Box */}
                                        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 p-8 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group">
                                            <div className="absolute w-40 h-40 bg-blue-500/10 rounded-full blur-[50px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 group-hover:bg-teal-500/10 transition-colors" />
                                            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-4 z-10">Current Rank</p>
                                            <div className="flex items-start justify-center z-10">
                                                <span className="text-4xl font-light text-gray-500 mt-2 mr-2">#</span>
                                                <span className="text-7xl md:text-8xl font-black text-white tracking-tighter">
                                                    {result.rank || '>50'}
                                                </span>
                                            </div>
                                            <div className={`mt-6 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest z-10 ${getStatusText(result.rank).bg} ${getStatusText(result.rank).color} border-current opacity-80`}>
                                                {getStatusText(result.rank).text}
                                            </div>
                                        </div>

                                        {/* Details & Top Competitors */}
                                        <div className="md:col-span-2 space-y-4">
                                            <div className="bg-gray-900/40 border border-gray-800 p-6 rounded-2xl flex items-center justify-between">
                                                <div>
                                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Keyword</p>
                                                    <p className="text-lg font-bold text-white truncate max-w-[150px]">"{result.keyword}"</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Domain</p>
                                                    <p className="text-lg font-bold text-white">{result.domain}</p>
                                                </div>
                                            </div>

                                            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6">
                                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                                    Top Competitors
                                                </h3>
                                                <div className="space-y-2">
                                                    {result.competitors?.slice(0, 3).map((comp, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 py-1 text-xs">
                                                            <div className="w-5 h-5 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center font-bold">{idx + 1}</div>
                                                            <p className="text-gray-300 truncate">{comp.domain}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right: History Sidebar (Always Visible) */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-6 sticky top-24">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Recent Checks
                            </h3>
                            <div className="space-y-4">
                                {history.length > 0 ? history.map((h, i) => (
                                    <div key={i} className="group p-3 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-white font-bold text-sm truncate pr-2">{h.keyword}</p>
                                            <span className={`text-xs font-black ${h.rank ? 'text-blue-400' : 'text-red-500'}`}>
                                                #{h.rank || '--'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-gray-500">
                                            <p className="truncate">{h.domain}</p>
                                            <p>{h.date}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                                        </div>
                                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">No history yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PositionTracker;
