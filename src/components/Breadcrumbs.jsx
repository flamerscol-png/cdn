import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaChevronRight } from 'react-icons/fa';

const Breadcrumbs = ({ items }) => {
    const BASE_URL = 'https://FlamerCoal.com'; // Adjust if needed

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": BASE_URL
            },
            ...items.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 2,
                "name": item.name,
                "item": item.path ? `${BASE_URL}${item.path}` : undefined
            })).filter(i => i.item)
        ]
    };

    return (
        <nav aria-label="breadcrumb" className="mb-6 relative z-10">
            <script type="application/ld+json">
                {JSON.stringify(breadcrumbSchema)}
            </script>
            <ol className="flex flex-wrap items-center gap-1 text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500">
                <li>
                    <Link to="/" className="flex items-center gap-1.5 hover:text-[#ff4d00] transition-colors">
                        <FaHome className="text-[11px]" /> HOME
                    </Link>
                </li>
                {items.map((item, index) => (
                    <React.Fragment key={index}>
                        <li><FaChevronRight className="text-[8px] text-gray-800" /></li>
                        <li>
                            {item.path ? (
                                <Link 
                                    to={item.path} 
                                    className="hover:text-[#ff4d00] transition-colors"
                                >
                                    {item.name}
                                </Link>
                            ) : (
                                <span className="text-gray-400">{item.name}</span>
                            )}
                        </li>
                    </React.Fragment>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
