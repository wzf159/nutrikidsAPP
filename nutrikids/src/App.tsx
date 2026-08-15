import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { useSession } from './lib/auth';
import TopNav from './components/E1_Layout/TopNav';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import FoodAnalyzer from './pages/FoodAnalyzer';
import ScienceInsights from './pages/ScienceInsights';
import GrowthProfile from './pages/GrowthProfile';
import Feedback from './pages/Feedback';
import FoodFactVisualization from './pages/FoodFactVisualization';
import Footer from './components/Footer';
import About from './pages/About';
import Support from './pages/Support';
import Login from './pages/Login';
import AdminPortal from './pages/AdminPortal';

export default function App() {
  return <BrowserRouter><Routes><Route path="/admin/*" element={<AdminPortal />} /><Route path="*" element={<ConsumerApp />} /></Routes></BrowserRouter>;
}

function ConsumerApp() {
  const { data: session, isPending } = useSession();
  const devBypassAuth =
    import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#d8ccf5] via-[#e8ccec] to-[#f5cce0]">
        <div className="text-2xl animate-pulse">🥦</div>
      </div>
    );
  }

  if (!session && !devBypassAuth) {
    return <Login />;
  }

  return (
      <div className="flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/label-profiler" element={<FoodAnalyzer />} />
            <Route path="/food-analyzer" element={<Navigate to="/label-profiler" replace />} />
            <Route path="/healthy-growth" element={<ScienceInsights />} />
            <Route path="/science-insights" element={<Navigate to="/healthy-growth" replace />} />
            <Route path="/growth-profile" element={<GrowthProfile />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/food-fact" element={<FoodFactVisualization />} />
            <Route path="/support" element={<Support />} />
            <Route path="/about" element={<About />} />
           
          </Routes>
        </main>
        <Footer />
      </div>
  );
}
