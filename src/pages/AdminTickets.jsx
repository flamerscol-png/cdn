import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllSupportRequests, updateSupportStatus } from '../utils/db';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import AdBanner from '../components/AdBanner';

const AdminTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, open, resolved
    const navigate = useNavigate();

    const ADMIN_EMAIL = 'informeryt0@gmail.com';

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user || user.email !== ADMIN_EMAIL) {
                console.warn("[Admin] Unauthorized access attempt", user?.email);
                navigate('/');
                return;
            }
            setAuthLoading(false);
            fetchTickets();
        });
        return () => unsubscribe();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const data = await getAllSupportRequests();
            setTickets(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (userId, ticketId, newStatus) => {
        try {
            await updateSupportStatus(userId, ticketId, newStatus);
            // Update local state
            setTickets(prev => prev.map(t => 
                (t.ticketId === ticketId && t.userId === userId) 
                ? { ...t, status: newStatus } 
                : t
            ));
        } catch (err) {
            alert(`Failed to update: ${err.message}`);
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (filter === 'all') return true;
        return t.status === filter;
    });

    const formatDate = (ts) => {
        return new Date(ts).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#ff4d00]/30">
            <SEOHead title="Admin Tickets Panel" description="Manage user support requests." />
            <Navbar />
            
            <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
                {authLoading ? (
                    <div className="flex justify-center py-40">
                        <div className="w-12 h-12 border-4 border-[#ff4d00]/20 border-t-[#ff4d00] rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        <AdBanner size="leaderboard" className="mb-12" />
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-3xl font-black mb-2 italic uppercase tracking-tighter">Support <span className="text-[#ff4d00]">Tickets</span></h1>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Total Claims: {tickets.length}</p>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                        {['all', 'open', 'resolved'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                    filter === f ? 'bg-[#ff4d00] text-white' : 'text-gray-500 hover:text-white'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-[#ff4d00]/20 border-t-[#ff4d00] rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="p-8 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-2xl text-center">
                        ⚠️ Error: {error}
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-20 text-center bg-white/5 border border-dashed border-white/10 rounded-3xl">
                        <p className="text-gray-600 font-black uppercase tracking-widest">No tickets match this filter</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredTickets.map((ticket) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={ticket.ticketId}
                                className={`modrinth-card p-6 border-white/5 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden ${
                                    ticket.status === 'resolved' ? 'opacity-60' : ''
                                }`}
                            >
                                {/* Status Glow */}
                                {ticket.status === 'open' && (
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff4d00]/5 blur-3xl pointer-events-none" />
                                )}

                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                            ticket.status === 'open' ? 'bg-[#ff4d00]/20 text-[#ff4d00]' : 'bg-gray-800 text-gray-500'
                                        }`}>
                                            {ticket.status}
                                        </div>
                                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{formatDate(ticket.submittedAt)}</span>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-black text-white leading-tight">{ticket.type}</h3>
                                        <p className="text-gray-500 text-xs font-bold">{ticket.email}</p>
                                    </div>

                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <p className="text-sm text-gray-300 font-medium leading-relaxed whitespace-pre-wrap">
                                            {ticket.details}
                                        </p>
                                    </div>

                                    {ticket.transactionId && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Ref:</span>
                                            <code className="text-[10px] font-bold text-[#ff4d00] bg-[#ff4d00]/5 px-2 py-0.5 rounded border border-[#ff4d00]/10">
                                                {ticket.transactionId}
                                            </code>
                                        </div>
                                    )}

                                    {/* Link for logic of base64 image if exists */}
                                    {ticket.proofImageUrl && (
                                        <div className="pt-2">
                                            <p className="text-[10px] font-black text-gray-600 uppercase mb-2">Attached Proof:</p>
                                            <img 
                                                src={ticket.proofImageUrl} 
                                                alt="Proof" 
                                                className="w-48 h-auto rounded-xl border border-white/10 hover:scale-105 transition-transform cursor-zoom-in"
                                                onClick={() => window.open(ticket.proofImageUrl, '_blank')}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2 w-full md:w-auto">
                                    {ticket.status === 'open' ? (
                                        <button
                                            onClick={() => handleStatusUpdate(ticket.userId, ticket.ticketId, 'resolved')}
                                            className="px-6 py-3 bg-[#ff4d00] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all text-center"
                                        >
                                            Mark Resolved
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleStatusUpdate(ticket.userId, ticket.ticketId, 'open')}
                                            className="px-6 py-3 bg-white/5 border border-white/10 text-gray-400 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-white/10 active:scale-95 transition-all text-center"
                                        >
                                            Re-open
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
                </>
            )}
            </main>
            <Footer />
        </div>
    );
};

export default AdminTickets;
