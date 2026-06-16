import { useTranslation } from 'react-i18next';

interface RuleDoc {
  icon: string;
  name: string;
  org: string;
  what: string;   // 是什么
  rule: string;   // 在 NutriKids 中转化成什么规则
  how: string;    // 使用方法
}

const DOCS_ZH: RuleDoc[] = [
  {
    icon: '🌍',
    name: 'WHO 健康饮食指南（WHO Healthy Diet Guideline）',
    org: '世界卫生组织',
    what: '全球性健康饮食建议，核心阈值：游离糖 <10% 总能量（最好 <5%）、盐 <5g/天、脂肪 <30% 总能量、每天 ≥400g 蔬果。',
    rule: '作为糖、钠、脂肪的"警示线"基准：产品每 100g 含量换算成儿童每日能量占比，超过 WHO 阈值时打上「高糖」「高盐」「高脂」红色标签。',
    how: '在评分引擎（server/src/scoring.ts）的风险维度中读取产品营养表 → 与 WHO 阈值表比对 → 输出 0–3 个警示标签，每个标签按权重扣分。',
  },
  {
    icon: '🇺🇸',
    name: '美国膳食指南（Dietary Guidelines for Americans）',
    org: 'USDA + HHS',
    what: '美国官方膳食指南，按生命阶段（0-2 岁、2-8 岁、9-13 岁…）给出食物组推荐量和限制项，特别强调 2 岁以下不应添加糖。',
    rule: '提供"分龄差异"规则：同一产品对不同年龄孩子的评分不同。例如含添加糖的产品，对 0-2 岁档案直接评为「不推荐」，对 4-8 岁仅做扣分。',
    how: '孩子档案的年龄段字段（ageStage）→ 匹配对应年龄段的限制规则表 → 在评分时叠加年龄修正系数。',
  },
  {
    icon: '👶',
    name: 'AAP 儿童营养指导（AAP Nutrition Guidance）',
    org: '美国儿科学会',
    what: '儿科临床视角的饮食建议：果汁限量（1-3 岁 ≤120ml/天）、全脂/低脂奶切换年龄、铁和维生素 D 补充时机等。',
    rule: '转化为「发育目标 ↔ 营养素」映射：孩子档案勾选的发育目标（骨骼、大脑、免疫…）对应到关键营养素清单，产品含有对应营养素时加分。',
    how: '维护一张 goal → nutrients 映射表（已对应数据库 DevelopmentGoal / KeyNutrient 表），评分时统计产品覆盖了几个目标营养素。',
  },
  {
    icon: '⚠️',
    name: 'AAP 食品添加剂报告（AAP Food Additives Report）',
    org: '美国儿科学会',
    what: '点名儿童应重点规避的添加剂类别：人工色素（柠檬黄、诱惑红等）、亚硝酸盐/硝酸盐、BPA/邻苯二甲酸酯（包装迁移）、人工甜味剂。',
    rule: '这是「儿童慎用」标签的唯一权威来源：Additive 表的 childRiskFlag 字段按本报告点名清单置位，命中即在风险成分卡片中红色高亮。',
    how: '产品配料表解析 → 匹配 Additive 表 → childRiskFlag=true 的成分进入 ExposureConcern 卡片并扣分，附报告原文说明作为依据展示。',
  },
  {
    icon: '❤️',
    name: 'AHA 营养中心（American Heart Association）',
    org: '美国心脏协会',
    what: '从心血管长期健康角度的阈值，比 WHO 更严格：儿童添加糖 <25g/天（约 6 茶匙），2 岁以下零添加糖。',
    rule: '作为添加糖的"严格档"标准：App 默认用 WHO 线做警示，家长在档案中开启「严格模式」后切换为 AHA 线。',
    how: '阈值表中每项指标存两档（who / aha），评分时按孩子档案的 strictMode 字段选择。',
  },
  {
    icon: '🏭',
    name: 'NOVA 加工等级分类（NOVA Classification）',
    org: '圣保罗大学 / NIH NCI 研究资源',
    what: '按加工程度把食品分为 4 级：1 未加工或最少加工、2 烹饪配料、3 加工食品、4 超加工食品。判定依据是配料表中是否出现工业化配料（果葡糖浆、水解蛋白、乳化剂等）。',
    rule: '对应 App 中已有的「加工程度」卡片（ProcessingLevelCard）：NOVA 1-2 显示绿色，3 显示黄色，4 显示红色并扣分。',
    how: '实现一个 classifyNova(ingredients) 函数：维护"超加工标志配料"关键词表，配料表命中任一关键词即判为 NOVA 4；无添加剂且单一配料判为 NOVA 1。',
  },
];

const DOCS_EN: RuleDoc[] = [
  {
    icon: '🌍',
    name: 'WHO Healthy Diet Guideline',
    org: 'World Health Organization',
    what: 'Global dietary recommendations. Core thresholds: free sugars <10% of energy (ideally <5%), salt <5g/day, fat <30% of energy, ≥400g fruit & vegetables daily.',
    rule: 'Serves as the warning baseline for sugar, sodium and fat: per-100g values are converted to a share of a child\'s daily energy; exceeding a WHO threshold triggers a red "High sugar / salt / fat" tag.',
    how: 'In the scoring engine (server/src/scoring.ts) risk dimension: read nutrition facts → compare against the WHO threshold table → emit 0–3 warning tags, each deducting weighted points.',
  },
  {
    icon: '🇺🇸',
    name: 'Dietary Guidelines for Americans',
    org: 'USDA + HHS',
    what: 'Official US dietary guidance by life stage (0-2, 2-8, 9-13…), notably: no added sugar under age 2.',
    rule: 'Provides age-differentiated rules: the same product scores differently per child. A product with added sugar is "Not recommended" for a 0-2 profile but only loses points for a 4-8 profile.',
    how: 'Child profile ageStage → look up the stage-specific restriction table → apply an age modifier during scoring.',
  },
  {
    icon: '👶',
    name: 'AAP Nutrition Guidance',
    org: 'American Academy of Pediatrics',
    what: 'Clinical pediatric advice: juice limits (≤120ml/day for ages 1-3), whole-vs-low-fat milk switch age, iron and vitamin D supplementation timing.',
    rule: 'Drives the development-goal ↔ nutrient mapping: goals selected in the child profile (bones, brain, immunity…) map to key nutrients; products containing them gain points.',
    how: 'Maintain a goal → nutrients mapping table (matches the DevelopmentGoal / KeyNutrient tables) and count how many goal nutrients a product covers.',
  },
  {
    icon: '⚠️',
    name: 'AAP Food Additives Report',
    org: 'American Academy of Pediatrics',
    what: 'Names additive categories children should avoid: artificial colors (tartrazine, allura red…), nitrates/nitrites, BPA/phthalates (packaging migration), artificial sweeteners.',
    rule: 'The single authoritative source for the "child caution" flag: Additive.childRiskFlag is set from this report\'s list; hits are highlighted red in the risk card.',
    how: 'Parse ingredient list → match the Additive table → childRiskFlag=true items appear in the ExposureConcern card, deduct points, and show the report rationale.',
  },
  {
    icon: '❤️',
    name: 'AHA Nutrition Center',
    org: 'American Heart Association',
    what: 'Cardiovascular-focused thresholds, stricter than WHO: added sugar <25g/day for children (~6 tsp), zero added sugar under age 2.',
    rule: 'Acts as the "strict tier" for added sugar: WHO thresholds by default; parents can enable Strict Mode in the profile to switch to AHA thresholds.',
    how: 'Each metric in the threshold table stores two tiers (who / aha); scoring picks one based on the profile\'s strictMode field.',
  },
  {
    icon: '🏭',
    name: 'NOVA Classification',
    org: 'University of São Paulo / NIH NCI resource',
    what: 'Classifies foods into 4 processing groups: 1 unprocessed/minimally processed, 2 culinary ingredients, 3 processed, 4 ultra-processed — judged by industrial ingredients (HFCS, hydrolysed protein, emulsifiers…).',
    rule: 'Maps to the existing Processing Level card: NOVA 1-2 green, 3 yellow, 4 red with point deduction.',
    how: 'Implement classifyNova(ingredients): keep a keyword table of ultra-processing markers; any hit → NOVA 4; single whole-food ingredient with no additives → NOVA 1.',
  },
];

export default function ScoringRules() {
  const { t, i18n } = useTranslation();
  const docs = i18n.language.startsWith('zh') ? DOCS_ZH : DOCS_EN;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('admin.rules.title')}</h1>
      <p className="text-sm text-gray-500 mb-6">{t('admin.rules.subtitle')}</p>

      <div className="flex flex-col gap-4">
        {docs.map((d) => (
          <div key={d.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{d.icon}</span>
              <div>
                <h2 className="font-semibold text-gray-800">{d.name}</h2>
                <p className="text-xs text-gray-400">{d.org}</p>
              </div>
            </div>
            <dl className="grid gap-3 text-sm">
              <Row label={t('admin.rules.what')} text={d.what} />
              <Row label={t('admin.rules.rule')} text={d.rule} accent />
              <Row label={t('admin.rules.how')} text={d.how} />
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, text, accent }: { label: string; text: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${accent ? 'bg-green-50/60' : 'bg-gray-50'}`}>
      <dt className={`text-xs font-semibold uppercase tracking-wider mb-1 ${accent ? 'text-green-600' : 'text-gray-400'}`}>
        {label}
      </dt>
      <dd className="text-gray-600 leading-relaxed">{text}</dd>
    </div>
  );
}
