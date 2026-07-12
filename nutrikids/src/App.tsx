import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './lib/auth';
import TopNav from './components/E1_Layout/TopNav';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import FoodAnalyzer from './pages/FoodAnalyzer';
import ScienceInsights from './pages/ScienceInsights';
import GrowthProfile from './pages/GrowthProfile';
import Feedback from './pages/Feedback';
import FoodFactVisualization from './pages/FoodFactVisualization';
import ManagementLayout from './pages/admin/ManagementLayout';
import AdminLayout from './pages/admin/AdminLayout';
import DataSourceDetail from './pages/admin/DataSourceDetail';
import GuidelineDetail from './pages/admin/GuidelineDetail';
import ModelDetail from './pages/admin/ModelDetail';
import ScienceInsightsDesign from './pages/admin/ScienceInsightsDesign';
import FeedbackStats from './pages/admin/FeedbackStats';
import Footer from './components/Footer';
import About from './pages/About';
import Support from './pages/Support';
import Login from './pages/Login';

export default function App() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#d8ccf5] via-[#e8ccec] to-[#f5cce0]">
        <div className="text-2xl animate-pulse">🥦</div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/food-analyzer" element={<FoodAnalyzer />} />
            <Route path="/science-insights" element={<ScienceInsights />} />
            <Route path="/growth-profile" element={<GrowthProfile />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/food-fact" element={<FoodFactVisualization />} />
            <Route path="/support" element={<Support />} />
            <Route path="/about" element={<About />} />
           
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}