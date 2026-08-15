import { DataTable, Formula, InfoCard, PageHero, Section } from './FoodAnalysisDoc';

const codeClass = 'rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.92em] text-slate-700';

function FlowStep({ no, title, children }: { no: string; title: string; children: React.ReactNode }) {
  return <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">{no}</span>
    <div><h3 className="font-bold text-slate-900">{title}</h3><div className="mt-2 text-sm leading-6 text-slate-600">{children}</div></div>
  </div>;
}

export default function DataConsistencyDoc() {
  return <div className="mx-auto max-w-6xl">
    <PageHero
      index="01.2"
      title="数据口径与“家长须知”校核"
      subtitle="解释为什么原始 OFF 数据、预处理数据表、平台评分和页面提醒中的数量或结果可能不一致；同时明确分类区间、添加剂、糖、钠和脂肪分别来自哪里，以及哪些结论是本地规则而不是 OFF 官方安全判断。"
      accent="blue"
    />

    <Section eyebrow="WHY COUNTS DIFFER" title="为什么 categories_tags 和原始数据数量不对应">
      <p className="mb-5 max-w-4xl text-sm leading-7 text-slate-600">参考统计表不是对原始 <code className={codeClass}>food.parquet</code> 的逐列复制，而是面向评分用途生成的清洗子集。因此，分类数、营养素数和可参与统计的产品数变少属于预期结果，不能直接据此判断数据丢失。</p>
      <div className="grid gap-4 md:grid-cols-2">
        <FlowStep no="1" title="只保留评分会使用的营养素">
          从原始数据挑出所需字段，并按 <code className={codeClass}>nutrient_goal_mapping.csv</code> 的营养素清单过滤 <code className={codeClass}>nutriments</code>。几十种未进入成长目标、极少出现或命名不稳定的营养素不会进入统计表。
        </FlowStep>
        <FlowStep no="2" title="只保留 en: 规范分类标签">
          <code className={codeClass}>categories_tags</code> 中可能同时出现 <code className={codeClass}>fr:</code>、<code className={codeClass}>de:</code>、<code className={codeClass}>af:</code> 等语言前缀。统计前只保留 <code className={codeClass}>en:</code>，避免同一分类因多语言名称被重复计数。
        </FlowStep>
        <FlowStep no="3" title="排除纯数字“假分类”">
          用格式校验剔除 <code className={codeClass}>en:1</code>、<code className={codeClass}>fr:333</code>、<code className={codeClass}>af:42</code> 等“语言前缀 + 纯数字”标签。这些值没有可解释的食品分类语义。
        </FlowStep>
        <FlowStep no="4" title="用 OFF 官方 taxonomy 白名单校验">
          使用由 <a className="font-semibold text-blue-700 underline" href="https://static.openfoodfacts.org/data/taxonomies/categories.json" target="_blank" rel="noreferrer">OFF categories taxonomy</a> 生成的 <code className={codeClass}>categories_parents.json</code> 校验标签，只保留官方分类体系内的节点，过滤拼写错误、废弃旧标签和带 <code className={codeClass}>en:</code> 前缀的自由文本。
        </FlowStep>
      </div>
      <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-950"><b>核对数量时应分层比较：</b>原始行数 → 有目标营养素的行数 → 有规范英文分类的行数 → taxonomy 校验通过的行数 → 当前营养素满足可靠样本量的分类数。只有在同一层口径下，数量才可直接比较。</div>
    </Section>

    <Section eyebrow="CATEGORY BOUNDS" title="分类区间：从具体分类向最近可靠父类回退">
      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <FlowStep no="1" title="先找产品的叶子分类">
            OFF 通常会把具体分类及全部父类一起展开。例如 <code className={codeClass}>en:breads</code>、<code className={codeClass}>en:sliced-breads</code>、<code className={codeClass}>en:wheat-breads</code> 可能同时出现。算法先去掉只是其他标签祖先的节点，保留最具体分类。
          </FlowStep>
          <FlowStep no="2" title="逐营养素检查区间是否可靠">
            该分类必须同时具有有效 <code className={codeClass}>P10</code>、<code className={codeClass}>P90</code>，且样本量 <code className={codeClass}>n ≥ 30</code>。判断是“分类 × 当前营养素”级别，不是分类一旦合格就适用于全部营养素。
          </FlowStep>
          <FlowStep no="3" title="没有可靠数据就沿父类 BFS 回退">
            从叶子节点开始，依据 <code className={codeClass}>categories_parents.json</code> 逐层向上搜索；分类体系是 DAG，可能有多个父节点，因此使用 BFS 找跳数最近的可靠祖先。
          </FlowStep>
          <FlowStep no="4" title="使用一组有明确语义的 P10/P90">
            找到可靠分类后，只用该分类自身的区间，不把宽泛父类和具体子类的多组区间混在一起。若多个叶子分支都有数据，独立评分器当前以样本量较小者作为“更具体”的决胜规则。
          </FlowStep>
        </div>
        <div className="space-y-4">
          <InfoCard title="目标算法" tone="emerald">
            <Formula>叶子分类 → 最近 n≥30 且 P10/P90 有效的分类<br />L = 选中分类的 P10<br />U = 选中分类的 P90</Formula>
            <p className="mt-3">对应文件：<code>categoryTaxonomy.ts</code>、<code>nutriKidsScorer.ts</code>、<code>categories_parents.json</code>。</p>
          </InfoCard>
          <InfoCard title="为什么更合理" tone="blue">父类“面包”和子类“全麦切片面包”不是平级样本。只选最近可靠分类，可以让区间真正代表产品所在细分类；样本不足时仍能安全退回更宽泛分类。</InfoCard>
          <InfoCard title="不能找到时" tone="amber">一路到根节点都没有可靠区间，则跳过该营养素，不把缺失统计当作 0，也不人为生成 P10/P90。</InfoCard>
        </div>
      </div>
    </Section>

    <Section eyebrow="IMPLEMENTATION AUDIT" title="当前仓库有两套分类区间实现">
      <DataTable headers={['调用路径', '当前算法', '关键文件', '校核结论']} rows={[
        ['消费端主流程：POST /api/analyses', '遍历产品全部 categories_tags，收集可用 P10/P90 后分别取中位数；不读取分类树，也不做父类回溯。', <><code>scoring.ts</code><br /><code>devScoreV2.ts</code></>, '与本页“最近可靠父类”口径不一致，是平台结果与数据表复算继续不同的主要风险。'],
        ['独立评分接口：GET /api/food/score', '识别叶子分类；逐层查最近 n≥30 且 P10/P90 有效的父类；多个分支以 n 较小者决胜。', <><code>nutriKidsScorer.ts</code><br /><code>categoryTaxonomy.ts</code></>, '符合本页描述，但不是消费端当前使用的主分析接口。'],
      ]} />
      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-950"><b>上线前必须统一：</b>平台、API、CSV/Notebook 应调用同一个分类选择函数，并在调试结果中记录叶子分类、父类回退路径、最终分类、n、P10 和 P90。否则即使输入完全相同，结果仍可能不一致。</div>
    </Section>

    <Section eyebrow="PARENT PANEL · ADDITIVES" title="添加剂：OFF 产品事实与本地判断必须分开">
      <DataTable headers={['层级', '数据/文件', '具体规则', '能否称为 OFF 官方结论']} rows={[
        ['产品含有哪些添加剂', <><code>product.additives_tags</code><br /><code>Product.additivesJson</code></>, '主流程直接请求 OFF 独立字段 additives_tags，例如 en:e150d；与完整配料 ingredients_tags 分开保存。', '是 OFF 返回的产品数据，但依赖配料表完整度和 OFF 解析质量。'],
        ['添加剂属于什么类别', <><code>scoring/data/additive_categories.json</code><br /><code>additiveCategories.ts</code></>, '本地字典当前有 645 个 E 标签：Acidity Regulator 166、Thickener 129、Color 93、Sweetener 87、Preservative 63、Glazing Agent 51、Antioxidant 26、Flavor Enhancer 25、Other 5。hasAdditiveCategory() 只做 tag→类别精确映射。', '不是 OFF 对产品的安全评价；这是项目本地生成的功能分类。'],
        ['是否命中“有害”集合', <><code>scoring/data/harmful_additives_reference.json</code><br /><code>harmfulAdditives.ts</code></>, <><code>efsa_evaluation_overexposure_risk.en = en:high</code> 的 38 个 OFF 添加剂。产品 <code>additives_tags</code> 去重后与该集合求交集。</>, '风险字段与名称来自 OFF taxonomy；“命中即不评分”是本项目的产品规则。'],
        ['如何进入总分', <code>scoring.ts</code>, '只要命中任一高风险添加剂，FinalScore、overallScore 和 Grade 均不计算；无命中时才进入常规 A–E 评分分支。', '属于 Growtrition 的安全优先规则。'],
      ]} />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <InfoCard title="空数组不一定等于已确认无添加剂" tone="amber">若 OFF 没有可解析的配料表，<code>additives_tags = []</code> 可能代表“未识别到/资料不足”。页面应结合 <code>ingredients_text</code>、<code>ingredients_n</code> 和数据质量标签区分“已解析未检出”与“未知”。</InfoCard>
        <InfoCard title="两个评分入口使用同一口径" tone="blue">主分析接口与独立 <code>/api/food/score</code> 都读取 <code>additives_tags</code>，并使用同一份 38 项 EFSA high 参考表。</InfoCard>
      </div>
    </Section>

    <Section eyebrow="PARENT PANEL · NUTRIENTS" title="糖、钠、饱和脂肪和反式脂肪字段校核">
      <DataTable headers={['页面项目', 'OFF 字段', '当前状态', '正确展示边界']} rows={[
        ['总糖 Total Sugars', <code>sugars_100g</code>, '项目已与添加糖分开映射。', '包含天然糖和添加糖；FDA 未设总糖 %DV，不能用固定 25g 分母。'],
        ['添加糖 Added Sugars', <code>added-sugars_100g</code>, '字段选择正确，但 OFF 可能缺失、填错或出现与总糖矛盾的值。', <><code>0 ≤ added-sugars ≤ sugars</code> 才可作为基本可信定量值；<code>ingredients_tags</code> 的 <code>en:added-sugar</code> 只能提供定性线索。</>],
        ['钠 Sodium', <code>sodium_100g</code>, '当前从 g×1000 转为 mg，映射正确。', <><code>salt_100g</code> 是“盐”而不是“钠”；二者通常可用 <code>salt ≈ sodium×2.5</code> 做一致性检查。</>],
        ['饱和脂肪', <code>saturated-fat_100g</code>, '映射正确。', '分龄百分比必须说明是 FDA 标签 %DV，还是按每日能量 10% 推算的个体参考。'],
        ['反式脂肪', <code>trans-fat_100g</code>, '主流程当前没有读取该营养字段，只按 hydrogenated、E471/E472 推断。', '应优先读取 OFF 定量字段；配料关键词只作补充提醒，E471/E472 本身不能证明含反式脂肪。'],
      ]} />
    </Section>

    <Section eyebrow="PARENT PANEL · DAILY LIMIT" title="Daily Limit (%) 当前为什么不成立">
      <div className="grid gap-5 lg:grid-cols-2">
        <InfoCard title="代码当前实际计算" tone="rose">
          <Formula>每份含量 = OFF每100g值 × servingFactor<br />dailyValue = round(每份含量 ÷ 固定dvRef × 100)</Formula>
          <p className="mt-3">当前固定分母：添加糖 25g、钠 2300mg、饱和脂肪 20g。随后页面又展示另一套分龄 <code>ageLimit</code>，但百分比并没有用这个分龄上限计算。</p>
        </InfoCard>
        <InfoCard title="界面产生的误解" tone="amber">页面标题写“Age-Specific Daily Limit”，同时又把每份 %DV 描述为“基于标准化 100g 参考”。实际上百分比按每份和固定分母计算；每100g含量、每份含量、FDA %DV、年龄指导值被混成了一个概念。</InfoCard>
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4"><h3 className="font-bold text-slate-900">建议拆成四个独立展示字段</h3></div>
        <div className="grid gap-px bg-slate-200 md:grid-cols-2 lg:grid-cols-4">
          {[
            ['每100g含量', '直接显示 OFF *_100g，供同品类比较。'],
            ['每份含量', '优先使用 OFF *_serving；否则仅在 serving size 可解析时换算。'],
            ['FDA 标签 %DV', '明确写明分母和适用年龄；总糖、反式脂肪不显示 %DV。'],
            ['年龄指导', '钠可用分龄日上限；饱和/反式脂肪按能量比例；添加糖使用“避免/限制”和单餐提示，不伪造日百分比。'],
          ].map(([title, detail]) => <div key={title} className="bg-white p-5"><h4 className="font-bold text-slate-900">{title}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p></div>)}
        </div>
      </div>
      <DataTable headers={['项目', '建议计算/展示', '备注']} rows={[
        ['添加糖', '显示每份克数；儿童提示“无推荐摄入量/应避免或严格限制”；单餐超过 10g 单独提示。', '如选择展示 FDA %DV，1–3 岁用 25g、4 岁以上用 50g，必须标成 FDA %DV，不叫个体日上限。'],
        ['钠', <><code>每份钠 ÷ 年龄上限 × 100%</code></>, '现行美国指南：1–3 岁 1200mg、4–8 岁 1500mg、9–13 岁 1800mg、14 岁以上 2300mg；婴儿不要套用成人/儿童限值。'],
        ['饱和脂肪', <><code>每日能量kcal × 10% ÷ 9 = 克数参考</code></>, '没有儿童能量目标时，不应声称是个体年龄百分比。'],
        ['反式脂肪', 'FDA %DV 显示 N/A；如采用 WHO 指导，可按每日能量低于 1% 单独展示。', '必须注明规则来源；不能用“检测到氢化油”代替克数。'],
      ]} />
    </Section>

    <Section eyebrow="ACCEPTANCE CHECKLIST" title="统一数据口径后的验收条件">
      <div className="grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2">
        {[
          '同一条码在平台、独立 API 和 CSV 复算中记录相同的最终分类、回退路径、n、P10/P90。',
          '添加剂列表只从 additives_tags 读取；空数组区分“已解析未检出”和“配料资料不足”。',
          '添加剂类别和“有害集合”在 UI 中明确标为 Growtrition 本地规则，并可追溯到具体 JSON 文件。',
          'added-sugars_100g 必须通过非负且不大于 sugars_100g 的一致性校验，否则标为数据不可用。',
          '反式脂肪接入 trans-fat_100g；配料关键词不再冒充定量营养事实。',
          '每100g、每份、FDA %DV、年龄指导分开命名和计算；无正式分母时不显示百分比。',
        ].map((item, index) => <p key={item} className="rounded-xl border border-slate-200 bg-white p-4"><b className="mr-2 text-violet-600">{index + 1}.</b>{item}</p>)}
      </div>
    </Section>

    <div className="mt-10 rounded-2xl border border-slate-300 bg-slate-100 p-5 text-sm leading-6 text-slate-800"><b>文档定位：</b>本页是数据来源、算法口径和页面文案的校核说明，不是医学诊断或新的食品安全标准。OFF 提供产品事实；分类回退、添加剂关注集合、评分分支和提醒阈值均属于 Growtrition 的应用规则，必须单独维护版本和依据。</div>
  </div>;
}
