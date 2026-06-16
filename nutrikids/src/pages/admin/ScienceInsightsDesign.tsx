import { useTranslation } from 'react-i18next';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function RuleBox({ label, text }: { label: string; text: string }) {
  return (
    <div className="bg-green-50/60 rounded-xl p-3 mb-3">
      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
    </div>
  );
}

function DataSourceBox({ name, icon, status, description, fields }: { name: string; icon: string; status: string; description: string; fields: string[] }) {
  return (
    <div className={`rounded-xl border p-4 ${status === 'ready' ? 'border-green-200 bg-green-50/40' : status === 'planned' ? 'border-blue-200 bg-blue-50/40' : 'border-amber-200 bg-amber-50/40'}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="font-semibold text-gray-800">{name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${status === 'ready' ? 'bg-green-100 text-green-700' : status === 'planned' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
            {status === 'ready' ? '✓ 已有' : status === 'planned' ? '📋 待开发' : '⚠️ 硬编码'}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <div className="flex flex-wrap gap-1">
        {fields.map((f) => (
          <span key={f} className="text-xs px-2 py-1 rounded-lg bg-white border border-gray-100 text-gray-500">{f}</span>
        ))}
      </div>
    </div>
  );
}

function ScoreLayer({ name, icon, weight, description, example }: { name: string; icon: string; weight: string; description: string; example: string }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="font-semibold text-gray-800">{name}</p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{weight}</span>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <div className="bg-gray-50 rounded-lg p-2">
        <p className="text-xs font-semibold text-gray-500 mb-1">示例</p>
        <p className="text-xs text-gray-600">{example}</p>
      </div>
    </div>
  );
}

function PageModule({ name, icon, description, content }: { name: string; icon: string; description: string; content: string }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="font-semibold text-gray-800">{name}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <p className="text-sm text-gray-600">{content}</p>
    </div>
  );
}

export default function ScienceInsightsDesign() {
  useTranslation();

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔬</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ScienceInsights 科学解读页</h1>
            <p className="text-sm text-gray-500">功能设计说明 · 数据来源 · 评分规则 · 页面模块</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">设计文档</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          ScienceInsights 页面的核心使命是：<strong>向家长解释「为什么这款产品适合/不适合我的孩子」</strong>，
          将评分结果转化为可理解的科学依据。它是 FoodAnalyzer（产品分析工具）的"深度解读页"——家长在快速评估后，
          点击"了解更多"进入此页面，获得完整的科学依据和教育内容。
        </p>
      </div>

      <Section title="功能定位">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50/60 rounded-xl p-4">
            <p className="font-semibold text-blue-700 mb-2">🎯 FoodAnalyzer</p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>快速评估，立即决策</li>
              <li>评分结果 + 简单标签</li>
              <li>操作导向</li>
            </ul>
          </div>
          <div className="bg-purple-50/60 rounded-xl p-4">
            <p className="font-semibold text-purple-700 mb-2">🔬 ScienceInsights</p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>深度解读，教育家长</li>
              <li>评分依据 + 权威来源</li>
              <li>知识导向</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="数据来源体系">
        <p className="text-sm text-gray-600 mb-4">科学解读页的数据分为三层：真实业务数据、权威参考数据库、评分规则引擎。</p>
        <div className="space-y-4">
          <DataSourceBox
            name="第一层：真实业务数据"
            icon="🗄️"
            status="ready"
            description="已通过 API 获取的用户和产品数据"
            fields={['孩子档案', '产品分析记录', '发育目标', '过敏原', '关注营养素']}
          />
          <DataSourceBox
            name="第二层：权威参考数据库"
            icon="📚"
            status="planned"
            description="需从管理后台配置的数据源导入"
            fields={['NIH ODS 分龄 RDA', '发育目标↔营养素映射', 'WHO/AHA 阈值表', '添加剂安全数据库']}
          />
          <DataSourceBox
            name="第三层：评分规则引擎"
            icon="⚙️"
            status="partial"
            description="四维个性化评分模型"
            fields={['营养密度', '风险成分', '加工程度', '阶段匹配']}
          />
        </div>
      </Section>

      <Section title="评分规则与模型（三层体系）">
        <div className="space-y-4">
          <ScoreLayer
            name="Nutri-Score（产品客观质量）"
            icon="🚦"
            weight="A-E 五级"
            description="由法国营养流行病学家开发，算法完全公开。将食品营养质量以 A（深绿）到 E（深红）五色等级直观展示。"
            example="原味无糖酸奶 → A 级（深绿）；儿童夹心饼干 → E 级（深红）"
          />
          <ScoreLayer
            name="NRF 分龄营养密度（内部排序）"
            icon="📈"
            weight="连续分值"
            description="学术界通用营养密度模型，用 NIH ODS 分龄 RDA 替代通用 DV，得到儿童专属的分龄 NRF 分。"
            example="搜索「酸奶」时，按当前孩子年龄段的 NRF 分排序，营养密度最高的排第一"
          />
          <ScoreLayer
            name="四维个性化评分（对该孩子适合程度）"
            icon="🎯"
            weight="0-100 总分"
            description="结合孩子档案与产品事实计算的个性化评分，包含四个维度：营养密度(40%)、风险成分(30%)、加工程度(20%)、阶段匹配(10%)"
            example="同一款含添加糖饼干：对 18 个月宝宝直接「不推荐」，对 5 岁孩子扣 5 分，对 12 岁孩子轻微扣分"
          />
        </div>
      </Section>

      <Section title="四维评分模型详解">
        <div className="grid grid-cols-2 gap-4">
          {[
            { dim: '营养密度', weight: '40%', desc: '排除糖/能量的营养素 %DV 累计', range: '0-40 分' },
            { dim: '风险成分', weight: '30%', desc: '添加糖 + 有害添加剂扣分', range: '0-30 分' },
            { dim: '加工程度', weight: '20%', desc: 'NOVA 等级映射（1=20分, 4=8分）', range: '0-20 分' },
            { dim: '阶段匹配', weight: '10%', desc: '产品营养素与孩子关注营养素的重合度', range: '0-10 分' },
          ].map((item) => (
            <div key={item.dim} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-700">{item.dim}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{item.weight}</span>
              </div>
              <p className="text-xs text-gray-500 mb-1">{item.desc}</p>
              <p className="text-xs font-mono text-gray-400">{item.range}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="页面功能模块设计">
        <div className="grid grid-cols-2 gap-4">
          <PageModule
            name="模块一：评分结果概览"
            icon="📊"
            description="整体评分展示"
            content="Nutri-Score 色条（产品客观质量）、四维个性化总分 + 等级、FDA Healthy 徽章（如通过）"
          />
          <PageModule
            name="模块二：分龄营养贡献"
            icon="🥗"
            description="营养满足度分析"
            content="产品各营养素的 %RDA（基于 NIH ODS 分龄数据），如「含 18% 每日钙推荐量（4-8岁）」"
          />
          <PageModule
            name="模块三：发育目标支持度"
            icon="🎯"
            description="个性化需求匹配"
            content="针对孩子选定的每个目标，展示支持程度（core/important/supporting），具体营养素贡献明细"
          />
          <PageModule
            name="模块四：风险成分解读"
            icon="⚠️"
            description="安全依据说明"
            content="列出风险成分，附权威来源说明（AAP/JECFA/FDA/EFSA），如「柠檬黄 — AAP建议儿童避免」"
          />
          <PageModule
            name="模块五：评分规则说明"
            icon="📖"
            description="教育内容"
            content="解释四维评分的权重和计算逻辑，引用 WHO/DGA/AHA 等指南作为依据"
          />
        </div>
      </Section>

      <Section title="数据模型需求">
        <p className="text-sm text-gray-600 mb-4">需要在数据库中补充以下表结构，以支持科学解读页的功能：</p>
        <div className="space-y-3">
          <RuleBox
            label="NutrientReference（分龄参考值表）"
            text="存储 NIH ODS 的分龄 RDA 数据，字段包括：nutrientId、ageGroup、sex、rdaAmount、unit、upperLimit、sourceUrl。用于计算产品营养素对该年龄段孩子的满足率。"
          />
          <RuleBox
            label="Threshold（阈值表）"
            text="存储 WHO/AHA 的阈值数据，字段包括：metric（糖/钠/脂肪）、ageGroup、whoValue、ahaValue、unit。用于解释高糖/高钠/高脂警示的依据。"
          />
          <RuleBox
            label="Additive（添加剂安全数据库）"
            text="扩展现有表，添加 INS 编号、JECFA ADI、FDA 状态、EFSA 状态、childRiskFlag 等字段。用于解释风险成分的安全依据。"
          />
          <RuleBox
            label="DevelopmentGoal ↔ KeyNutrient（目标营养素映射）"
            text="将 scoring.ts 中硬编码的 GOAL_NUTRIENT_MAP 迁移到数据库，支持动态配置。例如：骨骼目标 → 钙、维生素D、磷、蛋白质。"
          />
        </div>
      </Section>

      <Section title="API 需求">
        <RuleBox
          label="getScienceInsights API"
          text="后端新增端点，整合所有数据源：获取产品分析记录、孩子档案、NutrientReference 分龄 RDA、Additive 安全信息、Threshold WHO/AHA 阈值、DevelopmentGoal ↔ KeyNutrient 映射，返回整合后的科学解读数据。"
        />
      </Section>

      <Section title="实现路线图">
        <div className="bg-blue-50/60 rounded-xl p-4">
          <p className="font-semibold text-blue-700 mb-3">📋 开发步骤</p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li><strong>第一步（数据库）</strong>：扩展 schema.prisma，添加 NutrientReference、Threshold 表，扩展 Additive 表</li>
            <li><strong>第二步（数据导入）</strong>：从 NIH ODS API 导入分龄 RDA，从 JECFA/FDA/EFSA 导入添加剂安全数据</li>
            <li><strong>第三步（后端）</strong>：开发 getScienceInsights API，整合所有数据源</li>
            <li><strong>第四步（前端）</strong>：重构 ScienceInsights.tsx，替换硬编码数据为 API 调用</li>
            <li><strong>第五步（UI）</strong>：完善页面模块，添加教育内容和权威来源引用</li>
          </ol>
        </div>
      </Section>

      <Section title="与 FoodAnalyzer 的角色分工">
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-2 font-semibold">对比项</th>
                <th className="text-left px-4 py-2 font-semibold">FoodAnalyzer</th>
                <th className="text-left px-4 py-2 font-semibold">ScienceInsights</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['定位', '产品分析工具', '科学解释页面'],
                ['数据深度', '快速评估，立即决策', '深度解读，教育家长'],
                ['展示内容', '评分结果 + 简单标签', '评分依据 + 权威来源'],
                ['用户意图', '帮我判断这款好不好', '告诉我为什么好/不好'],
                ['调用时机', '扫描/搜索后直接显示', '用户点击"了解更多"后进入'],
              ].map(([item, fa, si]) => (
                <tr key={item} className="border-t border-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-700">{item}</td>
                  <td className="px-4 py-2 text-gray-600">{fa}</td>
                  <td className="px-4 py-2 text-gray-600">{si}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
