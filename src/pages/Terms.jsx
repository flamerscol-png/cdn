import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import AdBanner from '../components/AdBanner';

const Terms = () => {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-[#ff4d00]/30">
            <SEOHead 
                title="Terms of Service" 
                description="Read the terms of service and usage guidelines for FlameCoal's SEO and YouTube tools." 
            />
            <Navbar />
            <main className="pt-32 pb-24 px-6 md:px-12 max-w-4xl mx-auto">
                <div className="mb-16">
                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">Terms of <span className="text-[#ff4d00]">Service.</span></h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Last Updated: October 2023</p>
                </div>

                <AdBanner size="leaderboard" className="mb-12" />

                <div className="prose prose-invert max-w-none space-y-12">
                    <section>
                        <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">1. Acceptance of Terms</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            By accessing or using Flamerscoal, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, you may not access or use the application.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">2. Use of Services</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            Our tools are provided for professional SEO and digital marketing analysis. You agree not to use the services for any unlawful purpose or to conduct automated high-frequency scraping of our systems beyond the limits allowed by your plan level.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">3. Account Responsibility</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            You are responsible for maintaining the confidentiality of your account credentials. Any activities that occur under your account are your sole responsibility.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">4. Payment & Refunds</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            Payments for subscriptions are made on a pre-paid basis. For Non-KYC Crypto payments, verification may take 2-24 hours. Due to the nature of digital credits and data access, refunds are generally not provided once credits have been used.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">5. Limitation of Liability</h2>
                        <p className="text-gray-400 leading-relaxed font-medium">
                            Flamerscoal is provided "as is" without warranties of any kind. We are not liable for any direct or indirect damages resulting from the use of our optimization tools or the data generated.
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Terms;
