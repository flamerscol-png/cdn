import React from 'react';
import { Link } from 'react-router-dom';

const youtubeToolsList = [
    {
        icon: "📹",
        title: "Thumbnail Downloader",
        desc: "Extract and download any YouTube thumbnail in 4K.",
        link: "/tools/youtube-thumbnail-downloader",
    },
    {
        icon: "🏷️",
        title: "Tag Generator",
        desc: "Generate high-traffic SEO tags for discoverability.",
        link: "/tools/youtube-tag-generator",
    },
    {
        icon: "📝",
        title: "Title Generator",
        desc: "Synthesize high CTR clickbait titles.",
        link: "/tools/youtube-title-generator",
    },
    {
        icon: "📜",
        title: "Description Builder",
        desc: "Format perfectly optimized video descriptions.",
        link: "/tools/youtube-description-generator",
    },
    {
        icon: "🎨",
        title: "Thumbnail Suggester",
        desc: "AI-generated visual concepts for viral thumbnails.",
        link: "/tools/youtube-thumbnail-suggester",
    },
    {
        icon: "🗺️",
        title: "Strategy Builder",
        desc: "Actionable YouTube growth plan with psychology logic.",
        link: "/tools/youtube-strategy-builder",
    }
];

const RelatedYoutubeTools = ({ currentToolPath }) => {
    // Filter out the current tool and pick 3 other tools
    const relatedTools = youtubeToolsList
        .filter(tool => tool.link !== currentToolPath)
        .slice(0, 3);

    return (
        <section className="py-20 border-t border-gray-900 bg-black">
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-2xl font-bold text-white mb-8 text-center">Discover More YouTube Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {relatedTools.map((tool, index) => (
                        <Link to={tool.link} key={index} className="block group">
                            <div className="bg-gray-900 border border-[#ff0000]/10 p-6 rounded-xl h-full hover:bg-gray-800 transition-colors hover:border-[#ff0000]/30">
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

export default RelatedYoutubeTools;
