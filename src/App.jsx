import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import EarnCoal from './pages/EarnCoal';

import KeywordResearch from './pages/tools/KeywordResearch';
import SiteAuditor from './pages/tools/SiteAuditor';
import BlogWriter from './pages/tools/BlogWriter';
import PositionTracker from './pages/tools/PositionTracker';
import BacklinkMonitor from './pages/tools/BacklinkMonitor';
import AuthorityChecker from './pages/tools/AuthorityChecker';

import YoutubeThumbnailDownloader from './pages/tools/YoutubeThumbnailDownloader';
import YoutubeTagGenerator from './pages/tools/YoutubeTagGenerator';
import YoutubeTitleGenerator from './pages/tools/YoutubeTitleGenerator';
import YoutubeDescriptionGenerator from './pages/tools/YoutubeDescriptionGenerator';
import YoutubeStrategyBuilder from './pages/tools/YoutubeStrategyBuilder';

import ComingSoon from './pages/ComingSoon';
import SeoTools from './pages/SeoTools';
import YoutubeTools from './pages/YoutubeTools';
import Pricing from './pages/Pricing';
import Calculators from './pages/Calculators';
import Converters from './pages/Converters';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

function App() {
  return (
    <Router>
      <Navbar />
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
        <Route path="/tools/position-tracker" element={<PositionTracker />} />
        <Route path="/tools/backlink-monitor" element={<BacklinkMonitor />} />
        <Route path="/tools/authority-checker" element={<AuthorityChecker />} />

        {/* YouTube Tools */}
        <Route path="/tools/youtube-thumbnail-downloader" element={<YoutubeThumbnailDownloader />} />
        <Route path="/tools/youtube-tag-generator" element={<YoutubeTagGenerator />} />
        <Route path="/tools/youtube-title-generator" element={<YoutubeTitleGenerator />} />
        <Route path="/tools/youtube-description-generator" element={<YoutubeDescriptionGenerator />} />
        <Route path="/tools/youtube-strategy-builder" element={<YoutubeStrategyBuilder />} />

        {/* Business & Utility */}
        <Route path="/calculators" element={<Calculators />} />
        <Route path="/converters" element={<Converters />} />

        {/* Info & Legal */}
        <Route path="/blog" element={<ComingSoon title="Our Blog" />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </Router>
  );
}

export default App;
