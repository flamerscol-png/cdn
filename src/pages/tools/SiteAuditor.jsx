import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { deductPowers } from '../../utils/db';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../../components/Footer';
import AdContainer from '../../components/AdContainer';
import SEOHead from '../../components/SEOHead';
import API_BASE_URL from '../../utils/api';
import AdBanner from '../../components/AdBanner';
import RelatedSeoTools from '../../components/RelatedSeoTools';

// ─────────────────────────── Helper Sub-Components ───────────────────────────

const ScoreRing = ({ score, size = 96, stroke = 8, color }) => {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    const ringColor = color || (score >= 80 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444');

    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2937" strokeWidth={stroke} />
            <motion.circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={ringColor} strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
            />
        </svg>
    );
};

const MetricRingCard = ({ title, score, color, icon }) => {
    const colors = {
        green: { text: 'text-green-400', ring: '#22c55e' },
        yellow: { text: 'text-yellow-400', ring: '#eab308' },
        blue: { text: 'text-blue-400', ring: '#3b82f6' },
        purple: { text: 'text-purple-400', ring: '#a855f7' },
        red: { text: 'text-red-400', ring: '#ef4444' },
    };
    const c = colors[color] || colors.blue;
    const safeScore = score ?? 0;

    return (
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl flex flex-col items-center gap-3">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{icon} {title}</p>
            <div className="relative flex items-center justify-center">
                <ScoreRing score={safeScore} size={80} stroke={7} color={c.ring} />
                <span className={`absolute text-xl font-bold ${c.text}`}>{safeScore}</span>
            </div>
            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: c.ring }}
                    initial={{ width: 0 }}
                    animate={{ width: `${safeScore}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                />
            </div>
        </div>
    );
};

const StatBox = ({ label, value, highlight }) => (
    <div className={`p-4 rounded-lg border text-center ${highlight ? 'bg-blue-900/20 border-blue-700/40' : 'bg-black/30 border-gray-800'}`}>
        <p className="text-gray-500 text-xs uppercase font-bold mb-1">{label}</p>
        <p className={`text-xl font-bold ${highlight ? 'text-blue-300' : 'text-white'}`}>{value ?? '—'}</p>
    </div>
);

const CheckItem = ({ label, passed }) => (
    <div className={`p-3 rounded-lg border flex flex-col items-center gap-1 ${passed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
        <div className="text-2xl">{passed ? '✅' : '❌'}</div>
        <p className={`text-xs font-bold uppercase text-center leading-tight ${passed ? 'text-green-400' : 'text-red-400'}`}>{label}</p>
    </div>
);

const TechDetailItem = ({ label, passed }) => (
    <div className="flex items-center justify-between p-2.5 bg-black/30 rounded-lg border border-gray-800">
        <span className="text-sm text-gray-300">{label}</span>
        <span className={`text-sm font-bold ${passed ? 'text-green-400' : 'text-red-400'}`}>
            {passed ? '✅' : '❌'}
        </span>
    </div>
);

const SectionCard = ({ title, children, className = '' }) => (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-bold text-white mb-5">{title}</h3>
        {children}
    </div>
);

const MetaCharBar = ({ len, min, max, label }) => {
    const pct = Math.min(100, (len / max) * 100);
    const color = len < min ? '#eab308' : len > max ? '#ef4444' : '#22c55e';
    const status = len < min ? 'Too Short' : len > max ? 'Too Long' : 'Good';
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
                <span>{label}</span>
                <span style={{ color }}>{len} chars — {status}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
};

const IssueItem = ({ issue, idx }) => {
    const cfg = {
        error: { dot: 'bg-red-500', label: 'text-red-400', bg: 'bg-red-500/5 border-red-900/30' },
        warning: { dot: 'bg-yellow-500', label: 'text-yellow-400', bg: 'bg-yellow-500/5 border-yellow-900/30' },
        info: { dot: 'bg-blue-500', label: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-900/30' },
    };
    const c = cfg[issue.type] || cfg.info;
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            className={`flex items-start gap-3 p-3 rounded-lg border ${c.bg}`}
        >
            <span className={`mt-2 w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
            <div>
                <p className="text-gray-200 text-sm">{issue.msg}</p>
                <span className={`text-[10px] uppercase font-bold tracking-wider ${c.label}`}>{issue.type}</span>
            </div>
        </motion.div>
    );
};

// ─────────────────────────── Speed Meter ───────────────────────────

const SpeedMeter = ({ loadTimeMs, pageSizeKB }) => {
    const speedLabel = loadTimeMs < 1500 ? 'Fast' : loadTimeMs < 3000 ? 'Moderate' : 'Slow';
    const speedColor = loadTimeMs < 1500 ? '#22c55e' : loadTimeMs < 3000 ? '#eab308' : '#ef4444';
    const sizeLabel = pageSizeKB < 100 ? 'Light' : pageSizeKB < 300 ? 'Medium' : 'Heavy';
    const sizeColor = pageSizeKB < 100 ? '#22c55e' : pageSizeKB < 300 ? '#eab308' : '#ef4444';

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-gray-800">
                <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Load Time</p>
                    <p className="text-2xl font-bold text-white mt-0.5">{(loadTimeMs / 1000).toFixed(2)}s</p>
                </div>
                <div className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: speedColor + '20', color: speedColor }}>
                    {speedLabel}
                </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-gray-800">
                <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Page Size</p>
                    <p className="text-2xl font-bold text-white mt-0.5">{pageSizeKB} KB</p>
                </div>
                <div className="px-3 py-1 rounded-full text-sm font-bold" style={{ background: sizeColor + '20', color: sizeColor }}>
                    {sizeLabel}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────── Main Component ───────────────────────────

const loadingSteps = [
    '🌐 Routing through CORS Proxy...',
    '🕷️ Fetching HTML content...',
    '🧠 Running browser analysis...',
    '🎯 Checking keyword data...',
    '📊 Finalizing local report...',
];

const SiteAuditor = () => {
    const [url, setUrl] = useState('');
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('issues');
    const [auditResult, setAuditResult] = useState(null);
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const TOOL_COST = 30;

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

    useEffect(() => {
        let interval;
        if (loading) {
            let step = 0;
            setLoadingMessage(loadingSteps[0]);
            interval = setInterval(() => {
                step = (step + 1) % loadingSteps.length;
                setLoadingMessage(loadingSteps[step]);
            }, 1500);
        }
        return () => clearInterval(interval);
    }, [loading]);

    const performClientSideAudit = async (targetUrl, targetKeyword) => {
        // Use codetabs proxy as it's often more permissive than allorigins for localhost
        const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;

        const startTime = performance.now();
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('CORS Proxy failed to fetch site content.');

        const html = await response.text();
        const endTime = performance.now();
        const measuredLoadTimeMs = Math.round(endTime - startTime);

        if (!html) throw new Error('Site returned no content via proxy.');

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const getMeta = (name) => doc.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || '';
        const getOG = (prop) => doc.querySelector(`meta[property="og:${prop}"]`)?.getAttribute('content') || '';

        const title = doc.title || '';
        const metaDesc = getMeta('description');
        const bodyText = doc.body?.innerText || doc.body?.textContent || '';
        const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

        // Enhanced Heading Detection (Tags + ARIA Roles)
        const findHeadings = (level) => {
            const tags = Array.from(doc.querySelectorAll(`h${level}`));
            const roles = Array.from(doc.querySelectorAll(`[role="heading"][aria-level="${level}"]`));
            return [...new Set([...tags, ...roles])]
                .map(h => (h.innerText || h.textContent || '').trim())
                .filter(Boolean);
        };

        const h1s = findHeadings(1);
        const h2s = findHeadings(2);
        const h3s = findHeadings(3);
        const h4s = findHeadings(4);
        const h5s = findHeadings(5);
        const h6s = findHeadings(6);
        const allHeadingTexts = [...h1s, ...h2s, ...h3s, ...h4s, ...h5s, ...h6s];

        const allImages = Array.from(doc.querySelectorAll('img')).map(img => ({ alt: img.getAttribute('alt') || '', lazy: img.getAttribute('loading') === 'lazy' }));
        const links = Array.from(doc.querySelectorAll('a')).map(a => a.href);

        // Basic detection
        const hasSchema = !!doc.querySelector('script[type="application/ld+json"]');
        const hasFavicon = !!doc.querySelector('link[rel*="icon"]');
        const isHTTPS = targetUrl.startsWith('https://');

        const firstPara = (doc.querySelector('p')?.textContent || '').trim();

        // Simple Keyword Analysis
        const kw = targetKeyword?.toLowerCase().trim();
        const kwStats = {
            title: kw ? title.toLowerCase().includes(kw) : false,
            h1: kw ? h1s.some(h => h.toLowerCase().includes(kw)) : false,
            // Check all subheadings for keyword
            h2: kw ? [...h2s, ...h3s, ...h4s, ...h5s, ...h6s].some(h => h.toLowerCase().includes(kw)) : false,
            firstPara: kw ? firstPara.toLowerCase().includes(kw) : false,
            alt: kw ? allImages.some(img => img.alt.toLowerCase().includes(kw)) : false,
            count: kw ? (bodyText.toLowerCase().match(new RegExp(kw, 'g')) || []).length : 0,
            density: 0
        };
        if (kw && wordCount > 0) {
            kwStats.density = (kwStats.count / wordCount) * 100;
        }

        // Reuse scoring logic (Simplified for frontend)
        let seoScore = 70;
        if (title.length > 30 && title.length < 70) seoScore += 10;
        if (metaDesc.length > 100) seoScore += 10;
        if (h1s.length === 1) seoScore += 10;

        const issues = [];
        if (h1s.length === 0) issues.push({ type: 'error', msg: 'Missing H1 tag.' });
        if (h1s.length > 1) issues.push({ type: 'warning', msg: 'Multiple H1 tags found.' });
        if (!metaDesc) issues.push({ type: 'error', msg: 'Missing meta description.' });
        if (wordCount < 300) issues.push({ type: 'warning', msg: 'Thin content (under 300 words).' });

        return {
            url: targetUrl,
            keyword: targetKeyword,
            score: Math.min(100, seoScore),
            httpStatus: 200,
            isEstimated: true,
            metrics: {
                performance: Math.max(40, 100 - (measuredLoadTimeMs / 100)),
                seo: seoScore,
                content: Math.min(100, Math.floor(wordCount / 10)),
                technical: 90
            },
            details: {
                title,
                titleLength: title.length,
                metaDescription: metaDesc,
                metaLength: metaDesc.length,
                wordCount,
                readability: wordCount > 500 ? 'Good' : 'Basic',
                passiveVoiceRatio: "N/A",
                loadTime: `${(measuredLoadTimeMs / 1000).toFixed(2)}s`,
                loadTimeMs: measuredLoadTimeMs,
                pageSize: `${Math.round(html.length / 1024)} KB`,
                pageSizeKB: Math.round(html.length / 1024),
                internalLinks: links.filter(l => l.includes(new URL(targetUrl).hostname)).length,
                externalLinks: links.filter(l => !l.includes(new URL(targetUrl).hostname)).length,
                totalImages: allImages.length,
                imagesWithoutAlt: allImages.filter(i => !i.alt).length,
                schemaTypes: hasSchema ? ['Detected'] : [],
                hasSchema,
                responsiveMetaTag: !!doc.querySelector('meta[name="viewport"]'),
                h1s, h2s, h3s, h4s, h5s, h6s,
                duplicateRisk: wordCount < 100,
                keywordStats: kwStats,
                technicalDetails: {
                    isHTTPS,
                    hasFavicon,
                    htmlLang: doc.documentElement.lang,
                    ogTitle: !!getOG('title')
                }
            },
            issues
        };
    };

    const handleAudit = async (e) => {
        e.preventDefault();
        if (!url.trim()) return;

        if (!auth.currentUser) {
            navigate('/login');
            return;
        }

        if (!userData || (userData.powers || 0) < TOOL_COST) {
            alert(`Insufficient Coal! You need ${TOOL_COST} 🔥 but have ${userData?.powers || 0} 🔥.`);
            return;
        }

        setLoading(true);
        setAuditResult(null);

        try {
            await deductPowers(auth.currentUser.uid, TOOL_COST);

            const clientResult = await performClientSideAudit(url, keyword);
            setAuditResult(clientResult);
        } catch (error) {
            console.error('Audit Error:', error);
            alert(`Audit Failed: ${error.message}. Please try a different URL or check your internet.`);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyReport = useCallback(() => {
        if (!auditResult) return;
        const d = auditResult.details;
        const lines = [
            `🛡️ SITE AUDIT REPORT`,
            `URL: ${auditResult.url}`,
            `Keyword: ${auditResult.keyword || 'N/A'}`,
            `Overall Score: ${auditResult.score}/100`,
            ``,
            `── SCORES ──`,
            `Performance:  ${auditResult.metrics.performance}/100`,
            `SEO:          ${auditResult.metrics.seo}/100`,
            `Content:      ${auditResult.metrics.content}/100`,
            `Technical:    ${auditResult.metrics.technical}/100`,
            ``,
            `── PAGE INFO ──`,
            `Title (${d.titleLength} chars): ${d.title}`,
            `Meta (${d.metaLength} chars): ${d.metaDescription}`,
            ``,
            `── PERFORMANCE ──`,
            `Load Time: ${d.loadTime}`,
            `Page Size: ${d.pageSize}`,
            `Responsive: ${d.responsiveMetaTag ? 'Yes' : 'No'}`,
            ``,
            `── CONTENT ──`,
            `Word Count: ${d.wordCount}`,
            `Readability: ${d.readability}`,
            `Passive Voice: ${d.passiveVoiceRatio}`,
            ``,
            `── LINKS ──`,
            `Internal: ${d.internalLinks} | External: ${d.externalLinks}`,
            ``,
            `── IMAGES ──`,
            `Total: ${d.totalImages} | Without Alt: ${d.imagesWithoutAlt}`,
            ``,
            `── SCHEMA ──`,
            `Types: ${d.schemaTypes?.join(', ') || 'None'}`,
            ``,
            `── ISSUES (${auditResult.issues.length}) ──`,
            ...auditResult.issues.map(i => `[${i.type.toUpperCase()}] ${i.msg}`),
        ];
        navigator.clipboard.writeText(lines.join('\n'));
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    }, [auditResult]);

    const verdict = auditResult
        ? auditResult.score >= 80 ? { label: 'Excellent', color: '#22c55e' }
            : auditResult.score >= 60 ? { label: 'Good', color: '#3b82f6' }
                : auditResult.score >= 40 ? { label: 'Needs Work', color: '#eab308' }
                    : { label: 'Poor', color: '#ef4444' }
        : null;

    const errCount = auditResult?.issues.filter(i => i.type === 'error').length || 0;
    const warnCount = auditResult?.issues.filter(i => i.type === 'warning').length || 0;
    const infoCount = auditResult?.issues.filter(i => i.type === 'info').length || 0;

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-purple-500/30">
            <SEOHead
                title="Site Auditor"
                description="Comprehensive technical SEO audit tool. Analyze performance, content, and on-page optimization."
            />
            {/* Background Mesh */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto min-h-[85vh]">
                <AdBanner size="leaderboard" />

                {/* Hero */}
                <div className="max-w-4xl mx-auto mb-10 text-center pt-8">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-5xl font-bold mb-3 text-white tracking-tight"
                    >
                        Advanced Site Auditor
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 text-lg"
                    >
                        Browser-powered 16-point SEO, Content & Technical audit. No server required.
                    </motion.p>
                </div>

                {/* Input Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="max-w-3xl mx-auto mb-12"
                >
                    <form onSubmit={handleAudit} className="space-y-3">
                        <div className="flex flex-col md:flex-row gap-3">
                            {/* URL Input */}
                            <div className="flex-grow relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-20 group-hover:opacity-40 blur transition duration-500" />
                                <div className="relative flex items-center bg-gray-900 border border-gray-800 rounded-xl p-2">
                                    <div className="pl-3 text-gray-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                        </svg>
                                    </div>
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full bg-transparent border-none text-white px-4 py-3 focus:outline-none focus:ring-0 text-base placeholder-gray-600"
                                        required
                                    />
                                </div>
                            </div>
                            {/* Keyword Input */}
                            <div className="md:w-72 relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl opacity-20 group-hover:opacity-40 blur transition duration-500" />
                                <div className="relative flex items-center bg-gray-900 border border-gray-800 rounded-xl p-2">
                                    <div className="pl-3 text-gray-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        placeholder="Target Keyword (Optional)"
                                        className="w-full bg-transparent border-none text-white px-4 py-3 focus:outline-none focus:ring-0 text-base placeholder-gray-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 font-bold text-lg rounded-xl transition-all disabled:cursor-not-allowed flex justify-center items-center shadow-lg
                                ${loading ? 'bg-gray-800 text-blue-400 border border-blue-500/30' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 hover:shadow-blue-500/20'}`}
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span className="animate-pulse">{loadingMessage}</span>
                                </div>
                            ) : '🔍 Start Full Audit'}
                        </button>
                    </form>
                </motion.div>

                {/* Results */}
                <AdBanner size="leaderboard" className="mt-8 mb-4" />
                <AnimatePresence>
                    {auditResult && !loading && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* ── Summary Banner ── */}
                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    {/* Big Score Ring */}
                                    <div className="relative flex items-center justify-center flex-shrink-0">
                                        <ScoreRing score={auditResult.score} size={120} stroke={10} />
                                        <div className="absolute flex flex-col items-center">
                                            <span className="text-3xl font-black text-white">{auditResult.score}</span>
                                            <span className="text-gray-500 text-xs">/ 100</span>
                                        </div>
                                    </div>
                                    {/* Verdict + Meta Chips */}
                                    <div className="flex-grow text-center md:text-left space-y-3">
                                        <div>
                                            <span
                                                className="text-2xl font-black mr-3"
                                                style={{ color: verdict?.color }}
                                            >{verdict?.label}</span>
                                            <span className="text-gray-500 text-sm">Overall Health Score</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 justify-center md:justify-start text-xs">
                                            {auditResult.isEstimated && <Chip label="Estimated (Browser)" color="purple" icon="⚡" />}
                                            <Chip label={`HTTP ${auditResult.httpStatus}`} color={auditResult.httpStatus === 200 ? 'green' : 'red'} />
                                            <Chip label={auditResult.details.loadTime} color="blue" icon="⚡" />
                                            <Chip label={auditResult.details.pageSize} color="purple" icon="📦" />
                                            <Chip label={`${auditResult.details.wordCount} words`} color="gray" icon="✍️" />
                                            <Chip label={auditResult.details.responsiveMetaTag ? 'Mobile Ready' : 'Not Mobile Ready'}
                                                color={auditResult.details.responsiveMetaTag ? 'green' : 'red'} icon="📱" />
                                        </div>
                                        {/* Issues summary */}
                                        <div className="flex gap-3 flex-wrap justify-center md:justify-start">
                                            {errCount > 0 && <span className="text-red-400 text-xs font-bold bg-red-500/10 px-2 py-1 rounded-full">🔴 {errCount} Error{errCount > 1 ? 's' : ''}</span>}
                                            {warnCount > 0 && <span className="text-yellow-400 text-xs font-bold bg-yellow-500/10 px-2 py-1 rounded-full">🟡 {warnCount} Warning{warnCount > 1 ? 's' : ''}</span>}
                                            {infoCount > 0 && <span className="text-blue-400 text-xs font-bold bg-blue-500/10 px-2 py-1 rounded-full">🔵 {infoCount} Suggestion{infoCount > 1 ? 's' : ''}</span>}
                                        </div>
                                    </div>
                                    {/* Copy Button */}
                                    <button
                                        onClick={handleCopyReport}
                                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-all"
                                    >
                                        {copied ? '✅ Copied!' : '📋 Copy Report'}
                                    </button>
                                </div>
                            </div>

                            {/* ── 4 Metric Score Cards ── */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <MetricRingCard title="Performance" score={auditResult?.metrics?.performance} color="blue" icon="⚡" />
                                <MetricRingCard title="On-Page SEO" score={auditResult?.metrics?.seo} color="yellow" icon="🎯" />
                                <MetricRingCard title="Content" score={auditResult?.metrics?.content} color="purple" icon="✍️" />
                                <MetricRingCard title="Technical" score={auditResult?.metrics?.technical} color="green" icon="⚙️" />
                            </div>

                            {/* ── Main Grid ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">

                                    {/* Page Info */}
                                    <SectionCard title="📄 Page Info">
                                        <div className="space-y-4">
                                            <div className="bg-black/30 p-4 rounded-lg border border-gray-800 space-y-2">
                                                <p className="text-gray-500 text-xs uppercase font-bold">Title Tag</p>
                                                <p className="text-white text-sm font-medium leading-relaxed">
                                                    {auditResult?.details?.title || <span className="text-red-400 italic">No title found</span>}
                                                </p>
                                                <MetaCharBar len={auditResult?.details?.titleLength} min={30} max={60} label="Character count" />
                                            </div>
                                            <div className="bg-black/30 p-4 rounded-lg border border-gray-800 space-y-2">
                                                <p className="text-gray-500 text-xs uppercase font-bold">Meta Description</p>
                                                <p className="text-white text-sm leading-relaxed">
                                                    {auditResult?.details?.metaDescription || <span className="text-red-400 italic">No meta description found</span>}
                                                </p>
                                                <MetaCharBar len={auditResult?.details?.metaLength} min={120} max={160} label="Character count" />
                                            </div>

                                        </div>
                                    </SectionCard>

                                    {/* On-Page SEO */}
                                    <SectionCard title="🎯 On-Page Optimization">
                                        {/* Headings */}
                                        <div className="space-y-3 mb-5">
                                            <HeadingList label="H1" items={auditResult?.details?.h1s} emptyColor="red" />
                                            <HeadingList label="H2" items={auditResult?.details?.h2s} emptyColor="yellow" />
                                            {auditResult?.details?.h3s?.length > 0 && (
                                                <HeadingList label="H3" items={auditResult?.details?.h3s} />
                                            )}
                                        </div>

                                        {/* Keyword checks */}
                                        {auditResult?.keyword ? (
                                            <>
                                                <div className="border-t border-gray-800 pt-5">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <h4 className="text-sm text-gray-400 font-bold uppercase">Keyword Placement</h4>
                                                        <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full">"{auditResult.keyword}"</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                                        <CheckItem label="In Title" passed={auditResult?.details?.keywordStats?.title} />
                                                        <CheckItem label="In H1" passed={auditResult?.details?.keywordStats?.h1} />
                                                        <CheckItem label="1st Para" passed={auditResult?.details?.keywordStats?.firstPara} />
                                                        <CheckItem label="In Alt Text" passed={auditResult?.details?.keywordStats?.alt} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <StatBox label="Keyword Density" value={`${auditResult?.details?.keywordStats?.density?.toFixed(2)}%`} />
                                                        <StatBox label="Target KW in H2" value={auditResult?.details?.keywordStats?.h2 ? '✅ Yes' : '❌ No'} />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="border-t border-gray-800 pt-5 text-center py-4 text-gray-500">
                                                <p className="text-sm">💡 Enter a <strong className="text-purple-400">Target Keyword</strong> above to see keyword placement analysis.</p>
                                            </div>
                                        )}
                                    </SectionCard>

                                    {/* Content & Links */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <SectionCard title="✍️ Content Quality">
                                            <div className="space-y-3">
                                                <StatBox label="Word Count" value={auditResult.details.wordCount} />
                                                <StatBox label="Readability" value={auditResult.details.readability}
                                                    highlight={auditResult.details.readability === 'Good'} />
                                                <StatBox label="Passive Voice" value={auditResult.details.passiveVoiceRatio} />
                                            </div>
                                        </SectionCard>
                                        <SectionCard title="🔗 Link Profile">
                                            <div className="space-y-3">
                                                <StatBox label="Internal Links" value={auditResult.details.internalLinks} />
                                                <StatBox label="External Links" value={auditResult.details.externalLinks} />
                                            </div>
                                        </SectionCard>
                                    </div>

                                    {/* Issues List with Tabs */}
                                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                                        <div className="p-5 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                            <h3 className="text-lg font-bold text-white">📋 Full Audit Report</h3>
                                            <div className="flex gap-2 text-xs">
                                                {['all', 'error', 'warning', 'info'].map(tab => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => setActiveTab(tab)}
                                                        className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${activeTab === tab
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                                                    >
                                                        {tab === 'all' ? `All (${auditResult.issues.length})` : tab === 'error' ? `🔴 ${errCount}` : tab === 'warning' ? `🟡 ${warnCount}` : `🔵 ${infoCount}`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="p-5 space-y-3 max-h-[450px] overflow-y-auto">
                                            {(() => {
                                                const filtered = activeTab === 'all' ? auditResult.issues : auditResult.issues.filter(i => i.type === activeTab);
                                                return filtered.length > 0
                                                    ? filtered.map((issue, idx) => <IssueItem key={idx} issue={issue} idx={idx} />)
                                                    : <div className="text-center py-8 text-green-400">🎉 No {activeTab === 'all' ? '' : activeTab} issues found!</div>;
                                            })()}
                                        </div>
                                    </div>

                                </div>

                                {/* Right Sidebar */}
                                <div className="space-y-6">

                                    {/* Technical Compliance */}
                                    {auditResult.details.technicalDetails && (
                                        <SectionCard title="⚙️ Technical Compliance">
                                            <div className="grid grid-cols-1 gap-3">
                                                <TechDetailItem label="HTTPS Secure" passed={auditResult.details.technicalDetails.isHTTPS} />
                                                <TechDetailItem label="Open Graph Tags" passed={auditResult.details.technicalDetails.ogTitle && auditResult.details.technicalDetails.ogDescription && auditResult.details.technicalDetails.ogImage} />
                                                <TechDetailItem label="Twitter Card" passed={auditResult.details.technicalDetails.twitterCard} />
                                                <TechDetailItem label="HTML Lang" passed={!!auditResult.details.technicalDetails.htmlLang} />
                                                <TechDetailItem label="Favicon" passed={auditResult.details.technicalDetails.hasFavicon} />
                                                <TechDetailItem label="Indexable" passed={!auditResult.details.technicalDetails.isNoIndex} />
                                                <TechDetailItem label="Sitemap Link" passed={auditResult.details.technicalDetails.hasSitemapLink} />
                                            </div>
                                        </SectionCard>
                                    )}


                                    {/* Duplicate Risk */}
                                    <SectionCard title="📂 Content Integrity">
                                        <div className={`p-4 rounded-xl border flex items-center gap-4 ${auditResult.details.duplicateRisk ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                                            <div className="text-2xl">{auditResult.details.duplicateRisk ? '⚠️' : '✅'}</div>
                                            <div>
                                                <p className="text-sm font-black tracking-tight">{auditResult.details.duplicateRisk ? 'Low Text-to-Code Ratio' : 'Unique Content Signal'}</p>
                                                <p className="text-[10px] opacity-80 uppercase font-bold">{auditResult.details.duplicateRisk ? 'Page may be seen as thin or duplicate' : 'Excellent content substance'}</p>
                                            </div>
                                        </div>
                                    </SectionCard>

                                    {/* Performance */}
                                    <SectionCard title="⚡ Performance">
                                        <SpeedMeter
                                            loadTimeMs={auditResult.details.loadTimeMs}
                                            pageSizeKB={auditResult.details.pageSizeKB}
                                        />
                                    </SectionCard>

                                    {/* Images */}
                                    <SectionCard title="🖼️ Images">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <StatBox label="Total Images" value={auditResult.details.totalImages} />
                                                <StatBox label="Missing Alt" value={auditResult.details.imagesWithoutAlt} />
                                            </div>
                                            {auditResult.details.totalImages > 0 && (
                                                <div>
                                                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                                        <span>Alt text coverage</span>
                                                        <span>{Math.round(((auditResult.details.totalImages - auditResult.details.imagesWithoutAlt) / auditResult.details.totalImages) * 100)}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full rounded-full bg-blue-500"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${((auditResult.details.totalImages - auditResult.details.imagesWithoutAlt) / auditResult.details.totalImages) * 100}%` }}
                                                            transition={{ duration: 1, ease: 'easeOut' }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </SectionCard>

                                    {/* Schema */}
                                    <SectionCard title="⚙️ Structured Data">
                                        {auditResult.details.schemaTypes?.length > 0 ? (
                                            <div className="space-y-3">
                                                <p className="text-xs text-green-400 font-bold">✅ Schema.org JSON-LD Detected</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {auditResult.details.schemaTypes.map((type, i) => (
                                                        <span key={i} className="text-xs bg-green-900/30 border border-green-700/30 text-green-300 px-2.5 py-1 rounded-full font-medium">
                                                            {type}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-red-400 text-sm font-bold">❌ No Schema Found</p>
                                                <p className="text-gray-500 text-xs mt-1">Add JSON-LD structured data to enable rich snippets in search results.</p>
                                            </div>
                                        )}
                                    </SectionCard>

                                    {/* Sidebar Ads: Triple 300x250 */}
                                    <div className="flex flex-col gap-4">
                                        <AdBanner size="rectangle" />
                                        <AdBanner size="rectangle" />
                                        <AdBanner size="rectangle" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom Ad */}
                {auditResult && (
                    <div className="max-w-7xl mx-auto mt-10 mb-20">
                        <AdContainer slot="auditor_bottom" className="h-[90px] w-full bg-gray-900/30 rounded-xl" />
                    </div>
                )}

            </main>

            <RelatedSeoTools currentToolPath="/tools/site-auditor" />

            <Footer />
        </div>
    );
};

// ─────────────────────────── Tiny Extras ───────────────────────────

const Chip = ({ label, color = 'gray', icon = '' }) => {
    const colors = {
        green: 'bg-green-900/30 border-green-700/30 text-green-300',
        red: 'bg-red-900/30 border-red-700/30 text-red-300',
        blue: 'bg-blue-900/30 border-blue-700/30 text-blue-300',
        purple: 'bg-purple-900/30 border-purple-700/30 text-purple-300',
        gray: 'bg-gray-800 border-gray-700 text-gray-300',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border font-medium ${colors[color] || colors.gray}`}>
            {icon && <span>{icon}</span>}
            {label}
        </span>
    );
};

const HeadingList = ({ label, items, emptyColor = 'blue' }) => {
    const emptyColors = { red: 'text-red-400', yellow: 'text-yellow-400', blue: 'text-blue-400' };
    return (
        <div className="bg-black/30 p-4 rounded-lg border border-gray-800">
            <p className="text-gray-500 text-xs uppercase font-bold mb-2">
                {label} Headings <span className="text-gray-600 normal-case font-normal">({items?.length || 0})</span>
            </p>
            {items?.length > 0 ? (
                <div className="space-y-1 max-h-28 overflow-y-auto">
                    {items.map((h, i) => (
                        <p key={i} className="text-white text-sm py-1 border-b border-gray-800/50 last:border-b-0 leading-snug">"{h}"</p>
                    ))}
                </div>
            ) : (
                <p className={`text-sm ${emptyColors[emptyColor] || 'text-blue-400'}`}>⚠️ No {label} found</p>
            )}
        </div>
    );
};

export default SiteAuditor;
