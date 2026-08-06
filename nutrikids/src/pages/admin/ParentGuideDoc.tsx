import { AnalysisTabs, DataTable, Formula, InfoCard, PageHero, Section } from './FoodAnalysisDoc';

const ages = ['0–6月', '7–12月', '1–3岁', '4–8岁', '9–13岁', '14–18岁'];

export default function ParentGuideDoc() {
  return <div className="mx-auto max-w-6xl">
    <AnalysisTabs />
    <PageHero index="03" title="家长须知：提醒、过敏与加工判断" subtitle="这一页解释结果页为什么会出现“添加糖、钠、饱和脂肪、人工色素”等提醒，以及为什么过敏命中会直接改变推荐结论。提醒采用明确规则，不由大模型自由生成。" accent="amber" />

    <Section eyebrow="SAFETY FIRST" title="过敏原是独立的安全否决">
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <InfoCard title="匹配规则" tone="rose">产品关联表中 <code>present = true</code> 的过敏原，与孩子档案中的过敏原 ID 求交集。命中列表返回名称、中文名、代码与图标。</InfoCard>
        <InfoCard title="推荐规则" tone="amber"><Formula>matchedAllergens.length = 0 → recommended<br />matchedAllergens.length &gt; 0 → not_recommended</Formula><p className="mt-3">过敏命中不会偷偷修改食品总分；它以更高优先级单独否决推荐，因此“分数较高但不推荐”是允许且必要的结果。</p></InfoCard>
      </div>
    </Section>

    <Section eyebrow="AGE THRESHOLDS" title="三项定量提醒的年龄阈值">
      <DataTable headers={['年龄段', '添加糖：每份提示线 / 日参考上限', '钠：每份提示线 / 日上限', '饱和脂肪：每份提示线 / 日上限']} rows={ages.map((age, index) => {
        const sugarT = [1, 1, 3, 5, 5, 5][index];
        const sugarL = [0, 0, 12, 25, 25, 25][index];
        const sodiumT = [50, 100, 200, 300, 400, 500][index];
        const sodiumL = [200, 370, 800, 1200, 1500, 1800][index];
        const satT = [1, 1, 2, 2.5, 3, 4][index];
        const satL = [null, null, 8, 10, 13, 16][index];
        return [age, `${sugarT}g / ${sugarL === 0 ? '不建议添加糖' : `${sugarL}g`}`, `${sodiumT}mg / ${sodiumL}mg`, `${satT}g / ${satL === null ? '暂无明确上限' : `${satL}g`}`];
      })} />
      <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900"><b>比较口径：</b>阈值与产品的“每份 value”比较，条件为严格大于（添加糖代码当前为大于等于）。若 serving size 可解析为 g/ml，会从每 100g 换算到每份；无法解析时以 100g / 100ml 为参考口径并在页面标明。</div>
    </Section>

    <Section eyebrow="RULE ENGINE" title="其他成分提醒怎么触发">
      <DataTable headers={['提醒', '判定依据', '典型命中']} rows={[
        ['人工香精', '配料名、添加剂类型或 OFF 添加剂标签', 'flavor / 香精 / 提取物；E620–E625、E635'],
        ['人工色素', '配料名、添加剂类型或 E 编号清单', 'E102、E110、E122、E124、E129、E133 等'],
        ['防腐剂', '配料关键词或 E 编号清单', 'benzoate / sorbate；E200、E202、E210–E213、E220、E249–E252'],
        ['反式脂肪', '配料关键词或标签', 'hydrogenated / 氢化；E471、E472'],
        ['果葡糖浆', '配料关键词', 'fructose corn / 果葡 / 高果糖'],
        ['添加剂类别', 'additive_categories.json 分类', '抗氧化剂、酸度调节剂、增稠/乳化剂、增味剂、甜味剂'],
        ['加工程度', 'Open Food Facts 的 NOVA 值', 'NOVA 1–2 低加工，3 加工，4 超加工；当前摘要分映射为 20/17/15/8'],
      ]} />
    </Section>

    <Section eyebrow="REPLAYABLE CASE" title="案例：4–8 岁儿童的一份夹心谷物棒">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InfoCard title="产品每份" tone="slate">添加糖 6g、钠 340mg、饱和脂肪 2.2g；配料含 E322、天然香料；标注含牛奶。</InfoCard>
        <InfoCard title="阈值比较" tone="amber">添加糖 <code>6 ≥ 5</code>：提示；钠 <code>340 &gt; 300</code>：提示；饱和脂肪 <code>2.2 ≤ 2.5</code>：不提示。</InfoCard>
        <InfoCard title="成分类别" tone="blue">香料关键词触发“人工香精/加工标志”卡；其他添加剂根据分类字典展示，不能仅凭 E 编号断言有害。</InfoCard>
        <InfoCard title="最终建议" tone="rose">孩子档案若勾选牛奶过敏，产品牛奶过敏原命中，因此 <code>not_recommended</code>，无论食品总分是多少。</InfoCard>
      </div>
    </Section>

    <Section eyebrow="DATA SOURCES" title="每一种提醒的数据源与边界">
      <DataTable headers={['用途', '数据源', '系统如何使用', '边界']} rows={[
        ['产品事实', 'Open Food Facts；本地缓存；极端缺失时 AI 兜底', '读取 serving size、营养、配料、过敏原、添加剂、NOVA', '用户贡献型数据库可能缺字段；AI 生成产品会标记 isAiGenerated，不能当作已核验标签'],
        ['添加糖年龄规则', '美国膳食指南 / AHA 儿童添加糖建议转成代码常量', '0–12 月参考上限为 0；1–3 岁 12g；4 岁以上 25g', '这是提醒参考线，不是个人医疗处方'],
        ['钠与饱和脂肪', 'WHO / CDC 营养建议转成分龄常量', '按每份值与提示线比较，并展示日上限', '婴儿饱和脂肪未设页面日上限'],
        ['添加剂风险集合', 'ANSES / EFSA 评估整理结果', 'harmful_additives_reference.json 用于 C/D/E 总分扣分', '“出现添加剂”与“有害添加剂命中”是两个概念'],
        ['过敏原', 'OFF 标签 + 本地标准化过敏原表 + 儿童档案', '产品 present 过敏原与孩子过敏原精确匹配', '痕量污染、标签遗漏或交叉接触仍需以包装和医生建议为准'],
      ]} />
    </Section>

    <div className="mt-10 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-900"><b>面向家长的最终提示：</b>有严重食物过敏、代谢性疾病或特殊医学膳食需求时，不应只依赖 App 结果；请核对实物包装，并遵循儿科医生或注册营养师建议。</div>
  </div>;
}
