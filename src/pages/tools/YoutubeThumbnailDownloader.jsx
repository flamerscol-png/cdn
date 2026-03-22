import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, database } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { deductPowers } from '../../utils/db';
import { motion } from 'framer-motion';
import Footer from '../../components/Footer';
import SEOHead from '../../components/SEOHead';
import { FaYoutube, FaDownload, FaLink } from 'react-icons/fa';
import AdBanner from '../../components/AdBanner';
import RelatedYoutubeTools from '../../components/RelatedYoutubeTools';

const YoutubeThumbnailDownloader = () => {
    const [url, setUrl] = useState('');
    const [thumbnails, setThumbnails] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const TOOL_COST = 5;

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

    const extractVideoId = (url) => {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : false;
    };

    const handleFetch = async (e) => {
        e.preventDefault();
        setError('');
        const videoId = extractVideoId(url);

        if (!videoId) {
            setError('Please enter a valid YouTube URL');
            setThumbnails(null);
            return;
        }

        if (!auth.currentUser) {
            navigate('/login');
            return;
        }

        if (!userData || (userData.powers || 0) < TOOL_COST) {
            setError(`Insufficient Coal! You need ${TOOL_COST} 🔥 but have ${userData?.powers || 0} 🔥.`);
            setThumbnails(null);
            return;
        }

        try {
            await deductPowers(auth.currentUser.uid, TOOL_COST);
            
            setThumbnails({
            maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            hq: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            mq: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            sd: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
            });
        } catch (err) {
            console.error("Deduction error:", err);
            setError(err.message || "Failed to process request.");
        }
    };

    const downloadImage = async (imgUrl, quality) => {
        try {
            const response = await fetch(imgUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `youtube-thumbnail-${quality}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Download failed, opening in new tab instead.", err);
            window.open(imgUrl, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
            <SEOHead
                title="YouTube Thumbnail Downloader - Free SEO Tools"
                description="Download high-quality thumbnails from any YouTube video instantly. Get HD, MaxRes, and Standard quality images."
            />
            {/* Background Decoration */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#ff0000]/5 rounded-full blur-[120px]" />
            </div>

            <main className="flex-grow relative z-10 px-6 pt-32 pb-24 max-w-4xl mx-auto w-full">
            <AdBanner size="leaderboard" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 text-center"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#ff0000]/10 border border-[#ff0000]/20 text-[#ff0000] text-xs font-bold uppercase tracking-widest mb-4">
                        <FaYoutube /> Creator Tools
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">YouTube <span className="text-[#ff0000]">Thumbnail</span> Downloader</h1>
                    <p className="text-gray-400 text-lg">Extract and download thumbnails in Max Resolution, HD, and SD.</p>
                </motion.div>

                <div className="modrinth-card p-8 mb-8 relative overflow-hidden">
                    <form onSubmit={handleFetch} className="flex flex-col md:flex-row gap-4 relative z-10">
                        <div className="flex-grow flex items-center bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#ff0000]/50 transition-colors">
                            <FaLink className="text-gray-500 mr-3" />
                            <input
                                type="url"
                                required
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Paste YouTube Video URL here..."
                                className="w-full bg-transparent text-white outline-none font-medium placeholder-gray-600"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-[#ff0000] hover:bg-[#ff1a1a] text-white font-black px-8 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(255,0,0,0.3)] hover:shadow-[0_0_30px_rgba(255,0,0,0.5)] flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                            <FaDownload /> Extract Thumbnail (5 🔥)
                        </button>
                    </form>
                    {error && <div className="mt-4 text-[#ff0000] text-sm font-bold bg-[#ff0000]/10 p-3 rounded-lg">{error}</div>}
                </div>

                {thumbnails && (
                    <motion.div
                        initial={{ opacity: 0, mt: 20 }}
                        animate={{ opacity: 1, mt: 0 }}
                        className="space-y-8"
                    >
                        <div className="modrinth-card p-6 border border-[#ff0000]/20 bg-[#ff0000]/5">
                            <h3 className="text-xl font-black mb-1 flex justify-between items-center">
                                Max Resolution (1280x720)
                                <button onClick={() => downloadImage(thumbnails.maxres, 'maxres')} className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                                    <FaDownload /> Download
                                </button>
                            </h3>
                            <p className="text-gray-400 text-sm mb-4">Best quality. Note: Some videos might not have a MaxRes thumbnail.</p>
                            <img src={thumbnails.maxres} alt="MaxRes Thumbnail" className="w-full rounded-xl border border-white/10 shadow-lg object-cover" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="modrinth-card p-4">
                                <h3 className="text-lg font-bold mb-3 flex justify-between items-center">
                                    High Quality (480x360)
                                    <button onClick={() => downloadImage(thumbnails.hq, 'hq')} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                                        <FaDownload /> Download
                                    </button>
                                </h3>
                                <img src={thumbnails.hq} alt="HQ Thumbnail" className="w-full rounded-lg border border-white/10" />
                            </div>
                            <div className="modrinth-card p-4">
                                <h3 className="text-lg font-bold mb-3 flex justify-between items-center">
                                    Standard Quality (320x180)
                                    <button onClick={() => downloadImage(thumbnails.mq, 'mq')} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                                        <FaDownload /> Download
                                    </button>
                                </h3>
                                <img src={thumbnails.mq} alt="MQ Thumbnail" className="w-full rounded-lg border border-white/10" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>
            <RelatedYoutubeTools currentToolPath="/tools/youtube-thumbnail-downloader" />
            <Footer />
        </div>
    );
};

export default YoutubeThumbnailDownloader;
