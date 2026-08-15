import {
  AnalysisTabs,
  DataTable,
  Formula,
  InfoCard,
  PageHero,
  Section,
} from './FoodAnalysisDoc';

const levelRows = [
  ['Strong', '5', '75–100', '强力支持', '绿色', '营养益处明显优于潜在风险'],
  ['Good', '4', '58–74', '良好支持', '黄绿色', '营养益处优于潜在风险'],
  ['Moderate', '3', '44–57', '适度支持', '琥珀色', '益处与关注点并存'],
  ['Limited', '2', '37–43', '有限支持', '橙色', '潜在风险开始超过营养支持'],
  ['Minimal', '1', '0–36', '益处有限', '红色', '潜在风险超过营养支持'],
];

const ageThresholdRows = [
  ['0–6 个月', '0g / ≥ 1g', '200mg / > 50mg', '暂无 / > 1g'],
  ['7–12 个月', '0g / ≥ 1g', '370mg / > 100mg', '暂无 / > 1g'],
  ['1–3 岁', '12g / ≥ 3g', '800mg / > 200mg', '8g / > 2g'],
  ['4–8 岁', '25g / ≥ 5g', '1200mg / > 300mg', '10g / > 2.5g'],
  ['9–13 岁', '25g / ≥ 5g', '1500mg / > 400mg', '13g / > 3g'],
  ['14–18 岁', '25g / ≥ 5g', '1800mg / > 500mg', '16g / > 4g'],
];

const watchRows = [
  ['添加糖', '独立的 Added Sugars 营养字段', '达到年龄阈值；缺字段时显示“数据不可用”', '按 %DV 分高 / 中 / 低'],
  ['钠', '营养字段的每份含量', '每份含量大于年龄阈值', '按 %DV 分高 / 中 / 低'],
  ['饱和脂肪', '营养字段的每份含量', '每份含量大于年龄阈值', '按 %DV 分高 / 中 / 低'],
  ['反式脂肪', '配料含“氢化”或添加剂命中 E471 / E472', '一旦命中即“高”', '只有高 / 低两种状态'],
  ['人工香精', '配料、添加剂名称或 E620–E625 / E635', '任一规则命中即“已检出”', '存在 / 未检出'],
  ['人工色素', '配料、添加剂名称或指定色素 E 编号', '任一规则命中即“已检出”', '存在 / 未检出'],
  ['防腐剂', '配料、添加剂名称或指定防腐剂 E 编号', '任一规则命中即“已检出”', '存在 / 未检出'],
  ['果葡糖浆', '配料名称文本', '命中 fructose corn / 果葡 / 高果糖', '存在 / 未检出'],
  ['抗氧化剂', '添加剂分类表', '分类为 Antioxidant', '存在 / 未检出'],
  ['酸度调节剂', '添加剂分类表', '分类为 Acidity Regulator', '存在 / 未检出'],
  ['增稠剂 / 乳化剂', '添加剂分类表', '分类为 Thickener', '存在 / 未检出'],
  ['增味剂', '添加剂分类表', '分类为 Flavor Enhancer', '存在 / 未检出'],
  ['甜味剂', '添加剂分类表', '分类为 Sweetener', '存在 / 未检出'],
];

function CompactFlow({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto whitespace-pre rounded-2xl bg-slate-950 p-5 font-mono text-[12px] leading-6 text-slate-200 shadow-inner md:text-sm">
      {children}
    </pre>
  );
}

function OrderBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-violet-600 px-2 text-xs font-bold text-white">
      {children}
    </span>
  );
}

export default function FoodAnalyzerLabelsDoc() {
  return (
    <div className="mx-auto max-w-6xl">
      <AnalysisTabs />
      <PageHero
        index="01.3"
        title="Food Analyzer 页面标签与等级口径"
        subtitle="按 food-analyzer 实际显示顺序，逐项说明标签从什么数据产生、经过什么判断、最终显示成哪个等级。本文以当前前端 FoodAnalyzer.tsx、服务端 scoring.ts 与产品入库逻辑为准。"
        accent="blue"
      />

      <Section eyebrow="READING ORDER" title="先看一遍完整显示链">
        <CompactFlow>{`产品事实 + 儿童档案
        │
        ├─ Nutri-Score 原始分/等级是否完整？ ── 否 ─→ 422：不生成分析结果
        │                                      是
        ▼
   计算 0–100 总分 → 换算 Food Score 1–5 与文字等级
        │
        ├─ 命中儿童过敏原？ ──────── 是 ─┐
        ├─ 命中高风险添加剂？ ────── 是 ─┴→ 安全否决：显示 0 / NOT SAFE
        │                                      否
        ▼
   显示原总分与文字等级
        │
        ├─ Food Score ≥ 3 → 优先显示“富含”营养素
        └─ Food Score < 3 → 优先显示“注意”成分
        │
        ▼
   ① 食品评估 → ② 成长益处 → ③ 家长须知 → NOVA 加工程度`}</CompactFlow>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          页面标签有三类：计算标签（总分、文字等级、%DV）、判断标签（NOT SAFE、已检出、富含）和来源标签（NOVA、AI 估算、数据源按钮）。三者不要混成同一种“评分”。
        </p>
      </Section>

      <Section eyebrow="0 · COMMON BASIS" title="所有营养标签共用的基础口径">
        <div className="grid gap-4 lg:grid-cols-3">
          <InfoCard title="每份含量 value" tone="blue">
            Open Food Facts 的每 100g / 100ml 数值先做单位换算，再乘每份系数。可解析到 g、ml 或 oz 时按实际份量换算；无法解析时按 100g / 100ml 处理。
          </InfoCard>
          <InfoCard title="每日参考占比 %DV" tone="violet">
            <code>%DV = round(每份含量 ÷ 对应营养素参考值 × 100)</code>。当前为产品入库时按固定参考值生成的占比，页面直接读取，不会随所选儿童年龄重新计算；随年龄变化的是下方关注项的每日上限与 present 阈值。
          </InfoCard>
          <InfoCard title="每 100g 原始值 value100g" tone="emerald">
            用于同品类 p10 / p90 比较和成长算法。它与“每份含量”是两套口径：前者用于同类比较，后者用于页面展示与 %DV。
          </InfoCard>
        </div>
      </Section>

      <Section eyebrow="1 · FOOD ASSESSMENT" title="① 食品评估：总分、文字等级与安全否决">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><OrderBadge>A</OrderBadge><h3 className="font-bold">先算总分</h3></div>
            <div className="mt-4 space-y-3">
              <Formula>NutriNorm = clip((55 − Nutri-Score原始分) ÷ 72, 0, 1)</Formula>
              <Formula>A / B：总分 = 100 × (0.5 × NutriNorm + 0.5 × DevScore)</Formula>
              <Formula>C / D / E：总分 = max(0, 100 × (0.5 × NutriNorm − 0.5 × AdditiveScore))</Formula>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><OrderBadge>B</OrderBadge><h3 className="font-bold">再做安全优先判断</h3></div>
            <CompactFlow>{`儿童过敏原与产品过敏原有交集？ ── 是 ─┐
本地添加剂字典 risk = high？ ───── 是 ─┴→ displayScore = 0
                                           displayLevel = 0
                                           标签 = NOT SAFE
两个条件都否 ───────────────────────────→ 保留原总分和文字等级`}</CompactFlow>
            <p className="mt-3 text-xs leading-5 text-slate-500">安全否决只改变页面显示，不会回写或重算数据库中的原始 overallScore。</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">这里的 <code>risk = high</code> 来自前端添加剂说明字典；它与 C/D/E 总分分支使用的 ANSES/EFSA harmful reference 集合是两套用途不同的数据。</p>
          </div>
        </div>

        <h3 className="mt-7 text-lg font-bold">前台五档文字等级</h3>
        <div className="mt-3"><DataTable headers={['文字等级', 'Food Score', '总分区间', '中文标题', '颜色', '摘要含义']} rows={levelRows} /></div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-bold text-amber-950">注意：系统里同时存在“四档 Grade”和“五档 Food Score”</p>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            服务端保存的 Grade 为 Excellent 80–100、Good 60–79、Fair 40–59、Poor 0–39；food-analyzer 主结果卡实际展示的是 Strong、Good、Moderate、Limited、Minimal。两套阈值用途不同，不应拿 Grade 的 A/B/C/D 去解释页面文字等级。
          </p>
        </div>
      </Section>

      <Section eyebrow="1.1 · RESULT LABELS" title="① 食品评估卡内每个标签何时出现">
        <DataTable
          headers={['页面位置 / 标签', '显示条件', '计算或取值', '缺失 / 被覆盖时']}
          rows={[
            ['评分圆圈', '成功获得分析结果', '正常显示四舍五入后的 overallScore 与文字等级；安全否决时固定 0 / NOT SAFE', '缺 Nutri-Score 原始分或 A–E 等级时整张结果卡不生成'],
            ['Strong / Good / Moderate / Limited / Minimal', '没有安全否决', '按前台五档 Food Score 阈值选择标题、颜色和摘要', '安全否决时改成过敏原 / 有害添加剂标题'],
            ['AI 估算营养信息', 'verified = false 且 isAiGenerated = true', '未验证、无条码的 AI 创建产品', '官方 / 条码产品不显示'],
            ['检测到过敏原', '产品已标记存在的过敏原，与当前儿童档案过敏原 ID 相同', '列出所有 matchedAllergens', '无交集则不显示'],
            ['检测到有害添加剂', '产品 E 编号在前端添加剂字典中且 risk = high', '列出命中的添加剂名称', '无高风险项则不显示'],
            ['富含…', 'Food Score ≥ 3，且至少有一个正向营养素达到 High', '取正向营养素列表中 %DV ≥ 20 的前 2 项', '安全否决优先；无 High 营养素时不显示'],
            ['注意：…', 'Food Score < 3、没有安全否决、且存在 watch.present 项', '最多显示前三个已判定存在的关注项', 'Food Score ≥ 3 时不显示此摘要'],
            ['支持 N 项目标 · 核心 / 重要 / 辅助', '儿童已选择目标', '只统计 selected、supportDV > 0 且具有年龄/性别 tier 的目标', '总数为 0 时显示“没有足够营养证据”'],
            ['NOVA 4 · 超加工', '产品 novaScore = 4', '仅对超加工食品显示加工等级警示', 'NOVA 1–3 或没有 NOVA 数据时不显示'],
            ['来源按钮', '结果卡固定展示', 'WHO、AAP、AHA、CDC、NIH ODS、Open Food Facts 等固定入口', '它们是说明入口，不参与计算'],
          ]}
        />
      </Section>

      <Section eyebrow="2 · GROWTH BENEFITS" title="② 成长益处：目标层级、支持度与营养等级">
        <CompactFlow>{`儿童选择了该目标？ ── 否 ─→ 不进入目标展示
           是
           ▼
按 年龄阶段 × 性别 查 DEV_TIERS ─→ 核心 / 重要 / 辅助 / 不适用
           │
           ▼
计算单目标 GoalScore（0–1）
           │
           ├─ 映射营养素 %DV ≥ 5，或 value100g > 0 → 计为一条证据
           ▼
supportDV = round(GoalScore × 证据覆盖率 × 100)
           │
           ├─ supportDV > 0 → 彩色展示并计入“支持 N 项目标”
           └─ supportDV = 0 → 置灰，不计入支持数量`}</CompactFlow>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <InfoCard title="核心 / 重要 / 辅助" tone="violet">
            这是儿童发育阶段优先级，来自固定的“目标 × 年龄阶段 × 性别”表；不是按食品分数高低临时分档。同一目标随年龄和性别可能改变层级或变为不适用。
          </InfoCard>
          <InfoCard title="GoalScore" tone="blue">
            每个映射营养素先按同品类 p10 / p90 中位区间归一化：<code>s = clip((x−L)/(U−L),0,1)</code>；目标分为 <code>min(1, Σs)</code>。
          </InfoCard>
          <InfoCard title="证据覆盖率" tone="emerald">
            <code>coverage = min(1, 证据数 ÷ min(映射营养素数, 3))</code>。它只约束页面 supportDV，避免单个营养素让多个目标都看起来“满分”。
          </InfoCard>
        </div>

        <h3 className="mt-7 text-lg font-bold">营养素标签的筛选与等级</h3>
        <DataTable
          headers={['步骤', '规则', '页面结果']}
          rows={[
            ['进入候选', '排除总糖、添加糖、能量、饱和脂肪和钠', '只保留正向营养素'],
            ['有效值', '%DV > 0', '0 或缺失不进入成长益处营养素列表'],
            ['排序与截断', '按 %DV 从高到低排序，最多取 6 项', '桑基图与“富含”都基于这 6 项'],
            ['高 High', '%DV ≥ 20', '可进入“富含”候选'],
            ['中等 Moderate', '10 ≤ %DV < 20', '显示中等来源'],
            ['低 Low', '0 < %DV < 10', '显示低来源'],
            ['目标—营养素连线', '目标已选择、营养素在静态映射内、%DV > 0 且进入前 6 项', '生成 flow；线宽值为四舍五入后的 %DV'],
          ]}
        />
      </Section>

      <Section eyebrow="3 · PARENT GUIDE" title="③ 家长须知：高 / 中 / 低与“已检出”不是一套判断">
        <div className="grid gap-4 lg:grid-cols-3">
          <InfoCard title="高 / 中 / 低" tone="amber">
            用于添加糖、钠、饱和脂肪等营养关注项：High ≥ 20% DV；Moderate 10–19% DV；Low &lt; 10% DV。反式脂肪例外：命中即 High。
          </InfoCard>
          <InfoCard title="存在 / 已检出" tone="rose">
            用于配料和添加剂类别，是布尔判断，不计算百分比。配料文本、E 编号或添加剂分类命中任一规则即为存在。
          </InfoCard>
          <InfoCard title="顶部高亮数量" tone="violet">
            只统计 High 的添加糖 / 钠 / 饱和脂肪、已检出的反式脂肪，以及已检出的配料 / 添加剂组。Moderate 和 Low 卡片仍可查看，但不计入顶部高亮。
          </InfoCard>
        </div>

        <div className="mt-6"><DataTable headers={['标签项', '数据依据', '何时判定 present / 高亮', '显示等级']} rows={watchRows} /></div>

        <h3 className="mt-7 text-lg font-bold">年龄阈值表</h3>
        <p className="mt-2 text-sm text-slate-500">每格均为“每日参考上限 / 页面判定 present 的每份阈值”。present 用于“值得注意的成分”统计；High / Moderate / Low 仍由 %DV 决定。</p>
        <div className="mt-3"><DataTable headers={['年龄阶段', '添加糖', '钠', '饱和脂肪']} rows={ageThresholdRows} /></div>
      </Section>

      <Section eyebrow="3.1 · NOVA" title="加工程度：NOVA 1–4 直接映射">
        <DataTable
          headers={['NOVA', '页面名称', '典型示例', '参与哪些地方']}
          rows={[
            ['1', '未 / 低度加工', '新鲜水果、蔬菜、鸡蛋、牛奶', 'Things to Watch 不提示；天然食物的糖不自动当作添加糖'],
            ['2', '加工烹饪配料', '油、黄油、糖、盐', 'Things to Watch 不提示加工等级'],
            ['3', '加工食品', '奶酪、酸奶、罐装蔬菜、新鲜面包', 'Things to Watch 不提示加工等级'],
            ['4', '超加工', '碳酸饮料、糖果、方便面', 'Things to Watch 显示加工等级警示；旧的 breakdown.processingLevel 会映射为 8/20，但不参与当前最终总分'],
          ]}
        />
        <p className="mt-3 text-sm leading-6 text-slate-500">NOVA 优先读取 Open Food Facts 的 <code>nova_group</code>，必要时读取其营养字段里的 nova-group 兜底；前端不根据配料数量自行推算 NOVA。</p>
      </Section>

      <Section eyebrow="EDGE CASES" title="缺失、冲突与优先级">
        <DataTable
          headers={['情况', '页面行为', '原因']}
          rows={[
            ['缺 Nutri-Score 原始分', '不生成结果，接口返回 422', '总分主公式无法成立'],
            ['Nutri-Score 等级不是 A–E', '不生成结果，接口返回 422', '无法选择 A/B 或 C/D/E 分支'],
            ['添加糖字段缺失', '显示“数据不可用”，不当作 0g', '总糖不能替代添加糖'],
            ['某正向营养素缺 %DV', '不进入前 6 项营养素列表', '成长展示要求 %DV > 0'],
            ['同品类没有可用 p10 / p90', '该营养素跳过，不按 0 惩罚', '无法做可靠归一化'],
            ['过敏原与高风险添加剂同时命中', '标题显示二者都检测到；分数显示 0、等级显示 NOT SAFE', '安全优先级高于营养得分'],
            ['安全否决后仍有益处 / 家长须知数据', '下方区域置灰且不可交互', '保留数据上下文，但阻止正向信息压过安全警示'],
          ]}
        />
      </Section>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-100 p-5 text-sm leading-6 text-slate-600">
        <b className="text-slate-900">维护约定：</b>修改 food-analyzer 的阈值、标签文案、关注项或安全覆盖规则时，应同步更新本页；尤其要区分“服务端保存结果”和“前端最终显示结果”。
      </div>
    </div>
  );
}
