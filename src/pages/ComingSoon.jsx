import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const ComingSoon = ({ title }) => {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
            {/* Background Gradient Mesh */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/50 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/50 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10"
            >
                <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-100 via-gray-400 to-gray-600 bg-clip-text text-transparent">
                    {title || "Coming Soon"}
                </h1>
                <p className="text-xl text-gray-400 mb-8 max-w-lg mx-auto">
                    We are working hard to bring you this feature. Stay tuned for updates!
                </p>
                <Link to="/" className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">
                    Back to Home
                </Link>
            </motion.div>
        </div>
    );
};

export default ComingSoon;
