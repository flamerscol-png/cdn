import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import AdBanner from '../components/AdBanner';
import PromoAd from '../components/PromoAd';

const CalculatorCard = ({ title, children, icon }) => (
    <div className="modrinth-card p-8 border-white/5 h-full">
        <div className="flex items-center gap-4 mb-8">
            <div className="text-3xl bg-white/5 p-3 rounded-xl border border-white/10">{icon}</div>
            <h2 className="text-xl font-black text-white">{title}</h2>
        </div>
        {children}
    </div>
);

const Calculators = () => {
    // ROI Calculator State
    const [investment, setInvestment] = useState('');
    const [returnAmount, setReturnAmount] = useState('');
    const [roi, setRoi] = useState(null);

    // BMI Calculator State
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [bmi, setBmi] = useState(null);

    // Margin Calculator State
    const [cost, setCost] = useState('');
    const [revenue, setRevenue] = useState('');
    const [margin, setMargin] = useState(null);
    const [copied, setCopied] = useState(null); // id of current copied result
    const [error, setError] = useState(null);

    const calcROI = () => {
        const inv = parseFloat(investment);
        const ret = parseFloat(returnAmount);
        if (inv > 0 && ret >= 0) {
            setRoi(((ret - inv) / inv * 100).toFixed(2));
        } else if (inv <= 0) {
            setError("Investment must be greater than 0");
        }
    };

    const calcBMI = () => {
        const w = parseFloat(weight);
        const h = parseFloat(height) / 100; // to meters
        if (w > 0 && h > 0) {
            setBmi((w / (h * h)).toFixed(1));
        } else {
            setError("Weight and Height must be positive values");
        }
    };

    const calcMargin = () => {
        const c = Math.abs(parseFloat(cost));
        const r = Math.abs(parseFloat(revenue));
        if (c > 0 && r >= 0) {
            setMargin(((r - c) / r * 100).toFixed(2));
        } else if (r === 0) {
            setError("Revenue cannot be zero");
        }
    };

    const handleCopy = (val, id) => {
        navigator.clipboard.writeText(val);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-[#ff4d00]/30">
            <SEOHead
                title="Business & Health Calculators"
                description="Calculate ROI, Profit Margins, BMI and more with our suite of simple, efficient calculators."
            />
            <Navbar />
            <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black mb-6 tracking-tightest leading-none"
                    >
                        Business <span className="text-[#ff4d00]">&</span> Health <br />
                        <span className="text-gray-500">Calculators.</span>
                    </motion.h1>
                    <p className="text-gray-500 text-xl max-w-2xl mx-auto font-medium mb-6">
                        Essential tools for growth, efficiency, and wellness.
                    </p>
                    <Link to="/converters" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-all font-bold text-sm bg-white/5 px-4 py-2 rounded-lg border border-white/10 hover:border-white/20">
                        <span className="text-base">🔄</span> Need to convert data? Try Converters
                    </Link>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold max-w-md mx-auto flex items-center justify-between"
                        >
                            <span>{error}</span>
                            <button onClick={() => setError(null)} className="text-red-500/50 hover:text-red-500">✕</button>
                        </motion.div>
                    )}
                </div>

                <AdBanner size="leaderboard" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* ROI Calculator */}
                    <CalculatorCard title="ROI Calculator" icon="📈">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 font-black">Investment Amount ($)</label>
                                <input
                                    type="number"
                                    value={investment}
                                    onChange={(e) => setInvestment(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-[#ff4d00] transition-colors"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 font-black">Return Amount ($)</label>
                                <input
                                    type="number"
                                    value={returnAmount}
                                    onChange={(e) => setReturnAmount(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-[#ff4d00] transition-colors"
                                    placeholder="0.00"
                                />
                            </div>
                            <button
                                onClick={calcROI}
                                className="w-full bg-[#ff4d00] text-white py-4 rounded-xl font-black uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all"
                            >
                                Calculate ROI
                            </button>
                            {roi !== null && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center"
                                >
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Result</p>
                                    <p className={`text-4xl font-black ${parseFloat(roi) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {roi}%
                                    </p>
                                    <button
                                        onClick={() => handleCopy(`${roi}%`, 'roi')}
                                        className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#ff4d00] transition-colors"
                                    >
                                        {copied === 'roi' ? '✅ Copied' : '📋 Copy Result'}
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </CalculatorCard>

                    {/* Profit Margin Calculator */}
                    <CalculatorCard title="Margin Calculator" icon="💰">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 font-black">Cost Price ($)</label>
                                <input
                                    type="number"
                                    value={cost}
                                    onChange={(e) => setCost(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-[#ff4d00] transition-colors"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 font-black">Revenue ($)</label>
                                <input
                                    type="number"
                                    value={revenue}
                                    onChange={(e) => setRevenue(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-[#ff4d00] transition-colors"
                                    placeholder="0.00"
                                />
                            </div>
                            <button
                                onClick={calcMargin}
                                className="w-full border border-white/10 hover:bg-white/5 text-white py-4 rounded-xl font-black uppercase tracking-widest active:scale-[0.98] transition-all"
                            >
                                Calculate Margin
                            </button>
                            {margin !== null && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center"
                                >
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Gross Margin</p>
                                    <p className="text-4xl font-black text-blue-500">
                                        {margin}%
                                    </p>
                                    <button
                                        onClick={() => handleCopy(`${margin}%`, 'margin')}
                                        className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-500 transition-colors"
                                    >
                                        {copied === 'margin' ? '✅ Copied' : '📋 Copy Result'}
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </CalculatorCard>

                    {/* BMI Calculator */}
                    <CalculatorCard title="BMI Calculator" icon="⚖️">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 font-black">Weight (kg)</label>
                                    <input
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-[#ff4d00] transition-colors"
                                        placeholder="70"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 font-black">Height (cm)</label>
                                    <input
                                        type="number"
                                        value={height}
                                        onChange={(e) => setHeight(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-[#ff4d00] transition-colors"
                                        placeholder="175"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={calcBMI}
                                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white py-4 rounded-xl font-black uppercase tracking-widest active:scale-[0.98] transition-all"
                            >
                                Calculate BMI
                            </button>
                            {bmi !== null && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center"
                                >
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Body Mass Index</p>
                                    <p className={`text-4xl font-black ${parseFloat(bmi) < 18.5 || parseFloat(bmi) > 25 ? 'text-yellow-500' : 'text-green-500'}`}>
                                        {bmi}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide mt-2">
                                        {parseFloat(bmi) < 18.5 ? 'Underweight' : parseFloat(bmi) < 25 ? 'Healthy Weight' : parseFloat(bmi) < 30 ? 'Overweight' : 'Obese'}
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </CalculatorCard>

                    {/* Percentage Calculator */}
                    <CalculatorCard title="Quick Percent" icon="📊">
                        <div className="space-y-6">
                            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center min-h-[250px]">
                                <div className="text-4xl mb-4">🧩</div>
                                <h3 className="text-lg font-black text-white mb-2 uppercase tracking-wide">More coming soon</h3>
                                <p className="text-xs text-gray-500 font-bold max-w-[200px]">We are building more advanced calculators for your business needs.</p>
                            </div>
                        </div>
                    </CalculatorCard>
                </div>

                <PromoAd variant="strip" className="mt-8" />
            </main>
            <Footer />
        </div>
    );
};

export default Calculators;
