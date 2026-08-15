const CATEGORY_ROWS = [
  { category: '面包', tag: 'en:breads', level: '父级', n: '43,858', p10: '37.0', p90: '69.869' },
  { category: '切片面包', tag: 'en:sliced-breads', level: '子级', n: '4,348', p10: '35.9', p90: '51.0' },
  { category: '小麦面包', tag: 'en:wheat-breads', level: '更具体', n: '1,928', p10: '40.3125', p90: '55.0' },
];

function Step({ no, title, text }: { no: string; title: string; text: string }) {
  return <div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">{no}</span><div><h4 className="font-bold text-slate-800">{title}</h4><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div></div>;
}

export default function CategoryBoundsComparison() {
  return <div className="mx-auto max-w-5xl">
    <header className="rounded-3xl bg-gradient-to-br from-slate-900 via-violet-950 to-violet-800 p-8 text-white shadow-lg md:p-10">
      <p className="text-sm font-semibold tracking-widest text-violet-200">食品分析文档 · 01.1</p>
      <h2 className="mt-3 text-3xl font-bold md:text-4xl">分类 P10/P90：新旧算法说明</h2>
      <p className="mt-4 max-w-3xl leading-7 text-violet-100">解释食品同时属于多个父子分类时，如何选择营养分布区间，以及为什么平台结果可能与 CSV 测试结果不同。</p>
    </header>

    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-violet-600">示例数据</p>
      <h3 className="mt-1 text-2xl font-bold">一个商品带有多个层级分类</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">Open Food Facts 通常会把具体分类及其父级一起放进 <code className="rounded bg-slate-100 px-1.5 py-0.5">categories_tags</code>。以下是当前参考统计文件中的碳水区间。</p>
      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">分类</th><th className="px-4 py-3">OFF tag</th><th className="px-4 py-3">层级</th><th className="px-4 py-3">样本数 n</th><th className="px-4 py-3">P10</th><th className="px-4 py-3">P90</th></tr></thead><tbody className="divide-y divide-slate-100">{CATEGORY_ROWS.map((row) => <tr key={row.tag}><td className="px-4 py-3 font-semibold">{row.category}</td><td className="px-4 py-3 font-mono text-xs text-slate-500">{row.tag}</td><td className="px-4 py-3">{row.level}</td><td className="px-4 py-3">{row.n}</td><td className="px-4 py-3">{row.p10}</td><td className="px-4 py-3">{row.p90}</td></tr>)}</tbody></table></div>
    </section>

    <section className="mt-8 grid gap-6 lg:grid-cols-2">
      <article className="rounded-2xl border-2 border-amber-200 bg-amber-50/60 p-6">
        <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-amber-700">旧算法</p><h3 className="mt-1 text-xl font-bold">全部分类取中位数</h3></div><span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">平台当前主流程</span></div>
        <div className="mt-6 space-y-5"><Step no="1" title="遍历所有分类" text="不区分父级和子级，把所有有统计数据的 categories_tags 视为平级候选。" /><Step no="2" title="收集全部区间" text="分别收集每个分类中当前营养素的 P10 和 P90。" /><Step no="3" title="分别取中位数" text="P10 取一组数的中位数，P90 再取另一组数的中位数。" /></div>
        <div className="mt-6 rounded-xl bg-white p-4 font-mono text-sm leading-7 text-slate-700 shadow-sm">P10 = median(37, 35.9, 40.3125) = <b>37</b><br />P90 = median(69.869, 51, 55) = <b>55</b></div>
        <p className="mt-4 text-sm leading-6 text-amber-900"><b>问题：</b>最终的 37～55 不属于表中的任何一个真实分类，是不同层级混合产生的人工区间。</p>
      </article>

      <article className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/60 p-6">
        <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-emerald-700">新算法</p><h3 className="mt-1 text-xl font-bold">最具体可靠分类 + 父级回退</h3></div><span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">建议统一规则</span></div>
        <div className="mt-6 space-y-5"><Step no="1" title="识别父子关系" text="根据 categories taxonomy 去掉只是其他分类祖先的 tag，找到真正的叶子分类。" /><Step no="2" title="检查可靠性" text="检查当前营养素是否有 P10、P90，并满足最低样本量，例如 n ≥ 30。" /><Step no="3" title="不可靠就向父级回退" text="沿 taxonomy 逐级向上查找，直到最近的可靠父分类。" /><Step no="4" title="只用一个分类" text="最终只使用被选中分类自身的一组 P10/P90，不与其他层级混合。" /></div>
        <div className="mt-6 rounded-xl bg-white p-4 text-sm leading-7 text-slate-700 shadow-sm"><span className="font-semibold">示意：</span><br /><span className="font-mono">小麦面包（不可靠） → 切片面包（可靠）</span><br />最终只用切片面包：<b>P10 = 35.9，P90 = 51.0</b></div>
        <p className="mt-4 text-sm leading-6 text-emerald-900"><b>优点：</b>区间有明确分类含义；样本不足时可以安全退回更宽泛的父级。</p>
      </article>
    </section>

    <section className="mt-8 rounded-2xl border border-violet-200 bg-violet-50 p-6">
      <h3 className="text-lg font-bold text-violet-950">为什么最终分数会不同？</h3>
      <p className="mt-2 text-sm leading-6 text-violet-900">营养素归一化使用 <code className="rounded bg-white px-1.5 py-0.5">(食品值 − P10) ÷ (P90 − P10)</code>。分类选择不同会直接改变 P10/P90，随后改变营养素得分、DevScore 和最终评分。差异来自参考区间选择，不一定来自食品营养值。</p>
    </section>

    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-bold">建议统一口径</h3>
      <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2"><p className="rounded-xl bg-slate-50 p-4"><b>1.</b> 平台、API 和 CSV 测试调用同一套分类选择函数。</p><p className="rounded-xl bg-slate-50 p-4"><b>2.</b> “可靠”统一为 P10/P90 有效且 n 达到阈值。</p><p className="rounded-xl bg-slate-50 p-4"><b>3.</b> 多个叶子或同层父级必须规定固定决胜规则。</p><p className="rounded-xl bg-slate-50 p-4"><b>4.</b> 调试结果记录选中分类、回退路径、n、P10 和 P90。</p></div>
    </section>

    <section className="mt-8 rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-6 shadow-sm md:p-8">
      <p className="text-sm font-semibold text-sky-700">基础概念</p>
      <h3 className="mt-1 text-2xl font-bold text-slate-900">P10 和 P90 是什么？</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">P10 和 P90 是百分位数，用于描述同一分类食品中某项营养素的常见分布范围。假设收集 100 个切片面包，并把每 100g 的钙含量从低到高排列：</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-sky-200 bg-white p-5"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-lg font-black text-sky-700">P10</span><div><h4 className="font-bold">相对较低的参考线</h4><p className="mt-1 text-sm text-slate-500">约有 10% 的同类产品低于这个数值。</p></div></div></article>
        <article className="rounded-2xl border border-indigo-200 bg-white p-5"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-lg font-black text-indigo-700">P90</span><div><h4 className="font-bold">相对较高的参考线</h4><p className="mt-1 text-sm text-slate-500">约有 90% 的同类产品低于这个数值，10% 高于它。</p></div></div></article>
      </div>

      <div className="mt-7 rounded-2xl bg-slate-900 p-6 text-white">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400"><span>较低</span><div className="h-px flex-1 bg-slate-700" /><span>同类食品常见范围</span><div className="h-px flex-1 bg-slate-700" /><span>较高</span></div>
        <div className="mt-4 grid grid-cols-[1fr_auto_4fr_auto_1fr] items-center"><div className="h-2 rounded-l-full bg-slate-700" /><div className="h-6 w-1 bg-sky-400" /><div className="h-2 bg-gradient-to-r from-sky-400 to-indigo-400" /><div className="h-6 w-1 bg-indigo-400" /><div className="h-2 rounded-r-full bg-slate-700" /></div>
        <div className="mt-2 grid grid-cols-[1fr_auto_4fr_auto_1fr] text-center text-xs"><span /><b className="text-sky-300">P10 = 20</b><span /><b className="text-indigo-300">P90 = 90</b><span /></div>
        <p className="mt-5 text-sm leading-6 text-slate-300">示例表示：大约 80% 的切片面包，其钙含量位于 20～90 mg/100g 之间。</p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h4 className="font-bold">系统如何使用这个区间？</h4>
        <p className="mt-2 text-sm leading-6 text-slate-600">如果某个面包的钙含量是 55 mg/100g：</p>
        <div className="mt-3 rounded-xl bg-slate-50 p-4 font-mono text-sm text-slate-700">(55 − 20) ÷ (90 − 20) = 35 ÷ 70 = <b>0.5</b></div>
        <p className="mt-3 text-sm leading-6 text-slate-600">说明它大致处于该分类参考区间的中间位置。</p>
      </div>

      <div className="mt-6 grid gap-3 text-sm leading-6 text-slate-700 md:grid-cols-2">
        <p className="rounded-xl bg-white p-4"><b>不是极值：</b>P10/P90 不是最低值和最高值，它们会排除两端少量极端数据。</p>
        <p className="rounded-xl bg-white p-4"><b>不是医学标准：</b>它们不代表推荐摄入量，也不表示达到 P90 就一定健康。</p>
        <p className="rounded-xl bg-white p-4"><b>用于同类比较：</b>它们反映当前食品在同类食品中的相对位置。</p>
        <p className="rounded-xl bg-white p-4"><b>依赖样本量：</b>样本数 n 太少时区间不稳定，需要回退到可靠父级。</p>
      </div>
    </section>
  </div>;
}
