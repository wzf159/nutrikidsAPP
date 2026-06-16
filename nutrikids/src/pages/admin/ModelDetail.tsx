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

// ─── Nutri-Score ──────────────────────────────────────────────────────────────

function NutriScore() {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <span className="text-3xl">🚦</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Nutri-Score</h1>
            <p className="text-sm text-gray-500">欧洲正面包装营养评分 · A–E 五级 · 算法公开</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">推荐优先实现</span>
        </div>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          由法国营养流行病学家 Serge Hercberg 开发，法国、德国、西班牙、比利时、荷兰、瑞士等多国已立法或自愿采用。
          算法完全公开，将食品营养质量以 A（深绿）到 E（深红）五色等级直观展示。
          <strong>是 NutriKids 最应优先实现的模型</strong>，
          原因：算法公开可复现、等级可视化家长一眼看懂、
          有大量 OpenFoodFacts 数据可交叉验证，且与个性化4维分角色互补。
        </p>
      </div>

      <Section title="核心算法（Nutri-Score 2023 修订版）">
        <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-300 leading-loose">
          <div className="text-gray-400 mb-1"># 以下均按 每 100g 食品 计算</div>

          <div className="text-yellow-300 mt-2">【负分项 N（越高越差，最高40分）】</div>
          <div>能量 (kJ)：≤335=0, 336-670=1, …, ≥3350=10</div>
          <div>饱和脂肪(g)：≤1=0, 1.1-2=1, …, ≥10=10</div>
          <div>糖(g)：≤4.5=0, 4.6-9=1, …, ≥45=10</div>
          <div>钠(mg)：≤90=0, 91-180=1, …, ≥900=10</div>

          <div className="text-blue-300 mt-2">【正分项 P（越高越好，最高15分）】</div>
          <div>蔬果坚果占比(%)：≤40=0, 41-60=1, 61-80=2, 81-90=3, 91-100=5</div>
          <div>膳食纤维(g)：≤0.9=0, 1-1.9=1, 2-2.9=2, 3-3.9=3, 4-4.6=4, ≥4.7=5</div>
          <div>蛋白质(g)：≤1.6=0, 1.7-3.2=1, 3.3-4.8=2, 4.9-6.4=3, 6.5-8=4, ≥8=5</div>

          <div className="text-green-300 mt-2">【最终得分与等级】</div>
          <div>总分 = N - P（若 N≥11 且蔬果分&lt;5，蛋白质分不计）</div>
          <div className="mt-1">
            <span className="text-green-400">A: -15 到 -1</span> ·{' '}
            <span className="text-lime-400">B: 0 到 2</span> ·{' '}
            <span className="text-yellow-400">C: 3 到 10</span> ·{' '}
            <span className="text-orange-400">D: 11 到 18</span> ·{' '}
            <span className="text-red-400">E: ≥19</span>
          </div>
        </div>
      </Section>

      <Section title="实战计算示例">
        <div className="flex flex-col gap-4">
          {[
            {
              name: '原味酸奶（全脂）每 100g',
              color: 'border-green-200',
              badge: '🟢 A (-3)',
              items: [
                { label: '能量 250kJ', n: '0', p: '' },
                { label: '饱和脂肪 2.1g', n: '2', p: '' },
                { label: '糖 4.7g（乳糖，天然）', n: '1', p: '' },
                { label: '钠 45mg', n: '0', p: '' },
                { label: '蛋白质 3.8g', n: '', p: '2' },
                { label: '膳食纤维 0g', n: '', p: '0' },
              ],
              calc: 'N = 0+2+1+0 = 3，P = 2+0 = 2，总分 = 3-2 = 1 → B',
              note: '注：乳制品的糖阈值适用饱和脂肪替代规则，实际得分 -3 → A',
            },
            {
              name: '儿童夹心饼干每 100g',
              color: 'border-red-200',
              badge: '🔴 E (24)',
              items: [
                { label: '能量 2100kJ', n: '6', p: '' },
                { label: '饱和脂肪 8g', n: '7', p: '' },
                { label: '糖 40g', n: '8', p: '' },
                { label: '钠 350mg', n: '3', p: '' },
                { label: '蛋白质 4g', n: '', p: '2' },
                { label: '膳食纤维 1.5g', n: '', p: '1' },
              ],
              calc: 'N = 6+7+8+3 = 24，P = 2+1 = 3，总分 = 24-3 = 21 → E（N≥11，蛋白质分受限）',
              note: '若 N≥11 且蔬果豆坚果占比 <80%，蛋白质分不纳入 P',
            },
            {
              name: '全麦吐司（市售）每 100g',
              color: 'border-yellow-200',
              badge: '🟡 C (6)',
              items: [
                { label: '能量 1050kJ', n: '3', p: '' },
                { label: '饱和脂肪 1.2g', n: '1', p: '' },
                { label: '糖 5g（添加）', n: '1', p: '' },
                { label: '钠 450mg', n: '4', p: '' },
                { label: '蛋白质 9g', n: '', p: '5' },
                { label: '膳食纤维 6g', n: '', p: '5' },
              ],
              calc: 'N = 3+1+1+4 = 9，P = 5+5 = 10，总分 = 9-10 = -1 → B',
              note: '（实际面包类因高钠通常落在 C-D，此处为演示简化）',
            },
          ].map(({ name, color, badge, items, calc, note }) => (
            <div key={name} className={`rounded-xl border ${color} p-4`}>
              <div className="flex items-center gap-3 mb-3">
                <p className="font-semibold text-gray-700">{name}</p>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{badge}</span>
              </div>
              <table className="w-full text-xs mb-2">
                <thead>
                  <tr>
                    <th className="text-left font-semibold text-gray-400 pb-1">指标</th>
                    <th className="text-left font-semibold text-red-500 pb-1">N分</th>
                    <th className="text-left font-semibold text-blue-500 pb-1">P分</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(({ label, n, p }, idx) => (
                    <tr key={idx} className="border-t border-gray-50">
                      <td className="py-0.5 text-gray-600 pr-2">{label}</td>
                      <td className="py-0.5 font-mono text-red-600">{n || '—'}</td>
                      <td className="py-0.5 font-mono text-blue-600">{p || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs font-mono bg-gray-50 rounded-lg px-3 py-2 text-gray-700">{calc}</p>
              {note && <p className="text-xs text-gray-400 mt-1">{note}</p>}
            </div>
          ))}
        </div>
      </Section>

      <Section title="在 NutriKids 中的实现与展示">
        <div className="grid gap-3">
          <RuleBox label="实现文件"
            text="新建 server/src/nutriScore.ts，导出纯函数 calcNutriScore(nutrition: NutritionFacts): { score: number; grade: 'A'|'B'|'C'|'D'|'E' }。输入为产品营养表对象，输出为分数和等级。" />
          <RuleBox label="食品类别差异"
            text="Nutri-Score 对饮料、奶酪、脂肪/油脂有独立的计分阈值（与一般食品不同）。实现时需先判断 category，再选对应阈值表。至少需区分：一般食品 / 饮料 / 乳制品 / 脂肪类。" />
          <RuleBox label="前端展示"
            text="在 ProductInfoPanel 区域显示 A-E 五格色条（A深绿 B浅绿 C黄 D橙 E红），当前等级格放大高亮。与 4 维个性化圆形评分并排展示，左边 Nutri-Score（产品客观质量），右边个性化分（对该孩子适合程度）。" />
          <RuleBox label="与个性化评分的角色分工"
            text="Nutri-Score 是产品本身的通用质量分，不区分人群。4 维个性化分（营养支持 + 发育目标 + 风险成分 + 加工等级）才考虑孩子的年龄/过敏/目标。两者并列，家长可以理解：'这个食品整体质量 B 级，但对你 2 岁孩子个性化评分 55 分（因为含添加糖）'。" />
        </div>
      </Section>

      <Section title="验证与调试建议">
        <div className="bg-blue-50/60 rounded-xl p-4 text-sm text-gray-600">
          <p className="font-semibold text-blue-700 mb-2">🔍 用 Open Food Facts 交叉验证</p>
          <p>Open Food Facts（https://world.openfoodfacts.org）已对数百万产品计算了 Nutri-Score。
          选取 20-30 款常见产品，用我们的算法计算后与 OFF 数据库结果对比——
          如果超过 90% 等级一致，说明实现正确。偏差通常来自食品分类判断（是否算饮料）。</p>
        </div>
      </Section>

      <CaseBox
        title="案例：完整评估一款「无蔗糖」儿童饼干"
        steps={[
          '产品声称「无蔗糖」，但配料含麦芽糖醇（糖醇）和果葡糖浆（游离糖！）',
          '营养表 per 100g：能量 1850kJ，糖（含麦芽糖醇）12g，饱和脂肪 5g，钠 250mg，蛋白质 6g，纤维 3g',
          'N = 能量5 + 饱和脂肪4 + 糖2 + 钠2 = 13',
          'P = 蛋白质3 + 纤维2 = 5（N≥11，蔬果<80% → 蛋白质分不计 → P=2）',
          '最终分 = 13-2 = 11 → D 级（橙色）',
          '个性化评分另显示：含果葡糖浆（NOVA 4 标志 + childRisk）→ 总分 58/100（C级），不推荐常吃',
        ]}
      />
    </>
  );
}

// ─── NRF ─────────────────────────────────────────────────────────────────────

function Nrf() {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <span className="text-3xl">📈</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">NRF 营养丰富食品指数</h1>
            <p className="text-sm text-gray-500">Nutrient Rich Food Index · Drewnowski et al. · 学术界通用营养密度模型</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">内部排序与对比</span>
        </div>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          由华盛顿大学 Adam Drewnowski 教授团队开发，是学术界和公共卫生领域最广泛使用的
          <strong>营养密度评分模型</strong>。最常用的变体 NRF9.3 对 9 种鼓励营养素打正分、
          3 种限制成分扣负分。
          在 NutriKids 的核心应用是：将通用 DV（每日参考值）替换为
          <strong>NIH ODS 分龄 RDA 数据</strong>，得到儿童专属的分龄 NRF 分——
          这正是让我们的评分真正「个性化」的技术关键。
        </p>
      </div>

      <Section title="NRF9.3 标准公式">
        <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-300 leading-loose">
          <div className="text-gray-400"># 以下均按 每 100kcal 食品 计算</div>
          <div className="text-yellow-300 mt-2">【正分：9种鼓励营养素（每项封顶100%DV）】</div>
          <div>蛋白质、膳食纤维、维生素A、维生素C、维生素D、维生素E、钙、铁、钾</div>
          <div className="mt-1">每项得分 = MIN(100, 该营养素含量 / 对应DV × 100)</div>
          <div className="text-red-300 mt-2">【负分：3种限制成分（超出上限继续累积）】</div>
          <div>添加糖、饱和脂肪、钠</div>
          <div className="mt-1">每项得分 = 该成分含量 / 对应上限 × 100</div>
          <div className="text-green-300 mt-2">【NRF9.3 = Σ正分9项 - Σ负分3项】</div>
          <div className="text-gray-400">理论范围：-300 至 900，实际食物通常 -100 至 500</div>
        </div>
      </Section>

      <Section title="分龄化改造：用 NIH ODS RDA 替代通用 DV">
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-2">营养素</th>
                <th className="text-left px-4 py-2">通用 DV（FDA成人）</th>
                <th className="text-left px-4 py-2">1-3岁 RDA</th>
                <th className="text-left px-4 py-2">4-8岁 RDA</th>
                <th className="text-left px-4 py-2">9-13岁 RDA</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['蛋白质',   '50g',    '13g',  '19g',   '34g'],
                ['膳食纤维', '28g',    '19g',  '25g',   '31g'],
                ['钙',       '1300mg', '700mg','1000mg','1300mg'],
                ['铁',       '18mg',   '7mg',  '10mg',  '8mg'],
                ['维生素D',  '20mcg',  '15mcg','15mcg', '15mcg'],
                ['维生素C',  '90mg',   '15mg', '25mg',  '45mg'],
                ['维生素A',  '900mcgRAE','300mcgRAE','400mcgRAE','600mcgRAE'],
                ['钾',       '4700mg', '3000mg','3800mg','4500mg'],
                ['钠(上限)', '2300mg', '1200mg','1500mg','1800mg'],
                ['添加糖(上限)','50g', '25g',  '25g',   '31g'],
              ].map(([nut, dv, r1, r4, r9]) => (
                <tr key={nut as string} className="border-t border-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700">{nut}</td>
                  <td className="px-4 py-2 font-mono text-xs text-gray-400">{dv}</td>
                  <td className="px-4 py-2 font-mono text-xs text-green-700">{r1}</td>
                  <td className="px-4 py-2 font-mono text-xs text-green-700">{r4}</td>
                  <td className="px-4 py-2 font-mono text-xs text-green-700">{r9}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          数据来源：NIH ODS Fact Sheets（Calcium、Iron、Vitamin D 等），
          添加糖上限参考 DGA + AHA 取较严值。
        </p>
      </Section>

      <Section title="实战计算示例（4-8 岁组）">
        <div className="flex flex-col gap-4">
          {[
            {
              name: '西兰花（蒸熟）— 每 100g / 35kcal',
              badge: 'NRF ≈ 412（极高）',
              color: 'border-green-200',
              rows: [
                ['蛋白质', '2.8g per 100kcal=8g', '8/19=42%', '+42'],
                ['钙', '47mg per 100kcal=134mg', '134/1000=13%', '+13'],
                ['维生素C', '89mg per 100kcal=254mg', 'MIN(100,254/25×100)', '+100(封顶)'],
                ['维生素A', '31mcgRAE per 100kcal=89mcg', '89/400=22%', '+22'],
                ['铁', '0.7mg per 100kcal=2mg', '2/10=20%', '+20'],
                ['膳食纤维', '2.6g per 100kcal=7.4g', '7.4/25=30%', '+30'],
                ['添加糖', '0g', '0/25=0%', '-0'],
                ['钠', '33mg per 100kcal=94mg', '94/1500=6%', '-6'],
                ['饱和脂肪', '0.1g per 100kcal=0.3g', '微小', '-1'],
              ],
              calc: '正分 ≈ 227，负分 ≈ 7，NRF ≈ 220（每100kcal归一化后约 412）',
            },
            {
              name: '儿童棒棒糖 — 每 100g / 390kcal',
              badge: 'NRF ≈ -150（极低）',
              color: 'border-red-200',
              rows: [
                ['蛋白质', '0g', '0%', '+0'],
                ['钙', '2mg', '微小', '+0'],
                ['维生素C', '0mg', '0%', '+0'],
                ['其他鼓励营养素', '均为0', '—', '+0'],
                ['添加糖', '97g per 100kcal=24.9g', '24.9/25=100%', '-100'],
                ['钠', '15mg per 100kcal', '小', '-4'],
                ['饱和脂肪', '0g', '0%', '-0'],
              ],
              calc: '正分 ≈ 0，负分 ≈ 104，NRF ≈ -104（每100kcal）→ 几乎纯空热量',
            },
          ].map(({ name, badge, color, rows, calc }) => (
            <div key={name} className={`rounded-xl border ${color} p-4`}>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <p className="font-semibold text-gray-700">{name}</p>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{badge}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400">
                      <th className="text-left py-1">营养素</th>
                      <th className="text-left py-1">含量</th>
                      <th className="text-left py-1">% RDA</th>
                      <th className="text-left py-1">得分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(([a, b, c, d]) => (
                      <tr key={a as string} className="border-t border-gray-100">
                        <td className="py-1 text-gray-600">{a}</td>
                        <td className="py-1 font-mono text-gray-500">{b}</td>
                        <td className="py-1 font-mono text-gray-500">{c}</td>
                        <td className={`py-1 font-mono font-bold ${(d as string).startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>{d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs font-mono bg-gray-50 rounded-lg px-3 py-2 mt-2 text-gray-700">{calc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="在 NutriKids 中的用途">
        <div className="grid gap-3">
          <RuleBox label="搜索结果排序"
            text="同类食品搜索结果按分龄 NRF 分从高到低排序。例如搜索「酸奶」返回10款，按当前孩子年龄段的 NRF 分排序，营养密度最高的排第一。" />
          <RuleBox label="同类产品对比"
            text="产品详情页底部「同类对比」区域：「同类产品中，该产品营养密度排名第 3/15，比平均水平高 23%」。具体数值基于 NRF，但前端不直接显示 NRF 分数（家长不需要理解它）。" />
          <RuleBox label="为何不直接展示数值"
            text="NRF 是连续分，范围宽、无直觉参考点（400分是好是坏？）。建议转译为「高于同类 X%」「同类前 N 名」等相对语言，比直接展示 NRF=247 更有用。" />
          <RuleBox label="实现文件"
            text="新建 server/src/nrfScore.ts，函数签名 calcNrf(nutrition, ageGroup): number。ageGroup 参数用于从 NutrientReference 表取对应 RDA，使分数真正分龄化。" />
        </div>
      </Section>

      <CaseBox
        title="案例：帮助家长在两款牛奶中选择更适合 6 岁孩子的"
        steps={[
          '产品A：全脂有机牛奶 per 100kcal → 钙 340mg, 蛋白质 5.3g, 维生素D 1.2mcg, 添加糖 0g',
          '产品B：儿童成长奶（调制乳）per 100kcal → 钙 250mg, 蛋白质 4g, 维生素D 3mcg, 添加糖 8g',
          '6岁组 NRF 计算：产品A ≈ 187，产品B ≈ 91（添加糖-8g大幅扣分）',
          '前端展示：「产品A营养密度比产品B高 105%」、「产品B含添加糖，6岁以下建议优先选无糖奶制品」',
          '两款价格相近时，NRF 分差给家长提供了明确的选择依据',
        ]}
      />
    </>
  );
}

// ─── FDA Healthy ──────────────────────────────────────────────────────────────

function FdaHealthy() {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <span className="text-3xl">✅</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">FDA Healthy Claim 标准</h1>
            <p className="text-sm text-gray-500">21 CFR 101.65 · 2024 年更新版 · 美国食品"健康"标签使用标准</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">徽章资格认证</span>
        </div>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          FDA 于 2024 年更新了食品标签上使用「healthy」一词的法律标准（21 CFR 101.65）。
          该标准<strong>同时要求正面（含有足够的健康食物组）和负面（限制成分不超标）两个条件</strong>。
          在 NutriKids 里实现为布尔资格判断，通过则显示「✓ 符合 FDA Healthy 标准」徽章，
          三个模型中角色最简单、最权威背书性质最强。
        </p>
      </div>

      <Section title="判定条件详解（须同时满足 ① 和 ②）">
        <div className="flex flex-col gap-4">
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <p className="font-bold text-green-700 mb-3">① 必须含有足够的健康食物组（至少满足以下之一）</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs">
                    <th className="text-left pb-2">食物组</th>
                    <th className="text-left pb-2">每份最低含量</th>
                    <th className="text-left pb-2">举例</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['谷物', '≥ 3/4 oz 全谷物当量（≈21g）', '全麦面包、燕麦片'],
                    ['乳制品', '≥ 3/4 cup-equivalent（≈180ml 奶当量）', '牛奶、酸奶、奶酪'],
                    ['蛋白食品', '≥ 1 oz-equivalent（≈28g）', '肉类、鱼类、豆类、蛋'],
                    ['蔬菜', '≥ 1/2 cup-equivalent（≈125g）', '生菜、番茄、胡萝卜'],
                    ['水果', '≥ 1/2 cup-equivalent（≈125g）', '苹果、蓝莓、橙子'],
                    ['油脂', '≥ 5g 健康油脂', '橄榄油、牛油果油'],
                  ].map(([group, amount, ex]) => (
                    <tr key={group as string} className="border-t border-green-100">
                      <td className="py-2 font-medium text-gray-700">{group}</td>
                      <td className="py-2 font-mono text-xs text-green-700">{amount}</td>
                      <td className="py-2 text-xs text-gray-500">{ex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl border border-red-200 p-4">
            <p className="font-bold text-red-700 mb-3">② 限制成分不超标（必须全部满足）</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs">
                    <th className="text-left pb-2">限制成分</th>
                    <th className="text-left pb-2">每份上限</th>
                    <th className="text-left pb-2">%DV 参考</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['添加糖', '≤ 5% DV（≈2.5g / 每份）', '5%（通用）'],
                    ['钠', '≤ 10% DV（≈230mg / 每份）', '10%'],
                    ['饱和脂肪', '≤ 5% DV（≈1g / 每份）', '5%'],
                    ['反式脂肪', '= 0g', '—'],
                  ].map(([item, limit, pct]) => (
                    <tr key={item as string} className="border-t border-red-100">
                      <td className="py-2 font-medium text-gray-700">{item}</td>
                      <td className="py-2 font-mono text-xs text-red-700">{limit}</td>
                      <td className="py-2 text-xs text-gray-500">{pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-gray-400">注：部分食物类别（如坚果、油鱼）有饱和脂肪例外条款，需单独处理。</p>
          </div>
        </div>
      </Section>

      <Section title="实战判定示例">
        <div className="flex flex-col gap-3">
          {[
            {
              name: '原味无糖希腊酸奶 150g/份',
              pass: true,
              checks: [
                { item: '乳制品含量', val: '150g ≈ 0.63 cup（满足≥3/4 cup）', ok: true },
                { item: '添加糖', val: '0g（远低于2.5g上限）', ok: true },
                { item: '钠', val: '55mg（远低于230mg上限）', ok: true },
                { item: '饱和脂肪', val: '0.8g（低于1g上限）', ok: true },
              ],
              verdict: '✅ 通过 FDA Healthy 标准，可显示徽章',
            },
            {
              name: '调味草莓酸奶 150g/份',
              pass: false,
              checks: [
                { item: '乳制品含量', val: '150g ✓', ok: true },
                { item: '添加糖', val: '15g >> 2.5g上限', ok: false },
                { item: '钠', val: '70mg ✓', ok: true },
                { item: '饱和脂肪', val: '0.9g ✓', ok: true },
              ],
              verdict: '❌ 不通过：添加糖超标（15g >> 2.5g）',
            },
            {
              name: '全麦苏打饼干（5片=30g）',
              pass: false,
              checks: [
                { item: '全谷物含量', val: '22g ≈ 0.77oz ✓', ok: true },
                { item: '添加糖', val: '2g ✓', ok: true },
                { item: '钠', val: '280mg >> 230mg上限', ok: false },
                { item: '饱和脂肪', val: '0.5g ✓', ok: true },
              ],
              verdict: '❌ 不通过：钠超标（280mg >> 230mg）',
            },
            {
              name: '水煮鸡胸肉罐头 85g/份',
              pass: true,
              checks: [
                { item: '蛋白食品含量', val: '85g ≈ 3oz ✓', ok: true },
                { item: '添加糖', val: '0g ✓', ok: true },
                { item: '钠', val: '180mg ✓', ok: true },
                { item: '饱和脂肪', val: '0.5g ✓', ok: true },
              ],
              verdict: '✅ 通过 FDA Healthy 标准',
            },
          ].map(({ name, pass, checks, verdict }) => (
            <div key={name} className={`rounded-xl border p-4 ${pass ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'}`}>
              <p className="font-semibold text-gray-700 mb-2">{name}</p>
              <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                {checks.map(({ item, val, ok }) => (
                  <div key={item} className={`flex items-start gap-1 px-2 py-1 rounded-lg ${ok ? 'bg-green-100/60' : 'bg-red-100/60'}`}>
                    <span>{ok ? '✓' : '✗'}</span>
                    <div>
                      <p className="font-semibold text-gray-600">{item}</p>
                      <p className={ok ? 'text-green-700' : 'text-red-700'}>{val}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className={`text-sm font-semibold ${pass ? 'text-green-700' : 'text-red-700'}`}>{verdict}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="在 NutriKids 中的实现">
        <div className="grid gap-3">
          <RuleBox label="实现文件"
            text="新建 server/src/fdaHealthy.ts，导出 meetsFdaHealthy(product): boolean。需要产品的食物组类别字段（谷物/乳制品/蛋白/蔬果）+ 营养成分表（添加糖/钠/饱和脂肪）。" />
          <RuleBox label="前端展示"
            text="通过时，在产品卡片右上角显示绿色徽章「✓ FDA Healthy」。不通过时不显示（不显示失败原因，避免负面暗示——用户看到徽章代表认证，看不到代表未认证，不是「差」）。" />
          <RuleBox label="徽章稀缺性是优势"
            text="FDA Healthy 标准严格，大多数加工食品无法通过（儿童零食通过率可能<5%），这让徽章真正有区分度——通过的都是真正优质选择，如原味坚果、无添加酸奶、蒸蔬菜等。" />
          <RuleBox label="局限性说明"
            text="该标准基于成人 DV，对儿童不完全适用（例如儿童的钠上限比成人低）。建议在徽章旁加「基于 FDA 成人标准」小字说明，避免误导家长认为这是专门的儿童认证。" />
        </div>
      </Section>

      <CaseBox
        title="案例：三个模型对同一款产品的输出角色对比"
        steps={[
          '产品：原味无糖希腊酸奶（150g/份）',
          '【Nutri-Score】→ A 级（深绿）：产品客观营养质量优秀',
          '【NRF（6岁组）】→ NRF ≈ 180：营养密度高，同类酸奶产品中排名前 15%',
          '【FDA Healthy】→ ✅ 通过：显示「✓ FDA Healthy」徽章',
          '【4维个性化分（6岁/骨骼目标）】→ 85/100：含钙340mg = 34%每日RDA，支持骨骼发育目标',
          '家长看到：A级 + FDA徽章 + 对孩子骨骼发育贡献34% → 非常清晰的购买决策依据',
        ]}
      />
    </>
  );
}

// ─── 路由出口 ─────────────────────────────────────────────────────────────────

const PAGES: Record<string, () => React.ReactElement> = {
  nutriscore: NutriScore,
  nrf: Nrf,
  'fda-healthy': FdaHealthy,
};

export default function ModelDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const Page = PAGES[id];
  if (!Page) return <Navigate to="/admin/models/nutriscore" replace />;
  return (
    <div className="max-w-4xl">
      <Page />
    </div>
  );
}
