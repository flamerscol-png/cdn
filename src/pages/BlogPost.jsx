import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import AdBanner from '../components/AdBanner';
import { blogData } from '../data/blogData';
import { FaCalendarAlt, FaClock, FaArrowLeft, FaTools } from 'react-icons/fa';

const BlogPost = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);

    useEffect(() => {
        const foundPost = blogData.find(p => p.slug === slug);
        if (foundPost) {
            setPost(foundPost);
        } else {
            navigate('/blog'); // Redirect if not found
        }
        window.scrollTo(0, 0);
    }, [slug, navigate]);

    if (!post) return null;

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-[#ff4d00]/30 tracking-wide">
            <SEOHead
                title={post.title}
                description={post.excerpt}
            />
            
            {/* Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[30%] bg-[#ff4d00]/5 rounded-full blur-[200px]" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 py-12 max-w-4xl mx-auto">
                <button 
                    onClick={() => navigate('/blog')}
                    className="flex items-center gap-2 text-gray-400 hover:text-[#ff4d00] transition-colors mb-12 font-bold text-sm"
                >
                    <FaArrowLeft /> Back to Hub
                </button>

                <article>
                    {/* Header */}
                    <header className="mb-12 text-center">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-center gap-4 text-xs font-black uppercase tracking-widest text-gray-500 mb-6"
                        >
                            <span className={post.category === 'YouTube' ? 'text-red-500' : 'text-blue-500'}>
                                {post.category}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5"><FaCalendarAlt /> {post.date}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5"><FaClock /> {post.readTime}</span>
                        </motion.div>

                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight tracking-tight px-4"
                        >
                            {post.title}
                        </motion.h1>

                        {post.image && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="w-full aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/5"
                            >
                                <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                            </motion.div>
                        )}
                    </header>

                    {/* Content */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="prose prose-invert prose-orange max-w-none text-gray-300 text-lg leading-relaxed
                                   prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                                   prose-a:text-[#ff4d00] prose-a:no-underline hover:prose-a:underline
                                   prose-strong:text-white prose-strong:font-black
                                   prose-p:mb-6 prose-li:mb-2
                                   prose-img:rounded-2xl prose-img:border prose-img:border-white/10"
                    >
                        <ReactMarkdown>{post.content}</ReactMarkdown>
                    </motion.div>

                    {/* Integrated Sales CTA */}
                    {post.integratedTool && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mt-16 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#ff4d00]/10 to-transparent border border-[#ff4d00]/30 text-center relative overflow-hidden group"
                        >
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ff4d00]/20 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                            
                            <div className="w-16 h-16 bg-[#ff4d00] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#ff4d00]/20 text-white text-2xl">
                                <FaTools />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Stop Guessing. Start Growing.</h3>
                            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto font-medium">
                                Put these strategies into action immediately with the <span className="text-white font-black">{post.integratedTool.name}</span>.
                            </p>
                            <Link 
                                to={post.integratedTool.path}
                                className="inline-flex items-center justify-center px-10 py-5 text-lg font-black bg-[#ff4d00] text-white rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_-10px_#ff4d00] active:scale-95 shadow-xl shadow-[#ff4d00]/20 uppercase tracking-widest"
                            >
                                Try It Free Now
                            </Link>
                        </motion.div>
                    )}
                </article>

                <div className="mt-20">
                    <h3 className="text-2xl font-black text-white mb-8">Recommended Intelligence</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {blogData
                            .filter(p => p.slug !== slug)
                            .sort(() => 0.5 - Math.random())
                            .slice(0, 3)
                            .map((p, i) => (
                                <Link to={`/blog/${p.slug}`} key={i} className="group flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.07] transition-all">
                                    <div className="aspect-video w-full overflow-hidden">
                                        <img src={p.image || '/blog-placeholder.png'} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="p-4">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-2">{p.category}</div>
                                        <h4 className="font-bold text-white text-sm line-clamp-2 group-hover:text-[#ff4d00] transition-colors">{p.title}</h4>
                                    </div>
                                </Link>
                            ))}
                    </div>
                </div>

                <div className="mt-20">
                    <AdBanner size="leaderboard" />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default BlogPost;
