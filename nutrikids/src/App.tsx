import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import Footer from './components/Footer';  // 加这行 import
import About from './pages/About';
import Support from './pages/Support';

export default function App() {
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
            <Route path="/admin" element={<ManagementLayout />}>
              <Route index element={<Navigate to="feedback-stats" replace />} />
              <Route path="feedback-stats" element={<FeedbackStats />} />
            </Route>
            <Route path="/dev-admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="datasources/nih-ods" replace />} />
              <Route path="datasources/:id" element={<DataSourceDetail />} />
              <Route path="rules/:id" element={<GuidelineDetail />} />
              <Route path="models/:id" element={<ModelDetail />} />
              <Route path="science-insights" element={<ScienceInsightsDesign />} />
              <Route path="feedback-stats" element={<FeedbackStats />} />
            </Route>
          </Routes>
        </main>
        <Footer />   {/* 加这行 */}
      </div>
    </BrowserRouter>
  );
}