import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import Footer from '../../components/Footer';
import SEOHead from '../../components/SEOHead';
import { FaYoutube, FaMapSigns, FaMagic, FaCopy, FaCheck, FaUserTag, FaCrosshairs, FaChartBar, FaSpinner, FaRedo, FaPaperPlane, FaScroll, FaCalendarAlt, FaTags, FaSave, FaHistory, FaTrash, FaUsers, FaEye, FaUserPlus, FaMoneyBillWave } from 'react-icons/fa';
import { auth, database } from '../../firebase';
import { onValue, ref, push, set, remove, get } from 'firebase/database';
import { deductPowers } from '../../utils/db';
import API_BASE_URL from '../../utils/api';
import AdBanner from '../../components/AdBanner';

const formatCompactNumber = (number) => {
    if (number === null || number === undefined) return "0";
    const num = typeof number === 'string' ? parseInt(number.replace(/,/g, '')) : number;
    if (isNaN(num)) return "0";
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
};

const calculateChannelGrade = (subRank) => {
    const rank = typeof subRank === 'string' ? parseInt(subRank.replace(/,/g, '')) : subRank;
    if (!rank || isNaN(rank)) return "C";
    if (rank <= 100) return "A++";
    if (rank <= 1000) return "A+";
    if (rank <= 5000) return "A";
    if (rank <= 15000) return "A-";
    if (rank <= 50000) return "B+";
    if (rank <= 100000) return "B";
    if (rank <= 500000) return "C+";
    return "C";
};

// --- VIEWSTATS DECRYPTION ---
const decryptViewStats = async (encryptedBuffer) => {
    try {
        const VS_IV_B64 = "Wzk3LCAxMDksIC0xMDAsIC05MCwgMTIyLCAtMTI0LCAxMSwgLTY5LCAtNDIsIDExNSwgLTU4LCAtNjcsIDQzLCAtNzUsIDMxLCA3NF0=";
        const VS_KEY_B64 = "Wy0zLCAtMTEyLCAxNSwgLTEyNCwgLTcxLCAzMywgLTg0LCAxMDksIDU3LCAtMTI3LCAxMDcsIC00NiwgMTIyLCA0OCwgODIsIC0xMjYsIDQ3LCA3NiwgLTEyNywgNjUsIDc1LCAxMTMsIC0xMjEsIDg5LCAtNzEsIDUwLCAtODMsIDg2LCA5MiwgLTQ2LCA0OSwgNTZd";
        const keyArr = JSON.parse(atob(VS_KEY_B64));
        const ivArr = JSON.parse(atob(VS_IV_B64));
        const keyBytes = new Uint8Array(keyArr.map(b => (b + 256) % 256));
        const ivBytes = new Uint8Array(ivArr.map(b => (b + 256) % 256));
        const encryptedBytes = new Uint8Array(encryptedBuffer);
        const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, cryptoKey, encryptedBytes);
        return JSON.parse(new TextDecoder().decode(decrypted));
    } catch (e) {
        console.error("ViewStats Decryption failed:", e);
        return null;
    }
};

const fetchViewStatsDirect = async (handle) => {
    try {
        const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
        
        // Fetch perfectly parsed + decrypted data from our secure local Node API 
        // (which acts exactly like the PHP wrapper you provided)
        const res = await fetch(`${API_BASE_URL}/api/viewstats/channel?handle=${encodeURIComponent(cleanHandle)}`);
        
        if (!res.ok) return null;
        const data = await res.json();
        
        return {
            grade: data.grade || "B",
            name: data.name || cleanHandle,
            subscribers: data.subscribers || "0",
            uploads: data.uploads || "0",
            totalViews: data.totalViews || "0",
            country: data.country || "US",
            channelType: data.channelType || "YouTube",
            last30DayViews: data.last30DayViews || "0",
            subscribersLast30Days: data.subscribersLast30Days || "0",
            monthlyEarnings: data.monthlyEarnings || "$0 - $0",
            source: data.source || 'ViewStats Free Proxy'
        };
    } catch (e) {
        console.error("fetchViewStatsDirect Error:", e);
        return null;
    }
};

// --- GROQ HELPER ---
const callGroq = async (systemMsg, userMsg) => {
    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
    if (!GROQ_API_KEY) throw new Error("Missing VITE_GROQ_API_KEY");
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }], response_format: { type: "json_object" }, temperature: 0.7 })
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Groq API Error'); }
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
};

const callGroqText = async (systemMsg, userMsg) => {
    const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
    if (!GROQ_API_KEY) throw new Error("Missing VITE_GROQ_API_KEY");
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }], temperature: 0.7 })
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || 'Groq API Error'); }
    const data = await res.json();
    return data.choices[0].message.content;
};

// --- NICHE SCORE GAUGE ---
const NicheScoreGauge = ({ score }) => {
    const color = score <= 33 ? '#22c55e' : score <= 66 ? '#eab308' : '#ef4444';
    const label = score <= 33 ? 'Low Competition' : score <= 66 ? 'Medium' : 'High Competition';
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-20 h-20">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                    <path d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32" fill="none" stroke="#ffffff10" strokeWidth="3" />
                    <path d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${score}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black" style={{ color }}>{score}</span>
                </div>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color }}>{label}</p>
        </div>
    );
};

// --- VELOCITY GRAPH COMPONENT ---
const VelocityGraph = ({ points, verdict }) => {
    // Tank-proof normalization
    let actualPoints = [];
    if (Array.isArray(points)) {
        actualPoints = points;
    } else if (points && typeof points === 'object') {
        actualPoints = Object.values(points);
    }
    
    // Ensure 6 points, fallback if junk
    actualPoints = actualPoints.map(p => {
        const val = Number(p);
        return isNaN(val) ? 0 : val;
    });
    
    // If still empty or all zeros, use a visual placeholder curve so it's not "nothing"
    if (actualPoints.length === 0 || actualPoints.every(v => v === 0)) {
        actualPoints = [15, 30, 45, 60, 75, 90]; 
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex items-end justify-between gap-2 h-24 px-3 bg-white/[0.03] rounded-xl border border-white/5 py-4">
                {actualPoints.slice(0, 6).map((p, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group min-w-[10px]">
                        <div className="w-full relative flex flex-col justify-end h-full">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(p, 8)}%` }} // Ensure at least 8% is visible
                                transition={{ duration: 1.2, delay: i * 0.1, ease: [0.33, 1, 0.68, 1] }}
                                className="w-[80%] mx-auto bg-gradient-to-t from-[#ff0000] to-[#ff4444] rounded-t-[2px] relative group-hover:brightness-125 transition-all shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                            >
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-[9px] font-black px-1.5 py-0.5 rounded-sm shadow-2xl pointer-events-none z-30">
                                    {p}%
                                </div>
                            </motion.div>
                        </div>
                        <span className="text-[7px] font-black text-gray-500 group-hover:text-white transition-colors">M{i + 1}</span>
                    </div>
                ))}
            </div>
            {verdict && (
                <div className="px-2 pt-2 border-t border-white/5">
                    <p className="text-white text-[11px] font-medium italic text-center opacity-80 leading-relaxed italic">
                        "{verdict}"
                    </p>
                </div>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---
const YoutubeStrategyBuilder = () => {
    const navigate = useNavigate();
    const chatEndRef = useRef(null);
    const [handle, setHandle] = useState('');
    const [competitorHandle, setCompetitorHandle] = useState('');
    
    // --- ANALYTICS STATE ---
    const [strategy, setStrategy] = useState(null);
    const [liveData, setLiveData] = useState(null);
    const [socialBladeData, setSocialBladeData] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [error, setError] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [copied, setCopied] = useState(false);

    // Feature states
    const [seoExpanded, setSeoExpanded] = useState({});
    const [seoData, setSeoData] = useState({});
    const [seoLoading, setSeoLoading] = useState({});
    const [scriptModal, setScriptModal] = useState(null);
    const [scriptLoading, setScriptLoading] = useState(false);
    const [scriptContent, setScriptContent] = useState('');
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [savedStrategies, setSavedStrategies] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [rerollLoading, setRerollLoading] = useState({});

    const STRATEGY_COST = 100;
    const FOLLOWUP_COST = 25;

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) { setLoadingUser(false); return; }
            const userRef = ref(database, `users/${user.uid}`);
            onValue(userRef, (snapshot) => { setUserData(snapshot.val()); setLoadingUser(false); });
            // Load saved strategies
            const stratRef = ref(database, `strategies/${user.uid}`);
            onValue(stratRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const list = Object.entries(data).map(([id, val]) => ({ id, ...val })).sort((a, b) => b.timestamp - a.timestamp);
                    setSavedStrategies(list);
                } else { setSavedStrategies([]); }
            });
        });
        return () => unsubscribe();
    }, []);

    // --- COPY STRATEGY ---
    const copyStrategy = () => {
        if (!strategy) return;
        const text = `
🎯 YOUTUBE STRATEGY FOR @${handle}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Niche Score: ${strategy.nicheScore || 'N/A'}/100
⏱️ Optimal Video Length: ${strategy.contentStrategy?.optimalTimeLimit || 'N/A'}
📈 Verdict: ${strategy.monthlyPerformance?.performanceVerdict || 'N/A'}

💡 VIRAL VIDEO IDEAS:
${strategy.contentStrategy?.remixedIdeas?.map((idea, i) => `${i + 1}. "${idea.title}"\n   ${idea.concept}\n   🎨 Thumbnail: ${idea.thumbnailHook}`).join('\n\n') || 'None'}

⚔️ COMPETITION (${strategy.marketAnalysis?.competitionLevel || 'N/A'}):
${strategy.marketAnalysis?.verifiedCompetitors?.map(c => `• ${c.title}: ${c.description}`).join('\n') || 'None'}
Gap: ${strategy.marketAnalysis?.marketGap || 'N/A'}

🔍 AUDIENCE DEMAND:
${strategy.audienceDemand?.topSearchTerms?.map(t => `• "${t}"`).join('\n') || 'None'}
Trend: ${strategy.audienceDemand?.currentTrend || 'N/A'}

🎙️ VIRAL HOOKS: ${strategy.viralHooks?.map(h => `\n• "${h}"`).join('') || 'None'}

📅 CONTENT CALENDAR:
${strategy.weeklySchedule?.map(d => `• ${d.day}: ${d.contentType} — ${d.topic}`).join('\n') || 'None'}

🗺️ EXECUTION PLAN:
${strategy.executionPlan?.map(p => `• ${p}`).join('\n') || 'None'}
`.trim();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // --- SAVE STRATEGY ---
    const saveStrategy = async () => {
        if (!strategy || !auth.currentUser) return;
        const stratRef = ref(database, `strategies/${auth.currentUser.uid}`);
        await push(stratRef, { handle, competitorHandle, strategy, socialBladeData, timestamp: Date.now() });
    };

    // --- LOAD SAVED STRATEGY ---
    const loadSavedStrategy = (saved) => {
        setHandle(saved.handle);
        setCompetitorHandle(saved.competitorHandle || '');
        setStrategy(saved.strategy);
        setSocialBladeData(saved.socialBladeData);
        setLiveData({ yours: saved.socialBladeData });
        setChatMessages([]);
        setShowHistory(false);
    };

    // --- DELETE SAVED STRATEGY ---
    const deleteSavedStrategy = async (id) => {
        if (!auth.currentUser) return;
        await remove(ref(database, `strategies/${auth.currentUser.uid}/${id}`));
    };

    // --- SEO TITLE OPTIMIZER ---
    const generateSEOTitles = async (idea, idx) => {
        if (seoLoading[idx]) return;
        setSeoLoading(p => ({ ...p, [idx]: true }));
        try {
            const result = await callGroq(
                'You are a YouTube SEO expert. Output ONLY valid JSON.',
                `Generate 3 SEO-optimized title variations and 5 relevant YouTube tags for this video concept:\nTitle: "${idea.title}"\nConcept: ${idea.concept}\n\nOutput JSON: { "titles": ["title1","title2","title3"], "tags": ["tag1","tag2","tag3","tag4","tag5"] }`
            );
            setSeoData(p => ({ ...p, [idx]: result }));
            setSeoExpanded(p => ({ ...p, [idx]: true }));
        } catch (e) { console.error(e); }
        setSeoLoading(p => ({ ...p, [idx]: false }));
    };

    // --- SCRIPT WRITER ---
    const generateScript = async (idea) => {
        setScriptModal(idea);
        setScriptLoading(true);
        setScriptContent('');
        try {
            const result = await callGroqText(
                'You are a top YouTube scriptwriter. Write engaging, conversational scripts with hooks, transitions, and CTAs.',
                `Write a full YouTube video script outline for:\nTitle: "${idea.title}"\nConcept: ${idea.concept}\n\nInclude:\n1. HOOK (first 10 seconds — attention-grabbing)\n2. INTRO (set up the premise, 30 seconds)\n3. MAIN CONTENT (3-5 key segments with transitions)\n4. CLIMAX (the big reveal/payoff)\n5. CTA (subscribe, like, comment prompt)\n\nMake it conversational and engaging. Use timestamps.`
            );
            setScriptContent(result);
            if (auth.currentUser) await deductPowers(auth.currentUser.uid, FOLLOWUP_COST);
        } catch (e) { setScriptContent('Failed to generate script: ' + e.message); }
        setScriptLoading(false);
    };

    // --- AI CHAT ---
    const sendChatMessage = async () => {
        if (!chatInput.trim() || chatLoading || !strategy) return;
        if (userData?.powers < FOLLOWUP_COST) { setChatMessages(p => [...p, { role: 'system', content: `Not enough Coal! You need ${FOLLOWUP_COST} 🔥.` }]); return; }

        const userMsg = chatInput.trim();
        setChatInput('');
        setChatMessages(p => [...p, { role: 'user', content: userMsg }]);
        setChatLoading(true);
        try {
            const context = `Previous strategy for @${handle}: ${JSON.stringify(strategy).slice(0, 2000)}`;
            const result = await callGroqText(
                'You are a YouTube growth expert. Answer follow-up questions about the strategy. Be specific and actionable.',
                `Context: ${context}\n\nUser question: ${userMsg}`
            );
            setChatMessages(p => [...p, { role: 'assistant', content: result }]);
            if (auth.currentUser) await deductPowers(auth.currentUser.uid, FOLLOWUP_COST);
        } catch (e) { setChatMessages(p => [...p, { role: 'system', content: 'Error: ' + e.message }]); }
        setChatLoading(false);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    // --- REROLL SECTION ---
    const rerollSection = async (section) => {
        if (rerollLoading[section] || !strategy) return;
        if (userData?.powers < FOLLOWUP_COST) { setError(`Need ${FOLLOWUP_COST} 🔥 to re-roll!`); return; }
        setRerollLoading(p => ({ ...p, [section]: true }));
        try {
            const sectionPrompts = {
                titles: `Generate 5 NEW and COMPLETELY DIFFERENT viral video ideas for a ${socialBladeData?.channelType || 'YouTube'} channel (@${handle}). Use different viral frameworks (challenge, comparison, reaction, contrarian, ranking). Each title must have numbers/superlatives, create curiosity gaps, be 8-12 words. Output JSON: { "remixedIdeas": [{ "title": "...", "concept": "...", "thumbnailHook": "...", "hookLogic": "..." }] }`,
                hooks: `Generate 3 NEW viral hooks (first 5-second opening lines) for a ${socialBladeData?.channelType || 'YouTube'} channel (@${handle}). Use pattern interrupts. Output JSON: { "viralHooks": ["hook1", "hook2", "hook3"] }`,
                gaps: `Generate 3 NEW content gaps for a ${socialBladeData?.channelType || 'YouTube'} channel (@${handle}) — specific untapped topics with high search demand. Output JSON: { "contentGaps": ["gap1", "gap2", "gap3"] }`
            };
            const result = await callGroq('You are a YouTube viral strategist. Output ONLY valid JSON.', sectionPrompts[section]);
            setStrategy(prev => {
                const updated = { ...prev };
                if (section === 'titles') updated.contentStrategy = { ...updated.contentStrategy, remixedIdeas: result.remixedIdeas };
                if (section === 'hooks') updated.viralHooks = result.viralHooks;
                if (section === 'gaps') updated.contentGaps = result.contentGaps;
                return updated;
            });
            if (auth.currentUser) await deductPowers(auth.currentUser.uid, FOLLOWUP_COST);
        } catch (e) { console.error(e); }
        setRerollLoading(p => ({ ...p, [section]: false }));
    };

    // --- MAIN GENERATE ---
    const generateStrategy = async (e) => {
        e.preventDefault();
        if (!handle.trim()) return;
        if (!auth.currentUser) { navigate('/login'); return; }
        if (userData?.powers < STRATEGY_COST) { setError(`Insufficient Coal! Need ${STRATEGY_COST} 🔥 but have ${userData?.powers || 0} 🔥.`); return; }

        setIsGenerating(true); setError(null); setStrategy(null); setLiveData(null); setSocialBladeData(null); setChatMessages([]); setSeoData({}); setSeoExpanded({});

        try {
            setLoadingStep('Fetching Channel Analytics...');
            // Always fetch fresh data — never use stale React state from previous query
            const vData = await fetchViewStatsDirect(handle).catch(() => null);

            // ViewStats only has data for large/popular channels — gracefully continue without it
            if (vData) {
                setSocialBladeData(vData);
                setLiveData({ yours: vData });
            }

            let compData = null;
            if (competitorHandle) { setLoadingStep('Fetching Competitor...'); compData = await fetchViewStatsDirect(competitorHandle).catch(() => null); }

            setLoadingStep('AI Building Strategy...');

            const statsContext = vData
                ? `Subscribers: ${vData.subscribers}, Uploads: ${vData.uploads}, Views/30d: ${vData.last30DayViews}, Grade: ${vData.grade}, Country: ${vData.country}, Type: ${vData.channelType}`
                : 'No ViewStats data available — analyze the channel niche and name to infer the category, audience, and content type.';

            const prompt = `
You are an elite YouTube Strategist and Channel Auditor.
Analyze this channel deeply based on its public data:

CHANNEL: @${handle}
COMPETITOR: @${competitorHandle || 'None'}
DATA: ${statsContext}

INSTRUCTIONS (YOU MUST INCLUDE ALL SECTIONS):
1. **CHANNEL AUDIT**: Identify exactly what is WRONG with the current channel.
2. **CONTENT REQUIREMENTS**: Specific mix of Shorts/Long-form and content style.
3. **NICHE SCORE**: 1-100 difficulty.
4. **VIRAL IDEAS**: 5 hyper-specific ideas with viral hooks.
5. **WEEKLY SCHEDULE**: 7-day content plan.
6. **ACTIONABLE GROWTH MAP**: 3 immediate critical changes.
7. **PERFORMANCE FORECAST**: You MUST project Growth Velocity for the next 6 months.

Output ONLY this JSON structure (don't miss performanceVerdict or velocityPoints):
{
  "nicheScore": 75,
  "audit": { "whatIsWrong": ["...", "..."], "growthMap": ["...", "..."] },
  "contentStrategy": { "requiredType": "...", "optimalTimeLimit": "...", "remixedIdeas": [{ "title": "...", "concept": "...", "thumbnailHook": "...", "hookLogic": "..." }] },
  "monthlyPerformance": { 
    "performanceVerdict": "A detailed forecast of growth momentum...",
    "velocityPoints": [30, 45, 60, 72, 85, 95] 
  },
  "marketAnalysis": { "competitionLevel": "...", "verifiedCompetitors": [{ "title": "...", "description": "..." }], "marketGap": "..." },
  "viralHooks": ["...", "...", "..."],
  "contentGaps": ["...", "...", "..."],
  "weeklySchedule": [{ "day": "Monday", "contentType": "Short", "topic": "..." }, ...],
  "executionPlan": ["Month 1: ...", "Month 2: ...", "Month 3: ..."]
}`;

            const parsedStrategy = await callGroq(
                'You are an expert YouTube strategist. Your analysis must be specific and actionable. Output ONLY valid JSON.',
                prompt
            );

            // --- DATA NORMALIZATION & FALLBACKS ---
            if (!parsedStrategy.monthlyPerformance) {
                parsedStrategy.monthlyPerformance = { 
                    performanceVerdict: "Projected momentum remains strong based on current niche trends.",
                    velocityPoints: [20, 35, 52, 68, 82, 95] 
                };
            } else {
                // Ensure velocityPoints is a valid array of numbers
                const rawPoints = parsedStrategy.monthlyPerformance.velocityPoints || 
                                 parsedStrategy.monthlyPerformance.velocity_points || 
                                 parsedStrategy.monthlyPerformance.growthPoints || [];
                
                let normalizedPoints = Array.isArray(rawPoints) ? rawPoints : Object.values(rawPoints);
                normalizedPoints = normalizedPoints.map(p => Number(p)).filter(p => !isNaN(p));
                
                if (normalizedPoints.length < 6) {
                    // Pad or replace if incomplete
                    const fallbacks = [25, 40, 55, 70, 85, 98];
                    parsedStrategy.monthlyPerformance.velocityPoints = normalizedPoints.length === 0 
                        ? fallbacks 
                        : [...normalizedPoints, ...fallbacks.slice(normalizedPoints.length)];
                } else {
                    parsedStrategy.monthlyPerformance.velocityPoints = normalizedPoints.slice(0, 6);
                }

                if (!parsedStrategy.monthlyPerformance.performanceVerdict) {
                    parsedStrategy.monthlyPerformance.performanceVerdict = "Momentum is projected to accelerate following the recommended strategy implementation.";
                }
            }

            if (!parsedStrategy.executionPlan) {
                parsedStrategy.executionPlan = [
                    "Month 1: Branding overhaul and initial content pivot.",
                    "Month 2: Scaling production and community engagement.",
                    "Month 3: Viral optimization and cross-platform synergy."
                ];
            }

            if (compData) setLiveData(prev => ({ ...prev, competitor: compData }));
            setStrategy(parsedStrategy);
            await deductPowers(auth.currentUser.uid, STRATEGY_COST);
        } catch (err) {
            console.error("Strategy Builder Error:", err);
            setError(err.message || "Failed to generate strategy.");
        } finally { setIsGenerating(false); setLoadingStep(''); }
    };

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
            <SEOHead title="YouTube Strategy Builder" description="AI-powered YouTube growth strategy with niche analysis, viral concepts, and content calendar" />
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
                    {/* --- LEFT SIDEBAR --- */}
                    <div className="lg:col-span-3 lg:sticky lg:top-32 h-fit flex flex-col gap-4">
                        <div className="modrinth-card p-6 border border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl flex flex-col gap-6">
                            <form onSubmit={generateStrategy} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-3">
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <FaYoutube className="text-gray-600 group-focus-within:text-[#ff0000] transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Channel Handle (e.g. @MrBeast)"
                                                className="w-full bg-[#050505] border border-white/5 rounded-2xl pl-11 pr-4 py-4 text-white focus:outline-none focus:border-[#ff0000]/50 transition-all font-medium placeholder-gray-700 shadow-inner"
                                                value={handle}
                                                onChange={(e) => setHandle(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[#050505] border border-white/10 rounded-2xl p-4">
                                    <label className="text-gray-500 font-bold text-xs uppercase mb-2 flex items-center gap-2"><FaCrosshairs /> Competitor (Optional)</label>
                                    <input type="text" value={competitorHandle} onChange={(e) => setCompetitorHandle(e.target.value)} placeholder="@Veritasium" className="w-full bg-transparent text-white text-lg outline-none font-bold" />
                                </div>
                                <button type="submit" disabled={isGenerating || !handle.trim()} className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${isGenerating || !handle.trim() ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-[#ff0000] text-white hover:brightness-110 active:scale-95 shadow-xl shadow-[#ff0000]/20'}`}>
                                    {isGenerating ? 'AI Scrutinizing...' : `Build Strategy (${STRATEGY_COST} 🔥)`}
                                </button>
                            </form>

                            {error && (<div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-500 text-xs font-bold"><span className="uppercase tracking-widest">⚠️ Error</span><p className="opacity-70 mt-1">{error}</p></div>)}
                            {isGenerating && (<div className="flex flex-col gap-3"><div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><motion.div className="h-full bg-[#ff0000]" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 15, ease: "linear" }} /></div><p className="text-[10px] font-black text-[#ff0000] uppercase tracking-widest text-center animate-pulse">{loadingStep}</p></div>)}
                        </div>

                        {/* Sidebar Ads: Triple 300x250 */}
                        <div className="space-y-4">
                            <AdBanner size="rectangle" />
                            <AdBanner size="rectangle" />
                            <AdBanner size="rectangle" />
                        </div>

                        {/* --- PAST STRATEGIES ---*/}
                        {savedStrategies.length > 0 && (
                            <div className="modrinth-card p-4 border border-white/5 bg-[#0a0a0a]/80">
                                <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white w-full">
                                    <FaHistory /> Past Strategies ({savedStrategies.length})
                                </button>
                                <AnimatePresence>
                                    {showHistory && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3 flex flex-col gap-2">
                                            {savedStrategies.slice(0, 10).map(s => (
                                                <div key={s.id} className="flex items-center justify-between bg-[#111] p-2 rounded-lg border border-white/5 text-xs">
                                                    <button onClick={() => loadSavedStrategy(s)} className="text-left flex-1 hover:text-[#ff0000] transition-colors">
                                                        <span className="font-bold text-white">@{s.handle}</span>
                                                        <span className="text-gray-500 ml-2">{new Date(s.timestamp).toLocaleDateString()}</span>
                                                    </button>
                                                    <button onClick={() => deleteSavedStrategy(s.id)} className="text-gray-600 hover:text-red-500 p-1"><FaTrash size={10} /></button>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* --- MAIN CONTENT --- */}
                    <div className="lg:col-span-9">
                        {isGenerating && !strategy && (
                            <div className="modrinth-card border border-white/5 p-12 h-full flex flex-col items-center justify-center min-h-[500px] text-center">
                                <div className="w-16 h-16 border-4 border-white/5 border-t-[#ff0000] rounded-full animate-spin mb-8"></div>
                                <h3 className="text-2xl font-black mb-2 animate-pulse text-[#ff0000]">BUILDING THE BLUEPRINT</h3>
                                <p className="text-gray-500 font-medium max-w-sm">Decoding viral patterns and engineering your content strategy...</p>
                            </div>
                        )}

                        {strategy ? (
                            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-6">

                                {/* TOP BAR — Stats + Buttons */}
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-6">
                                        {/* Subscribers */}
                                        {socialBladeData && (
                                            <div className="flex flex-wrap gap-4">
                                                <div className="bg-[#111] border border-[#ff0000]/30 rounded-xl p-4 border-l-4 border-l-[#ff0000] min-w-[120px]">
                                                    <div className="flex items-center gap-2 text-[#ff0000] text-[10px] uppercase mb-1 font-bold"><FaUsers /> Subs</div>
                                                    <h3 className="text-xl font-black text-white">{socialBladeData.subscribers}</h3>
                                                </div>
                                                <div className="bg-[#111] border border-blue-500/30 rounded-xl p-4 border-l-4 border-l-blue-500 min-w-[120px]">
                                                    <div className="flex items-center gap-2 text-blue-500 text-[10px] uppercase mb-1 font-bold"><FaEye /> 30D Views</div>
                                                    <h3 className="text-xl font-black text-white">{socialBladeData.last30DayViews}</h3>
                                                </div>
                                                <div className="bg-[#111] border border-green-500/30 rounded-xl p-4 border-l-4 border-l-green-500 min-w-[120px]">
                                                    <div className="flex items-center gap-2 text-green-500 text-[10px] uppercase mb-1 font-bold"><FaUserPlus /> 30D Subs</div>
                                                    <h3 className="text-xl font-black text-white">{socialBladeData.subscribersLast30Days}</h3>
                                                </div>
                                                <div className="bg-[#111] border border-yellow-500/30 rounded-xl p-4 border-l-4 border-l-yellow-500 min-w-[120px]">
                                                    <div className="flex items-center gap-2 text-yellow-500 text-[10px] uppercase mb-1 font-bold"><FaMoneyBillWave /> Income (Est.)</div>
                                                    <h3 className="text-xl font-black text-white">{socialBladeData.monthlyEarnings}</h3>
                                                </div>
                                            </div>
                                        )}
                                        {/* Niche Score */}
                                        {strategy.nicheScore && <NicheScoreGauge score={strategy.nicheScore} />}
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={copyStrategy} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all">
                                            {copied ? <><FaCheck className="text-green-500" /> Copied!</> : <><FaCopy /> Copy Strategy</>}
                                        </button>
                                        <button onClick={saveStrategy} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff0000]/10 border border-[#ff0000]/30 text-xs font-bold text-[#ff0000] hover:bg-[#ff0000]/20 transition-all">
                                            <FaSave /> Save
                                        </button>
                                    </div>
                                </div>

                                {/* COMPETITOR COMPARISON */}
                                {liveData?.competitor && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[#111] border border-[#ff0000]/30 rounded-2xl p-5 text-center">
                                            <h4 className="text-[#ff0000] text-[10px] uppercase mb-2 font-bold">Your Channel</h4>
                                            <h3 className="text-2xl font-black">{socialBladeData?.subscribers || '?'}</h3>
                                            <p className="text-gray-500 text-xs mt-1">@{handle}</p>
                                        </div>
                                        <div className="bg-[#111] border border-blue-500/30 rounded-2xl p-5 text-center">
                                            <h4 className="text-blue-500 text-[10px] uppercase mb-2 font-bold">Competitor</h4>
                                            <h3 className="text-2xl font-black">{liveData.competitor.subscribers || '?'}</h3>
                                            <p className="text-gray-500 text-xs mt-1">@{competitorHandle}</p>
                                        </div>
                                    </div>
                                )}

                                {/* OPTIMAL TIME + VERDICT */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5">
                                        <h4 className="text-orange-500 text-xs font-bold uppercase mb-2">⏱️ Optimal Time</h4>
                                        <h2 className="text-3xl font-black text-white">{strategy.contentStrategy?.optimalTimeLimit || "N/A"}</h2>
                                        <p className="text-orange-500/60 text-[10px] uppercase font-black tracking-widest mt-2">Required Code: {strategy.contentStrategy?.requiredType || "Standard"}</p>
                                    </div>
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex flex-col items-center justify-center">
                                        <h4 className="text-blue-500 text-xs font-bold uppercase mb-4 w-full">📊 Growth Velocity</h4>
                                        <VelocityGraph points={strategy.monthlyPerformance?.velocityPoints} verdict={strategy.monthlyPerformance?.performanceVerdict} />
                                    </div>
                                </div>

                                {/* CHANNEL AUDIT & GROWTH MAP */}
                                {strategy.audit && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                                            <h4 className="text-red-500 text-sm font-bold uppercase mb-4 flex items-center gap-2">⚠️ Brutal Audit: What's Wrong?</h4>
                                            <div className="space-y-3">
                                                {strategy.audit.whatIsWrong?.map((item, idx) => (
                                                    <div key={idx} className="flex items-start gap-2">
                                                        <span className="text-red-500 mt-1">✕</span>
                                                        <p className="text-gray-300 text-xs leading-relaxed">{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
                                            <h4 className="text-green-500 text-sm font-bold uppercase mb-4 flex items-center gap-2">🔥 Actionable Growth Map</h4>
                                            <div className="space-y-3">
                                                {strategy.audit.growthMap?.map((item, idx) => (
                                                    <div key={idx} className="flex items-start gap-2">
                                                        <span className="text-green-500 mt-1">✓</span>
                                                        <p className="text-gray-300 text-xs leading-relaxed font-bold">{item}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* REMIXED IDEAS + SEO + SCRIPT */}
                                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                                        <h4 className="text-white text-sm font-bold uppercase flex items-center gap-2"><span className="text-yellow-500">💡</span> Remixed Viral Concepts</h4>
                                        <button onClick={() => rerollSection('titles')} disabled={rerollLoading.titles} className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400 hover:text-[#ff0000] transition-colors">
                                            {rerollLoading.titles ? <FaSpinner className="animate-spin" /> : <FaRedo />} Re-roll ({FOLLOWUP_COST} 🔥)
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {strategy.contentStrategy?.remixedIdeas?.map((idea, idx) => (
                                            <div key={idx} className="bg-[#111] p-5 rounded-2xl border border-white/5 hover:border-[#ff0000]/50 transition-all flex flex-col gap-4">
                                                <div>
                                                    <h5 className="text-white font-black text-xl mb-2 leading-tight">"{idea.title}"</h5>
                                                    <p className="text-gray-400 text-xs leading-relaxed">{idea.concept}</p>
                                                </div>
                                                <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                                                    <div className="bg-[#ff0000]/5 p-3 rounded-lg border border-[#ff0000]/10">
                                                        <p className="text-[10px] text-[#ff0000] font-bold uppercase mb-1">📸 Thumbnail:</p>
                                                        <p className="text-white text-[11px] leading-snug italic">{idea.thumbnailHook}</p>
                                                    </div>
                                                    <div className="bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
                                                        <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">🧠 Hook Logic:</p>
                                                        <p className="text-gray-400 text-[10px] leading-snug">{idea.hookLogic}</p>
                                                    </div>
                                                </div>
                                                {/* Action Buttons */}
                                                <div className="flex gap-2 mt-auto">
                                                    <button onClick={() => generateSEOTitles(idea, idx)} disabled={seoLoading[idx]} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold hover:bg-purple-500/20 transition-all">
                                                        {seoLoading[idx] ? <FaSpinner className="animate-spin" /> : <FaTags />} SEO Titles
                                                    </button>
                                                    <button onClick={() => generateScript(idea)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold hover:bg-green-500/20 transition-all">
                                                        <FaScroll /> Script ({FOLLOWUP_COST} 🔥)
                                                    </button>
                                                </div>
                                                {/* SEO Expanded */}
                                                <AnimatePresence>
                                                    {seoExpanded[idx] && seoData[idx] && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-purple-500/5 rounded-lg p-3 border border-purple-500/10">
                                                            <p className="text-[9px] text-purple-400 font-bold uppercase mb-2">SEO Title Variations:</p>
                                                            {seoData[idx].titles?.map((t, i) => <p key={i} className="text-white text-xs mb-1">• {t}</p>)}
                                                            <p className="text-[9px] text-purple-400 font-bold uppercase mt-3 mb-1">Tags:</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {seoData[idx].tags?.map((tag, i) => <span key={i} className="bg-purple-500/20 text-purple-300 text-[9px] px-2 py-0.5 rounded-full">{tag}</span>)}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* CONTENT CALENDAR */}
                                {strategy.weeklySchedule && (
                                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                        <h4 className="text-white text-sm font-bold uppercase mb-4 pb-3 border-b border-white/5 flex items-center gap-2"><FaCalendarAlt className="text-cyan-500" /> Weekly Content Calendar</h4>
                                        <div className="grid grid-cols-7 gap-2">
                                            {strategy.weeklySchedule.map((day, idx) => (
                                                <div key={idx} className={`p-3 rounded-xl border text-center ${day.contentType === 'Rest' ? 'bg-white/5 border-white/5' : day.contentType === 'Short' ? 'bg-purple-500/10 border-purple-500/20' : 'bg-[#ff0000]/10 border-[#ff0000]/20'}`}>
                                                    <p className="text-[9px] font-bold uppercase text-gray-400">{day.day?.slice(0, 3)}</p>
                                                    <p className={`text-xs font-black mt-1 ${day.contentType === 'Rest' ? 'text-gray-500' : day.contentType === 'Short' ? 'text-purple-400' : 'text-[#ff0000]'}`}>{day.contentType}</p>
                                                    <p className="text-[9px] text-gray-500 mt-1 leading-tight">{day.topic !== '-' ? day.topic : '—'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* COMPETITION + AUDIENCE */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                                            <h4 className="text-white text-sm font-bold uppercase flex items-center gap-2"><span className="text-red-500">⚔️</span> Niche Competition (<span className="text-[#ff0000]">{strategy.marketAnalysis?.competitionLevel}</span>)</h4>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Verified Rivals:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {strategy.marketAnalysis?.verifiedCompetitors?.map((comp, idx) => (
                                                    <span key={idx} className="bg-[#ff0000]/10 text-white text-[11px] px-3 py-1 rounded-full border border-[#ff0000]/30 font-bold" title={comp.description}>{comp.title}</span>
                                                )) || <span className="text-gray-500 text-xs italic">None identified.</span>}
                                            </div>
                                            <div className="mt-4 p-3 bg-[#111] rounded-lg border-l-4 border-[#ff0000]">
                                                <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">The Strategy Gap:</p>
                                                <p className="text-white text-xs leading-relaxed italic">{strategy.marketAnalysis?.marketGap}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                        <h4 className="text-white text-sm font-bold uppercase mb-4 pb-3 border-b border-white/5 flex items-center gap-2"><span className="text-purple-500">📈</span> Audience Demand</h4>
                                        <div className="flex flex-col gap-3">
                                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">High-Volume Search Terms:</p>
                                            <div className="flex flex-col gap-2">
                                                {strategy.audienceDemand?.topSearchTerms?.map((term, idx) => (
                                                    <div key={idx} className="bg-white/5 text-gray-300 text-xs px-3 py-2 rounded-lg border border-white/10 flex items-center gap-2"><span className="text-purple-500">🔍</span> "{term}"</div>
                                                ))}
                                            </div>
                                            <div className="mt-auto pt-4">
                                                <div className="p-3 bg-[#111] rounded-lg border-l-4 border-purple-500">
                                                    <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Trend:</p>
                                                    <p className="text-white text-xs leading-relaxed">{strategy.audienceDemand?.currentTrend || "N/A"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* VIRAL HOOKS */}
                                {strategy.viralHooks && (
                                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                                            <h4 className="text-white text-sm font-bold uppercase flex items-center gap-2"><span className="text-yellow-500">🎙️</span> Viral Hooks</h4>
                                            <button onClick={() => rerollSection('hooks')} disabled={rerollLoading.hooks} className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400 hover:text-[#ff0000]">
                                                {rerollLoading.hooks ? <FaSpinner className="animate-spin" /> : <FaRedo />} Re-roll ({FOLLOWUP_COST} 🔥)
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {strategy.viralHooks.map((hook, idx) => (
                                                <div key={idx} className="bg-[#111] p-4 rounded-xl border border-white/5">
                                                    <p className="text-white text-sm italic">"{hook}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* CONTENT GAPS */}
                                {strategy.contentGaps && (
                                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                                            <h4 className="text-white text-sm font-bold uppercase flex items-center gap-2"><span className="text-green-500">🕳️</span> Content Gaps</h4>
                                            <button onClick={() => rerollSection('gaps')} disabled={rerollLoading.gaps} className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400 hover:text-[#ff0000]">
                                                {rerollLoading.gaps ? <FaSpinner className="animate-spin" /> : <FaRedo />} Re-roll ({FOLLOWUP_COST} 🔥)
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {strategy.contentGaps.map((gap, idx) => (
                                                <div key={idx} className="bg-[#111] p-3 rounded-lg border border-white/5 flex items-center gap-2">
                                                    <span className="text-green-500 text-xs">●</span>
                                                    <p className="text-white text-sm">{gap}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* EXECUTION PLAN */}
                                {strategy.executionPlan && (
                                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                        <h4 className="text-white text-sm font-bold uppercase mb-4 pb-3 border-b border-white/5 flex items-center gap-2"><span className="text-cyan-500">🗺️</span> 3-Month Execution Plan</h4>
                                        <div className="flex flex-col gap-3">
                                            {strategy.executionPlan.map((step, idx) => (
                                                <div key={idx} className="bg-[#111] p-4 rounded-xl border border-white/5 flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#ff0000]/20 text-[#ff0000] flex items-center justify-center text-sm font-black flex-shrink-0">{idx + 1}</div>
                                                    <p className="text-white text-sm leading-relaxed">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* AI CHAT FOLLOW-UP */}
                                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
                                    <h4 className="text-white text-sm font-bold uppercase mb-4 pb-3 border-b border-white/5 flex items-center gap-2"><span className="text-cyan-400">💬</span> Ask Follow-up Questions ({FOLLOWUP_COST} 🔥 each)</h4>
                                    {chatMessages.length > 0 && (
                                        <div className="flex flex-col gap-3 mb-4 max-h-[400px] overflow-y-auto pr-2">
                                            {chatMessages.map((msg, idx) => (
                                                <div key={idx} className={`p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-[#ff0000]/10 border border-[#ff0000]/20 text-white ml-8' : msg.role === 'system' ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' : 'bg-[#111] border border-white/5 text-gray-300 mr-8'}`}>
                                                    {msg.role === 'assistant' ? <ReactMarkdown className="prose prose-invert prose-sm max-w-none">{msg.content}</ReactMarkdown> : msg.content}
                                                </div>
                                            ))}
                                            <div ref={chatEndRef} />
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage()} placeholder="Ask anything about the strategy..." className="flex-1 bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0000]/50" />
                                        <button onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()} className="px-4 py-3 rounded-xl bg-[#ff0000] text-white font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed">
                                            {chatLoading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                                        </button>
                                    </div>
                                </div>

                            </motion.div>
                        ) : !isGenerating && (
                            <div className="modrinth-card border border-white/5 border-dashed bg-[#0a0a0a] items-center justify-center h-full text-center p-12 flex flex-col min-h-[500px]">
                                <h3 className="text-2xl font-black text-gray-500 mb-2">Awaiting Target</h3>
                                <p className="text-gray-600 font-medium max-w-md mx-auto">Drop a channel handle. The AI will analyze competitors, build viral concepts, and engineer your growth strategy.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* SCRIPT MODAL */}
            <AnimatePresence>
                {scriptModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setScriptModal(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                                <h3 className="text-white font-black text-lg">📝 Video Script</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => { navigator.clipboard.writeText(scriptContent); }} className="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-gray-400 hover:text-white"><FaCopy /></button>
                                    <button onClick={() => setScriptModal(null)} className="text-gray-500 hover:text-white text-lg font-bold">✕</button>
                                </div>
                            </div>
                            <p className="text-[#ff0000] text-xs font-bold mb-4">"{scriptModal.title}"</p>
                            {scriptLoading ? (
                                <div className="flex items-center justify-center py-12"><FaSpinner className="animate-spin text-[#ff0000] text-2xl" /></div>
                            ) : (
                                <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown>{scriptContent}</ReactMarkdown></div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );
};

export default YoutubeStrategyBuilder;
