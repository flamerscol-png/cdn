import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import AdBanner from '../components/AdBanner';
import { blogData } from '../data/blogData';
import { FaCalendarAlt, FaClock, FaArrowLeft, FaTools, FaShare, FaLink } from 'react-icons/fa';
import Breadcrumbs from '../components/Breadcrumbs';

const BASE_URL = 'https://flamercoal.web.app';

// ─── Schema Builders ─────────────────────────────────────────────
const buildArticleSchema = (post, url, images = []) => ({
    '@type': 'Article',
    '@id': `${url}#article`,
    isPartOf: { '@id': `${url}#webpage` },
    author: { '@id': `${BASE_URL}/#organization` },
    publisher: { '@id': `${BASE_URL}/#organization` },
    headline: post.title,
    description: post.excerpt,
    mainEntityOfPage: { '@id': url },
    image: images.length > 0 ? images.map(i => i.url) : (post.image || `${BASE_URL}/favicon.svg`),
    datePublished: post.dateISO || new Date().toISOString(),
    dateModified: post.dateISO || new Date().toISOString(),
    articleSection: post.category,
    wordCount: post.content ? post.content.split(' ').length : undefined,
});

const buildBreadcrumbSchema = (post, url) => ({
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
});

const buildFaqSchema = (faqs, url) => ({
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: faqs.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
    })),
});

// Parse FAQs from markdown content: lines starting with **Question?**
const extractFaqs = (content) => {
    const faqs = [];
    const lines = content.split('\n');
    let i = 0;
    while (i < lines.length) {
        const qMatch = lines[i].match(/^\*\*(.+\?)\*\*$/);
        if (qMatch) {
            const question = qMatch[1];
            let answer = '';
            i++;
            while (i < lines.length && !lines[i].match(/^\*\*(.+\?)\*\*$/) && !lines[i].startsWith('---') && !lines[i].startsWith('##')) {
                if (lines[i].trim()) answer += (answer ? ' ' : '') + lines[i].trim();
                i++;
            }
            if (answer) faqs.push({ q: question, a: answer.replace(/\*\*/g, '') });
        } else {
            i++;
        }
    }
    return faqs;
};

// Parse image URLs from markdown content: ![alt](url)
const extractImages = (content, heroImage, heroAlt) => {
    const images = [];
    if (heroImage) {
        images.push({ url: heroImage.startsWith('http') ? heroImage : `${BASE_URL}${heroImage}`, alt: heroAlt || '' });
    }
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
        const url = match[2].startsWith('http') ? match[2] : `${BASE_URL}${match[2]}`;
        if (!images.find(i => i.url === url)) {
            images.push({ url, alt: match[1] || '' });
        }
    }
    return images;
};

// ─── Reading Progress Bar ──────────────────────────────────────
const ReadingProgress = () => {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const update = () => {
            const el = document.documentElement;
            const scrollTop = el.scrollTop || document.body.scrollTop;
            const scrollHeight = el.scrollHeight - el.clientHeight;
            setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
        };
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, []);
    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/5">
            <div
                className="h-full bg-gradient-to-r from-[#ff4d00] to-[#ff7a00] transition-all duration-100"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
};

// ─── Share Button ─────────────────────────────────────────────
const ShareButtons = ({ title, url }) => {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="flex items-center gap-3 mt-8 pt-8 border-t border-white/10">
            <span className="text-xs font-black uppercase tracking-widest text-gray-500">Share Content</span>
            <button onClick={copy}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-[#ff4d00]/20 hover:text-[#ff4d00] text-gray-400 text-sm font-bold transition-all border border-white/5">
                <FaLink /> {copied ? 'Copied to Clipboard!' : 'Copy Post Link'}
            </button>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────
const BlogPost = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const articleRef = useRef(null);

    // Synchronous find to ensure SEO head is rendered on the very first pass for search engine crawlers
    const post = blogData.find(p => p.slug === slug);

    useEffect(() => {
        if (!post) {
            navigate('/blog');
        }
        window.scrollTo(0, 0);
    }, [post, navigate]);

    if (!post) return null;

    const pageUrl = `${BASE_URL}/blog/${post.slug}`;
    const faqs = extractFaqs(post.content || '');
    const blogImages = extractImages(post.content || '', post.image, post.imageAlt);

    // Build combined schema graph
    const schemas = [
        {
            '@type': 'WebPage',
            '@id': pageUrl,
            url: pageUrl,
            name: post.title,
            description: post.excerpt,
            publisher: { '@id': `${BASE_URL}/#organization` },
        },
        buildArticleSchema(post, pageUrl, blogImages),
        buildBreadcrumbSchema(post, pageUrl)
    ];
    if (faqs.length > 0) schemas.push(buildFaqSchema(faqs, pageUrl));
    // Add ImageObject schemas for all blog images
    blogImages.forEach((img, idx) => {
        schemas.push({
            '@type': 'ImageObject',
            '@id': `${pageUrl}#image-${idx}`,
            url: img.url,
            contentUrl: img.url,
            caption: img.alt,
            inLanguage: 'en-US',
        });
    });
    
    const combinedSchema = { 
        '@context': 'https://schema.org', 
        '@graph': [
            {
                '@type': 'Organization',
                '@id': `${BASE_URL}/#organization`,
                name: 'FlamerCoal',
                url: BASE_URL,
                logo: { '@type': 'ImageObject', url: `${BASE_URL}/favicon.svg` }
            },
            ...schemas
        ]
    };

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-[#ff4d00]/30 tracking-wide">
            {/* Reading Progress */}
            <ReadingProgress />

            {/* SEO Head — Article schema + OG image + canonical */}
            <SEOHead
                title={post.title}
                description={post.excerpt}
                customSchema={combinedSchema}
                ogImage={post.image}
                ogType="article"
            />

            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[30%] bg-[#ff4d00]/5 rounded-full blur-[200px]" />
            </div>

            <main className="relative z-10 pt-28 pb-24 px-4 md:px-6 max-w-4xl mx-auto">

                {/* ── Breadcrumbs ─────────────────────────────── */}
                <Breadcrumbs 
                    items={[
                        { name: 'BLOG', path: '/blog' },
                        { name: post.category, path: `/blog?category=${post.category}` },
                        { name: post.title }
                    ]} 
                />

                <article ref={articleRef}>
                    {/* ── Header ──────────────────────────────── */}
                    <header className="mb-12 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-gray-500 mb-6"
                        >
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${post.category === 'YouTube' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {post.category}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5"><FaCalendarAlt /><time dateTime={post.dateISO}>{post.date}</time></span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5"><FaClock /> {post.readTime}</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl md:text-5xl font-black text-white mb-8 leading-tight tracking-tight px-2"
                        >
                            {post.title}
                        </motion.h1>

                        {/* Excerpt / Lead */}
                        {post.excerpt && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.15 }}
                                className="text-lg text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed"
                            >
                                {post.excerpt}
                            </motion.p>
                        )}

                        {/* ── Hero Image ─────────────────────── */}
                        {post.image && (
                            <motion.figure
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="w-full aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/5 mb-4"
                            >
                                <img
                                    src={post.image}
                                    alt={post.imageAlt || post.title}
                                    className="w-full h-full object-cover"
                                    loading="eager"
                                    fetchpriority="high"
                                    width="1280"
                                    height="720"
                                />
                                {post.imageAlt && (
                                    <figcaption className="sr-only">{post.imageAlt}</figcaption>
                                )}
                            </motion.figure>
                        )}
                    </header>

                    {/* ── Body Content ──────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="prose prose-invert prose-orange max-w-none text-gray-300 text-lg leading-relaxed
                                   prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                                   prose-headings:font-heading
                                   prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-3
                                   prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                                   prose-p:font-body prose-p:text-gray-300 prose-p:leading-8
                                   prose-a:text-[#ff4d00] prose-a:no-underline hover:prose-a:underline
                                   prose-strong:text-white prose-strong:font-bold
                                   prose-blockquote:border-l-[#ff4d00] prose-blockquote:bg-[#ff4d00]/5 prose-blockquote:rounded-r-xl prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:not-italic
                                   prose-code:bg-white/10 prose-code:text-[#ff4d00] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                                   prose-img:rounded-2xl prose-img:border prose-img:border-white/10 prose-img:shadow-xl prose-img:shadow-black/40"
                    >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                    </motion.div>

                    {/* ── Share Buttons ─────────────────────────── */}
                    <ShareButtons title={post.title} url={pageUrl} />

                    {/* ── Tool CTA ──────────────────────────────── */}
                    {post.integratedTool && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mt-12 p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#ff4d00]/10 to-transparent border border-[#ff4d00]/30 text-center relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ff4d00]/10 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                            <div className="w-16 h-16 bg-[#ff4d00] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#ff4d00]/20 text-white text-2xl">
                                <FaTools />
                            </div>
                            <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Stop Guessing. Start Growing.</h3>
                            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto font-medium">
                                Put these strategies into action with the <span className="text-white font-black">{post.integratedTool.name}</span>.
                            </p>
                            <Link
                                to={post.integratedTool.path}
                                className="inline-flex items-center justify-center px-10 py-5 text-lg font-black bg-[#ff4d00] text-white rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_-10px_#ff4d00] active:scale-95 shadow-xl shadow-[#ff4d00]/20 uppercase tracking-widest"
                            >
                                Try It Free Now
                            </Link>
                        </motion.div>
                    )}

                    {/* ── FAQ Section (visible, also parsed into schema) ── */}
                    {faqs.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mt-16"
                            aria-label="Frequently Asked Questions"
                        >
                            <h2 className="text-2xl font-black text-white mb-6 tracking-tight">Frequently Asked Questions</h2>
                            <div className="space-y-4">
                                {faqs.map(({ q, a }, idx) => (
                                    <details
                                        key={idx}
                                        className="group rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
                                    >
                                        <summary
                                            className="flex items-center justify-between cursor-pointer px-6 py-5 font-bold text-white text-base hover:bg-white/[0.03] transition-colors select-none list-none"
                                        >
                                            {q}
                                            <span className="ml-4 text-[#ff4d00] text-lg transform group-open:rotate-45 transition-transform duration-200 flex-shrink-0">+</span>
                                        </summary>
                                        <div
                                            className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4"
                                        >
                                            <span>{a}</span>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </motion.section>
                    )}
                </article>

                {/* ── Recommended Posts ─────────────────────────── */}
                <section className="mt-20" aria-label="Recommended Articles">
                    <h3 className="text-2xl font-black text-white mb-8">Recommended Intelligence</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {blogData
                            .filter(p => p.slug !== slug)
                            .sort(() => 0.5 - Math.random())
                            .slice(0, 3)
                            .map((p, i) => (
                                <Link to={`/blog/${p.slug}`} key={i} className="group flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.07] hover:border-[#ff4d00]/30 transition-all">
                                    <div className="aspect-video w-full overflow-hidden bg-black/40">
                                        <img
                                            src={p.image || 'https://cdn.jsdelivr.net/gh/flamerscol-png/cdn@main/public/blog_youtube_tags_1773810722203.png'}
                                            alt={p.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                            width="400"
                                            height="225"
                                        />
                                    </div>
                                    <div className="p-4 flex flex-col gap-1">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00]">{p.category}</div>
                                        <h4 className="font-bold text-white text-sm line-clamp-2 group-hover:text-[#ff4d00] transition-colors">{p.title}</h4>
                                        <span className="text-[11px] text-gray-500 mt-1">{p.readTime}</span>
                                    </div>
                                </Link>
                            ))}
                    </div>
                </section>

                <div className="mt-20">
                    <AdBanner size="leaderboard" />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default BlogPost;
