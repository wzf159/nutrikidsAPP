import { useTranslation } from 'react-i18next';

interface ModelDoc {
  icon: string;
  name: string;
  badge: string;       // 推荐程度
  badgeColor: string;
  what: string;        // 是什么
  formula: string;     // 计算方式
  how: string;         // 在 NutriKids 中的使用方法
  pros: string;        // 优缺点
}

const MODELS_ZH: ModelDoc[] = [
  {
    icon: '🚦',
    name: 'Nutri-Score（欧洲营养评分）',
    badge: '推荐优先落地',
    badgeColor: 'bg-green-100 text-green-700',
    what: '法国主导、多个欧盟国家采用的食品正面标签体系，把食品分为 A（深绿）到 E（深红）五个等级，算法完全公开。',
    formula:
      '按每 100g 计算：负分项 N = 能量 + 糖 + 饱和脂肪 + 钠（各 0-10 分）；正分项 P = 蔬果坚果占比 + 膳食纤维 + 蛋白质（各 0-5 分）。总分 = N − P，-15~-1 为 A，0~2 为 B，3~10 为 C，11~18 为 D，≥19 为 E。',
    how: '在 server/src/scoring.ts 旁新建 nutriScore.ts 实现公开计分表（纯函数，营养表 → 等级），评分结果与 4 维个性化分并列展示：Nutri-Score 是"产品本身好坏"的客观分，4 维分是"对这个孩子合不合适"的个性化分。前端用 A-E 色条组件展示（绿→红）。',
    pros: '优点：算法公开、可复现、家长一眼能懂、有大量公开数据可校验。注意：它是成人通用模型，不分龄——这正是和我们个性化评分互补的地方。',
  },
  {
    icon: '📈',
    name: 'NRF 营养丰富指数（Nutrient Rich Food Index）',
    badge: '适合内部排序',
    badgeColor: 'bg-blue-100 text-blue-700',
    what: '学术界常用的营养密度模型，最常见的是 NRF9.3：9 种鼓励营养素（蛋白质、纤维、维 A/C/D/E、钙、铁、钾、镁）减去 3 种限制成分（添加糖、饱和脂肪、钠）。',
    formula:
      'NRF9.3 = Σ(9 种鼓励营养素占每日推荐量的百分比，单项封顶 100%) − Σ(3 种限制成分占每日上限的百分比)，通常按每 100 kcal 归一化。',
    how: '关键点：公式里的"每日推荐量"直接换成 NIH ODS 的分龄 RDA 表，就得到一个分龄版 NRF——这是我们个性化评分的理想骨架。用于：① 搜索结果按营养密度排序；② 同类产品横向对比（"这款饼干比那款营养密度高 40%"）。',
    pros: '优点：连续数值、适合排序和对比、可注入分龄 RDA。注意：对家长不直观，建议只做内部计算，前端转译成对比性文案而不直接展示分数。',
  },
  {
    icon: '✅',
    name: 'FDA Healthy 声称标准（FDA Healthy Claim Rule）',
    badge: '适合做徽章',
    badgeColor: 'bg-amber-100 text-amber-700',
    what: 'FDA 2024 年更新的"healthy"标签使用标准：产品必须含有一定量的基础食物组（蔬果、全谷物、乳制品、蛋白食品），同时添加糖、钠、饱和脂肪不超过每日限值的特定百分比。',
    formula:
      '两个条件同时满足：① 食物组当量达标（按品类不同，如谷物类需 ≥3/4 oz 全谷物当量）；② 限制成分达标（添加糖 ≤5% DV、钠 ≤10% DV、饱和脂肪 ≤5% DV，按品类略有不同）。',
    how: '实现成布尔判定函数 meetsFdaHealthy(product)，通过则在产品卡片上显示「✓ 符合 FDA Healthy 标准」徽章。不参与打分，只做资格认证型展示——和 Nutri-Score（等级）、NRF（排序）三者角色互不重叠。',
    pros: '优点：权威背书、二元判定简单清晰。注意：标准较严，大部分零食不会通过，徽章会比较稀有——这反而让它有区分度。',
  },
];

const MODELS_EN: ModelDoc[] = [
  {
    icon: '🚦',
    name: 'Nutri-Score (European front-of-pack label)',
    badge: 'Recommended first',
    badgeColor: 'bg-green-100 text-green-700',
    what: 'A front-of-pack labelling system led by France and adopted across the EU, grading foods from A (dark green) to E (dark red). The algorithm is fully public.',
    formula:
      'Per 100g: negative points N = energy + sugars + saturated fat + sodium (0-10 each); positive points P = fruit/veg/nut share + fibre + protein (0-5 each). Score = N − P; -15..-1 = A, 0..2 = B, 3..10 = C, 11..18 = D, ≥19 = E.',
    how: 'Implement the public scoring table as a pure function in nutriScore.ts next to server/src/scoring.ts (nutrition facts → grade). Show it alongside the 4-dimension personalised score: Nutri-Score is the objective "how good is this product" grade; the 4-dim score is "how suitable for this child". Render an A-E colour bar in the UI.',
    pros: 'Pros: public, reproducible, instantly readable by parents, lots of open data to validate against. Caveat: it is a general adult model with no age dimension — which is exactly what our personalised score adds.',
  },
  {
    icon: '📈',
    name: 'NRF (Nutrient Rich Food Index)',
    badge: 'For internal ranking',
    badgeColor: 'bg-blue-100 text-blue-700',
    what: 'The standard academic nutrient-density model. The common variant NRF9.3 scores 9 nutrients to encourage (protein, fibre, vitamins A/C/D/E, calcium, iron, potassium, magnesium) minus 3 to limit (added sugar, saturated fat, sodium).',
    formula:
      'NRF9.3 = Σ(% of daily value for 9 encouraged nutrients, capped at 100% each) − Σ(% of daily limit for 3 limited nutrients), usually normalised per 100 kcal.',
    how: 'Key move: replace the generic daily values with NIH ODS age-specific RDAs to get an age-aware NRF — the ideal skeleton for our personalised scoring. Use for: ① ranking search results by nutrient density; ② head-to-head product comparison ("40% more nutrient-dense than that one").',
    pros: 'Pros: continuous value, great for ranking and comparison, accepts age-specific RDAs. Caveat: not parent-friendly as a raw number — keep it internal and translate to comparative copy in the UI.',
  },
  {
    icon: '✅',
    name: 'FDA Healthy Claim Rule',
    badge: 'Badge logic',
    badgeColor: 'bg-amber-100 text-amber-700',
    what: 'FDA\'s 2024 updated criteria for using the "healthy" claim: a product must contain meaningful amounts of basic food groups (fruit/veg, whole grains, dairy, protein foods) while keeping added sugar, sodium and saturated fat under set shares of daily values.',
    formula:
      'Both conditions must hold: ① food-group equivalent met (e.g. grain products need ≥3/4 oz whole-grain equivalent); ② limits met (added sugar ≤5% DV, sodium ≤10% DV, saturated fat ≤5% DV, varying slightly by category).',
    how: 'Implement as a boolean meetsFdaHealthy(product); when true, show a "✓ Meets FDA Healthy" badge on the product card. It does not feed the score — it is a certification-style display, so the three models never overlap in role (grade / ranking / badge).',
    pros: 'Pros: authoritative, simple binary check. Caveat: strict — most snacks fail, so the badge is rare, which actually makes it meaningful.',
  },
];

export default function ScoringModels() {
  const { t, i18n } = useTranslation();
  const models = i18n.language.startsWith('zh') ? MODELS_ZH : MODELS_EN;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('admin.models.title')}</h1>
      <p className="text-sm text-gray-500 mb-6">{t('admin.models.subtitle')}</p>

      <div className="flex flex-col gap-4">
        {models.map((m) => (
          <div key={m.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="text-2xl">{m.icon}</span>
              <h2 className="font-semibold text-gray-800">{m.name}</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.badgeColor}`}>{m.badge}</span>
            </div>
            <dl className="grid gap-3 text-sm">
              <Row label={t('admin.models.what')} text={m.what} />
              <Row label={t('admin.models.formula')} text={m.formula} mono />
              <Row label={t('admin.models.how')} text={m.how} accent />
              <Row label={t('admin.models.pros')} text={m.pros} />
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, text, accent, mono }: { label: string; text: string; accent?: boolean; mono?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${accent ? 'bg-green-50/60' : 'bg-gray-50'}`}>
      <dt className={`text-xs font-semibold uppercase tracking-wider mb-1 ${accent ? 'text-green-600' : 'text-gray-400'}`}>
        {label}
      </dt>
      <dd className={`text-gray-600 leading-relaxed ${mono ? 'font-mono text-xs' : ''}`}>{text}</dd>
    </div>
  );
}
