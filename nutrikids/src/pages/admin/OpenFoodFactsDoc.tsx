import React from 'react';

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

export default function OpenFoodFactsDoc() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-800">Open Food Facts API</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">✓ 有 REST API v2</span>
        </div>
        <p className="text-sm text-gray-500">Open Food Facts — Crowdsourced Food Product Database</p>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          全球最大的开源食品数据库，收录超过 300 万种产品，涵盖营养成分、过敏原、添加剂、
          Nutri-Score、NOVA 加工分级等信息。无需 API Key，免费使用。
          NutriKids 通过条形码查询自动从该数据库导入产品信息。
        </p>
        <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer"
          className="inline-block mt-1 text-xs text-green-600 hover:underline">
          https://world.openfoodfacts.org
        </a>
      </div>

      <Section title="API 接口">
        <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-300 leading-loose">
          <div className="text-gray-400"># 按条形码查询产品（核心端点）</div>
          GET https://world.openfoodfacts.org/api/v2/product/<span className="text-yellow-300">{`{barcode}`}</span>
          <div className="mt-2 text-gray-400"># 限制返回字段（推荐，减少响应体积）</div>
          GET https://world.openfoodfacts.org/api/v2/product/<span className="text-yellow-300">{`{barcode}`}</span>.json?fields=<span className="text-cyan-300">product_name,product_name_zh,brands,image_front_url,nova_group,nutriscore_grade,quantity,serving_size,nutriments,allergens_tags</span>
          <div className="mt-2 text-gray-400"># 可选：指定语言获取本地化名称</div>
          GET https://<span className="text-yellow-300">cn</span>.openfoodfacts.org/api/v2/product/<span className="text-yellow-300">{`{barcode}`}</span>
          <div className="mt-2 text-gray-400"># 搜索产品（非条形码查询）</div>
          GET https://world.openfoodfacts.org/api/v2/search?q=<span className="text-yellow-300">milk</span>&amp;fields=<span className="text-cyan-300">code,product_name,brands</span>&amp;page_size=10
        </div>
      </Section>

      <Section title="请求参数（fields 参数详解）">
        <div className="bg-blue-50/60 rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-blue-700 mb-2">💡 关键提示</p>
          <p className="text-xs text-gray-600">
            产品对象包含 200+ 字段，未指定 fields 时返回全部数据（约 50KB+）。
            生产环境<strong>必须指定 fields</strong>，仅请求所需字段可大幅提升性能。
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-400 mb-2">基本信息字段</p>
            <ul className="space-y-1">
              {['product_name', 'product_name_zh', 'brands', 'categories', 'quantity', 'serving_size', 'image_front_url'].map((f) => (
                <li key={f} className="font-mono text-xs text-green-700">{f}</li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-400 mb-2">评分与分级字段</p>
            <ul className="space-y-1">
              {['nutriscore_grade', 'nova_group', 'nutrient_levels', 'nutrition_grades'].map((f) => (
                <li key={f} className="font-mono text-xs text-green-700">{f}</li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-400 mb-2">营养成分字段</p>
            <ul className="space-y-1">
              {['nutriments', 'energy-kcal_100g', 'proteins_100g', 'carbohydrates_100g', 'sugars_100g', 'fat_100g'].map((f) => (
                <li key={f} className="font-mono text-xs text-green-700">{f}</li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-400 mb-2">配料与过敏原字段</p>
            <ul className="space-y-1">
              {['ingredients_text', 'allergens', 'allergens_tags', 'additives_tags', 'labels_tags'].map((f) => (
                <li key={f} className="font-mono text-xs text-green-700">{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="响应数据结构">
        <FieldTable rows={[
          { field: 'code',                  type: 'String',   desc: '产品条形码',                     example: '"3017624010701"' },
          { field: 'status',                type: 'Int',      desc: '状态码：1=找到，0=未找到',        example: '1' },
          { field: 'status_verbose',        type: 'String',   desc: '状态描述',                        example: '"product found"' },
          { field: 'product.product_name',  type: 'String',   desc: '产品英文名',                     example: '"Nutella"' },
          { field: 'product.product_name_zh',type: 'String?', desc: '产品中文名（可能为空）',          example: '"能多益巧克力酱"' },
          { field: 'product.brands',        type: 'String',   desc: '品牌名（逗号分隔多个）',          example: '"Ferrero, Nutella"' },
          { field: 'product.image_front_url',type: 'String?', desc: '产品正面图 URL',                  example: '"https://images.openfoodfacts.org/images/products/..."' },
          { field: 'product.nova_group',    type: 'Int?',     desc: 'NOVA 加工分级（1-4）',            example: '4' },
          { field: 'product.nutriscore_grade',type: 'String?',desc: 'Nutri-Score 等级（A-E）',         example: '"e"' },
          { field: 'product.quantity',      type: 'String?',  desc: '净含量',                         example: '"350g"' },
          { field: 'product.serving_size',  type: 'String?',  desc: '建议食用份量',                   example: '"30g"' },
          { field: 'product.allergens_tags',type: 'String[]', desc: '过敏原标签数组',                  example: '["en:milk","en:hazelnuts"]' },
          { field: 'product.nutriments',    type: 'Object',   desc: '营养成分对象（含 _100g 后缀）',  example: '{ proteins_100g: 7.5, sugars_100g: 56.3 }' },
        ]} />
      </Section>

      <Section title="nutriments 对象字段说明">
        <p className="text-xs text-gray-400 mb-3">营养成分以每 100g 为单位存储，字段命名规则：{`{nutrient}_{unit}_100g`}</p>
        <SampleTable
          cols={['OFF 字段名', 'NutriKids 营养素 ID', '中文名称', '单位', '儿童每日参考值']}
          rows={[
            ['proteins_100g',       '13', '蛋白质',   'g',   '30'],
            ['sugars_100g',         '15', '糖',       'g',   '25'],
            ['energy-kcal_100g',    '16', '热量',     'kcal','1600'],
            ['calcium_100g',        '5',  '钙',       'mg',  '1000'],
            ['iron_100g',           '1',  '铁',       'mg',  '10'],
            ['zinc_100g',           '2',  '锌',       'mg',  '5'],
            ['potassium_100g',      '14', '钾',       'mg',  '2300'],
            ['vitamin-c_100g',      '9',  '维生素C',  'mg',  '25'],
            ['vitamin-d_100g',      '6',  '维生素D',  'μg',  '15'],
            ['vitamin-a_100g',      '11', '维生素A',  'μg',  '400'],
            ['vitamin-b12_100g',    '12', '维生素B12','μg',  '1.8'],
            ['salt_100g',           '17', '盐',       'g',   '2'],
            ['fat_100g',            '18', '脂肪',     'g',   '25'],
            ['saturated-fat_100g',  '19', '饱和脂肪', 'g',   '10'],
            ['fiber_100g',          '20', '膳食纤维', 'g',   '25'],
          ]}
        />
      </Section>

      <Section title="allergens_tags 过敏原映射">
        <p className="text-xs text-gray-400 mb-3">OFF 使用 en: 前缀的标准化标签，需要映射到 NutriKids 的内部过敏原代码</p>
        <SampleTable
          cols={['OFF 标签', 'NutriKids 代码', '中文名称']}
          rows={[
            ['en:milk',         'milk',        '牛奶'],
            ['en:eggs',         'egg',         '鸡蛋'],
            ['en:soybeans',     'soy',         '大豆'],
            ['en:gluten',       'wheat',       '小麦/麸质'],
            ['en:nuts',         'tree-nuts',   '坚果'],
            ['en:peanuts',      'peanuts',     '花生'],
            ['en:fish',         'fish',        '鱼类'],
            ['en:shellfish',    'shellfish',   '甲壳类'],
            ['en:sesame-seeds', 'sesame',      '芝麻'],
            ['en:celery',       'celery',      '芹菜'],
            ['en:mustard',      'mustard',     '芥末'],
            ['en:lupin',        'lupin',       '羽扇豆'],
          ]}
        />
      </Section>

      <Section title="完整响应示例（简化版）">
        <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-300 overflow-x-auto">
          {`{
  "code": "3017624010701",
  "status": 1,
  "status_verbose": "product found",
  "product": {
    "product_name": "Nutella",
    "product_name_zh": "能多益巧克力酱",
    "brands": "Ferrero",
    "image_front_url": "https://images.openfoodfacts.org/images/products/301/762/401/0701/front_en.4.100.jpg",
    "quantity": "350g",
    "serving_size": "30g",
    "nova_group": 4,
    "nutriscore_grade": "e",
    "allergens_tags": ["en:milk", "en:hazelnuts", "en:soybeans"],
    "nutriments": {
      "energy-kcal_100g": 539,
      "proteins_100g": 7.5,
      "carbohydrates_100g": 57.5,
      "sugars_100g": 56.3,
      "fat_100g": 30.9,
      "saturated-fat_100g": 10.6,
      "salt_100g": 0.11,
      "fiber_100g": 3.1,
      "calcium_100g": 130,
      "iron_100g": 1.3,
      "zinc_100g": 1.5
    }
  }
}`}
        </div>
      </Section>

      <Section title="导入策略">
        <div className="grid grid-cols-3 gap-3 text-sm">
          {[
            { label: '触发时机', value: '条形码查询未命中本地库时', color: 'bg-blue-50 text-blue-700' },
            { label: '数据量',   value: '按需导入，每次1条',         color: 'bg-gray-50 text-gray-600' },
            { label: '更新频率', value: '导入后标记为未验证',         color: 'bg-amber-50 text-amber-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-3 ${color}`}>
              <p className="text-xs font-semibold opacity-70 mb-0.5">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-600">
          推荐做法：用户扫描条形码 → 查询本地数据库 → 未命中时调用 OFF API → 
          将返回数据转换为 NutriKids 数据模型（见 OFF_NUTRIENT_MAP 映射）→ 
          写入 Product、ProductNutrient、ProductAllergen 表 → 标记 verified=false。
        </p>
      </Section>

      <Section title="实际使用案例">
        <CaseBox
          title="案例：用户扫描一包牛奶的条形码"
          steps={[
            '用户扫描条形码：6901234567890',
            '后端查询本地数据库：未找到该条形码',
            '调用 OFF API：GET https://world.openfoodfacts.org/api/v2/product/6901234567890.json?fields=...',
            'OFF 返回：product_name="Pure Milk", brands="Mengniu", nutriscore_grade="b", nova_group=1',
            '映射营养成分：proteins_100g=3.2 → ProductNutrient(nutrientId=13, value=3.2, unit="g", dailyValue=11)',
            '映射过敏原：allergens_tags=["en:milk"] → ProductAllergen(allergenId=milk)',
            '创建 Product 记录，返回给前端进行分析',
          ]}
        />
      </Section>

      <Section title="注意事项">
        <div className="space-y-2">
          {[
            { type: '⚠️', text: '中文数据覆盖有限：约 30% 的产品有中文名称，其余仅返回英文', color: 'text-amber-600' },
            { type: '⚠️', text: '数据质量依赖众包：部分产品信息不完整或有误，需人工审核', color: 'text-amber-600' },
            { type: '✅', text: '无需认证：公开 API，直接调用即可', color: 'text-green-600' },
            { type: '✅', text: '限流友好：官方建议 3 次/秒，实际可更高', color: 'text-green-600' },
            { type: '🔄', text: '多语言支持：使用 cn.openfoodfacts.org 获取中文优先数据', color: 'text-blue-600' },
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