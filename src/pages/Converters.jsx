import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import AdBanner from '../components/AdBanner';
import PromoAd from '../components/PromoAd';

const Converters = () => {
    // Length Converter
    const [lengthValue, setLengthValue] = useState('');
    const [lengthFrom, setLengthFrom] = useState('meters');
    const [lengthTo, setLengthTo] = useState('feet');
    const [lengthResult, setLengthResult] = useState(null);

    // Data Converter
    const [dataValue, setDataValue] = useState('');
    const [dataFrom, setDataFrom] = useState('MB');
    const [dataTo, setDataTo] = useState('GB');
    const [dataResult, setDataResult] = useState(null);

    // JSON to CSV
    const [jsonInput, setJsonInput] = useState('');
    const [csvOutput, setCsvOutput] = useState('');
    const [copied, setCopied] = useState(null);
    const [error, setError] = useState(null);

    const convertLength = () => {
        const val = parseFloat(lengthValue);
        if (isNaN(val) || val < 0) {
            setError("Please enter a positive value.");
            return;
        }
        const rates = { meters: 1, feet: 3.28084, inches: 39.3701, km: 0.001, miles: 0.000621371 };
        const result = (val / rates[lengthFrom]) * rates[lengthTo];
        setLengthResult(result.toFixed(4));
    };

    const convertData = () => {
        const val = parseFloat(dataValue);
        if (isNaN(val) || val < 0) {
            setError("Please enter a positive value.");
            return;
        }
        const rates = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
        const result = (val * rates[dataFrom]) / rates[dataTo];
        setDataResult(result.toFixed(6).replace(/\.?0+$/, ''));
    };

    const jsonToCsv = () => {
        try {
            const arr = JSON.parse(jsonInput);
            if (!Array.isArray(arr)) throw new Error("Input must be a JSON array of objects.");
            const header = Object.keys(arr[0]).join(',');
            const rows = arr.map(obj => Object.values(obj).join(',')).join('\n');
            setCsvOutput(`${header}\n${rows}`);
        } catch (e) {
            setError("Invalid JSON: " + e.message);
        }
    };

    const handleCopy = (val, id) => {
        if (!val) return;
        navigator.clipboard.writeText(val);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-[#ff4d00]/30">
            <SEOHead
                title="Format & Unit Converters"
                description="Easily convert between JSON, CSV, Data sizes, and units with our lightning-fast utility tools."
            />
            <Navbar />
            <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-black mb-6 tracking-tightest leading-none"
                    >
                        Format <span className="text-[#ff4d00]">&</span> Unit <br />
                        <span className="text-gray-500">Converters.</span>
                    </motion.h1>
                    <p className="text-gray-500 text-xl max-w-2xl mx-auto font-medium mb-6">
                        Seamlessly switch between data formats and measurement systems.
                    </p>
                    <Link to="/calculators" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-all font-bold text-sm bg-white/5 px-4 py-2 rounded-lg border border-white/10 hover:border-white/20">
                        <span className="text-base">📈</span> Need ROI or BMI? Try Calculators
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
                    {/* Length Converter */}
                    <div className="modrinth-card p-10 border-white/5">
                        <h2 className="text-xl font-black mb-8 uppercase tracking-widest text-[#ff4d00]">Length & Distance</h2>
                        <div className="space-y-6">
                            <input
                                type="number"
                                value={lengthValue}
                                onChange={(e) => setLengthValue(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-black text-xl text-center"
                                placeholder="Value"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <select value={lengthFrom} onChange={(e) => setLengthFrom(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold">
                                    <option value="meters">Meters</option>
                                    <option value="feet">Feet</option>
                                    <option value="inches">Inches</option>
                                    <option value="km">Kilometers</option>
                                    <option value="miles">Miles</option>
                                </select>
                                <select value={lengthTo} onChange={(e) => setLengthTo(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold">
                                    <option value="meters">Meters</option>
                                    <option value="feet">Feet</option>
                                    <option value="inches">Inches</option>
                                    <option value="km">Kilometers</option>
                                    <option value="miles">Miles</option>
                                </select>
                            </div>
                            <button onClick={convertLength} className="w-full bg-[#ff4d00] text-white py-4 rounded-xl font-black uppercase tracking-widest">Convert</button>
                            {lengthResult && (
                                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center">
                                    <p className="text-3xl font-black text-white">{lengthResult} <span className="text-xs text-gray-500 uppercase">{lengthTo}</span></p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Data Size Converter */}
                    <div className="modrinth-card p-10 border-white/5">
                        <h2 className="text-xl font-black mb-8 uppercase tracking-widest text-blue-500">Digital Data Size</h2>
                        <div className="space-y-6">
                            <input
                                type="number"
                                value={dataValue}
                                onChange={(e) => setDataValue(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white font-black text-xl text-center"
                                placeholder="Value"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <select value={dataFrom} onChange={(e) => setDataFrom(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold">
                                    <option value="B">Bytes</option>
                                    <option value="KB">Kilobytes</option>
                                    <option value="MB">Megabytes</option>
                                    <option value="GB">Gigabytes</option>
                                    <option value="TB">Terabytes</option>
                                </select>
                                <select value={dataTo} onChange={(e) => setDataTo(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold">
                                    <option value="B">Bytes</option>
                                    <option value="KB">Kilobytes</option>
                                    <option value="MB">Megabytes</option>
                                    <option value="GB">Gigabytes</option>
                                    <option value="TB">Terabytes</option>
                                </select>
                            </div>
                            <button onClick={convertData} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-xl font-black uppercase tracking-widest">Convert</button>
                            {dataResult && (
                                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center">
                                    <p className="text-3xl font-black text-white">{dataResult} <span className="text-xs text-gray-500 uppercase">{dataTo}</span></p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* JSON to CSV */}
                    <div className="modrinth-card p-10 border-white/5 lg:col-span-2">
                        <h2 className="text-xl font-black mb-8 uppercase tracking-widest text-purple-500">JSON to CSV Converter</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Input JSON (Array of Objects)</label>
                                <textarea
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                    className="w-full h-64 bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-mono text-gray-300 focus:border-purple-500/50 outline-none transition-colors"
                                    placeholder='[{ "name": "Tool", "type": "SEO" }]'
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Output CSV</label>
                                <textarea
                                    readOnly
                                    value={csvOutput}
                                    className="w-full h-64 bg-[#0a0a0a] border border-white/5 rounded-xl p-4 text-xs font-mono text-gray-500"
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button onClick={jsonToCsv} className="flex-grow bg-[#ff4d00]/10 border border-[#ff4d00]/30 hover:bg-[#ff4d00] text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all">Generate CSV</button>
                            {csvOutput && (
                                <button
                                    onClick={() => handleCopy(csvOutput, 'csv')}
                                    className="px-8 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-black uppercase tracking-widest transition-all"
                                >
                                    {copied === 'csv' ? '✅' : '📋'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <PromoAd variant="strip" className="mt-8" />
            </main>
            <Footer />
        </div>
    );
};

export default Converters;
