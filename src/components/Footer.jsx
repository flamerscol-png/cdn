import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-[#050505] border-t border-white/5 text-gray-500 py-16 relative z-10 font-sans">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="md:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-6 group">
                            <div className="w-8 h-8 bg-[#ff4d00] rounded flex items-center justify-center">
                                <span className="text-white font-black text-xl leading-none">F</span>
                            </div>
                            <span className="text-lg font-bold tracking-tight text-white group-hover:text-[#ff4d00] transition-colors">
                                Flamers <span className="text-[#ff4d00]">Coal</span>
                            </span>
                        </Link>
                        <p className="text-sm font-medium leading-relaxed max-w-xs">
                            Elite search intelligence tools for digital creators and SEO professionals. Built for speed, precision, and privacy.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Product</h4>
                        <ul className="space-y-4 text-sm font-bold">
                            <li><Link to="/seo-tools" className="hover:text-white transition-colors">SEO Suite</Link></li>
                            <li><Link to="/calculators" className="hover:text-white transition-colors">Calculators</Link></li>
                            <li><Link to="/converters" className="hover:text-white transition-colors">Converters</Link></li>
                            <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Company</h4>
                        <ul className="space-y-4 text-sm font-bold">
                            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                            <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Connect</h4>
                        <ul className="space-y-4 text-sm font-bold">
                            <li className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                                <span>Follow on X</span>
                            </li>
                            <li className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                                <span>Support Desk</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-30">
                        &copy; {new Date().getFullYear()} Flamers Coal. All systems operational.
                    </div>
                    <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest">
                        <Link to="/privacy" className="hover:text-[#ff4d00]">Privacy</Link>
                        <Link to="/terms" className="hover:text-[#ff4d00]">Terms</Link>
                        <span className="text-[#ff4d00]/50">V2.0.4-BLAZE</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
