import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, database } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

const Navbar = () => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    useEffect(() => {
        let unsubscribeData;
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userRef = ref(database, `users/${currentUser.uid}`);
                unsubscribeData = onValue(userRef, (snapshot) => {
                    if (snapshot.exists()) {
                        setUserData(snapshot.val());
                    }
                }, (error) => {
                    console.error("[Navbar] ❌ DB listener error:", error.message);
                });
            } else {
                setUserData(null);
            }
        });

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            unsubscribeAuth();
            if (unsubscribeData) unsubscribeData();
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        setDropdownOpen(false);
        await signOut(auth);
        navigate('/');
    };

    const isAppPage = location.pathname.startsWith('/tools');

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled || isAppPage || location.pathname === '/dashboard' ? 'bg-[#0a0a0a]/80 backdrop-blur-2xl border-b border-white/5 shadow-lg shadow-black/20' : 'bg-transparent border-b border-transparent'} px-4 md:px-8 py-3.5`}>
            <div className="max-w-7xl mx-auto flex justify-between items-center">

                {/* Logo & Brand */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-8 h-8 bg-[#ff4d00] rounded-lg flex items-center justify-center shadow-lg shadow-[#ff4d00]/20 group-hover:scale-110 group-hover:shadow-[#ff4d00]/40 transition-all duration-300">
                        <span className="text-white font-black text-xl leading-none">F</span>
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white hidden sm:block">
                        Flamers <span className="text-[#ff4d00]">Coal</span>
                    </span>
                    {(isAppPage || location.pathname === '/dashboard') && (
                        <span className="text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-gray-400 font-bold">
                            App
                        </span>
                    )}
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-1">
                    {['Home', 'SEO Tools', 'YouTube Tools', 'Pricing', 'Utilities', 'Earn Coal', 'Blog'].map((item) => (
                        <Link
                            key={item}
                            to={item === 'Home' ? '/' : (item === 'SEO Tools' ? '/seo-tools' : (item === 'YouTube Tools' ? '/youtube-tools' : (item === 'Earn Coal' ? '/earn-coal' : (item === 'Utilities' ? '/converters' : `/${item.toLowerCase().replace(' ', '-')}`))))}
                            className={`px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${location.pathname === (item === 'Home' ? '/' : item === 'SEO Tools' ? '/seo-tools' : item === 'YouTube Tools' ? '/youtube-tools' : item === 'Earn Coal' ? '/earn-coal' : item === 'Utilities' ? '/converters' : `/${item.toLowerCase().replace(' ', '-')}`) ? 'text-[#ff4d00] bg-[#ff4d00]/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            {item === 'Earn Coal' ? 'Free Coal 🔥' : item}
                        </Link>
                    ))}
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            {location.pathname !== '/dashboard' && (
                                <Link to="/dashboard" className="hidden lg:inline-block text-sm font-semibold text-gray-400 hover:text-white transition-colors mr-2">
                                    Dashboard
                                </Link>
                            )}
                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#ff4d00]/10 border border-[#ff4d00]/20 text-[#ff4d00] font-black text-xs mr-1 shadow-sm shadow-[#ff4d00]/5">
                                <span className="text-sm">🔥</span>
                                <span>{userData?.powers || 0}</span>
                            </div>

                            {/* User Avatar + Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className={`w-9 h-9 rounded-full bg-[#121212] border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 cursor-pointer ${dropdownOpen ? 'border-[#ff4d00] text-[#ff4d00] scale-105' : 'border-white/10 text-[#ff4d00] hover:border-[#ff4d00]/50'}`}
                                >
                                    {user.email ? user.email[0].toUpperCase() : 'U'}
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 top-full mt-3 w-64 bg-[#121212]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50"
                                         style={{ animation: 'fadeInDown 0.2s ease-out' }}>
                                        <div className="p-4 border-b border-white/5">
                                            <p className="text-sm font-black text-white truncate">{userData?.displayName || user.email.split('@')[0]}</p>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{userData?.plan || 'Free'} Plan</p>
                                        </div>
                                        <div className="p-2">
                                            <Link to="/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                                                <span className="text-base">📊</span> Dashboard
                                            </Link>
                                            <Link to="/support" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                                                <span className="text-base">🛡️</span> Support
                                            </Link>
                                            <Link to="/pricing" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                                                <span className="text-base">💎</span> Upgrade Plan
                                            </Link>
                                        </div>
                                        <div className="p-2 border-t border-white/5">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all"
                                            >
                                                <span className="text-base">🚪</span> Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                                Log In
                            </Link>
                            <Link to="/signup" className="px-5 py-2.5 text-sm font-bold bg-[#ff4d00] text-white rounded-xl hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-[#ff4d00]/20">
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
