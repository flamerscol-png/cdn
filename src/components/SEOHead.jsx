import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SEOHead = ({ title, description, canonical }) => {
    const location = useLocation();
    const baseUrl = "https://flamerscoal.com";
    const currentUrl = `${baseUrl}${location.pathname}`;

    useEffect(() => {
        // Update Title
        document.title = title ? `${title} | Flamerscoal` : "Flamerscoal | Elite SEO Intelligence";

        // Update Description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = "description";
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = description || "Precision-engineered SEO tools and digital intelligence for experts.";

        // Update Canonical
        let linkCanonical = document.querySelector('link[rel="canonical"]');
        if (!linkCanonical) {
            linkCanonical = document.createElement('link');
            linkCanonical.rel = "canonical";
            document.head.appendChild(linkCanonical);
        }
        linkCanonical.href = canonical || currentUrl;

    }, [title, description, canonical, currentUrl]);

    return null;
};

export default SEOHead;
