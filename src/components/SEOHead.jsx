import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SEOHead = ({ title, description, schemaType = "WebSite", customSchema }) => {
    const location = useLocation();
    const baseUrl = "https://flamercoal.web.app";
    const currentUrl = `${baseUrl}${location.pathname}`;

    const defaultTitle = "FlameCoal | Elite SEO & YouTube Tools";
    const finalTitle = title ? `${title} | FlameCoal` : defaultTitle;
    const finalDescription = description || "Precision-engineered SEO tools and digital intelligence for experts. Boost your rankings, optimize videos, and scale your online presence.";

    useEffect(() => {
        // Update Title
        document.title = finalTitle;

        // Helper function for meta tags
        const updateMeta = (name, content, attribute = "name") => {
            if (!content) return;
            let meta = document.querySelector(`meta[${attribute}="${name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute(attribute, name);
                document.head.appendChild(meta);
            }
            meta.content = content;
        };

        // Standard Meta
        updateMeta('description', finalDescription);

        // Open Graph (OG)
        updateMeta('og:title', finalTitle, 'property');
        updateMeta('og:description', finalDescription, 'property');
        updateMeta('og:url', currentUrl, 'property');
        updateMeta('og:type', 'website', 'property');

        // Twitter Cards
        updateMeta('twitter:title', finalTitle);
        updateMeta('twitter:description', finalDescription);

        // --- Remove Canonical Link ---
        const existingCanonical = document.querySelector('link[rel="canonical"]');
        if (existingCanonical) {
            existingCanonical.remove();
        }

        // --- Inject JSON-LD Schema.org Structured Data ---
        let scriptSchema = document.querySelector('script[id="schema-org"]');
        if (!scriptSchema) {
            scriptSchema = document.createElement('script');
            scriptSchema.type = 'application/ld+json';
            scriptSchema.id = 'schema-org';
            document.head.appendChild(scriptSchema);
        }

        // Use custom schema if provided, else use default with dynamic type
        const finalSchemaData = customSchema ? customSchema : {
            "@context": "https://schema.org",
            "@type": schemaType,
            "name": title || "FlameCoal",
            "url": currentUrl,
            "description": finalDescription,
            "publisher": {
                "@type": "Organization",
                "name": "FlameCoal",
                "logo": {
                    "@type": "ImageObject",
                    "url": `${baseUrl}/favicon.svg`
                }
            }
        };

        scriptSchema.textContent = JSON.stringify(finalSchemaData);

    }, [finalTitle, finalDescription, currentUrl]);

    return null;
};

export default SEOHead;
