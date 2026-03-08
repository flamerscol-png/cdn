import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../utils/api';

const CryptoCheckout = ({ isOpen, onClose, plan, userEmail }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [payUrl, setPayUrl] = useState(null);
    const [error, setError] = useState(null);

    const handleCreateInvoice = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/payments/create-invoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: plan.price,
                    currency: 'USD',
                    description: `Plan: ${plan.name}`,
                    email: userEmail || ''
                })
            });

            const data = await response.json();
            if (data.success && data.payUrl) {
                setPayUrl(data.payUrl);
                // Redirect to Oxapay checkout
                window.location.href = data.payUrl;
            } else {
                throw new Error(data.details || 'Failed to create invoice');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setError('Could not initialize payment. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="modrinth-card max-w-lg w-full p-8 md:p-12 relative border-[#ff4d00]/20"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors p-2"
                    >
                        ✕
                    </button>

                    <div className="text-center">
                        <div className="flex items-center justify-center gap-3 mb-8">
                            <div className="p-2 bg-[#ff4d00]/10 rounded-lg">
                                <svg className="w-6 h-6 text-[#ff4d00]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <h2 className="text-2xl font-black text-white">Secure <span className="text-[#ff4d00]">Checkout</span></h2>
                        </div>

                        <div className="bg-[#121212]/50 border border-white/5 rounded-2xl p-6 mb-8">
                            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">Selected Plan</h3>
                            <div className="text-2xl font-black text-white mb-1">{plan.name}</div>
                            <div className="text-[#ff4d00] font-black text-xl">${plan.price}</div>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleCreateInvoice}
                            disabled={isSubmitting}
                            className="w-full py-4 bg-[#ff4d00] text-white font-black rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[#ff4d00]/20 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Initializing...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                    Pay with Crypto (OxaPay)
                                </>
                            )}
                        </button>

                        <p className="mt-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                            Powered by OxaPay. Your payment is secure and handled off-site. Credits will be added once the transaction is confirmed on the blockchain.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CryptoCheckout;
