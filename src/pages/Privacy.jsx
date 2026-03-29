import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import AdBanner from '../components/AdBanner';

const Privacy = () => {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-[#ff4d00]/30">
            <SEOHead 
                title="Privacy Policy" 
                description="Learn how FlamerCoal collects, uses, and protects your data while providing elite SEO intelligence." 
            />
            <Navbar />
            <main className="pt-32 pb-24 px-6 md:px-12 max-w-4xl mx-auto">
                <div className="mb-16">
                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">Privacy <span className="text-[#ff4d00]">Policy.</span></h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Last Updated: October 2023</p>
                </div>

                <AdBanner size="leaderboard" className="mb-12" />

                <div className="prose prose-invert max-w-none space-y-12">
                    <section>
                        <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">1. Data Collection</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            FlamerCoal collects minimal personal information required to provide our SEO and digital intelligence services. This includes your email address for account management and payment status tracking. We do not sell or share your personal data with third parties for marketing purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">2. Tool Usage & Logs</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            When you use our Site Auditor, or other tools, we may log the URLs and keywords you analyze to improve tool accuracy and prevent abuse of our API resources. This data is stored securely and is not publicly accessible.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">3. Cookies</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            We use essential cookies for authentication and performance optimization. These cookies ensure that you stay logged into your account and that the application settings are preserved across sessions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">4. Security</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            We implement industry-standard security measures to protect your account and data. Our payment flows (including Non-KYC Crypto) are designed to minimize the collection of sensitive financial information on our servers.
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Privacy;
