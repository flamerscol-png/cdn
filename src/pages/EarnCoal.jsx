import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { addPowers } from '../utils/db';
import { FaFire, FaAd, FaHammer, FaGem, FaCheckCircle, FaExclamationTriangle, FaMousePointer } from 'react-icons/fa';
import AdBanner from '../components/AdBanner';
import PromoAd from '../components/PromoAd';
import SEOHead from '../components/SEOHead';

const EarnCoal = () => {
    const [user, setUser] = useState(null);
    const [userCoal, setUserCoal] = useState(0);
    const [isMining, setIsMining] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [bannerClicked, setBannerClicked] = useState(false);
    const [timerDone, setTimerDone] = useState(false);
    const [timer, setTimer] = useState(0);
    const [status, setStatus] = useState(null);
    const [totalMined, setTotalMined] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        let unsubscribeData;
        const unsubscribeAuth = auth.onAuthStateChanged((u) => {
            if (!u) {
                navigate('/login');
                return;
            }
            setUser(u);

            const userRef = ref(database, `users/${u.uid}`);
            unsubscribeData = onValue(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setUserCoal(data.powers || 0);
                }
            }, (error) => {
                console.error("[EarnCoal] Real-time listener error:", error.message);
                setStatus({ type: 'error', message: `Database connection failed: ${error.message}` });
            });
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeData) unsubscribeData();
        };
    }, [navigate]);

    // When both conditions met, auto-claim
    useEffect(() => {
        if (timerDone && bannerClicked && !isClaiming) {
            claimReward();
        }
    }, [timerDone, bannerClicked, isClaiming]);

    useEffect(() => {
        let interval;
        if (isMining && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (isMining && timer === 0 && !timerDone) {
            setTimerDone(true);
            if (!bannerClicked) {
                setStatus({ type: 'info', message: 'Almost there! Click the sponsored banner below to claim your 20 🔥 Coal.' });
            }
        }
        return () => clearInterval(interval);
    }, [isMining, timer, timerDone, bannerClicked]);

    const startMining = () => {
        if (isMining || isClaiming) return;
        setIsMining(true);
        setBannerClicked(false);
        setTimerDone(false);
        setTimer(15);
        setStatus({ type: 'info', message: 'Mining started! Click the sponsored banner and wait for the timer.' });
    };

    const handleBannerClick = () => {
        if (!isMining || bannerClicked) return;
        setBannerClicked(true);
        if (timerDone) {
            // Timer already done, claim will be triggered by useEffect
        } else {
            setStatus({ type: 'info', message: '✅ Banner clicked! Wait for the timer to finish...' });
        }
    };

    const claimReward = async () => {
        if (!user) {
            setStatus({ type: 'error', message: 'Not logged in. Please refresh.' });
            setIsMining(false);
            return;
        }

        setIsClaiming(true);
        setStatus({ type: 'info', message: 'Claiming your 20 🔥 Coal...' });

        try {
            console.log("[Mining] Claiming reward for:", user.uid);
            const newTotal = await addPowers(user.uid, 20);

            console.log("[Mining] ✅ Claim success! New total:", newTotal);
            setStatus({ type: 'success', message: `Successfully mined 20 🔥 Coal! Balance: ${newTotal} 🔥` });
            setTotalMined(prev => prev + 20);

            setTimeout(() => {
                setIsMining(false);
                setIsClaiming(false);
                setStatus(null);
            }, 4000);

        } catch (error) {
            console.error("[Mining] ❌ Claim failed:", error);
            setStatus({
                type: 'error',
                message: `Mining failed: ${error.message}. Make sure Realtime Database is enabled in Firebase Console.`
            });
            setIsMining(false);
            setIsClaiming(false);
        }
    };

    const getStatusColors = (type) => {
        switch (type) {
            case 'success': return 'bg-green-500/10 text-green-400 border-green-500/30';
            case 'error': return 'bg-red-500/10 text-red-400 border-red-500/30';
            case 'info': return 'bg-[#ff4d00]/10 text-[#ff4d00] border-[#ff4d00]/30';
            default: return 'bg-white/5 text-gray-400 border-white/10';
        }
    };

    const getStatusIcon = (type) => {
        switch (type) {
            case 'success': return <FaCheckCircle />;
            case 'error': return <FaExclamationTriangle />;
            default: return <FaFire className="animate-pulse" />;
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white pt-32 pb-20 px-4 md:px-8">
            <SEOHead 
                title="Earn Coal" 
                description="Refuel your coal reserve by watching sponsored content. Power up your SEO tools on FlamerCoal." 
            />
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff4d00]/10 border border-[#ff4d00]/20 text-[#ff4d00] text-xs font-black uppercase tracking-widest mb-6"
                    >
                        <FaFire className="animate-pulse" /> Coal Mining Facility
                    </motion.div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tightest leading-none">
                        Refuel Your <br />
                        <span className="text-[#ff4d00]">Reserve.</span>
                    </h1>
                    <p className="text-gray-400 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
                        Support the combustion engine by watching short sponsored content. Every claim adds <span className="text-white font-bold">20 🔥 Coal</span> to your reserve.
                    </p>

                    {/* Live Coal Balance Display */}
                    {user && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-[#ff4d00]/10 border border-[#ff4d00]/20"
                        >
                            <span className="text-2xl">🔥</span>
                            <div>
                                <div className="text-xs font-black uppercase tracking-widest text-gray-500">Your Balance</div>
                                <div className="text-3xl font-black text-[#ff4d00]">{userCoal}</div>
                            </div>
                            {totalMined > 0 && (
                                <div className="ml-4 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold">
                                    +{totalMined} this session
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* Left Ad Placeholder */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="hidden lg:flex h-[600px] bg-[#0a0a0a] border border-white/5 rounded-3xl p-4 flex-col items-center justify-center text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#ff4d00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <FaAd className="text-4xl text-gray-700 mb-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Sponsor Area</span>
                        <p className="text-xs text-gray-500 mt-2 italic px-8">Vertical ad placement placeholder (160x600)</p>
                        <div className="mt-8 w-full h-full border border-dashed border-white/10 rounded-xl flex items-center justify-center text-gray-800 font-black">
                            300 x 600
                        </div>
                    </motion.div>

                    {/* Central Mining Action */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#0a0a0a] border border-[#ff4d00]/30 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl shadow-[#ff4d00]/5"
                        >
                            <div className="relative z-10">
                                <div className="w-24 h-24 bg-[#ff4d00]/10 rounded-full flex items-center justify-center mx-auto mb-8 relative border border-[#ff4d00]/20">
                                    {isMining ? (
                                        <FaHammer className="text-4xl text-[#ff4d00] animate-bounce" />
                                    ) : (
                                        <FaGem className="text-4xl text-[#ff4d00]" />
                                    )}
                                    {isMining && (
                                        <div className="absolute inset-0 rounded-full border-2 border-[#ff4d00] border-t-transparent animate-spin" />
                                    )}
                                </div>

                                <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">
                                    {isClaiming ? "Claiming..." : (timerDone && !bannerClicked) ? "Click the Banner!" : isMining ? "Excavating..." : "Ready to Mine"}
                                </h2>
                                <p className="text-gray-500 text-sm font-medium mb-4">
                                    {isClaiming ? "Saving reward to your account..." : (timerDone && !bannerClicked) ? "Click the sponsored banner below to get your Coal" : isMining ? `Verification in ${timer}s... ${bannerClicked ? '✅ Banner clicked!' : '👆 Click the banner!'}` : "Click below to begin the extraction process."}
                                </p>

                                {/* Progress Bar */}
                                {isMining && !isClaiming && (
                                    <div className="w-full bg-white/5 rounded-full h-2 mb-6 overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-[#ff4d00] to-orange-400 rounded-full"
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${((15 - timer) / 15) * 100}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                )}

                                {/* Status Message */}
                                {status && (
                                    <div className={`mb-6 p-4 rounded-xl text-sm font-bold border flex items-center gap-3 ${getStatusColors(status.type)}`}>
                                        {getStatusIcon(status.type)}
                                        <span className="text-left flex-1">{status.message}</span>
                                    </div>
                                )}

                                <button
                                    onClick={startMining}
                                    disabled={isMining || isClaiming}
                                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 ${isMining || isClaiming
                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                        : 'bg-[#ff4d00] text-white hover:brightness-110 active:scale-95 shadow-xl shadow-[#ff4d00]/20'
                                        }`}
                                >
                                    {isClaiming ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> :
                                        isMining ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Digging...</> :
                                            <><FaHammer /> Start Mining</>}
                                </button>
                            </div>

                            {/* Visual background elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff4d00]/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#ff4d00]/5 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />
                        </motion.div>

                        <div
                            onClick={handleBannerClick}
                            className={`rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 ${isMining && !bannerClicked
                                ? 'bg-[#ff4d00]/5 border-2 border-[#ff4d00]/40 cursor-pointer hover:bg-[#ff4d00]/10 animate-pulse shadow-lg shadow-[#ff4d00]/10'
                                : bannerClicked
                                    ? 'bg-green-500/5 border-2 border-green-500/30'
                                    : 'bg-[#0a0a0a] border border-white/5'
                            }`}
                        >
                            {bannerClicked ? (
                                <>
                                    <FaCheckCircle className="text-2xl text-green-400 mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-green-400">Banner Clicked ✅</span>
                                </>
                            ) : (
                                <>
                                    {isMining ? (
                                        <FaMousePointer className="text-2xl text-[#ff4d00] mb-2 animate-bounce" />
                                    ) : (
                                        <FaAd className="text-2xl text-gray-700 mb-2" />
                                    )}
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isMining ? 'text-[#ff4d00]' : 'text-gray-600'}`}>
                                        {isMining ? '👆 Click Here to Continue' : 'Sponsored Module'}
                                    </span>
                                </>
                            )}
                            <div className={`mt-4 w-full h-[250px] border rounded-xl flex items-center justify-center font-black ${isMining && !bannerClicked ? 'border-[#ff4d00]/30 text-[#ff4d00]/30' : 'border-dashed border-white/10 text-gray-800'}`}>
                                {isMining && !bannerClicked ? 'TAP HERE' : '300 x 250'}
                            </div>
                        </div>
                    </div>

                    {/* Right Ad Placeholder */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="hidden lg:flex h-[600px] bg-[#0a0a0a] border border-white/5 rounded-3xl p-4 flex-col items-center justify-center text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#ff4d00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <FaAd className="text-4xl text-gray-700 mb-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Sponsor Area</span>
                        <p className="text-xs text-gray-500 mt-2 italic px-8">Vertical ad placement placeholder (160x600)</p>
                        <div className="mt-8 w-full h-full border border-dashed border-white/10 rounded-xl flex items-center justify-center text-gray-800 font-black">
                            300 x 600
                        </div>
                    </motion.div>

                </div>

                {/* Bottom Banner Placeholder */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-4">Leaderboard Sponsor Zone</span>
                    <div className="w-full h-[90px] border border-dashed border-white/10 rounded-xl flex items-center justify-center text-gray-800 font-black max-w-4xl">
                        728 x 90
                    </div>
                </motion.div>

                <PromoAd variant="leaderboard" className="mt-4" />

            </div>
        </div>
    );
};

export default EarnCoal;
