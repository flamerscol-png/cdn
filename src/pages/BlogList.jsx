import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import AdBanner from '../components/AdBanner';
import { blogData } from '../data/blogData';
import { FaCalendarAlt, FaClock, FaTag, FaArrowRight } from 'react-icons/fa';

const BlogList = () => {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const categories = ['All', 'YouTube', 'SEO'];

    const filteredPosts = selectedCategory === 'All' 
        ? blogData 
        : blogData.filter(post => post.category === selectedCategory);

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-[#ff4d00]/30">
            <SEOHead
                title="FlameCoal Blog | SEO & YouTube Intelligence"
                description="Deep-dive strategies, tool tutorials, and growth hacks for mastering SEO and YouTube algorithms."
            />
            
            {/* Background Mesh */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#ff4d00]/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[150px]" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto min-h-screen">
                <div className="text-center mb-16">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-white"
                    >
                        The <span className="text-[#ff4d00]">Intelligence</span> Hub
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-400 text-lg max-w-2xl mx-auto"
                    >
                        Master the algorithms. Deep-dive strategies, industry secrets, and tactical guides for elite creators and SEOs.
                    </motion.p>
                </div>

                {/* Category Filter */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center gap-4 mb-12"
                >
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
                                selectedCategory === cat 
                                    ? 'bg-[#ff4d00] text-white shadow-lg shadow-[#ff4d00]/30' 
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </motion.div>

                <AdBanner size="leaderboard" className="mb-12" />

                {/* Blog Grid */}
                {filteredPosts.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-xl font-bold">New intelligence dropping soon.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredPosts.map((post, index) => (
                            <motion.div
                                key={post.slug}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                                className="group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-[#ff4d00]/50 transition-all duration-500 hover:shadow-2xl hover:shadow-[#ff4d00]/10 flex flex-col"
                            >
                                {/* Image Container */}
                                <div className="relative aspect-video overflow-hidden">
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all z-10" />
                                    {post.image ? (
                                        <img 
                                            src={post.image} 
                                            alt={post.title}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                                            <span className="text-gray-700 font-bold">Image Pending</span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 z-20">
                                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md ${
                                            post.category === 'YouTube' ? 'bg-red-500/80 text-white' : 'bg-blue-500/80 text-white'
                                        }`}>
                                            {post.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex flex-col flex-grow">
                                    <h2 className="text-2xl font-bold text-white mb-3 leading-tight group-hover:text-[#ff4d00] transition-colors line-clamp-2">
                                        <Link to={`/blog/${post.slug}`}>
                                            {post.title}
                                        </Link>
                                    </h2>
                                    <p className="text-gray-400 text-sm mb-6 line-clamp-3">
                                        {post.excerpt}
                                    </p>
                                    
                                    <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between text-xs text-gray-500 font-medium">
                                        <div className="flex items-center gap-4">
                                            <span className="flex items-center gap-1.5"><FaCalendarAlt className="opacity-70"/> {post.date}</span>
                                            <span className="flex items-center gap-1.5"><FaClock className="opacity-70"/> {post.readTime}</span>
                                        </div>
                                        <Link to={`/blog/${post.slug}`} className="text-[#ff4d00] flex items-center gap-2 font-bold group-hover:translate-x-1 transition-transform">
                                            Read <FaArrowRight />
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default BlogList;
