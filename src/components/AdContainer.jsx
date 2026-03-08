import React from 'react';

const AdContainer = ({ slot = "default", className = "" }) => {
    // In production, this would be replaced by actual ad code (e.g., Google AdSense)
    // For now, it renders an invisible or subtle container based on the 'debug' prop
    // To see where ads will be, add ?debug_ads=true to the URL

    // Check if debug mode is on (client-side only)
    const debug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug_ads') === 'true';

    if (!debug) {
        // Return an empty div that takes up space only if needed, or remains hidden
        // For standard banner sizes, we might want to enforce min-height to prevent layout shift
        return <div className={`ad-slot-${slot} ${className}`} aria-hidden="true"></div>;
    }

    return (
        <div className={`border-2 border-dashed border-yellow-500/50 bg-yellow-500/10 flex items-center justify-center p-4 text-yellow-500 text-xs font-mono uppercase tracking-widest ${className}`}>
            AD SPACE: {slot}
        </div>
    );
};

export default AdContainer;
