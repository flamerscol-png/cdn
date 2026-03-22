import React from 'react';
import { Link } from 'react-router-dom';

const seoToolsList = [
    {
        icon: "✍️",
        title: "AI Blog Writer",
        desc: "Generate professional SEO content instantly.",
        link: "/tools/blog-writer",
    },
    {
        icon: "🛡️",
        title: "Site Auditor",
        desc: "16-point technical SEO audit and health score.",
        link: "/tools/site-auditor",
    },
    {
        icon: "🔍",
        title: "Keyword Researcher",
        desc: "Data-driven keyword discovery and tracking.",
        link: "/tools/keyword-research",
    },
    // Fallbacks from YouTube category
    {
        icon: "📹",
        title: "Thumbnail Downloader",
        desc: "Extract any YouTube thumbnail in 4K.",
        link: "/tools/youtube-thumbnail-downloader",
    },
    {
        icon: "🏷️",
        title: "Tag Generator",
        desc: "Generate high-traffic SEO tags.",
        link: "/tools/youtube-tag-generator",
    }
];

const RelatedSeoTools = ({ currentToolPath }) => {
    // Filter out the current tool and pick 3 other tools
    const relatedTools = seoToolsList
        .filter(tool => tool.link !== currentToolPath)
        .slice(0, 3);

    return (
        <section className="py-20 border-t border-gray-900 bg-black">
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-2xl font-bold text-white mb-8 text-center">Discover More SEO Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {relatedTools.map((tool, index) => (
                        <Link to={tool.link} key={index} className="block group">
                            <div className="bg-gray-900 border border-[#ff4d00]/10 p-6 rounded-xl h-full hover:bg-gray-800 transition-colors hover:border-[#ff4d00]/30">
                                <div className="text-3xl mb-3">{tool.icon}</div>
                                <h3 className="font-bold text-white mb-1">{tool.title}</h3>
                                <p className="text-sm text-gray-400">{tool.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RelatedSeoTools;
