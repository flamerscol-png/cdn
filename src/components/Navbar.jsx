import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, database } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

const Navbar = () => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        let unsubscribeData;
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Fetch user specific coal balance (powers)
                const userRef = ref(database, `users/${currentUser.uid}`);
                unsubscribeData = onValue(userRef, (snapshot) => {
                    if (snapshot.exists()) {
                        setUserData(snapshot.val());
                        console.log("[Navbar] Balance updated:", snapshot.val().powers);
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

        window.addEventListener('scroll', handleScroll);
        return () => {
            unsubscribeAuth();
            if (unsubscribeData) unsubscribeData();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };

    const isAppPage = location.pathname.startsWith('/tools');

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled || isAppPage || location.pathname === '/dashboard' ? 'bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5' : 'bg-transparent border-b border-transparent'} px-4 md:px-8 py-3.5`}>
            <div className="max-w-7xl mx-auto flex justify-between items-center">

                {/* Logo & Brand */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="w-8 h-8 bg-[#ff4d00] rounded-lg flex items-center justify-center shadow-lg shadow-[#ff4d00]/20 group-hover:scale-110 transition-transform">
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
                    {['Home', 'SEO Tools', 'YouTube Tools', 'Pricing', 'Earn Coal', 'Blog'].map((item) => (
                        <Link
                            key={item}
                            to={item === 'Home' ? '/' : (item === 'SEO Tools' ? '/seo-tools' : (item === 'YouTube Tools' ? '/youtube-tools' : (item === 'Earn Coal' ? '/earn-coal' : `/${item.toLowerCase().replace(' ', '-')}`)))}
                            className={`px-3 py-2 text-sm font-medium transition-all rounded-lg ${location.pathname === (item === 'Home' ? '/' : item === 'SEO Tools' ? '/seo-tools' : item === 'YouTube Tools' ? '/youtube-tools' : item === 'Earn Coal' ? '/earn-coal' : `/${item.toLowerCase().replace(' ', '-')}`) ? 'text-[#ff4d00] bg-[#ff4d00]/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
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
                                    Go to Dashboard
                                </Link>
                            )}
                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#ff4d00]/10 border border-[#ff4d00]/20 text-[#ff4d00] font-black text-xs mr-2 shadow-sm shadow-[#ff4d00]/5">
                                <span className="text-sm">🔥</span>
                                <span>{userData?.powers || 0}</span>
                            </div>
                            <div className="h-8 w-[1px] bg-white/10 hidden sm:block mx-2" />
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-all uppercase tracking-wider"
                            >
                                Log Out
                            </button>
                            <div className="w-8 h-8 rounded-full bg-[#121212] border border-white/10 flex items-center justify-center text-xs font-bold text-[#ff4d00] shadow-inner">
                                {user.email ? user.email[0].toUpperCase() : 'U'}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                                Log In
                            </Link>
                            <Link to="/signup" className="px-5 py-2.5 text-sm font-bold bg-[#ff4d00] text-white rounded-lg hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-[#ff4d00]/20">
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
