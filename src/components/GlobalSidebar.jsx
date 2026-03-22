import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import PromoAd from './PromoAd';
import SlideAd from './SlideAd';

const GlobalSidebar = () => {
    const location = useLocation();
    
    // Check if we are on dashboard or tool pages where sidebar is most useful
    const isAppPage = location.pathname === '/dashboard' || location.pathname.includes('/tools/');

    return (
        <aside className="hidden xl:block w-[320px] 2xl:w-[360px] flex-shrink-0 border-l border-white/5 bg-[#0a0a0a]/30 backdrop-blur-md relative">
            <div className="sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto overflow-x-hidden p-6 scrollbar-hide flex flex-col gap-6">
                
                {/* Section 1: Video/Slide Ad */}
                <div className="w-full">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-[#ff4d00] mb-3">Sponsored ⚡</h5>
                    {/* We can use SlideAd here but tailored for a narrower space, 
                        or just pass a custom prop if needed. SlideAd is flexible. */}
                    <div className="transform scale-[0.85] origin-top-left w-[117%] mb-[-15%]">
                        <SlideAd className="!my-0" />
                    </div>
                </div>

                <hr className="border-white/5" />

                {/* Section 2: Rectangle Promo */}
                <div className="w-full flex justify-center">
                    <PromoAd variant="rectangle" className="!my-0" />
                </div>

                <hr className="border-white/5" />
                
                {/* Section 3: App Stats / Quick Links (if in app) */}
                {isAppPage && (
                    <div className="modrinth-card p-5 border-white/5 bg-black/40">
                        <h4 className="text-sm font-black text-white mb-4">Quick Shortcuts</h4>
                        <div className="space-y-2">
                            <Link to="/dashboard" className="block text-xs text-gray-400 hover:text-[#ff4d00] font-bold transition-colors py-1">Dashboard Overview</Link>
                            <Link to="/seo-tools" className="block text-xs text-gray-400 hover:text-[#ff4d00] font-bold transition-colors py-1">All SEO Tools</Link>
                            <Link to="/youtube-tools" className="block text-xs text-gray-400 hover:text-[#ff4d00] font-bold transition-colors py-1">All YouTube Tools</Link>
                            <Link to="/pricing" className="block text-xs text-gray-400 hover:text-[#ff4d00] font-bold transition-colors py-1">Upgrade Plan</Link>
                            <Link to="/support" className="block text-xs text-gray-400 hover:text-[#ff4d00] font-bold transition-colors py-1">Help & Support</Link>
                        </div>
                    </div>
                )}
                
                {/* Generic System Status */}
                {!isAppPage && (
                    <div className="modrinth-card p-5 border-white/5 bg-black/40">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <h4 className="text-sm font-black text-white">System Status</h4>
                        </div>
                        <p className="text-xs text-gray-500 font-bold">All systems operational.</p>
                        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-600 font-black uppercase tracking-widest">
                            <span>API</span>
                            <span className="text-green-500">99.9% Uptime</span>
                        </div>
                    </div>
                )}

                {/* Bottom Spacer wrapper for scrolling */}
                <div className="pb-8 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">FlameCoal Ads</span>
                </div>
            </div>
        </aside>
    );
};

export default GlobalSidebar;
