import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import GlobalSidebar from './components/GlobalSidebar';
import PromoPopup from './components/PromoPopup';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import EarnCoal from './pages/EarnCoal';

import KeywordResearch from './pages/tools/KeywordResearch';
import SiteAuditor from './pages/tools/SiteAuditor';
import BlogWriter from './pages/tools/BlogWriter';


import YoutubeThumbnailDownloader from './pages/tools/YoutubeThumbnailDownloader';
import YoutubeTagGenerator from './pages/tools/YoutubeTagGenerator';
import YoutubeTitleGenerator from './pages/tools/YoutubeTitleGenerator';
import YoutubeDescriptionGenerator from './pages/tools/YoutubeDescriptionGenerator';
import YoutubeStrategyBuilder from './pages/tools/YoutubeStrategyBuilder';
import ThumbnailGen from './pages/tools/ThumbnailGen';

import ComingSoon from './pages/ComingSoon';
import BlogList from './pages/BlogList';
import BlogPost from './pages/BlogPost';
import SeoTools from './pages/SeoTools';
import YoutubeTools from './pages/YoutubeTools';
import Pricing from './pages/Pricing';
import Calculators from './pages/Calculators';
import Converters from './pages/Converters';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Support from './pages/Support';
import AdminTickets from './pages/AdminTickets';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-[#050505] font-sans text-white selection:bg-[#ff4d00]/30">
        <PromoPopup />
        <Navbar />
        
        {/* Main Layout Wrapper */}
        <div className="flex flex-1 w-full max-w-[1920px] mx-auto relative">
          
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 flex flex-col">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/earn-coal" element={<EarnCoal />} />

              {/* SEO Tools */}
              <Route path="/seo-tools" element={<SeoTools />} />
              <Route path="/youtube-tools" element={<YoutubeTools />} />
              <Route path="/tools/keyword-research" element={<KeywordResearch />} />
              <Route path="/tools/site-auditor" element={<SiteAuditor />} />
              <Route path="/tools/blog-writer" element={<BlogWriter />} />


              {/* YouTube Tools */}
              <Route path="/tools/youtube-thumbnail-downloader" element={<YoutubeThumbnailDownloader />} />
              <Route path="/tools/youtube-tag-generator" element={<YoutubeTagGenerator />} />
              <Route path="/tools/youtube-title-generator" element={<YoutubeTitleGenerator />} />
              <Route path="/tools/youtube-description-generator" element={<YoutubeDescriptionGenerator />} />
              <Route path="/tools/youtube-strategy-builder" element={<YoutubeStrategyBuilder />} />
              <Route path="/tools/youtube-thumbnail-suggester" element={<ThumbnailGen />} />

              {/* Business & Utility */}
              <Route path="/calculators" element={<Calculators />} />
              <Route path="/converters" element={<Converters />} />

              {/* Info & Legal */}
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/support" element={<Support />} />
              <Route path="/admin/tickets" element={<AdminTickets />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          
          {/* Right Sidebar (Visible on xl+ screens) */}
          <GlobalSidebar />
          
        </div>
      </div>
    </Router>
  );
}

export default App;
