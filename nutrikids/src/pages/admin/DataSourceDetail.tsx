import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { testDataSource, type DataSourceTestResult } from '../../services/data';
import OpenFoodFactsDoc from './OpenFoodFactsDoc';
import FoodAnalysisDoc from './FoodAnalysisDoc';

// ─── 公共组件 ────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-bold text-gray-700 border-b border-gray-100 pb-1 mb-3">{title}</h2>
      {children}
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

function SampleTable({ cols, rows }: { cols: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            {cols.map((c) => <th key={c} className="text-left px-4 py-2 font-semibold">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-gray-600 font-mono text-xs">{cell}</td>
              ))}
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

function ConnectTest({ id }: { id: string }) {
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle');
  const [result, setResult] = useState<DataSourceTestResult | null>(null);

  async function run() {
    setState('running');
    try {
      const r = await testDataSource(id);
      setResult(r);
    } catch (e) {
      setResult({ id, ok: false, status: 0, latencyMs: 0, contentType: null, bytes: 0, sample: null, error: String(e) });
    }
    setState('done');
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={run}
          disabled={state === 'running'}
          className="px-4 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold rounded-full transition-colors"
        >
          {state === 'running' ? '测试中…' : '立即测试连通性'}
        </button>
        {state === 'done' && result && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${result.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {result.ok ? `✓ 已连通 · HTTP ${result.status} · ${result.latencyMs}ms · ${(result.bytes / 1024).toFixed(1)}KB` : `✗ 连接失败 · ${result.error ?? `HTTP ${result.status}`}`}
          </span>
        )}
      </div>
      {state === 'done' && result?.sample && (
        <div className="mt-3 bg-white rounded-lg p-3 border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 mb-1">实际响应抽样</p>
          {result.sample.title && <p className="text-sm font-medium text-gray-700">{result.sample.title}</p>}
          {result.sample.excerpt && <p className="mt-1 text-xs text-gray-500 leading-relaxed">{result.sample.excerpt}…</p>}
        </div>
      )}
    </div>
  );
}

// ─── 各数据源内容 ─────────────────────────────────────────────────────────────

function NihOds() {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-800">NIH 膳食补充剂办公室</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">✓ 有 JSON/XML API</span>
        </div>
        <p className="text-sm text-gray-500">National Institutes of Health — Office of Dietary Supplements</p>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          4 个数据源中<strong>唯一提供结构化 API</strong> 的。它为每种营养素（维生素、矿物质）提供一份
          Fact Sheet 页面，页面内含按年龄段、性别细分的 RDA（膳食推荐量）和 UL（可耐受最高摄入量）表格。
          这是 NutriKids「分龄个性化评分」的<strong>核心参考数据</strong>。
        </p>
        <a href="https://ods.od.nih.gov/factsheets/list-all/" target="_blank" rel="noreferrer"
          className="inline-block mt-1 text-xs text-green-600 hover:underline">
          https://ods.od.nih.gov/factsheets/list-all/
        </a>
      </div>

      <Section title="API 接口">
        <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-300 leading-loose">
          <div className="text-gray-400"># 按营养素名查询 Fact Sheet（XML 格式）</div>
          GET https://ods.od.nih.gov/api/?resourcename=<span className="text-yellow-300">Calcium</span>&readinglevel=Consumer&outputformat=JSON
          <div className="mt-2 text-gray-400"># 可用 resourcename 值举例</div>
          <div>Calcium · Iron · Vitamin-D · Zinc · Magnesium · Vitamin-A · Folate</div>
          <div>Iodine · Selenium · Vitamin-B12 · Vitamin-C · Potassium · Sodium</div>
          <div className="mt-2 text-gray-400"># 返回格式（实测为 XML，忽略 outputformat=JSON 参数）</div>
          &lt;Factsheet&gt;&lt;Title&gt;Calcium&lt;/Title&gt;&lt;URL&gt;…&lt;/URL&gt;&lt;Content&gt;…HTML 正文…&lt;/Content&gt;&lt;/Factsheet&gt;
        </div>
      </Section>

      <Section title="连通性测试">
        <ConnectTest id="nih-ods" />
        <p className="mt-2 text-xs text-gray-400">注：该站点对非浏览器 UA 有 Cloudflare 质询，后端已自动回退至系统 curl 探测。</p>
      </Section>

      <Section title="数据结构 — 从 API 提取的核心表（NutrientReference）">
        <FieldTable rows={[
          { field: 'nutrient',     type: 'String',  desc: '营养素名称（英文）',         example: '"Calcium"' },
          { field: 'nutrientZh',  type: 'String',  desc: '营养素中文名',                example: '"钙"' },
          { field: 'ageGroup',    type: 'String',  desc: '年龄段',                      example: '"4-8 years"' },
          { field: 'sex',         type: 'String',  desc: '性别（M/F/Both）',            example: '"Both"' },
          { field: 'rdaAmount',   type: 'Float',   desc: '推荐摄入量（RDA）',           example: '1000' },
          { field: 'unit',        type: 'String',  desc: '单位',                        example: '"mg"' },
          { field: 'upperLimit',  type: 'Float?',  desc: '可耐受最高摄入量（UL）',      example: '2500' },
          { field: 'sourceUrl',   type: 'String',  desc: '原始 Fact Sheet 链接',        example: '"https://ods.od.nih.gov/…"' },
        ]} />
      </Section>

      <Section title="样例数据 — 钙（Calcium）按年龄段 RDA">
        <SampleTable
          cols={['年龄段', '性别', 'RDA (mg/天)', 'UL (mg/天)', '典型食物来源']}
          rows={[
            ['0–6 月',    '不分性别', '200 (AI)',  '1000', '母乳/配方奶'],
            ['7–12 月',   '不分性别', '260 (AI)',  '1500', '配方奶 + 辅食'],
            ['1–3 岁',    '不分性别', '700',       '2500', '奶制品、豆腐'],
            ['4–8 岁',    '不分性别', '1000',      '2500', '牛奶、芝士、西兰花'],
            ['9–13 岁',   '男',       '1300',      '3000', '牛奶、鱼罐头'],
            ['9–13 岁',   '女',       '1300',      '3000', '牛奶、坚果'],
            ['14–18 岁',  '男',       '1300',      '3000', '奶制品、豆类'],
            ['14–18 岁',  '女',       '1300',      '3000', '奶制品、绿叶菜'],
          ]}
        />
        <p className="mt-2 text-xs text-gray-400">AI = 适宜摄入量（无足够证据设 RDA 时使用）。数据来自 NIH ODS Calcium Fact Sheet，2024年版。</p>
      </Section>

      <Section title="样例数据 — 其他关键营养素 RDA（4-8 岁参考）">
        <SampleTable
          cols={['营养素', 'RDA (4-8 岁)', '单位', 'UL (4-8 岁)', '典型缺乏风险']}
          rows={[
            ['钙 Calcium',       '1000', 'mg',  '2500', '骨密度不足'],
            ['铁 Iron',           '10',  'mg',  '40',   '缺铁性贫血、认知'],
            ['锌 Zinc',           '5',   'mg',  '12',   '生长迟缓、免疫下降'],
            ['维生素 D',          '600', 'IU',  '3000', '佝偻病、骨折风险'],
            ['维生素 A',          '400', 'mcg', '900',  '视力、免疫功能'],
            ['维生素 C',          '25',  'mg',  '650',  '伤口愈合、铁吸收'],
            ['叶酸 Folate',       '200', 'mcg', '400',  '细胞分裂、神经管'],
            ['钾 Potassium',      '2300','mg',  '—',    '心肌功能、血压'],
            ['碘 Iodine',         '90',  'mcg', '300',  '甲状腺、智力发育'],
            ['维生素 B12',        '1.2', 'mcg', '—',    '素食儿童神经损伤'],
          ]}
        />
      </Section>

      <Section title="导入策略">
        <div className="grid grid-cols-3 gap-3 text-sm">
          {[
            { label: '工作量', value: '低 · 1-2天', color: 'bg-green-50 text-green-700' },
            { label: '更新频率', value: '低（数年才更新一次）', color: 'bg-blue-50 text-blue-700' },
            { label: '数据量', value: '~20 营养素 × 10 年龄段 ≈ 200条', color: 'bg-gray-50 text-gray-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-3 ${color}`}>
              <p className="text-xs font-semibold opacity-70 mb-0.5">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-600">
          推荐做法：逐个营养素调用 API（约 20 次请求）→ 从返回的 XML 正文里用正则解析 RDA 表格 →
          整理成 CSV → 通过 <code className="bg-gray-100 px-1 rounded text-xs">prisma db seed</code> 写入
          <code className="bg-gray-100 px-1 rounded text-xs">NutrientReference</code> 表。
          数据稳定，一次性导入后只需每隔 2-3 年复核一次。
        </p>
      </Section>

      <Section title="实际使用案例">
        <CaseBox
          title="案例：评估一杯酸奶对 6 岁女孩的钙满足度"
          steps={[
            '孩子档案：6 岁女孩，发育目标含「骨骼健康」',
            '从 NutrientReference 表查询：ageGroup="4-8 years", nutrient="Calcium" → RDA = 1000mg',
            '产品营养表：每 100g 酸奶含钙 120mg，每份 150g → 单份钙 = 180mg',
            '满足率 = 180 / 1000 = 18%，显示「含 18% 每日钙推荐量（4-8岁）」',
            '若孩子当天已从其他食物摄取 400mg 钙，累计 580mg，仍不足，评分小幅减分',
          ]}
        />
      </Section>
    </>
  );
}

function Jecfa() {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-800">JECFA 食品添加剂数据库</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">⚠ 仅 HTML 网站</span>
        </div>
        <p className="text-sm text-gray-500">Joint FAO/WHO Expert Committee on Food Additives</p>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          FAO/WHO 联合食品添加剂专家委员会，是全球<strong>食品添加剂安全评估的最高权威</strong>。
          每个添加剂都有 ADI（每日允许摄入量，mg/kg 体重）和安全结论。
          没有官方 API，需按 INS 编号逐一抓取或定向整理。
        </p>
        <a href="https://apps.who.int/food-additives-contaminants-jecfa-database/" target="_blank" rel="noreferrer"
          className="inline-block mt-1 text-xs text-green-600 hover:underline">
          https://apps.who.int/food-additives-contaminants-jecfa-database/
        </a>
      </div>

      <Section title="连通性测试">
        <ConnectTest id="jecfa" />
      </Section>

      <Section title="数据结构 — Additive 表（JECFA 字段部分）">
        <FieldTable rows={[
          { field: 'insNumber',       type: 'String',  desc: 'INS 国际编号（主键，跨数据源关联）', example: '"211"' },
          { field: 'nameEn',          type: 'String',  desc: '英文名称',                          example: '"Sodium benzoate"' },
          { field: 'nameZh',          type: 'String',  desc: '中文名称',                          example: '"苯甲酸钠"' },
          { field: 'jecfaAdiValue',   type: 'Float?',  desc: 'ADI 数值（mg/kg 体重/天）',         example: '5' },
          { field: 'jecfaAdiType',    type: 'String',  desc: 'ADI 类型',                          example: '"0-5 / Not specified / Not allocated"' },
          { field: 'jecfaConclusion', type: 'String',  desc: '安全结论',                          example: '"Acceptable"' },
          { field: 'jecfaEvalYear',   type: 'Int?',    desc: '最近评估年份',                      example: '1996' },
          { field: 'jecfaSession',    type: 'String?', desc: '评估会议编号',                      example: '"JECFA 46"' },
        ]} />
      </Section>

      <Section title="ADI 类型说明">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { type: '0–N mg/kg bw/day', color: 'bg-green-50', tc: 'text-green-700', desc: '有明确安全上限，最常见，如 "0-5" 表示每公斤体重每日不超过5mg' },
            { type: 'Not specified',     color: 'bg-blue-50',  tc: 'text-blue-700',  desc: '安全性良好，无需设上限，如MSG（谷氨酸钠）' },
            { type: 'Not allocated',     color: 'bg-amber-50', tc: 'text-amber-700', desc: '数据不充分，暂不能评估' },
            { type: 'Withdrawn',         color: 'bg-red-50',   tc: 'text-red-700',   desc: '已撤销评估或不再推荐使用' },
          ].map(({ type, color, tc, desc }) => (
            <div key={type} className={`${color} rounded-xl p-3`}>
              <p className={`text-xs font-bold font-mono ${tc} mb-1`}>{type}</p>
              <p className="text-xs text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="样例数据 — 常见添加剂 ADI">
        <SampleTable
          cols={['INS', '名称', '中文', 'ADI (mg/kg bw)', '评估年份', '分类']}
          rows={[
            ['102', 'Tartrazine',         '柠檬黄',     '0–7.5',          '1996 JECFA 46', '人工色素'],
            ['110', 'Sunset Yellow FCF',  '日落黄',     '0–4',            '2016 JECFA 82', '人工色素'],
            ['129', 'Allura Red AC',      '诱惑红',     '0–7',            '2016 JECFA 82', '人工色素'],
            ['200', 'Sorbic acid',        '山梨酸',     '0–25',           '1996 JECFA 46', '防腐剂'],
            ['211', 'Sodium benzoate',    '苯甲酸钠',   '0–5',            '1996 JECFA 46', '防腐剂'],
            ['250', 'Sodium nitrite',     '亚硝酸钠',   '0–0.07',         '2002 JECFA 59', '护色剂'],
            ['621', 'Monosodium glutamate','谷氨酸钠(MSG)', 'Not specified','1988 JECFA 33', '增味剂'],
            ['954', 'Saccharin',          '糖精钠',     '0–5',            '1993 JECFA 41', '甜味剂'],
            ['951', 'Aspartame',          '阿斯巴甜',   '0–40',           '2023 JECFA 96', '甜味剂'],
            ['407', 'Carrageenan',        '卡拉胶',     'Not specified',  '2014 JECFA 79', '增稠剂'],
          ]}
        />
        <p className="mt-2 text-xs text-gray-400">共约 2500+ 种物质收录于 JECFA 数据库；建议只导入 NutriKids 产品库实际出现的约 200-300 种。</p>
      </Section>

      <Section title="导入策略">
        <div className="grid grid-cols-3 gap-3 text-sm">
          {[
            { label: '工作量', value: '中 · 3-5天', color: 'bg-amber-50 text-amber-700' },
            { label: '更新频率', value: '低（每年2-3次会议更新）', color: 'bg-blue-50 text-blue-700' },
            { label: '建议覆盖', value: '~300 种高频添加剂', color: 'bg-gray-50 text-gray-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-3 ${color}`}>
              <p className="text-xs font-semibold opacity-70 mb-0.5">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-600">
          推荐做法：从 AAP 报告点名清单 + 中国 GB 2760 常见添加剂名单取交集 →
          手工/半自动查询 JECFA 数据库约 300 种物质 → 整理成 CSV →
          导入 Additive 表（与 FDA、EFSA 字段共存同一张表，INS 编号关联）。
        </p>
      </Section>

      <Section title="实际使用案例">
        <CaseBox
          title="案例：计算一包香肠中亚硝酸钠对 8 岁男孩的风险"
          steps={[
            '产品配料表解析到：亚硝酸钠（INS 250）',
            '从 Additive 表查询：ADI = 0.07 mg/kg bw/day',
            '孩子档案：8 岁男孩，体重 25kg',
            '每日允许摄入上限 = 0.07 × 25 = 1.75 mg',
            '产品每份（50g 香肠）含亚硝酸钠约 3.75mg（按 GB 2760 最大用量 0.075g/kg 估算）',
            '估算摄入 = 3.75mg >> 1.75mg 上限 → 风险成分，显示「⚠️ 超过 JECFA 儿童 ADI 上限」',
          ]}
        />
      </Section>
    </>
  );
}

function Fda() {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-800">FDA 食品添加剂法规状态清单</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">⚠ 仅 HTML 清单</span>
        </div>
        <p className="text-sm text-gray-500">U.S. Food and Drug Administration — Food Additive Status List</p>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          美国官方食品添加剂合规状态清单，核心价值是给出每种物质的<strong>美国法律地位</strong>
          （GRAS / 批准使用 / 禁止使用）和对应的 21 CFR 法规条款编号。
          与 JECFA 的安全科学评估互补——JECFA 说"科学上多少量安全"，FDA 说"美国法律上允不允许用"。
        </p>
        <a href="https://www.fda.gov/food/food-additives-petitions/food-additive-status-list" target="_blank" rel="noreferrer"
          className="inline-block mt-1 text-xs text-green-600 hover:underline">
          https://www.fda.gov/food/food-additives-petitions/food-additive-status-list
        </a>
      </div>

      <Section title="连通性测试">
        <ConnectTest id="fda" />
      </Section>

      <Section title="FDA 状态类别说明">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { type: 'GRAS', color: 'bg-green-50', tc: 'text-green-700', desc: 'Generally Recognized As Safe：行业公认安全，无需单独上市前审批，如食盐、糖、醋' },
            { type: '21 CFR 172–180', color: 'bg-blue-50', tc: 'text-blue-700', desc: '正式批准的食品添加剂，有具体条款规定允许使用的食品类型和最大用量' },
            { type: 'Color Additive', color: 'bg-purple-50', tc: 'text-purple-700', desc: '着色剂单独分类（21 CFR 74/81），须通过批号认证（FD&C 认证色素）' },
            { type: 'Prohibited / Banned', color: 'bg-red-50', tc: 'text-red-700', desc: '明确禁止使用，如溴酸钾（在面包中）、偶氮甲酰胺（部分国家允许）' },
          ].map(({ type, color, tc, desc }) => (
            <div key={type} className={`${color} rounded-xl p-3`}>
              <p className={`text-xs font-bold font-mono ${tc} mb-1`}>{type}</p>
              <p className="text-xs text-gray-600">{desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="数据结构 — Additive 表（FDA 字段部分）">
        <FieldTable rows={[
          { field: 'insNumber',    type: 'String',  desc: '主键，与 JECFA/EFSA 关联',     example: '"211"' },
          { field: 'nameEn',       type: 'String',  desc: 'FDA 清单中的英文名称',          example: '"Benzoic acid / Sodium benzoate"' },
          { field: 'casNumber',    type: 'String?', desc: 'CAS 化学文摘号',                example: '"65-85-0"' },
          { field: 'fdaStatus',    type: 'String',  desc: '法规状态',                      example: '"GRAS · 21 CFR 184.1733"' },
          { field: 'fdaCfrRef',    type: 'String?', desc: '21 CFR 条款号',                 example: '"184.1733"' },
          { field: 'fdaUseLimits', type: 'String?', desc: '用量限制（如适用）',            example: '"Max 0.1% in food"' },
          { field: 'fdaBanned',    type: 'Boolean', desc: '是否在美国禁用',                example: 'false' },
        ]} />
      </Section>

      <Section title="样例数据 — 常见添加剂 FDA 状态">
        <SampleTable
          cols={['INS', '名称', '中文', 'FDA 状态', '21 CFR 条款', '用量限制']}
          rows={[
            ['102', 'Tartrazine',         '柠檬黄',    'Approved Color', '21 CFR 74.705',  '适量'],
            ['110', 'Sunset Yellow',      '日落黄',    'Approved Color', '21 CFR 74.710',  '适量'],
            ['129', 'Allura Red AC',      '诱惑红',    'Approved Color', '21 CFR 74.340',  '适量'],
            ['200', 'Sorbic acid',        '山梨酸',    'GRAS',           '21 CFR 182.3089','≤0.2%'],
            ['211', 'Sodium benzoate',    '苯甲酸钠',  'GRAS',           '21 CFR 184.1733','≤0.1%'],
            ['250', 'Sodium nitrite',     '亚硝酸钠',  'Approved',       '21 CFR 172.175', '≤200ppm'],
            ['300', 'Ascorbic acid',      '抗坏血酸',  'GRAS',           '21 CFR 182.3013','适量'],
            ['407', 'Carrageenan',        '卡拉胶',    'GRAS',           '21 CFR 172.620', '适量'],
            ['951', 'Aspartame',          '阿斯巴甜',  'Approved',       '21 CFR 172.804', '按类别'],
            ['—',   'Potassium bromate',  '溴酸钾',    'NOT approved',   '—',              '面粉处理禁用'],
          ]}
        />
        <p className="mt-2 text-xs text-gray-400">注：EU 禁止的溴酸钾（Potassium bromate）在美国亦已明确不批准用于面粉，但 FDA 清单标注方式与欧盟有差异。</p>
      </Section>

      <Section title="FDA × JECFA × EFSA 三方对照的价值">
        <div className="bg-amber-50/60 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-700 mb-2">🔁 三方不一致 = NutriKids 的差异化内容</p>
          <SampleTable
            cols={['添加剂', 'JECFA ADI', 'FDA 状态', 'EFSA / EU 状态', 'NutriKids 标签建议']}
            rows={[
              ['诱惑红 E129',     '0-7 mg/kg', 'Approved', '须儿童警示标签',    '⚠️ EU要求警示 / AAP建议避免'],
              ['溴酸钾',          '无 ADI',    '禁用',     '禁用',              '🚫 国际主流均禁止'],
              ['安赛蜜 E950',     '0-15mg/kg', 'Approved', 'Authorized',       '✓ 国际通行'],
              ['阿斯巴甜 E951',   '0-40mg/kg', 'Approved', '2023再评估关注',   '⚠️ 2023 JECFA争议 / 0-7岁慎用'],
            ]}
          />
        </div>
      </Section>

      <Section title="实际使用案例">
        <CaseBox
          title="案例：一款儿童饼干含诱惑红（Allura Red）"
          steps={[
            '产品配料表解析到：诱惑红（INS 129 / FD&C Red 40）',
            'FDA 状态：Approved（合法使用）',
            'EFSA 状态：EU 批准但须"可能对儿童的活动及注意力产生不良影响"警示标签',
            'AAP 添加剂报告：明确列为儿童应减少摄入的人工色素，childRiskFlag = true',
            'NutriKids 输出：风险卡片显示「⚠️ 人工色素 · 美国合法 · EU须儿童警示 · AAP建议儿童避免」',
            '不直接扣分，但纳入风险维度扣 1-3 分，并附可信来源说明',
          ]}
        />
      </Section>
    </>
  );
}

function Efsa() {
  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-800">EFSA 欧洲食品安全局评估</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">⚠ HTML/PDF + EU 数据库</span>
        </div>
        <p className="text-sm text-gray-500">European Food Safety Authority — Food Additives</p>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          欧盟食品安全权威机构，对所有 E 编号添加剂进行系统评估。
          核心价值：欧盟监管比美国更严格，<strong>E 编号体系覆盖约 330 种添加剂</strong>，
          包括若干美国允许但欧盟禁止或须警示的物质。
          结构化数据来自欧委会联合研究中心（JRC）维护的 EU Food Additives Database。
        </p>
        <a href="https://www.efsa.europa.eu/en/topics/topic/food-additives" target="_blank" rel="noreferrer"
          className="inline-block mt-1 text-xs text-green-600 hover:underline">
          https://www.efsa.europa.eu/en/topics/topic/food-additives
        </a>
      </div>

      <Section title="连通性测试">
        <ConnectTest id="efsa" />
      </Section>

      <Section title="数据结构 — Additive 表（EFSA 字段部分）">
        <FieldTable rows={[
          { field: 'insNumber',       type: 'String',  desc: '主键，INS/E 编号去掉 E 前缀',  example: '"102"' },
          { field: 'eNumber',         type: 'String?', desc: 'E 编号（欧盟标识）',            example: '"E102"' },
          { field: 'nameEu',          type: 'String?', desc: 'EU 官方名称',                  example: '"Tartrazine"' },
          { field: 'efsaStatus',      type: 'String',  desc: 'EU 批准状态',                  example: '"Authorized / Not authorized"' },
          { field: 'efsaReevalStatus',type: 'String?', desc: '再评估状态',                   example: '"Re-evaluation completed / Ongoing"' },
          { field: 'childWarning',    type: 'Boolean', desc: '是否须儿童活动警示标签',        example: 'true' },
          { field: 'childWarningText',type: 'String?', desc: '警示标签原文',                 example: '"may have an adverse effect on activity…"' },
          { field: 'ukPostBrexit',    type: 'String?', desc: '英国脱欧后独立状态',           example: '"Banned"' },
        ]} />
      </Section>

      <Section title="样例数据 — EU 添加剂评估状态">
        <SampleTable
          cols={['E编号', '中文', 'EU状态', '再评估', '儿童警示', '英国状态']}
          rows={[
            ['E102', '柠檬黄',       '批准',    '完成-维持',   '⚠️ 是', '批准'],
            ['E104', '喹啉黄',       '批准',    '进行中',      '无',    '禁止(脱欧后)'],
            ['E110', '日落黄',       '批准',    '完成-维持',   '⚠️ 是', '批准'],
            ['E122', '偶氮玉红',     '批准',    '完成-维持',   '⚠️ 是', '批准'],
            ['E124', '胭脂红 4R',    '批准',    '完成-维持',   '⚠️ 是', '批准'],
            ['E129', '诱惑红',       '批准',    '完成-维持',   '⚠️ 是', '批准'],
            ['E211', '苯甲酸钠',     '批准',    '完成-维持',   '无',    '批准'],
            ['E250', '亚硝酸钠',     '批准',    '进行中',      '无',    '批准'],
            ['E621', '谷氨酸钠',     '批准',    '完成-维持',   '无',    '批准'],
            ['E951', '阿斯巴甜',     '批准',    '2023关注',    '无',    '批准'],
            ['E952', '环己氨基磺酸钠','不批准',  '—',           '—',    '不批准'],
          ]}
        />
        <p className="mt-2 text-xs text-gray-400">
          ⚠️ 儿童警示：E102、E110、E122、E124、E129、E155（日落黄、柠檬黄等六种色素），
          EU 法规强制要求在产品标签上注明「可能对儿童的活动及注意力产生不良影响」。
        </p>
      </Section>

      <Section title="E 编号 × INS 编号关系">
        <div className="bg-blue-50/60 rounded-xl p-4 text-sm text-gray-600">
          <p className="font-semibold text-blue-700 mb-2">📐 编号系统对应规则</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>E 编号 = "E" 前缀 + INS 编号数字，例如 E211 对应 INS 211（苯甲酸钠）</li>
            <li>少数情况下欧盟和 Codex 编号有偏差，需手工确认（约 20-30 种）</li>
            <li>因此 Additive 表用 <code className="bg-white px-1 rounded">insNumber</code> 作主键可同时关联 JECFA/FDA/EFSA 三个数据集</li>
          </ul>
        </div>
      </Section>

      <Section title="实际使用案例">
        <CaseBox
          title="案例：一款进口糖果含 E104（喹啉黄）"
          steps={[
            '产品配料表：Quinoline Yellow（E104）',
            'EFSA 状态：EU 批准但再评估进行中',
            'FDA 状态：美国 NOT approved（喹啉黄未获 FDA 批准），实际上是欧美分裂品种',
            'UK 状态：英国脱欧后已禁止（2022 年禁令生效）',
            'AAP 状态：未点名，但属于人工合成色素类别，childRiskFlag 视实施策略可选置位',
            'NutriKids 输出：「⚠️ 合成色素 · EU批准中 · 美国不批准 · 英国已禁止 · 儿童慎选」',
          ]}
        />
      </Section>
    </>
  );
}

// ─── 路由出口 ─────────────────────────────────────────────────────────────────

const PAGES: Record<string, () => React.ReactElement> = {
  'nih-ods': NihOds,
  jecfa: Jecfa,
  fda: Fda,
  efsa: Efsa,
  off: OpenFoodFactsDoc,
  'food-analysis': FoodAnalysisDoc,
};

export default function DataSourceDetail() {
  const { id = '' } = useParams<{ id: string }>();
  const Page = PAGES[id];
  if (!Page) return <Navigate to="/admin/datasources/nih-ods" replace />;
  return (
    <div className="max-w-4xl">
      <Page />
    </div>
  );
}
