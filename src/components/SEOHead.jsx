import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SEOHead = ({ title, description, keywords, schemaType, customSchema, ogImage, ogType = "website", isTool = false }) => {
    const location = useLocation();
    const baseUrl = "https://flamercoal.web.app";
    const currentUrl = `${baseUrl}${location.pathname}`;

    const defaultTitle = "FlamerCoal | Elite SEO Intelligence & YouTube Growth Tools";
    const finalTitle = title ? `${title} | FlamerCoal` : defaultTitle;
    const finalDescription = description || "Precision-engineered SEO tools and digital intelligence for experts. Boost your rankings, optimize videos, and scale your online presence.";
    const finalImage = ogImage || `${baseUrl}/og-default.png`;
    const finalKeywords = keywords || "SEO tools, YouTube tools, keyword research, site auditor, FlamerCoal";

    // Organization base to be used in all schemas
    const organizationSchema = {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "FlamerCoal",
        "url": baseUrl,
        "logo": {
            "@type": "ImageObject",
            "url": `${baseUrl}/favicon.svg`
        }
    };

    // Tool Schema (SoftwareApplication)
    const toolSchema = isTool ? {
        "@type": "SoftwareApplication",
        "name": title || "FlamerCoal Tool",
        "applicationCategory": "SEOApplication",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "0.00",
            "priceCurrency": "USD"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "1240"
        }
    } : null;

    const finalSchemaData = customSchema ? (
        customSchema["@context"] ? customSchema : {
            "@context": "https://schema.org",
            "@graph": [
                organizationSchema,
                customSchema
            ]
        }
    ) : {
        "@context": "https://schema.org",
        "@graph": [
            organizationSchema,
            toolSchema,
            {
                "@type": schemaType || (isTool ? "SoftwareApplication" : "WebPage"),
                "name": title || "FlamerCoal",
                "url": currentUrl,
                "description": finalDescription,
                "publisher": { "@id": `${baseUrl}/#organization` }
            }
        ].filter(Boolean)
    };

    return (
        <Helmet>
            {/* Title & Description */}
            <title>{finalTitle}</title>
            <meta name="description" content={finalDescription} />
            <meta name="keywords" content={finalKeywords} />
            <meta name="author" content="FlamerCoal" />
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

            {/* Open Graph / Facebook */}
            <meta property="og:title" content={finalTitle} />
            <meta property="og:description" content={finalDescription} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:type" content={ogType} />
            <meta property="og:image" content={finalImage} />
            <meta property="og:image:width" content="1280" />
            <meta property="og:image:height" content="720" />
            <meta property="og:site_name" content="FlamerCoal" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={finalTitle} />
            <meta name="twitter:description" content={finalDescription} />
            <meta name="twitter:image" content={finalImage} />

            {/* Performance Hints */}
            <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
            <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://api.groq.com" />
            <link rel="dns-prefetch" href="https://api.codetabs.com" />

            {/* Structured Data (JSON-LD) */}
            <script type="application/ld+json">
                {JSON.stringify(finalSchemaData)}
            </script>
        </Helmet>
    );
};

export default SEOHead;
