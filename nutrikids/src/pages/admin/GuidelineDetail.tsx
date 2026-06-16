import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-bold text-gray-700 border-b border-gray-100 pb-1 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function ThresholdTable({ rows }: { rows: { item: string; value: string; note?: string; warn?: boolean }[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <th className="text-left px-4 py-2 font-semibold">指标</th>
            <th className="text-left px-4 py-2 font-semibold">阈值</th>
            <th className="text-left px-4 py-2 font-semibold">说明</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.item} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${r.warn ? 'border-l-2 border-amber-400' : ''}`}>
              <td className="px-4 py-2 font-medium text-gray-700">{r.item}</td>
              <td className="px-4 py-2 font-mono text-xs font-bold text-green-700">{r.value}</td>
              <td className="px-4 py-2 text-gray-500 text-xs">{r.note ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CaseBox({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="bg-green-50/60 rounded-xl p-4">
      <p className="text-sm font-semibold text-green-700 mb-2">📋 {title}</p>
      <ol className="list-decimal list-inside space-y-1">
        {steps.map((s, i) => <li key={i} className="text-sm text-gray-600">{s}</li>)}
      </ol>
    </div>
  );
}

function RuleBox({ label, text }: { label: string; text: string }) {
  return (
    <div className="bg-green-50/60 rounded-xl p-3">
      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
    </div>
  );
}

// ─── 各指南内容 ───────────────────────────────────────────────────────────────

function Who() {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🌍</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">WHO 健康饮食指南</h1>
            <p className="text-sm text-gray-500">WHO Healthy Diet Guideline · 世界卫生组织</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          WHO 健康饮食指南是<strong>全球通用基准</strong>，面向所有年龄段（成人与儿童），
          给出糖、盐、脂肪和蔬果摄入的核心阈值。
          在 NutriKids 里，它作为<strong>警示标签的默认基准线</strong>——
          产品某项营养素超过 WHO 阈值即触发高糖/高盐/高脂红色标签。
          用户可在儿童档案中切换到更严格的 AHA 阈值（见 AHA 条目）。
        </p>
      </div>

      <Section title="核心阈值（WHO 2023 版）">
        <ThresholdTable rows={[
          { item: '游离糖（Free sugars）', value: '<10% 总能量', note: '建议进一步降至 <5%，即对4岁儿童（1200kcal/天）约 <15g/天' },
          { item: '食盐 / 钠', value: '盐<5g/天 / 钠<2000mg/天', note: '儿童应按体重比例更低；4-8岁建议 ≤1500mg/天' },
          { item: '脂肪', value: '<30% 总能量', note: '其中饱和脂肪 <10%，反式脂肪 <1%' },
          { item: '蔬菜水果', value: '≥400g/天', note: '不含土豆等淀粉类蔬菜' },
          { item: '反式脂肪', value: '<1% 总能量', note: '工业反式脂肪目标 2023 年前全球消除' },
          { item: '饱和脂肪', value: '<10% 总能量', note: '替换为不饱和脂肪（橄榄油、坚果等）' },
        ]} />
      </Section>

      <Section title="换算为 4-8 岁儿童的具体数值">
        <ThresholdTable rows={[
          { item: '参考每日能量', value: '1200–1400 kcal', note: '4-8岁儿童典型值' },
          { item: '游离糖警示线（WHO 10%）', value: '<30–35g/天', note: '大约6-7茶匙' },
          { item: '游离糖理想线（WHO 5%）', value: '<15–17g/天', note: '大约3茶匙，AHA采用此线' },
          { item: '钠警示线', value: '<1500mg/天', note: '换算为盐 ≈ 3.75g/天' },
          { item: '饱和脂肪警示线', value: '<13–15g/天', note: '10% × 1300kcal / 9kcal/g' },
        ]} />
      </Section>

      <Section title="在 NutriKids 中的转化规则">
        <div className="grid gap-3">
          <RuleBox label="高糖标签触发条件"
            text="产品每份含游离糖 > 该年龄段 WHO 每日上限的 20%，触发「高糖⚠️」红色标签（例如4岁：单份 >6g）。超过 40% 触发「极高糖🚫」。" />
          <RuleBox label="高钠标签触发条件"
            text="产品每份含钠 > 该年龄段每日限值的 15%（4-8岁：>225mg/份），触发「高钠⚠️」。超过 30% 触发「极高钠🚫」。" />
          <RuleBox label="高饱和脂肪触发条件"
            text="产品每100g 饱和脂肪 > 5g（WHO 10%能量线对应的大约比例），触发「高饱和脂肪⚠️」。" />
          <RuleBox label="实施位置"
            text="在 server/src/scoring.ts 的风险维度计算中，引用 threshold 配置表（who/aha 两档），childProfile.strictMode = false 时使用 WHO 线。" />
        </div>
      </Section>

      <Section title="实际使用案例">
        <CaseBox
          title="案例：一包儿童薯片对 5 岁孩子的糖钠评估"
          steps={[
            '产品：每份 30g 薯片，含钠 380mg，游离糖 1g，饱和脂肪 2.5g',
            '5 岁儿童（4-8岁组），每日能量 1200kcal',
            '糖 = 1g < 6g 上限 → 无糖警示',
            '钠 = 380mg > 225mg（15%限值）→ 触发「高钠⚠️」',
            '380mg = 25% 的 1500mg 每日上限 → 显示"含每日钠推荐量的 25%"',
            '评分：风险维度扣 8 分（满分 25 分），原因附注「高钠（WHO 基准）」',
          ]}
        />
      </Section>
    </>
  );
}

function Dga() {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🇺🇸</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">美国官方膳食指南</h1>
            <p className="text-sm text-gray-500">Dietary Guidelines for Americans (DGA) 2020–2025 · USDA + HHS</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          美国农业部（USDA）和卫生与公共服务部（HHS）联合发布，每5年更新，
          最新版 2020–2025。<strong>最重要的儿童特异规则</strong>是：
          2岁以下禁止添加糖，以及各年龄段的钠限值比 WHO 更细化。
          这是 NutriKids <strong>年龄分层规则</strong>的主要依据——同一产品对不同年龄孩子的评分结果不同。
        </p>
      </div>

      <Section title="年龄分层核心规则">
        <ThresholdTable rows={[
          { item: '0–12 月：添加糖', value: '0g（绝对禁止）', note: '配方奶/母乳以外任何甜味物质均不推荐', warn: true },
          { item: '0–12 月：果汁', value: '不建议', note: '美国儿科学会（AAP）同步支持此立场', warn: true },
          { item: '12–24 月：添加糖', value: '0g（绝对禁止）', note: '这是 DGA 2020 新增的最重要变化', warn: true },
          { item: '2–18 岁：添加糖', value: '<10% 总能量', note: '约等于4-8岁 <30g/天，与WHO一致' },
          { item: '1–3 岁：钠', value: '<1200mg/天', note: '等效于盐 <3g/天' },
          { item: '4–8 岁：钠', value: '<1500mg/天', note: '等效于盐 <3.75g/天' },
          { item: '9–13 岁：钠', value: '<1800mg/天', note: '等效于盐 <4.5g/天' },
          { item: '14–18 岁：钠', value: '<2300mg/天', note: '等效于盐 <5.75g/天' },
          { item: '各年龄：饱和脂肪', value: '<10% 总能量', note: '与WHO一致' },
        ]} />
      </Section>

      <Section title="食物组建议（2-8 岁参考）">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { group: '蔬菜', amount: '1–1.5杯/天', sub: '深绿色、红橙色、豆类各占一定比例' },
            { group: '水果', amount: '1–1.5杯/天', sub: '以完整水果为主，限果汁' },
            { group: '全谷物', amount: '3–5盎司/天', sub: '至少一半为全谷物' },
            { group: '乳制品', amount: '2–2.5杯/天', sub: '低脂/脱脂（2岁以上）' },
            { group: '蛋白食品', amount: '2–4盎司/天', sub: '鱼、禽、蛋、豆、坚果' },
            { group: '油脂', amount: '15–17g/天', sub: '植物油为主' },
          ].map(({ group, amount, sub }) => (
            <div key={group} className="bg-gray-50 rounded-xl p-3">
              <p className="font-semibold text-gray-700">{group}</p>
              <p className="font-mono text-sm text-green-700">{amount}</p>
              <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="在 NutriKids 中的转化规则">
        <div className="grid gap-3">
          <RuleBox label="年龄门控（Age Gate）规则"
            text="对 0-2 岁档案：含任何添加糖的产品直接评为「不推荐」，无论糖量多少。前端显示红色警示「DGA：2岁以下不应摄入添加糖」。" />
          <RuleBox label="钠分年龄段扣分"
            text="钠阈值按年龄段从 DGA 表读取（1-3岁/4-8岁/9-13岁/14-18岁各不同），同一产品对婴幼儿评分更差。" />
          <RuleBox label="实施位置"
            text="在 ageStageRules 配置中维护 DGA 各年龄段阈值表；scoring.ts 读取 child.ageStage 字段匹配对应规则。" />
        </div>
      </Section>

      <Section title="实际使用案例">
        <CaseBox
          title="案例：同一款含添加糖饼干对不同年龄孩子的评分差异"
          steps={[
            '产品：每份 20g 饼干，含添加糖 6g',
            '档案A：18个月宝宝 → DGA 规则：添加糖=0上限 → 直接「不推荐」🚫，评分维度扣满，卡片显示「DGA/AAP：2岁以下禁止添加糖」',
            '档案B：5岁孩子（1200kcal/天，上限30g）→ 6g = 20% → 触发「高糖」⚠️ 警示，扣5分',
            '档案C：12岁孩子（1800kcal/天，上限45g）→ 6g = 13% → 提示「含添加糖」ℹ️，轻微扣分',
            '三个档案，三个结论——这是 NutriKids 个性化评分的核心差异化',
          ]}
        />
      </Section>
    </>
  );
}

function AapNutrition() {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">👶</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">AAP 儿童营养指导</h1>
            <p className="text-sm text-gray-500">AAP Nutrition Guidance · American Academy of Pediatrics</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          美国儿科学会（AAP）从<strong>儿科临床视角</strong>给出饮食建议，
          与 WHO/DGA 的公共卫生视角互补。
          AAP 建议更具体（如果汁的毫升数上限、全脂/低脂奶的切换年龄），
          且专门针对儿童发育阶段的营养需求。
          在 NutriKids 里驱动<strong>发育目标 ↔ 关键营养素的映射</strong>。
        </p>
      </div>

      <Section title="分年龄段核心建议">
        <ThresholdTable rows={[
          { item: '0–6 月：母乳/配方奶', value: '纯母乳或配方奶', note: '不添加任何辅食、果汁、水' },
          { item: '4–6 月：辅食引入', value: '富铁单谷物/蔬菜泥', note: '早产儿铁补充尤为重要' },
          { item: '6–12 月：维生素D', value: '400 IU/天', note: '纯母乳或喂奶量不足1L/天均需补充' },
          { item: '0–12 月：果汁', value: '不建议（禁止）', note: 'AAP 2017年更新，任何果汁均不推荐给1岁以下', warn: true },
          { item: '1–3 岁：果汁', value: '≤120ml/天', note: '选择100%纯果汁，非果汁饮料', warn: true },
          { item: '4–6 岁：果汁', value: '≤180ml/天', note: '同上，整果优于果汁' },
          { item: '12–24 月：牛奶', value: '全脂牛奶', note: '脂肪对大脑发育至关重要' },
          { item: '2岁以上：牛奶', value: '低脂/脱脂牛奶', note: '每天约480–720ml（2-3杯）' },
          { item: '2岁以上：甜味饮料', value: '不推荐', note: '含苏打水、运动饮料、调味奶' },
          { item: '4–8 岁：铁', value: '10mg/天', note: 'NIH RDA值，儿科强调红肉+VC同食提高吸收' },
        ]} />
      </Section>

      <Section title="发育目标 ↔ 关键营养素映射表">
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-2">发育目标（DevelopmentGoal）</th>
                <th className="text-left px-4 py-2">关键营养素（KeyNutrient）</th>
                <th className="text-left px-4 py-2">参考来源</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['🦷 骨骼与牙齿', 'Calcium · Vitamin D · Phosphorus · Magnesium', 'AAP + NIH ODS'],
                ['🧠 大脑与认知', 'Omega-3 (DHA) · Iron · Iodine · Choline · Zinc', 'AAP + DGA'],
                ['🛡 免疫系统', 'Vitamin C · Vitamin A · Vitamin E · Zinc · Selenium', 'AAP + NIH ODS'],
                ['💪 肌肉与生长', 'Protein · Iron · Vitamin D · Potassium', 'AAP + DGA'],
                ['👁 视力', 'Vitamin A · Lutein · Zeaxanthin · Omega-3', 'AAP + NIH ODS'],
                ['❤️ 心血管', 'Omega-3 · Fiber · Potassium · Vitamin E', 'AAP + AHA'],
                ['🩸 造血', 'Iron · Folate · Vitamin B12 · Vitamin C', 'AAP + NIH ODS'],
              ].map(([goal, nutrients, source]) => (
                <tr key={goal} className="border-t border-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700">{goal}</td>
                  <td className="px-4 py-2 font-mono text-xs text-green-700">{nutrients}</td>
                  <td className="px-4 py-2 text-xs text-gray-400">{source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="实际使用案例">
        <CaseBox
          title="案例：评估一款儿童果汁饮料对 2 岁孩子"
          steps={[
            '产品：一盒 200ml 儿童橙汁饮料（含 10g 游离糖）',
            '档案：2岁孩子，发育目标：骨骼健康 + 大脑认知',
            'AAP 果汁规则：1-3岁每日果汁上限 120ml，该产品单份 200ml 即超标',
            '触发「⚠️ 果汁超量警示：AAP 建议 1-3 岁每日 100% 纯果汁 ≤120ml，本产品单份 200ml 已超上限」',
            '骨骼目标：产品含钙 20mg → 满足 2 岁 RDA(700mg) 的 2.9% → 对骨骼目标贡献很低',
            '综合评分：营养贡献低 + 果汁超量警示 → 评分偏低，标记为"不推荐常饮"',
          ]}
        />
      </Section>
    </>
  );
}

function AapAdditives() {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">⚠️</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">AAP 食品添加剂报告</h1>
            <p className="text-sm text-gray-500">AAP Policy Statement: Food Additives and Child Health (2018) · Pediatrics</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          2018年 AAP 在《儿科学》期刊发表的政策声明，是 NutriKids
          <strong>「儿童慎用」标签（childRiskFlag）的唯一权威来源</strong>。
          点名了5类对儿童健康有潜在风险的添加剂，
          并要求 FDA 更新食品添加剂安全标准（考虑儿童特有的暴露风险）。
        </p>
      </div>

      <Section title="AAP 点名的 5 类风险添加剂">
        <div className="flex flex-col gap-3">
          {[
            {
              cat: '人工合成色素（Artificial Colors）',
              color: 'bg-red-50 border-red-200',
              tc: 'text-red-700',
              items: 'FD&C Red 40（诱惑红）、Yellow 5（柠檬黄）、Yellow 6（日落黄）、Blue 1、Blue 2、Green 3',
              risk: '部分研究显示与儿童多动症（ADHD）行为有关；2007年英国Southampton研究触发EU强制警示标签',
              ins: 'INS 129, 102, 110, 133, 132, 143',
            },
            {
              cat: '亚硝酸盐/硝酸盐（Nitrates/Nitrites）',
              color: 'bg-orange-50 border-orange-200',
              tc: 'text-orange-700',
              items: '亚硝酸钠（INS 250）、亚硝酸钾（INS 249）、硝酸钠（INS 251）',
              risk: '婴幼儿（尤其6月以下）高铁血红蛋白血症风险；长期摄入与消化道癌症相关',
              ins: 'INS 249, 250, 251, 252',
            },
            {
              cat: '包装迁移物（Food Contact Substances）',
              color: 'bg-purple-50 border-purple-200',
              tc: 'text-purple-700',
              items: 'BPA（双酚A）、邻苯二甲酸酯类（Phthalates）、全氟化合物（PFAS）',
              risk: '内分泌干扰物，影响生殖发育；热食接触包装迁移量更高',
              ins: '不在 INS 系统中，属包装材料化学物',
            },
            {
              cat: '高效甜味剂（Non-nutritive Sweeteners）',
              color: 'bg-yellow-50 border-yellow-200',
              tc: 'text-yellow-700',
              items: '糖精（INS 954）、阿斯巴甜（INS 951）、三氯蔗糖（INS 955）、安赛蜜（INS 950）',
              risk: '儿童期摄入可能影响味觉发育、肠道菌群；长期影响仍有争议',
              ins: 'INS 950, 951, 952, 954, 955, 960',
            },
            {
              cat: '特定抗氧化剂（Certain Antioxidants）',
              color: 'bg-amber-50 border-amber-200',
              tc: 'text-amber-700',
              items: 'BHA（叔丁基羟基茴香醚 INS 320）、BHT（二叔丁基羟基甲苯 INS 321）、TBHQ（INS 319）、没食子酸丙酯（INS 310）',
              risk: '动物实验中显示内分泌干扰活性；BHA 被 IARC 列为 2B 类可能致癌物',
              ins: 'INS 310, 319, 320, 321',
            },
          ].map(({ cat, color, tc, items, risk, ins }) => (
            <div key={cat} className={`rounded-xl border p-4 ${color}`}>
              <p className={`font-semibold ${tc} mb-2`}>{cat}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="font-semibold text-gray-500 mb-0.5">具体物质</p>
                  <p className="text-gray-600">{items}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 mb-0.5">健康风险</p>
                  <p className="text-gray-600">{risk}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 mb-0.5">INS 编号</p>
                  <p className="font-mono text-gray-600">{ins}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="在 NutriKids 中的实现">
        <div className="grid gap-3">
          <RuleBox label="childRiskFlag 字段"
            text="Additive 表中凡属以上 5 类的物质，childRiskFlag = true。产品配料表命中任一此类物质，即在「风险成分」卡片中以红色高亮显示，并附 AAP 声明出处。" />
          <RuleBox label="包装迁移物的处理"
            text="BPA/邻苯二甲酸酯不在 INS 体系中，无法从配料表直接识别。暂用「包装类型」字段标注（如热充填 PET 容器）间接提示风险，长期需要包装材料数据库支持。" />
          <RuleBox label="评分影响"
            text="每命中一种 childRiskFlag 成分，风险维度扣 3-8 分（按风险级别），上限扣 20 分（满分 25）。扣分理由显示来源「AAP 2018年政策声明」。" />
        </div>
      </Section>

      <Section title="实际使用案例">
        <CaseBox
          title="案例：一款儿童果冻含柠檬黄 + 苯甲酸钠"
          steps={[
            '产品配料：水、砂糖、柠檬黄（INS 102）、苯甲酸钠（INS 211）、卡拉胶',
            '柠檬黄 INS 102：childRiskFlag = true（AAP 人工色素类）',
            '苯甲酸钠 INS 211：FDA/JECFA 均批准，childRiskFlag = false',
            '但苯甲酸钠 + 维生素C 在酸性环境可生成苯，AAP 建议关注共存情况（加 riskNote）',
            '卡拉胶：JECFA Not specified（普通安全），childRiskFlag = false',
            '风险卡片显示：「⚠️ 柠檬黄（E102）— AAP建议儿童减少摄入的人工色素，EU强制须儿童警示标签」',
            '评分：风险维度扣 6 分，总分从 78 → 72，等级从 B → B（接近 C 边界）',
          ]}
        />
      </Section>
    </>
  );
}

function Aha() {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">❤️</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">AHA 儿童营养建议</h1>
            <p className="text-sm text-gray-500">American Heart Association — Dietary Guidance for Children · 2016–2023</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          美国心脏协会从<strong>心血管长期健康</strong>视角给出的儿童饮食建议。
          核心特点是对糖的限制<strong>比 WHO 更严格</strong>（25g vs 30g），
          且2岁以下同样强调零添加糖。在 NutriKids 里作为「严格模式（Strict Mode）」的阈值来源，
          让关注心血管风险的家长可以切换到更严格的评分标准。
        </p>
      </div>

      <Section title="AHA vs WHO 阈值对比">
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-2">指标</th>
                <th className="text-left px-4 py-2 text-blue-600">WHO（默认档）</th>
                <th className="text-left px-4 py-2 text-red-600">AHA（严格档）</th>
                <th className="text-left px-4 py-2">差异说明</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['添加糖（4-8岁）', '<30g/天 (10%能量)', '<25g/天 (约6茶匙)', 'AHA 更严 20%，与 WHO 5% 理想线相近'],
                ['添加糖（2岁以下）', '推荐极少', '绝对 0g', 'AHA 明确 0 容忍'],
                ['钠（4-8岁）', '<1500mg/天', '<1200–1500mg/天', '基本一致，AHA 略严'],
                ['饱和脂肪', '<10% 能量', '<7% 能量', 'AHA 更严（心脏病高风险家族史适用）'],
                ['含糖饮料', '减少', '完全避免', 'AHA 立场更强硬'],
                ['反式脂肪', '<1% 能量', '0（完全禁止）', 'AHA 推动美国2018年全面禁止'],
              ].map(([item, who, aha, diff]) => (
                <tr key={item as string} className="border-t border-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700">{item}</td>
                  <td className="px-4 py-2 font-mono text-xs text-blue-700">{who}</td>
                  <td className="px-4 py-2 font-mono text-xs text-red-700">{aha}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="在 NutriKids 中的转化规则">
        <div className="grid gap-3">
          <RuleBox label="严格模式（Strict Mode）开关"
            text="儿童档案中有 strictMode: boolean 字段。默认 false（WHO 基准）；家长开启后，所有糖/钠/脂肪阈值切换为 AHA 版本，评分更严格。适合有心血管疾病家族史的家庭。" />
          <RuleBox label="含糖饮料特殊处理"
            text="AHA 将含糖饮料（包括运动饮料、果汁饮料、调味乳）列为儿童「应完全避免」。严格模式下，产品若属含糖饮料类别，直接显示「AHA：建议儿童完全避免含糖饮料」警示。" />
          <RuleBox label="实施位置"
            text="threshold 配置表中每项指标存 who 和 aha 两个值；scoring.ts 根据 child.strictMode 选择对应阈值集进行计算。" />
        </div>
      </Section>

      <Section title="实际使用案例">
        <CaseBox
          title="案例：一盒儿童酸奶（8g 添加糖）在两种模式下的评分差异"
          steps={[
            '产品：每份 100g 酸奶，添加糖 8g，钠 60mg，饱和脂肪 1.5g',
            '孩子：5岁（每日能量 1200kcal）',
            '【WHO 默认模式】：糖上限 30g，8g = 26.7% → 触发「含添加糖」轻提示，糖维度扣 3 分',
            '【AHA 严格模式】：糖上限 25g，8g = 32% → 触发「高糖⚠️」，糖维度扣 8 分',
            '总分差异：WHO 模式 82 分（B+），AHA 严格模式 77 分（B），等级相同但分数明显更低',
            '界面显示「当前使用 AHA 严格标准」提示，家长清楚知道评分依据',
          ]}
        />
      </Section>
    </>
  );
}

function Nova() {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🏭</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">NOVA 食品加工等级分类</h1>
            <p className="text-sm text-gray-500">NOVA Classification · University of São Paulo · Monteiro et al.</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          NOVA 不是传统意义上的"数据库"，而是一套<strong>食品加工程度分类方法</strong>，
          由圣保罗大学 Carlos Monteiro 教授团队提出，已被 WHO、PAHO、FAO 等国际组织采纳。
          将食品分为 1-4 级，超加工食品（NOVA 4）与多种慢性病风险显著相关。
          在 NutriKids 里直接对应「加工程度」卡片（ProcessingLevelCard）的算法来源。
        </p>
      </div>

      <Section title="四级分类体系详解">
        <div className="flex flex-col gap-3">
          {[
            {
              level: 'NOVA 1',
              name: '未加工或最少加工食品',
              color: 'bg-green-50 border-green-200',
              tc: 'text-green-700',
              badge: '🟢 推荐',
              examples: '新鲜蔬菜水果、鸡蛋、肉（冷冻/冷藏）、牛奶、原味酸奶、豆类、大米、面粉、坚果',
              features: '自然界直接获取，仅经过去壳、切割、冷冻、巴氏杀菌等简单处理，不添加任何物质',
            },
            {
              level: 'NOVA 2',
              name: '烹饪配料',
              color: 'bg-lime-50 border-lime-200',
              tc: 'text-lime-700',
              badge: '🟡 中性',
              examples: '食用油、黄油、盐、糖、面粉、淀粉、醋、蜂蜜',
              features: '从自然食品中提取，用于烹饪，本身不作为食物直接食用',
            },
            {
              level: 'NOVA 3',
              name: '加工食品',
              color: 'bg-amber-50 border-amber-200',
              tc: 'text-amber-700',
              badge: '🟠 适量',
              examples: '罐头蔬菜/鱼/豆类、腌菜、腊肉/咸猪肉、芝士、啤酒、红酒',
              features: '含 2-3 种可识别配料，添加盐/糖/油用于保存，但无工业化成分',
            },
            {
              level: 'NOVA 4',
              name: '超加工食品',
              color: 'bg-red-50 border-red-200',
              tc: 'text-red-700',
              badge: '🔴 限制',
              examples: '薯片、碳酸饮料、方便面、早餐麦片（含甜味）、工厂面包、香肠、冰淇淋、饼干、糖果、能量饮料、果汁饮料',
              features: '含工业化专用配料：果葡糖浆、水解蛋白、麦芽糊精、人工香料、人工色素、乳化剂、增稠剂',
            },
          ].map(({ level, name, color, tc, badge, examples, features }) => (
            <div key={level} className={`rounded-xl border p-4 ${color}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-lg font-bold font-mono ${tc}`}>{level}</span>
                <span className="font-semibold text-gray-700">{name}</span>
                <span className="text-sm">{badge}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-semibold text-gray-500 mb-0.5">典型示例</p>
                  <p className="text-gray-600">{examples}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 mb-0.5">判定特征</p>
                  <p className="text-gray-600">{features}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="NOVA 4 识别关键词（配料表扫描规则）">
        <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-300 leading-loose">
          <div className="text-gray-400"># 命中任意以下关键词 → 判定为 NOVA 4</div>
          <div className="mt-1">
            <span className="text-yellow-300">糖类工业配料：</span>
            果葡糖浆 · 高果糖浆 · 葡萄糖浆 · 麦芽糊精 · 改性淀粉 · 棉子糖 · 乳糖醇
          </div>
          <div>
            <span className="text-yellow-300">蛋白质工业配料：</span>
            水解蛋白 · 蛋白粉 · 酪蛋白钠 · 乳清蛋白分离物 · 大豆分离蛋白
          </div>
          <div>
            <span className="text-yellow-300">人工香料/色素：</span>
            人工香料 · 天然香料(液态) · 柠檬黄(E102) · 日落黄 · 诱惑红 · 亮蓝
          </div>
          <div>
            <span className="text-yellow-300">乳化剂/稳定剂：</span>
            卡拉胶(E407) · 黄原胶(E415) · 大豆磷脂(工业用) · 甘油酯 · 聚山梨酯
          </div>
          <div>
            <span className="text-yellow-300">防腐剂（非盐/醋）：</span>
            苯甲酸钠 · 山梨酸钾 · 亚硝酸钠 · BHA · BHT · TBHQ
          </div>
          <div>
            <span className="text-yellow-300">甜味剂：</span>
            阿斯巴甜 · 糖精 · 安赛蜜 · 三氯蔗糖 · 甜蜜素
          </div>
        </div>
      </Section>

      <Section title="实际使用案例">
        <CaseBox
          title="案例：识别一款「健康」营销的儿童麦片"
          steps={[
            '产品配料表：燕麦、小麦粉、白砂糖、麦芽糊精、葡萄糖浆、植物油、食盐、大豆卵磷脂、香兰素、柠檬黄、日落黄、山梨酸钾',
            'NOVA 4 命中关键词：麦芽糊精✓、葡萄糖浆✓、大豆卵磷脂（乳化剂）✓、柠檬黄✓、日落黄✓、山梨酸钾✓',
            '判定：NOVA 4（超加工食品）',
            '加工程度卡片：🔴 NOVA 4 超加工，展示命中关键词列表',
            '营养成分补充评估：即使宣称「高纤维」，超加工特征已足够触发重要警示',
            '整体评分：加工维度扣 15 分（满分 25），即使营养成分尚可，总分也难超 70（C 级）',
          ]}
        />
      </Section>
    </>
  );
}

// ─── 路由出口 ─────────────────────────────────────────────────────────────────

const PAGES: Record<string, () => React.ReactElement> = {
  who: Who,
  dga: Dga,
  'aap-nutrition': AapNutrition,
  'aap-additives': AapAdditives,
  aha: Aha,
  nova: Nova,
};

export default function GuidelineDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const Page = PAGES[id];
  if (!Page) return <Navigate to="/admin/rules/who" replace />;
  return (
    <div className="max-w-4xl">
      <Page />
    </div>
  );
}
