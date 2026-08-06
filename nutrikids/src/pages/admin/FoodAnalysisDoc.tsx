/* eslint-disable react-refresh/only-export-components -- documentation pages share a small, colocated visual vocabulary */
import { NavLink } from 'react-router-dom';

type Tone = 'violet' | 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';

const toneStyles: Record<Tone, string> = {
  violet: 'border-violet-200 bg-violet-50 text-violet-950',
  blue: 'border-blue-200 bg-blue-50 text-blue-950',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  amber: 'border-amber-200 bg-amber-50 text-amber-950',
  rose: 'border-rose-200 bg-rose-50 text-rose-950',
  slate: 'border-slate-200 bg-slate-50 text-slate-950',
};

export const analysisTabs = [
  { to: '/admin/food-analysis/technical', label: '食品评估', no: '01' },
  { to: '/admin/food-analysis/growth-benefits', label: '成长益处', no: '02' },
  { to: '/admin/food-analysis/parent-guide', label: '家长须知', no: '03' },
] as const;

export function AnalysisTabs() {
  return <nav className="mb-7 grid gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-3">
    {analysisTabs.map((tab) => <NavLink key={tab.to} to={tab.to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${isActive ? 'bg-violet-600 font-semibold text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
      <span className="text-xs opacity-70">{tab.no}</span><span>{tab.label}</span>
    </NavLink>)}
  </nav>;
}

export function PageHero({ index, title, subtitle, accent = 'violet' }: { index: string; title: string; subtitle: string; accent?: Tone }) {
  const gradients: Record<Tone, string> = {
    violet: 'from-violet-700 via-purple-700 to-fuchsia-600',
    blue: 'from-blue-700 via-indigo-700 to-violet-700',
    emerald: 'from-emerald-700 via-teal-700 to-cyan-700',
    amber: 'from-amber-600 via-orange-600 to-rose-600',
    rose: 'from-rose-700 via-pink-700 to-violet-700',
    slate: 'from-slate-800 via-slate-700 to-slate-600',
  };
  return <header className={`rounded-3xl bg-gradient-to-br ${gradients[accent]} p-7 text-white shadow-lg md:p-10`}>
    <p className="text-xs font-bold tracking-[0.22em] text-white/70">食品分析算法 · {index}</p>
    <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
    <p className="mt-4 max-w-3xl text-sm leading-7 text-white/80 md:text-base">{subtitle}</p>
  </header>;
}

export function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="mt-10">
    <p className="text-xs font-bold tracking-[0.18em] text-violet-600">{eyebrow}</p>
    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
    <div className="mt-5">{children}</div>
  </section>;
}

export function InfoCard({ title, children, tone = 'slate' }: { title: string; children: React.ReactNode; tone?: Tone }) {
  return <article className={`rounded-2xl border p-5 ${toneStyles[tone]}`}>
    <h3 className="font-bold">{title}</h3>
    <div className="mt-2 text-sm leading-6 opacity-80">{children}</div>
  </article>;
}

export function Formula({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-2xl bg-slate-950 px-5 py-4 font-mono text-sm leading-7 text-emerald-300 shadow-inner">{children}</div>;
}

export function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
    <table className="w-full min-w-[680px] text-left text-sm">
      <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500"><tr>{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100 text-slate-600">{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 align-top leading-6">{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

function Step({ number, title, detail }: { number: string; title: string; detail: React.ReactNode }) {
  return <div className="flex gap-4">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">{number}</div>
    <div><h3 className="font-bold text-slate-900">{title}</h3><div className="mt-1 text-sm leading-6 text-slate-600">{detail}</div></div>
  </div>;
}

export default function FoodAnalysisDoc() {
  return <div className="mx-auto max-w-6xl">
    <AnalysisTabs />
    <PageHero index="01" title="食品评估：总分到底怎么算" subtitle="这一页只解释最终 0–100 分、等级与过敏推荐结论。公式与当前服务端 scoring.ts 保持一致；旧版“40% 营养密度 + 30% 风险成分 + 20% 加工程度 + 10% 阶段匹配”仅作为页面摘要字段，不再冒充最终总分公式。" />

    <Section eyebrow="INPUT" title="评分实际读取的字段">
      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="产品营养事实" tone="blue">Nutri-Score 原始分与等级、每 100g 营养值、商品分类标签、添加剂标签、NOVA、每份大小和过敏原。</InfoCard>
        <InfoCard title="儿童档案" tone="violet">年龄段、性别、已选择的成长目标、重点营养素与过敏原。年龄和性别会改变成长权重与提醒阈值。</InfoCard>
        <InfoCard title="参考数据" tone="emerald">同类食品营养分布、年龄/性别/目标权重、目标—营养素映射，以及 ANSES/EFSA 有害添加剂标签集合。</InfoCard>
      </div>
    </Section>

    <Section eyebrow="CORE FORMULA" title="两条总分分支">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold text-emerald-600">共同步骤</p>
          <h3 className="mt-1 text-lg font-bold">先标准化 Nutri-Score</h3>
          <Formula><span>NutriNorm = clip((55 − NutriScore原始分) / 72, 0, 1)</span></Formula>
          <p className="mt-3 text-sm leading-6 text-slate-500">原始分越低越好。缺少原始分，或等级不是 A–E 时，接口返回 422，不生成一个猜测分数。</p>
        </div>
        <div className="space-y-4">
          <InfoCard title="Nutri-Score 为 A / B：加入成长支持" tone="emerald"><Formula>总分 = 100 × (0.5 × NutriNorm + 0.5 × DevScore)</Formula></InfoCard>
          <InfoCard title="Nutri-Score 为 C / D / E：扣除添加剂风险" tone="rose"><Formula>总分 = max(0, 100 × (0.5 × NutriNorm − 0.5 × AdditiveScore))</Formula></InfoCard>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {[[80, 'Excellent', '80–100', 'bg-emerald-500'], [60, 'Good', '60–79', 'bg-blue-500'], [40, 'Fair', '40–59', 'bg-amber-500'], [0, 'Poor', '0–39', 'bg-rose-500']].map(([key, label, range, color]) => <div key={key} className="rounded-xl border border-slate-200 bg-white p-4"><span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} /><p className="mt-2 font-bold text-slate-900">{label}</p><p className="text-xs text-slate-500">{range} 分</p></div>)}
      </div>
    </Section>

    <Section eyebrow="SUB-SCORES" title="DevScore 与 AdditiveScore 的含义">
      <DataTable headers={['子分', '范围', '计算口径', '何时进入总分']} rows={[
        [<code>DevScore</code>, '0–1', '各成长目标得分按儿童年龄与性别权重加权平均；具体见“成长益处”。', '仅 A / B 产品，以 50% 权重加分'],
        [<code>NutriNorm</code>, '0–1', '直接使用 Open Food Facts 提供的官方 Nutri-Score 原始分做线性换算。', '所有可评分产品，以 50% 权重进入'],
        [<code>AdditiveScore</code>, '0–1', '产品命中的有害添加剂去重数 ÷ 参考集合总数（当前 135 个标签）。', '仅 C / D / E 产品，以 50% 权重扣分'],
      ]} />
    </Section>

    <Section eyebrow="REPLAYABLE CASE" title="案例：一盒 Nutri-Score B 的谷物酸奶">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-5">
            <Step number="1" title="产品与孩子" detail={<>Nutri-Score 原始分为 <b>5</b>、等级 B；儿童档案为 4–8 岁女孩。成长算法算得 <code>DevScore = 0.72</code>。</>} />
            <Step number="2" title="标准化" detail={<><code>NutriNorm = (55 − 5) / 72 = 0.6944</code></>} />
            <Step number="3" title="走 A/B 分支" detail={<><code>100 × (0.5 × 0.6944 + 0.5 × 0.72) = 70.72</code></>} />
            <Step number="4" title="取整与分级" detail={<>数据库保存总分 <b>71</b>，对应 <b>Good</b>。</>} />
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-2xl bg-slate-950 p-7 text-white">
          <div><p className="text-xs font-bold tracking-widest text-slate-400">RESULT</p><p className="mt-4 text-7xl font-black">71</p><p className="mt-2 text-xl font-bold text-blue-300">GOOD</p></div>
          <p className="mt-8 text-sm leading-6 text-slate-400">若同一产品命中孩子的过敏原，总分仍可为 71，但推荐结论会独立改为“不推荐”。评分与安全否决不混为一个数字。</p>
        </div>
      </div>
    </Section>

    <Section eyebrow="DATA PROVENANCE" title="数据从哪里来">
      <DataTable headers={['数据', '主要来源', '本地落点 / 用途', '缺失时']} rows={[
        ['商品名、品牌、分类、营养、配料、添加剂、过敏原、NOVA、Nutri-Score', 'Open Food Facts 产品 API；已查询商品会缓存到本地 Product 及关联表', '形成产品事实，评分统一读取本地标准化字段', '可由 AI 兜底补全普通营养资料，但若最终没有 Nutri-Score 原始分与 A–E 等级，则不评分'],
        ['儿童年龄、性别、目标、重点营养素、过敏原', '用户创建的儿童档案', 'Child 及关联表；用于个性化权重、提醒和安全匹配', '缺少儿童档案不能发起个性化分析'],
        ['同类食品 p10 / p90', '基于 Open Food Facts 样本预计算的 category_nutrition_stats.json', '给 DevScore 做同类相对归一化', '该营养素跳过，不按 0 值惩罚'],
        ['有害添加剂集合', 'ANSES / EFSA 评估整理后的 harmful_additives_reference.json', 'C/D/E 分支的 AdditiveScore', '集合为空时 AdditiveScore 为 0'],
      ]} />
    </Section>

    <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900"><b>解释边界：</b>NutriKids 分数是食品资料与儿童档案的决策辅助结果，不是医学诊断，也不代表实际食用量、全天膳食结构或个体临床需求。</div>
  </div>;
}
