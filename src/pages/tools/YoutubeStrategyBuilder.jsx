import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import Footer from '../../components/Footer';
import SEOHead from '../../components/SEOHead';
import { FaYoutube, FaMapSigns, FaMagic, FaCopy, FaCheck, FaUserTag, FaCrosshairs, FaChartBar, FaSpinner } from 'react-icons/fa';
import { auth, database } from '../../firebase';
import { onValue, ref } from 'firebase/database';
import { deductPowers } from '../../utils/db';
import API_BASE_URL from '../../utils/api';
import AdBanner from '../../components/AdBanner';

const calculateEarnings = (views) => {
    const lowRPM = 1.50;
    const highRPM = 4.00;
    if (!views || views === 0) return { range: "$0", rpm: "N/A" };
    const lowEst = (views / 1000) * lowRPM;
    const highEst = (views / 1000) * highRPM;
    return {
        range: `$${Math.round(lowEst).toLocaleString()} - $${Math.round(highEst).toLocaleString()}`,
        rpm: "$1.50 - $4.00 (Avg Tier 1/2)"
    };
};

const calculateSocialBladeGrade = (views) => {
    if (views > 50000000) return "A+";
    if (views > 15000000) return "A";
    if (views > 5000000) return "A-";
    if (views > 1000000) return "B+";
    if (views > 250000) return "B";
    if (views > 50000) return "B-";
    if (views > 10000) return "C+";
    if (views > 5000) return "C";
    return "C-";
};

const calculateSocialBladeRank = (subscribers) => {
    const subCount = parseInt(String(subscribers).replace(/,/g, '')) || 0;
    if (subCount > 100000000) return "25th";
    if (subCount > 50000000) return "100th";
    if (subCount > 10000000) return "800th";
    if (subCount > 1000000) return "15,000th";
    if (subCount > 100000) return "100,000th";
    return "500,000th+";
};

const YoutubeStrategyBuilder = () => {
    const navigate = useNavigate();
    const [handle, setHandle] = useState('');
    const [competitorHandle, setCompetitorHandle] = useState('');
    const [strategy, setStrategy] = useState(null);
    const [liveData, setLiveData] = useState(null);
    const [socialBladeData, setSocialBladeData] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    // Cost setting
    const STRATEGY_COST = 100;

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) {
                setLoadingUser(false);
                return;
            }

            const userRef = ref(database, `users/${user.uid}`);
            onValue(userRef, (snapshot) => {
                const data = snapshot.val();
                setUserData(data);
                setLoadingUser(false);
            });
        });

        return () => unsubscribe();
    }, []);

    const generateStrategy = async (e) => {
        e.preventDefault();
        if (!handle.trim()) return;

        if (!auth.currentUser) {
            navigate('/login');
            return;
        }

        if (userData?.powers < STRATEGY_COST) {
            setError(`Insufficient Coal Reserve! You need ${STRATEGY_COST} 🔥 but only have ${userData?.powers || 0} 🔥.`);
            return;
        }

        setIsGenerating(true);
        setError(null);
        setStrategy(null);
        setLiveData(null);
        setSocialBladeData(null);

        try {
            setLoadingStep('Scraping YouTube & AI Engine...');

            const response = await fetch(`${API_BASE_URL}/api/youtube/strategy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ handle, competitorHandle })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to generate strategy.");
            }

            const data = await response.json();

            // 1. Process Live Data
            setLiveData({
                yours: data.channelData,
                competitor: data.competitorData
            });

            // 2. Process Social Blade Data
            if (data.socialBlade) {
                setSocialBladeData({
                    ...data.socialBlade,
                    earnings: data.socialBlade.monthlyEarnings || "$0 - $0",
                    grade: data.socialBlade.grade || "C",
                    subRank: data.socialBlade.subRank || "N/A"
                });
            }

            // 3. Process Strategy
            setStrategy(data.strategy);

            // 4. Deduct Powers
            await deductPowers(auth.currentUser.uid, STRATEGY_COST);

        } catch (err) {
            console.error("Strategy Builder Error:", err);
            setError(err.message || "Failed to generate strategy.");
        } finally {
            setIsGenerating(false);
            setLoadingStep('');
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
            <SEOHead title="YouTube Strategy Builder" description="Analytics & AI Strategy" />
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[10%] right-[10%] w-[50%] h-[50%] bg-[#ff0000]/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[20%] left-[5%] w-[40%] h-[40%] bg-[#ff0000]/3 rounded-full blur-[120px]" />
            </div>

            <main className="flex-grow relative z-10 px-6 pt-32 pb-24 max-w-7xl mx-auto w-full">
                <AdBanner size="leaderboard" />
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#ff0000]/10 border border-[#ff0000]/20 text-[#ff0000] text-xs font-bold uppercase tracking-widest mb-4">
                        <FaChartBar /> Intelligence Dashboard
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight">Master <span className="text-[#ff0000]">Strategy</span></h1>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-3 lg:sticky lg:top-32 h-fit modrinth-card p-6 border border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl flex flex-col gap-6">
                        <form onSubmit={generateStrategy} className="flex flex-col gap-6">
                            <div className="bg-[#050505] border border-[#ff0000]/30 rounded-2xl p-4">
                                <label className="text-[#ff0000] font-bold text-xs uppercase mb-2 flex items-center gap-2"><FaUserTag /> Target Channel *</label>
                                <input type="text" required value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@MrBeast" className="w-full bg-transparent text-white text-lg outline-none font-bold" />
                            </div>
                            <div className="bg-[#050505] border border-white/10 rounded-2xl p-4">
                                <label className="text-gray-500 font-bold text-xs uppercase mb-2 flex items-center gap-2"><FaCrosshairs /> Competitor (Optional)</label>
                                <input type="text" value={competitorHandle} onChange={(e) => setCompetitorHandle(e.target.value)} placeholder="@Veritasium" className="w-full bg-transparent text-white text-lg outline-none font-bold" />
                            </div>
                            <button type="submit" disabled={isGenerating || loadingUser} className="w-full bg-[#ff0000] hover:bg-[#ff0000]/80 text-white font-black py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg">
                                {isGenerating ? <><FaSpinner className="animate-spin" /> {loadingStep || 'Analyzing...'}</> : <><FaMagic /> Build Strategy ({STRATEGY_COST} 🔥)</>}
                            </button>
                        </form>
                    </div>

                    <div className="lg:col-span-9 flex flex-col gap-8">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3">
                                <span className="text-xl">⚠️</span> {error}
                            </div>
                        )}

                        {liveData && (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-[#111] border border-white/10 rounded-xl p-4">
                                    <h4 className="text-gray-500 text-[10px] uppercase mb-1">Subscribers</h4>
                                    <h3 className="text-xl font-black text-white">{liveData.yours.subscribers}</h3>
                                </div>
                                <div className="bg-[#111] border border-white/10 rounded-xl p-4">
                                    <h4 className="text-[#ff0000] text-[10px] uppercase mb-1">30-Day Views</h4>
                                    <h3 className="text-xl font-black text-[#ff0000]">{socialBladeData?.last30DayViews || liveData.yours.thirtyDayViews.toLocaleString()}</h3>
                                </div>
                                <div className="bg-[#111] border border-white/10 rounded-xl p-4 border-l-4 border-l-green-500">
                                    <h4 className="text-green-500 text-[10px] uppercase mb-1">Grade</h4>
                                    <h3 className="text-xl font-black text-white">{socialBladeData ? socialBladeData.grade : "..."}</h3>
                                </div>
                                <div className="bg-[#111] border border-white/10 rounded-xl p-4 border-l-4 border-l-amber-500">
                                    <h4 className="text-amber-500 text-[10px] uppercase mb-1">Sub Rank</h4>
                                    <h3 className="text-xl font-black text-white">{socialBladeData ? socialBladeData.subRank : "..."}</h3>
                                </div>
                            </motion.div>
                        )}

                        {strategy ? (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-green-500 text-xs font-bold uppercase"><FaChartBar /> Est. Earnings</h4>
                                            {socialBladeData?.source && (
                                                <span className={`text-[8px] px-1.5 py-0.5 rounded border uppercase font-black ${socialBladeData.source === 'Social Blade' ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
                                                    {socialBladeData.source}
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-3xl font-black text-white">{socialBladeData ? socialBladeData.earnings : "$0 - $0"}</h2>
                                    </div>
                                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5">
                                        <h4 className="text-orange-500 text-xs font-bold uppercase mb-2">⏱️ Optimal Time</h4>
                                        <h2 className="text-3xl font-black text-white">{strategy.contentStrategy.optimalTimeLimit}</h2>
                                    </div>
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
                                        <h4 className="text-blue-500 text-xs font-bold uppercase mb-2">📊 Velocity Verdict</h4>
                                        <p className="text-white text-sm italic">"{strategy.monthlyPerformance.performanceVerdict}"</p>
                                    </div>
                                </div>

                                {socialBladeData && (
                                    <div className="modrinth-card bg-[#0a0a0a]/50 border border-white/5 p-6 rounded-2xl flex flex-col gap-6">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                            <h4 className="text-white font-black flex items-center gap-2 tracking-tight uppercase text-sm">
                                                <span className="p-1.5 bg-[#ff0000]/10 rounded-lg text-[#ff0000]"><FaChartBar /></span>
                                                Social Blade Deep Dive
                                            </h4>
                                            <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded-full font-bold uppercase tracking-widest border border-white/5">
                                                Realtime Chromium Extraction
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                            {[
                                                { label: "Uploads", value: socialBladeData.uploads },
                                                { label: "Country", value: socialBladeData.country },
                                                { label: "Channel Type", value: socialBladeData.channelType },
                                                { label: "Created", value: socialBladeData.userCreated },
                                                { label: "SB Rank", value: socialBladeData.sbRank },
                                                { label: "View Rank", value: socialBladeData.viewRank },
                                            ].map((item, idx) => (
                                                <div key={idx} className="flex flex-col gap-1">
                                                    <p className="text-[#ff0000] text-[9px] font-black uppercase tracking-tighter">{item.label}</p>
                                                    <p className="text-white font-bold text-sm truncate">{item.value || "—"}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-[#111] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <p className="text-gray-500 text-[10px] font-bold uppercase">Estimated Yearly Earnings</p>
                                                    <p className="text-green-500 font-black text-xl">{socialBladeData.yearlyEarnings || "—"}</p>
                                                </div>
                                                <div className="text-2xl opacity-20 text-green-500">💰</div>
                                            </div>
                                            <div className="bg-[#111] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                                <div>
                                                    <p className="text-gray-500 text-[10px] font-bold uppercase">Source Reliability</p>
                                                    <p className="text-blue-500 font-black text-xl">High (Chromium)</p>
                                                </div>
                                                <div className="text-2xl opacity-20 text-blue-500">🛡️</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                    <h4 className="text-white text-sm font-bold uppercase mb-4 pb-3 border-b border-white/5 flex items-center gap-2">
                                        <span className="text-yellow-500">💡</span> Remixed Viral Concepts
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {strategy.contentStrategy?.remixedIdeas?.map((idea, idx) => (
                                            <div key={idx} className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-[#ff0000]/50 transition-all flex flex-col gap-4">
                                                <div>
                                                    <h5 className="text-white font-black text-xl mb-2 leading-tight">"{idea.title}"</h5>
                                                    <p className="text-gray-400 text-xs leading-relaxed">{idea.concept}</p>
                                                </div>

                                                <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-white/5">
                                                    <div className="bg-[#ff0000]/5 p-3 rounded-lg border border-[#ff0000]/10">
                                                        <p className="text-[10px] text-[#ff0000] font-bold uppercase mb-1">📸 Thumbnail Idea:</p>
                                                        <p className="text-white text-[11px] leading-snug italic">{idea.thumbnailHook}</p>
                                                    </div>
                                                    <div className="bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
                                                        <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">🧠 Viral Hook Logic:</p>
                                                        <p className="text-gray-400 text-[10px] leading-snug">{idea.hookLogic}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                        <h4 className="text-white text-sm font-bold uppercase mb-4 pb-3 border-b border-white/5 flex items-center gap-2">
                                            <span className="text-red-500">⚔️</span> Niche Competition (<span className="text-[#ff0000]">{strategy.marketAnalysis?.competitionLevel}</span>)
                                        </h4>
                                        <div className="flex flex-col gap-3">
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Verified Market Rivals:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {strategy.marketAnalysis?.verifiedCompetitors && strategy.marketAnalysis.verifiedCompetitors.length > 0 ? (
                                                    strategy.marketAnalysis.verifiedCompetitors.map((comp, idx) => (
                                                        <span key={idx} className="bg-[#ff0000]/10 text-white text-[11px] px-3 py-1 rounded-full border border-[#ff0000]/30 font-bold" title={comp.description}>
                                                            {comp.title}
                                                        </span>
                                                    ))
                                                ) : strategy.marketAnalysis?.topCompetitorsInNiche?.length > 0 ? (
                                                    strategy.marketAnalysis.topCompetitorsInNiche.map((comp, idx) => (
                                                        <span key={idx} className="bg-white/5 text-gray-400 text-[11px] px-3 py-1 rounded-full border border-white/10">
                                                            {comp}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-500 text-xs italic">No specific rivals identified.</span>
                                                )}
                                            </div>
                                            <div className="mt-4 p-3 bg-[#111] rounded-lg border-l-4 border-[#ff0000]">
                                                <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">The Strategy Gap:</p>
                                                <p className="text-white text-xs leading-relaxed italic">{strategy.marketAnalysis?.marketGap}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                        <h4 className="text-white text-sm font-bold uppercase mb-4 pb-3 border-b border-white/5 flex items-center gap-2">
                                            <span className="text-purple-500">📈</span> Audience Demand
                                        </h4>
                                        <div className="flex flex-col gap-3">
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">High-Volume Search Terms:</p>
                                            <div className="flex flex-col gap-2">
                                                {strategy.audienceDemand?.topSearchTerms?.map((term, idx) => (
                                                    <div key={idx} className="bg-white/5 text-gray-300 text-xs px-3 py-2 rounded-lg border border-white/10 flex items-center gap-2">
                                                        <span className="text-purple-500">🔍</span> "{term}"
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-auto pt-4">
                                                <div className="p-3 bg-[#111] rounded-lg border-l-4 border-purple-500">
                                                    <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Current Trend Meta:</p>
                                                    <p className="text-white text-xs leading-relaxed">{strategy.audienceDemand.currentTrend}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="modrinth-card border border-white/5 border-dashed bg-[#0a0a0a] items-center justify-center h-full text-center p-12 flex flex-col min-h-[500px]">
                                <h3 className="text-2xl font-black text-gray-500 mb-2">Awaiting Target</h3>
                                <p className="text-gray-600 font-medium max-w-md mx-auto">Drop a channel handle. The AI will tear open its analytics, search top competitors, and build your strategy.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default YoutubeStrategyBuilder;
