import React from 'react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-bold text-gray-700 border-b border-gray-100 pb-1 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function FlowStep({ num, title, desc, color }: { num: number; title: string; desc: string; color: string }) {
  return (
    <div className="flex gap-3">
      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm`} style={{ backgroundColor: color }}>
        {num}
      </div>
      <div>
        <p className="font-semibold text-gray-800 text-sm">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function FieldTable({ rows }: { rows: { field: string; type: string; desc: string; example: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <th className="text-left px-4 py-2 font-semibold">字段</th>
            <th className="text-left px-4 py-2 font-semibold">类型</th>
            <th className="text-left px-4 py-2 font-semibold">说明</th>
            <th className="text-left px-4 py-2 font-semibold">示例</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.field} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
              <td className="px-4 py-2 font-mono text-xs text-green-700">{r.field}</td>
              <td className="px-4 py-2 font-mono text-xs text-blue-600">{r.type}</td>
              <td className="px-4 py-2 text-gray-600">{r.desc}</td>
              <td className="px-4 py-2 font-mono text-xs text-gray-500">{r.example}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FoodAnalysisDoc() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-800">食品分析功能</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">🍽️ 核心功能</span>
        </div>
        <p className="text-sm text-gray-500">NutriKids Food Analyzer — 个性化食品评估系统</p>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          食品分析是 NutriKids 的核心功能，支持多种输入方式（搜索、拍照、扫码、拖拽），
          通过 AI 识别和个性化算法，为孩子提供针对性的食品评估报告。
        </p>
      </div>

      <Section title="整体流程图">
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl">🔍</div>
                <p className="text-xs text-gray-500 mt-1">搜索</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-2xl">📷</div>
                <p className="text-xs text-gray-500 mt-1">拍照</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl">📊</div>
                <p className="text-xs text-gray-500 mt-1">扫码</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-2xl">🖱️</div>
                <p className="text-xs text-gray-500 mt-1">拖拽</p>
              </div>
              <span className="text-2xl text-gray-300">→</span>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-2xl">🤖</div>
                <p className="text-xs text-gray-500 mt-1">识别/查询</p>
              </div>
              <span className="text-2xl text-gray-300">→</span>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-pink-100 flex items-center justify-center text-2xl">🧮</div>
                <p className="text-xs text-gray-500 mt-1">评分分析</p>
              </div>
              <span className="text-2xl text-gray-300">→</span>
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center text-2xl">📋</div>
                <p className="text-xs text-gray-500 mt-1">报告展示</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="输入方式详解">
        <div className="bg-blue-50/40 rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-blue-700 mb-2">🎯 统一搜索流程（所有输入方式共用）</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold bg-white px-2 py-1 rounded">本地数据库</span>
            <span className="text-gray-400">→</span>
            <span className="font-bold bg-white px-2 py-1 rounded">Open Food Facts</span>
            <span className="text-gray-400">→</span>
            <span className="font-bold bg-white px-2 py-1 rounded">AI 生成兜底</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">输入方式仅决定"如何获取食品名称/条形码"，后续搜索逻辑完全一致</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: '🔍', name: '搜索', desc: '用户在搜索框输入食品名称（防抖 250ms）→ GET /products/search?q=xxx → ①查本地 SQLite 库（name/nameZh 模糊匹配）→ ②未命中则调用 Open Food Facts 按名称搜索 → ③仍未命中则由大模型生成标准营养数据 → 返回产品供用户选择 → 选中后调用 POST /analyses 评分', api: 'GET /products/search', color: 'bg-blue-50 text-blue-700' },
            { icon: '📷', name: '图片识别/拖拽', desc: '①点击拍照触发相机拍摄；②从网页拖拽图片。前端将图片发送到 POST /recognize/photo（URL 走 POST /recognize/url 代理下载）→ 后端调用 MiniMax-M3 多模态模型识别图片 → 解析出食品名称/品牌/条形码 → 交给统一搜索流程（本地→OFF→AI）→ 返回识别结果和匹配产品', api: 'POST /recognize/photo / POST /recognize/url', color: 'bg-purple-50 text-purple-700' },
            { icon: '📊', name: '扫码/图片拖拽', desc: '扫描条形码（相机实时扫描）或拖图片到按钮（ZXing 从图片解码）→ 调用 GET /barcode/{code} → 统一搜索流程：①本地 SQLite 按 barcode 精确查找 → ②未命中调用 Open Food Facts API → ③仍未命中则用条形码对应的名称走 AI 生成 → 返回产品信息', api: 'GET /barcode/{code}', color: 'bg-green-50 text-green-700' },
          ].map(({ icon, name, desc, api, color }) => (
            <div key={name} className={`rounded-xl p-4 ${color}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{icon}</span>
                <span className="font-bold text-sm">{name}</span>
              </div>
              <p className="text-xs opacity-80 mb-2">{desc}</p>
              <code className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded">{api}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="图片识别流程（AI 大模型）">
        <div className="bg-purple-50/60 rounded-xl p-4">
          <p className="text-sm font-semibold text-purple-700 mb-3">📷 拍照/上传图片 → MiniMax M3 多模态模型 → 统一搜索流程</p>
          <div className="space-y-3">
            {[
              { num: 1, title: '图片上传', desc: '前端将图片文件通过 multipart/form-data 发送到 /recognize/photo', color: '#893ce3' },
              { num: 2, title: 'AI 识别', desc: '后端调用 MiniMax-M3 模型，传入图片和提示词，返回 JSON 格式的识别结果', color: '#a855f7' },
              { num: 3, title: '结果解析', desc: '模型返回：isFood、kind、nameEn、nameZh、brand、barcode、confidence、alternatives', color: '#c084fc' },
              { num: 4, title: '统一搜索', desc: '将识别出的条形码和名称列表传入 productFinder 统一搜索流程', color: '#d8b4fe' },
              { num: 5, title: '本地优先', desc: '优先查本地 SQLite 数据库（条形码精确匹配 / 名称模糊匹配）', color: '#e9d5ff' },
              { num: 6, title: 'OFF 回退', desc: '本地未命中则调用 Open Food Facts API 按名称搜索', color: '#f3e8ff' },
              { num: 7, title: 'AI 兜底', desc: 'OFF 也未命中则由大模型生成标准营养数据（见 generateProductNutrition）', color: '#f3e8ff' },
              { num: 8, title: '返回结果', desc: '返回识别信息 + 匹配到的产品，标记来源（local/off/ai）', color: '#f3e8ff' },
            ].map((step) => (
              <FlowStep key={step.num} {...step} />
            ))}
          </div>
        </div>
      </Section>

      <Section title="条形码查询流程（统一搜索）">
        <div className="bg-green-50/60 rounded-xl p-4">
          <p className="text-sm font-semibold text-green-700 mb-3">📊 扫码 → 统一搜索流程（本地 + OFF + AI 兜底）</p>
          <p className="text-xs text-gray-500 mb-4">
            <strong>前端入口：</strong>用户点击「扫码」按钮（摄像头实时扫描）或拖拽条形码照片到按钮上（ZXing 从图片解码）
            <br />
            <strong>后端接口：</strong>GET /barcode/{`{code}`}（见 server/src/routes/recognize.ts，底层调用 productFinder）
          </p>
          <div className="space-y-3">
            {[
              { num: 1, title: '获取条形码', desc: '方式A：摄像头实时扫描；方式B：拖拽图片到按钮，ZXing 从图片解码', color: '#22c55e' },
              { num: 2, title: '调用后端接口', desc: 'GET /barcode/{code}，传入条形码数字', color: '#4ade80' },
              { num: 3, title: '统一搜索入口', desc: '调用 productFinder.findProduct({ barcode }) 进入三层查找流程', color: '#86efac' },
              { num: 4, title: '本地数据库查询', desc: '优先在 SQLite 的 Product 表中按 barcode 字段精确查找', color: '#86efac' },
              { num: 5, title: '本地命中返回', desc: '找到则直接返回，标记 source: "local"', color: '#86efac' },
              { num: 6, title: '本地未命中', desc: '调用 Open Food Facts API：GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json', color: '#bbf7d0' },
              { num: 7, title: 'OFF 命中', desc: '将 OFF 的 nutriments 映射到 NutriKids 营养素字典，写入本地库，标记 source: "openfoodfacts"', color: '#dcfce7' },
              { num: 8, title: 'OFF 未命中', desc: '尝试用条形码对应的产品名称搜索 OFF，若仍失败则由大模型生成营养数据，标记 source: "ai"', color: '#f0fdf4' },
              { num: 9, title: '返回结果', desc: '返回产品信息和来源标记', color: '#f0fdf4' },
            ].map((step) => (
              <FlowStep key={step.num} {...step} />
            ))}
          </div>
        </div>
      </Section>

      <Section title="评分算法（后端 scoring.ts）">
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { name: '营养密度', weight: '40%', desc: '非糖/能量营养素的 %DV 总和', color: 'bg-blue-50 text-blue-700' },
            { name: '风险成分', weight: '30%', desc: '添加糖扣分 + 不良添加剂扣分', color: 'bg-red-50 text-red-700' },
            { name: '加工程度', weight: '20%', desc: 'NOVA 分级：1=20分, 2=17分, 3=15分, 4=8分', color: 'bg-orange-50 text-orange-700' },
            { name: '阶段匹配', weight: '10%', desc: '产品营养素与孩子关注营养素的重合度', color: 'bg-green-50 text-green-700' },
          ].map(({ name, weight, desc, color }) => (
            <div key={name} className={`rounded-xl p-3 ${color}`}>
              <p className="text-xs font-bold opacity-70">{weight}</p>
              <p className="font-semibold text-sm">{name}</p>
              <p className="text-xs mt-1 opacity-80">{desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-300 overflow-x-auto">
          {`// 评分计算公式
const overall = nutrientDensity + riskIngredients + processingLevel + stageMatch;

// 等级映射
grade = overall >= 80 ? 'Excellent'  // A 很棒
      : overall >= 60 ? 'Good'      // B 不错
      : overall >= 40 ? 'Fair'       // C 一般
      : 'Poor';                      // D 较差`}
        </div>
      </Section>

      <Section title="发育目标与营养素映射">
        <p className="text-xs text-gray-400 mb-3">每个发育目标关联特定营养素，用于计算目标支持度和 Sankey 图</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 1, icon: '📚', name: '学习专注', nutrients: '铁(1)、Omega-3(3)、B族(4)、锌(2)' },
            { id: 2, icon: '🦴', name: '骨骼健康', nutrients: '钙(5)、维生素D(6)、磷(7)、蛋白质(13)' },
            { id: 3, icon: '⚡', name: '日常能量', nutrients: '复合碳水(8)、B族(4)、铁(1)、钾(14)' },
            { id: 4, icon: '🛡️', name: '免疫力', nutrients: '维生素C(9)、维生素D(6)、锌(2)、维生素A(11)、硒(10)、B12(12)' },
            { id: 5, icon: '🫀', name: '肠道健康', nutrients: '锌(2)、维生素B12(12)' },
            { id: 6, icon: '🧠', name: '大脑发育', nutrients: 'Omega-3(3)、铁(1)、锌(2)、维生素B12(12)、B族(4)' },
          ].map((goal) => (
            <div key={goal.id} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{goal.icon}</span>
                <span className="font-semibold text-sm">{goal.name}</span>
              </div>
              <p className="text-xs text-gray-500">{goal.nutrients}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="前端展示结构（FoodAnalyzer 页面）">
        <div className="space-y-3">
          {[
            { num: 1, title: '食物评估（Section 1）', desc: '产品图片、综合评分、等级字母（A-D）、过敏原检测结果、益处/留意摘要' },
            { num: 2, title: '成长益处（Section 2）', desc: 'Sankey 流程图：发育目标 ↔ 营养素的流向关系，展示食物如何支持孩子成长' },
            { num: 3, title: '家长须知（Section 3）', desc: '需要留意的成分卡片（添加糖、香精、色素等）、NOVA 加工程度进度条' },
          ].map(({ num, title, desc }) => (
            <div key={num} className="flex gap-3 items-start">
              <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                {num}
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="关键 API 接口">
        <FieldTable rows={[
          { field: 'GET /products/search', type: 'Public', desc: '按名称搜索产品（前端搜索建议）', example: '/products/search?q=milk' },
          { field: 'POST /recognize/photo', type: 'Public', desc: '上传图片识别食品（调用 MiniMax）', example: 'multipart/form-data' },
          { field: 'POST /recognize/url', type: 'Public', desc: '按图片 URL 识别食品（跨域代理）', example: '{ "url": "https://..." }' },
          { field: 'GET /barcode/{code}', type: 'Public', desc: '条形码查询（本地+OFF）', example: '/barcode/6901234567890' },
          { field: 'POST /analyses', type: 'Auth', desc: '发起个性化评分（需要 JWT）', example: '{ "childId", "productId", "source" }' },
          { field: 'GET /analyses', type: 'Auth', desc: '获取历史分析记录', example: '返回最近 50 条' },
          { field: 'GET /analyses/{id}', type: 'Auth', desc: '获取单条分析详情', example: '/analyses/xxx-xxx' },
        ]} />
      </Section>

      <Section title="数据流转图">
        <div className="bg-blue-50/30 rounded-xl p-4">
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-700">前端输入</span>
              <span className="text-gray-400">→</span>
              <span className="font-medium text-gray-700">识别/查询 API</span>
              <span className="text-gray-400">→</span>
              <span className="font-medium text-gray-700">产品匹配</span>
              <span className="text-gray-400">→</span>
              <span className="font-bold text-purple-700">分析 API</span>
              <span className="text-gray-400">→</span>
              <span className="font-medium text-gray-700">评分计算</span>
              <span className="text-gray-400">→</span>
              <span className="font-bold text-green-700">报告展示</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-gray-400">📷 拍照</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-400">📊 扫码</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-400">🔍 搜索</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-400">🖱️ 拖拽</span>
              <span className="text-gray-400 ml-auto">→</span>
              <span className="text-gray-500">MiniMax AI</span>
              <span className="text-gray-400">+</span>
              <span className="text-gray-500">Open Food Facts</span>
              <span className="text-gray-400">+</span>
              <span className="text-gray-500">本地数据库</span>
            </div>
          </div>
        </div>
      </Section>

      <Section title="注意事项">
        <div className="space-y-2">
          {[
            { type: '⚠️', text: '图片识别依赖 MiniMax API Key，需在后端配置 MINIMAX_API_KEY 环境变量', color: 'text-amber-600' },
            { type: '⚠️', text: '条形码查询可能触发 Open Food Facts 调用，需确保服务器网络可访问外网', color: 'text-amber-600' },
            { type: '✅', text: '所有 API 调用都有错误处理，失败时会显示友好的错误提示', color: 'text-green-600' },
            { type: '✅', text: '分析结果会持久化到数据库，用户可查看历史记录', color: 'text-green-600' },
            { type: '🔄', text: '前端支持中英文切换，所有文案都有 i18n 翻译', color: 'text-blue-600' },
          ].map(({ type, text, color }, i) => (
            <div key={`${type}-${i}`} className="flex items-start gap-2 text-sm">
              <span className="font-bold" style={{ color }}>{type}</span>
              <span className="text-gray-600">{text}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
