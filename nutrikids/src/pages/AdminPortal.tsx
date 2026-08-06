import { useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes } from 'react-router-dom';
import AdminLogin, { clearAdminToken, getAdminToken } from './AdminLogin';
import DataSources from './admin/DataSources';
import DataSourceDetail from './admin/DataSourceDetail';
import ScoringRules from './admin/ScoringRules';
import GuidelineDetail from './admin/GuidelineDetail';
import ScoringModels from './admin/ScoringModels';
import ModelDetail from './admin/ModelDetail';
import ScienceInsightsDesign from './admin/ScienceInsightsDesign';
import FoodAnalysisDoc from './admin/FoodAnalysisDoc';
import GrowthBenefitsDoc from './admin/GrowthBenefitsDoc';
import ParentGuideDoc from './admin/ParentGuideDoc';
import FeedbackStatsPage from './admin/FeedbackStats';

type Summary = { users: number; children: number; feedbacks: number; analyses: number };

const NAV_GROUPS = [
  { label: '运营', items: [['/admin', '运营概览'], ['/admin/feedback', '反馈统计']] },
  { label: '食品分析功能', items: [['/admin/food-analysis/technical', '01 · 食品评估'], ['/admin/food-analysis/growth-benefits', '02 · 成长益处'], ['/admin/food-analysis/parent-guide', '03 · 家长须知']] },
  { label: '参考资料', items: [['/admin/datasources', '权威数据源'], ['/admin/rules', '评分规则'], ['/admin/models', '评分模型']] },
  { label: '页面设计', items: [['/admin/science-insights', '科学洞察设计']] },
] as const;

function Overview({ summary }: { summary: Summary | null }) {
  const cards = summary ? [
    ['注册用户', summary.users], ['儿童档案', summary.children], ['食品分析', summary.analyses], ['用户反馈', summary.feedbacks],
  ] : [];
  return <div><h2 className="text-3xl font-bold">运营概览</h2><p className="mt-2 text-slate-500">查看 NutriKids 当前的核心数据。</p>{summary ? <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <article key={label as string} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-4xl font-bold">{value}</p></article>)}</div> : <p className="mt-8 text-slate-500">正在加载数据…</p>}</div>;
}

export default function AdminPortal() {
  const [authenticated, setAuthenticated] = useState(Boolean(getAdminToken()));
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    if (!authenticated) return;
    fetch('/api/admin/summary', { headers: { Authorization: `Bearer ${getAdminToken()}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('登录已失效');
        return response.json() as Promise<Summary>;
      })
      .then(setSummary)
      .catch(() => { clearAdminToken(); setAuthenticated(false); });
  }, [authenticated]);

  if (!authenticated) return <AdminLogin onSuccess={() => setAuthenticated(true)} />;

  return <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
    <aside className="h-screen w-64 shrink-0 overflow-y-auto bg-slate-950 px-4 py-6 text-white">
      <div className="px-3"><p className="text-xs font-semibold tracking-widest text-violet-300">NUTRIKIDS</p><h1 className="mt-1 text-xl font-bold">管理端</h1></div>
      <nav className="mt-8 space-y-6">{NAV_GROUPS.map((group) => <div key={group.label}><p className="mb-2 px-3 text-xs font-semibold text-slate-500">{group.label}</p><div className="space-y-1">{group.items.map(([path, label]) => <NavLink key={path} to={path} end={path === '/admin'} className={({ isActive }) => `block rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'bg-violet-600 font-semibold text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>{label}</NavLink>)}</div></div>)}</nav>
      <button onClick={() => { clearAdminToken(); setAuthenticated(false); }} className="mt-10 w-full rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">退出登录</button>
    </aside>
    <main className="h-screen min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10">
      <Routes>
        <Route index element={<Overview summary={summary} />} />
        <Route path="datasources" element={<DataSources />} />
        <Route path="datasources/:id" element={<DataSourceDetail />} />
        <Route path="food-analysis" element={<Navigate to="/admin/food-analysis/technical" replace />} />
        <Route path="food-analysis/technical" element={<FoodAnalysisDoc />} />
        <Route path="food-analysis/growth-benefits" element={<GrowthBenefitsDoc />} />
        <Route path="food-analysis/parent-guide" element={<ParentGuideDoc />} />
        <Route path="feedback" element={<FeedbackStatsPage />} />
        <Route path="rules" element={<ScoringRules />} />
        <Route path="rules/:id" element={<GuidelineDetail />} />
        <Route path="models" element={<ScoringModels />} />
        <Route path="models/:id" element={<ModelDetail />} />
        <Route path="science-insights" element={<ScienceInsightsDesign />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </main>
  </div>;
}
