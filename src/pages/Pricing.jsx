import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { auth } from '../firebase';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';

const Pricing = () => {
    const navigate = useNavigate();
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [upiModal, setUpiModal] = useState(null);
    const [payerUpi, setPayerUpi] = useState('');

    const tiers = [
        {
            name: "Starter Hub",
            price: "$3",
            usdNum: 3,
            powers: "5,000",
            emoji: "⚡",
            desc: "Kickstart your SEO strategy with essential coal.",
            features: [
                "5,000 🔥 Coal Included",
                "Full Access to All Tools",
                "No Expiry on Coal",
                "Community Support",
            ],
            gradient: "from-slate-500/20 to-slate-700/10",
            border: "border-white/10",
            glow: "",
            badge: null,
            highlight: false,
        },
        {
            name: "Pro Pack",
            price: "$10",
            usdNum: 10,
            powers: "10,000",
            emoji: "🚀",
            desc: "For serious creators fueling multiple niches at scale.",
            features: [
                "10,000 🔥 Coal Included",
                "Priority AI Processing",
                "Early Access Features",
                "Ad-Free Experience",
            ],
            gradient: "from-[#ff4d00]/20 to-orange-900/10",
            border: "border-[#ff4d00]/40",
            glow: "shadow-[0_0_60px_rgba(255,77,0,0.15)]",
            badge: "Most Popular",
            highlight: true,
        },
        {
            name: "Elite Bulk",
            price: "$25",
            usdNum: 25,
            powers: "15,000",
            emoji: "💎",
            desc: "Max intensity for power users and bulk operations.",
            features: [
                "15,000 🔥 Coal Included",
                "Everything in Pro",
                "Custom Audit Reports",
                "Dedicated Growth Manager",
            ],
            gradient: "from-purple-500/20 to-purple-900/10",
            border: "border-purple-500/30",
            glow: "",
            badge: "Best Value",
            highlight: false,
        }
    ];

    const PAYMENT_LINKS = {
        "Starter Hub": "https://nowpayments.io/payment/?iid=4966861734",
        "Pro Pack": "https://nowpayments.io/payment/?iid=6025266658",
        "Elite Bulk": "https://nowpayments.io/payment/?iid=5159653795"
    };

    const UPI_LINKS = {
        "Starter Hub": "upi://pay?pa=9315718114@fam&pn=FlamerCoal&am=250&cu=INR&tn=Starter+Hub+5000+Coal",
        "Pro Pack": "upi://pay?pa=9315718114@fam&pn=FlamerCoal&am=832&cu=INR&tn=Pro+Pack+10000+Coal",
        "Elite Bulk": "upi://pay?pa=9315718114@fam&pn=FlamerCoal&am=2085&cu=INR&tn=Elite+Bulk+15000+Coal"
    };

    const UPI_PRICES = {
        "Starter Hub": "₹250",
        "Pro Pack": "₹832",
        "Elite Bulk": "₹2,085"
    };

    const PAYPAL_LINKS = {
        "Starter Hub": "https://www.paypal.com/paypalme/FlamerCoal/3",
        "Pro Pack": "https://www.paypal.com/paypalme/FlamerCoal/10",
        "Elite Bulk": "https://www.paypal.com/paypalme/FlamerCoal/25"
    };

    const requireLogin = () => {
        if (!auth.currentUser) { navigate('/login'); return false; }
        return true;
    };

    const handleCrypto = (tier) => { if (!requireLogin()) return; window.location.href = PAYMENT_LINKS[tier.name]; };
    const handlePaypal = (tier) => { if (!requireLogin()) return; window.open(PAYPAL_LINKS[tier.name], '_blank'); };
    const handleUpi = (tier) => { if (!requireLogin()) return; setUpiModal({ name: tier.name, price: UPI_PRICES[tier.name], upiLink: UPI_LINKS[tier.name] }); };

    const faqs = [
        { q: "What is Coal?", a: "Coal (🔥) is the universal fuel powering all FlamerCoal AI tools. Heavy operations like Content Strategy consume coal to generate high-performance data." },
        { q: "Do credits expire?", a: "Never. Once purchased, your Coal stays in your reserve until fully used. No monthly pressure, no surprises." },
        { q: "How fast do I get my Coal?", a: "Within 24 hours of your payment being verified. Leave your email or UPI ID so we can match your transaction quickly." },
        { q: "Which payment methods are accepted?", a: "We accept Crypto (300+ coins via NOWPayments), UPI (GPay, PhonePe, Paytm), and PayPal — globally." },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-[#ff4d00]/30">
            <SEOHead 
                title="Pricing & Membership Plans | Scale Your Search Intelligence" 
                description="Choose the perfect plan to fuel your digital growth. From free starters to enterprise-grade SEO and YouTube power tools."
                keywords="FlamerCoal pricing, SEO tool pricing, youtube tool subscription, buy coal credits"
            />
            <Navbar />

            {/* ── UPI Modal ── */}
            <AnimatePresence>
                {upiModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
                        onClick={() => { setUpiModal(null); setPayerUpi(''); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0d0d0d] border border-blue-500/20 rounded-2xl max-w-sm w-full p-8 text-center shadow-2xl shadow-blue-500/10"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">Pay via UPI</div>
                            <h3 className="text-xl font-black mb-1">{upiModal.name}</h3>
                            <div className="text-4xl font-black text-blue-400 mb-5">{upiModal.price}</div>

                            <div className="mb-5 text-left">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 block">Your UPI ID (for verification)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. yourname@gpay"
                                    value={payerUpi}
                                    onChange={e => setPayerUpi(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition"
                                />
                                <p className="text-[10px] text-gray-600 mt-1.5">We use this to match your payment and credit your Coal.</p>
                            </div>

                            <div className="bg-white rounded-2xl p-3 w-fit mx-auto mb-4 shadow-xl">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=185x185&data=${encodeURIComponent(`${upiModal.upiLink}${payerUpi ? `_from_${payerUpi}` : ''}`)}`}
                                    alt="UPI QR Code" width={185} height={185}
                                />
                            </div>
                            <p className="text-gray-500 text-xs font-medium mb-4">Scan with GPay · PhonePe · Paytm · Any UPI App</p>

                            <a
                                href={`${upiModal.upiLink}${payerUpi ? `&tn=${encodeURIComponent(`from ${payerUpi}`)}` : ''}`}
                                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500/15 border border-blue-500/30 text-blue-300 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-500/25 transition mb-3"
                            >
                                📱 Tap to Open UPI App
                            </a>

                            <div className="flex items-center gap-3 bg-[#ff4d00]/5 border border-[#ff4d00]/15 rounded-xl px-4 py-3 mb-5">
                                <span className="text-2xl">🔥</span>
                                <p className="text-xs text-[#ff4d00] font-bold text-left">Coal is credited within <span className="font-black">24 hours</span> after payment is verified.</p>
                            </div>

                            <button
                                onClick={() => { setUpiModal(null); setPayerUpi(''); }}
                                className="text-xs text-gray-600 hover:text-gray-400 font-bold uppercase tracking-widest transition"
                            >✕ Close</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Error Modal ── */}
            <AnimatePresence>
                {paymentStatus && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="bg-[#0d0d0d] border border-red-500/20 rounded-2xl max-w-sm w-full p-10 text-center"
                        >
                            <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-2xl mx-auto mb-5">✕</div>
                            <h3 className="text-xl font-black mb-2">Error</h3>
                            <p className="text-sm text-red-400 font-medium mb-8">{paymentStatus.message}</p>
                            <button onClick={() => setPaymentStatus(null)} className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition">
                                Try Again
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Background ── */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-[#ff4d00]/6 rounded-full blur-[140px] animate-pulse" />
                <div className="absolute bottom-[10%] right-[-5%]  w-[400px] h-[400px] bg-orange-900/8 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] left-[-10%]  w-[300px] h-[300px] bg-purple-900/6 rounded-full blur-[100px]" />
                {/* Grid lines */}
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            </div>

            <main className="relative z-10 pt-36 pb-32 px-6 md:px-12">
                {/* ── Hero ── */}
                <div className="max-w-5xl mx-auto text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff4d00]/10 border border-[#ff4d00]/20 text-[#ff4d00] text-xs font-black uppercase tracking-widest mb-8"
                    >
                        <span className="w-2 h-2 rounded-full bg-[#ff4d00] animate-pulse" />
                        Simple, Transparent Pricing
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="text-6xl md:text-8xl font-black mb-6 leading-[0.88] tracking-tight"
                    >
                        Fuel Your <br />
                        <span className="bg-gradient-to-r from-[#ff4d00] via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                            Growth Engine
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                        className="text-lg text-gray-400 max-w-2xl mx-auto font-medium mb-6"
                    >
                        Buy Coal once, use forever. No subscriptions, no hidden fees. Pay with Crypto, UPI, or PayPal.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-400 text-xs font-bold"
                    >
                        ⚠️ Provide your email at checkout — Coal is credited within 24 hours of payment.
                    </motion.div>
                </div>

                {/* ── Trust Bar ── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="flex items-center justify-center gap-8 flex-wrap mb-20 text-xs font-bold text-gray-500 uppercase tracking-widest"
                >
                    {['💎 300+ Cryptos', '🇮🇳 UPI Accepted', '💳 PayPal Accepted', '🔒 Secure Checkout', '♾️ No Expiry'].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">{item}</div>
                    ))}
                </motion.div>

                <AdBanner size="leaderboard" />

                {/* ── Pricing Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-32">
                    {tiers.map((tier, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className={`relative flex flex-col rounded-3xl border bg-gradient-to-b ${tier.gradient} ${tier.border} ${tier.glow} ${tier.highlight ? 'scale-[1.03] z-10' : ''} p-8 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl group`}
                        >
                            {/* Animated bg glow on hover */}
                            <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b ${tier.gradient}`} />

                            {/* Badge */}
                            {tier.badge && (
                                <div className={`absolute top-5 right-5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tier.highlight ? 'bg-[#ff4d00] text-white' : 'bg-purple-500/20 border border-purple-500/40 text-purple-300'}`}>
                                    {tier.badge}
                                </div>
                            )}

                            <div className="relative z-10 flex flex-col flex-1">
                                {/* Header */}
                                <div className="mb-6">
                                    <div className="text-3xl mb-3">{tier.emoji}</div>
                                    <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">{tier.name}</div>
                                    <div className="flex items-end gap-2 mb-1">
                                        <span className="text-5xl font-black">{tier.price}</span>
                                        <span className="text-gray-500 font-bold pb-1">one-time</span>
                                    </div>
                                    <p className="text-[#ff4d00] text-[10px] font-black uppercase tracking-tighter mb-2">You will receive coal in 24 hrs</p>
                                    <div className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full ${tier.highlight ? 'bg-[#ff4d00]/15 text-[#ff4d00] border border-[#ff4d00]/20' : 'bg-white/5 text-gray-300 border border-white/10'}`}>
                                        🔥 {tier.powers} Coal
                                    </div>
                                </div>

                                <p className="text-gray-400 text-sm font-medium mb-6 leading-relaxed">{tier.desc}</p>

                                {/* Features */}
                                <div className="space-y-3 mb-8 flex-1">
                                    {tier.features.map((f, fi) => (
                                        <div key={fi} className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black ${tier.highlight ? 'bg-[#ff4d00]/20 text-[#ff4d00]' : 'bg-white/10 text-white'}`}>✓</div>
                                            {f}
                                        </div>
                                    ))}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-white/5 mb-6" />

                                {/* Payment Buttons */}
                                <div className="space-y-2.5">
                                    {/* Crypto */}
                                    <button
                                        onClick={() => handleCrypto(tier)}
                                        className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-200 active:scale-95 ${tier.highlight
                                            ? 'bg-[#ff4d00] text-white hover:brightness-110 shadow-lg shadow-[#ff4d00]/25'
                                            : 'bg-white/8 border border-white/12 text-white hover:bg-white/15'
                                            }`}
                                    >
                                        💎 Crypto — {tier.price}
                                    </button>

                                    {/* UPI */}
                                    <button
                                        onClick={() => handleUpi(tier)}
                                        className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-200 active:scale-95 bg-blue-500/10 border border-blue-500/25 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/40"
                                    >
                                        🇮🇳 UPI — {UPI_PRICES[tier.name]}
                                    </button>

                                    {/* PayPal */}
                                    <button
                                        onClick={() => handlePaypal(tier)}
                                        className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-200 active:scale-95 bg-[#003087]/20 border border-[#009cde]/25 text-[#47b0e8] hover:bg-[#003087]/35 hover:border-[#009cde]/40"
                                    >
                                        💳 PayPal — {tier.price}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── FAQ ── */}
                <div className="max-w-3xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        className="text-3xl font-black text-center mb-12"
                    >
                        Frequently Asked <span className="text-[#ff4d00]">Questions</span>
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                                className="bg-white/3 border border-white/8 rounded-2xl p-6 hover:border-white/15 transition"
                            >
                                <h4 className="font-black text-sm text-[#ff4d00] mb-2 uppercase tracking-wide">{faq.q}</h4>
                                <p className="text-sm text-gray-400 font-medium leading-relaxed">{faq.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Pricing;
