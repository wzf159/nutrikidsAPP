import { AnalysisTabs, DataTable, Formula, InfoCard, PageHero, Section } from './FoodAnalysisDoc';

export default function GrowthBenefitsDoc() {
  return <div className="mx-auto max-w-6xl">
    <AnalysisTabs />
    <PageHero index="02" title="成长益处：从营养值到目标支持度" subtitle="成长益处不是用“含有某营养素”就直接加分，而是先把产品与同类食品的营养分布比较，再按孩子的年龄、性别与成长目标加权。页面展示值还会加入证据覆盖率，避免一个营养素支撑所有目标。" accent="blue" />

    <Section eyebrow="REFERENCE MODEL" title="三张参考表决定个性化">
      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="目标—营养素映射" tone="blue"><code>nutrient_goal_mapping.json</code> 按 6 个年龄段、男女与 8 个成长目标列出可用营养素，并给每个目标 1–3 的权重。</InfoCard>
        <InfoCard title="同类食品分位数" tone="violet"><code>category_nutrition_stats.json</code> 保存 OFF 食品分类下各营养素的 p10、p90 与样本数，比较口径为每 100g。</InfoCard>
        <InfoCard title="权重总和" tone="emerald"><code>age_gender_weight_summary.json</code> 保存每个年龄×性别组合的目标权重总和，用于 DevScore 归一化。</InfoCard>
      </div>
    </Section>

    <Section eyebrow="ALGORITHM" title="单个成长目标如何计算">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div><p className="font-bold text-slate-900">① 找同类区间</p><p className="mt-1 text-sm leading-6 text-slate-600">遍历产品的全部 <code>categories_tags</code>。对某营养素收集每个分类可用的 p10 与 p90，分别取中位数：<code>L = median(p10)</code>，<code>U = median(p90)</code>。当前版本不做分类树父级回溯。</p></div>
        <div><p className="font-bold text-slate-900">② 把每个营养素归一化</p><Formula>sⱼ = clip((xⱼ − Lⱼ) / (Uⱼ − Lⱼ), 0, 1)</Formula><p className="mt-2 text-sm text-slate-500"><code>xⱼ</code> 是产品每 100g 值。若 <code>U = L</code>，则 x ≥ L 记 1，否则记 0。产品值或统计区间缺失时，该营养素直接跳过。</p></div>
        <div><p className="font-bold text-slate-900">③ 合并为目标分</p><Formula>GoalScoreᵢ = min(1, Σ sⱼ)</Formula><p className="mt-2 text-sm text-slate-500">同一目标下营养素贡献相加，上限为 1。</p></div>
        <div><p className="font-bold text-slate-900">④ 合并为成长分</p><Formula>DevScore = Σ(GoalScoreᵢ × weightᵢ) / Σ weightᵢ</Formula><p className="mt-2 text-sm text-slate-500">权重由年龄段与性别决定；DevScore 只在 Nutri-Score A/B 总分分支中使用。</p></div>
      </div>
    </Section>

    <Section eyebrow="UI CALCULATION" title="页面上的“支持度”为什么不等于 DevScore">
      <div className="grid gap-5 lg:grid-cols-2">
        <InfoCard title="支持度百分比" tone="blue">
          <Formula>coverage = min(1, 证据数 / min(映射数, 3))<br />supportDV = round(GoalScore × coverage × 100)</Formula>
          <p className="mt-3">“证据”指映射营养素每份 %DV ≥ 5，或至少有大于 0 的每 100g 值。覆盖率要求最多 3 项证据，防止单项高分造成夸大。</p>
        </InfoCard>
        <InfoCard title="Core / Important / Supporting 标签" tone="violet">
          标签不是由支持度阈值临时生成，而是读取代码中的 <code>DEV_TIERS</code>：成长目标 × 年龄段 × 性别的预设重要性。只有孩子已选择的目标才显示标签；不适用组合返回空。
        </InfoCard>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600"><b className="text-slate-900">营养流向线：</b>只连接孩子已选目标与页面前 6 个正向营养素；营养素需 %DV &gt; 0。线宽值取四舍五入后的 %DV。糖、添加糖、能量、饱和脂肪和钠不进入正向营养素前 6 名。</div>
    </Section>

    <Section eyebrow="REPLAYABLE CASE" title="案例：4–8 岁女孩的骨骼支持度">
      <DataTable headers={['营养素', '产品 x（每100g）', '分类 p10 中位数 L', '分类 p90 中位数 U', 'sⱼ']} rows={[
        ['钙', '180 mg', '80 mg', '280 mg', <code>clip((180−80)/(280−80)) = 0.50</code>],
        ['维生素 D', '2.0 μg', '0.5 μg', '3.5 μg', <code>clip((2.0−0.5)/(3.5−0.5)) = 0.50</code>],
        ['磷', '数据缺失', '—', '—', '跳过'],
      ]} />
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <InfoCard title="目标分" tone="emerald"><code>GoalScore = min(1, 0.50 + 0.50) = 1.00</code></InfoCard>
        <InfoCard title="证据覆盖率" tone="blue">骨骼映射 7 项，本产品有钙、维生素 D 两项有效证据：<code>2 / min(7,3) = 0.667</code></InfoCard>
        <InfoCard title="页面支持度" tone="violet"><code>round(1.00 × 0.667 × 100) = 67%</code></InfoCard>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-400">以上数值用于演示公式复算；实际 L/U 来自产品所有 OFF 分类对应统计的中位数。</p>
    </Section>

    <Section eyebrow="GOAL MAP" title="8 个目标当前映射哪些营养素">
      <DataTable headers={['目标', '用于页面证据与流向的营养素']} rows={[
        ['大脑发育', 'DHA、胆碱、铁、叶酸、维生素 B12/B6、锌、碘'],
        ['骨骼发育', '钙、维生素 D、磷、镁、蛋白质、维生素 K、锌'],
        ['心脏成长', '膳食纤维、钾、镁、DHA'],
        ['肌肉发育', '蛋白质、铁、锌、维生素 D、镁、碳水化合物、钾、肌酸'],
        ['免疫发育', '维生素 A/C/D、锌、铁、蛋白质、硒、DHA'],
        ['肠道发育', '膳食纤维、镁、钾、碳水化合物、维生素 D、锌'],
        ['视力发育', '维生素 A、DHA、锌、维生素 E、叶黄素'],
        ['牙齿发育', '钙、维生素 D、磷、维生素 C、镁、氟'],
      ]} />
    </Section>
  </div>;
}
