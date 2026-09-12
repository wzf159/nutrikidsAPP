import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { authClient, useSession } from './lib/auth';
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
import AdminPortal from './pages/AdminPortal';

export default function App() {
  return <BrowserRouter><Routes><Route path="/admin/*" element={<AdminPortal />} /><Route path="*" element={<ConsumerApp />} /></Routes></BrowserRouter>;
}

function ConsumerApp() {
  const { data: session, isPending, refetch } = useSession();
  const devBypassAuth =
    import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

  const guestStarted = useRef(false);
  const [guestFailed, setGuestFailed] = useState(false);

  // 不再要求登录：进站时静默创建游客（匿名）会话，用户直接进入「开始使用」界面。
  // 游客数据保存在服务端，之后在右上角菜单里用 Google 登录即可升级为正式账号。
  useEffect(() => {
    if (devBypassAuth || isPending || session || guestStarted.current) return;
    guestStarted.current = true;
    authClient.signIn.anonymous()
      .then(() => refetch())
      .catch(err => {
        console.error('游客会话创建失败', err);
        setGuestFailed(true);
      });
  }, [devBypassAuth, isPending, session, refetch]);

  if (!devBypassAuth && (isPending || !session)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#d8ccf5] via-[#e8ccec] to-[#f5cce0]">
        <div className="text-2xl animate-pulse">🥦</div>
        {guestFailed && (
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-full bg-white/80 text-sm font-bold text-[#893ce3] shadow-sm hover:bg-white transition"
          >
            ⟳ Retry
          </button>
        )}
      </div>
    );
  }

  return <AppLayout />;
}

function AppLayout() {
  const { pathname } = useLocation();
  // 注册（填写档案）页面不显示顶部导航栏：
  // 用户会点到暂不可用的功能入口，容易困惑
  const hideTopNav = pathname.startsWith('/onboarding');

  return (
      <div className="flex flex-col min-h-screen">
        {!hideTopNav && <TopNav />}
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
