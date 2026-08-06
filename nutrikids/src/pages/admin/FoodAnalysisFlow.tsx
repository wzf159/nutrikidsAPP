const INPUTS = [
  { icon: '⌨️', title: '搜索食品', text: '用户输入食品名称或关键词。' },
  { icon: '▦', title: '扫描条码', text: '读取包装上的商品条码。' },
  { icon: '📷', title: '拍照识别', text: '上传食品或配料表图片。' },
];

const FLOW = [
  { no: '01', title: '接收用户输入', text: '食品分析页面收集搜索文字、条码或图片，并附带当前选择的儿童档案。', tag: '前端页面' },
  { no: '02', title: '识别食品身份', text: '服务端把不同输入整理为统一的食品查询请求，确定商品或食品的基本身份。', tag: '识别服务' },
  { no: '03', title: '汇集食品资料', text: '优先读取本地产品库；资料不足时补充外部食品数据，统一名称、配料、营养和过敏原字段。', tag: '数据服务' },
  { no: '04', title: '读取儿童档案', text: '取得年龄、成长阶段、关注目标、重点营养素和过敏原等个性化背景。', tag: '用户数据' },
  { no: '05', title: '生成分析结果', text: '分析服务组合食品资料与儿童档案，形成总览、营养支持、风险提醒和说明文字。此处仅描述输入输出，不展开内部算法。', tag: '分析服务' },
  { no: '06', title: '保存本次记录', text: '将食品、输入来源、儿童档案及结果摘要关联保存，便于历史查询与后续复用。', tag: '业务数据库' },
  { no: '07', title: '返回页面展示', text: '页面把统一结果拆分成评分、产品信息、营养支持、过敏提醒和建议等可视模块。', tag: '结果页面' },
];

function Arrow({ label }: { label?: string }) {
  return <div className="flex flex-col items-center py-2 text-violet-400">
    {label && <span className="mb-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-600">{label}</span>}
    <span className="text-2xl leading-none">↓</span>
  </div>;
}

function FlowBox({ children, tone = 'normal' }: { children: React.ReactNode; tone?: 'normal' | 'action' | 'success' | 'warning' }) {
  const tones = {
    normal: 'border-slate-200 bg-white text-slate-800',
    action: 'border-violet-300 bg-violet-50 text-violet-900',
    success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-300 bg-amber-50 text-amber-900',
  };
  return <div className={`mx-auto w-full max-w-md rounded-xl border-2 px-5 py-3 text-center text-sm font-semibold shadow-sm ${tones[tone]}`}>{children}</div>;
}

export default function FoodAnalysisFlow() {
  return <div className="mx-auto max-w-5xl">
    <div className="rounded-3xl bg-gradient-to-br from-violet-700 via-purple-700 to-fuchsia-600 p-8 text-white shadow-lg md:p-10">
      <p className="text-sm font-semibold tracking-widest text-violet-200">食品分析文档 · 01</p>
      <h2 className="mt-3 text-3xl font-bold md:text-4xl">食品分析页面的数据流</h2>
      <p className="mt-4 max-w-3xl leading-7 text-violet-100">说明一次食品分析从用户输入到结果展示之间，数据经过哪些系统环节。本页关注页面与服务之间的数据流转，不涉及评分公式、阈值或具体算法。</p>
    </div>

    <section className="mt-10">
      <div className="mb-5 flex items-end justify-between"><div><p className="text-sm font-semibold text-violet-600">INPUT</p><h3 className="mt-1 text-2xl font-bold">三个分析入口</h3></div><span className="text-sm text-slate-400">最终进入同一条处理链路</span></div>
      <div className="grid gap-4 md:grid-cols-3">{INPUTS.map((item) => <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><span className="text-2xl">{item.icon}</span><h4 className="mt-3 font-bold">{item.title}</h4><p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p></article>)}</div>
    </section>

    <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
      <div className="text-center">
        <p className="text-sm font-semibold text-violet-600">OPERATION FLOWCHART</p>
        <h3 className="mt-1 text-2xl font-bold">用户实际操作流程图</h3>
        <p className="mt-2 text-sm text-slate-500">以页面上的点击、选择、确认和重试为节点。</p>
      </div>

      <div className="mx-auto mt-8 max-w-4xl">
        <div className="mx-auto w-fit rounded-full bg-slate-900 px-6 py-2 text-sm font-bold text-white">开始</div>
        <Arrow />
        <FlowBox tone="action">打开“食品分析”页面</FlowBox>
        <Arrow />
        <div className="mx-auto flex h-24 w-24 rotate-45 items-center justify-center rounded-xl border-2 border-violet-300 bg-violet-50 shadow-sm"><span className="-rotate-45 text-center text-xs font-bold text-violet-900">已选择<br />儿童档案？</span></div>
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col items-center"><Arrow label="否" /><FlowBox tone="warning">选择已有档案<br />或创建儿童档案</FlowBox></div>
          <div className="flex flex-col items-center"><Arrow label="是" /><FlowBox tone="action">选择食品录入方式</FlowBox></div>
        </div>
        <div className="mt-5 flex items-center gap-3"><div className="h-px flex-1 bg-violet-200" /><span className="text-xs font-semibold text-slate-400">档案准备完成后继续</span><div className="h-px flex-1 bg-violet-200" /></div>
        <Arrow />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-center"><div className="text-2xl">⌨️</div><h4 className="mt-2 font-bold text-blue-900">搜索</h4><p className="mt-2 text-xs leading-5 text-blue-700">输入关键词 → 查看候选 → 选择食品</p></div>
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-center"><div className="text-2xl">▦</div><h4 className="mt-2 font-bold text-cyan-900">扫码</h4><p className="mt-2 text-xs leading-5 text-cyan-700">允许相机 → 对准条码 → 等待识别</p></div>
          <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4 text-center"><div className="text-2xl">📷</div><h4 className="mt-2 font-bold text-fuchsia-900">拍照</h4><p className="mt-2 text-xs leading-5 text-fuchsia-700">拍摄或上传 → 确认图片 → 等待识别</p></div>
        </div>

        <Arrow label="三种入口汇合" />
        <div className="mx-auto flex h-24 w-24 rotate-45 items-center justify-center rounded-xl border-2 border-violet-300 bg-violet-50 shadow-sm"><span className="-rotate-45 text-center text-xs font-bold text-violet-900">识别结果<br />是否正确？</span></div>
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col items-center"><Arrow label="否" /><FlowBox tone="warning">返回重新搜索、扫码或拍照</FlowBox></div>
          <div className="flex flex-col items-center"><Arrow label="是" /><FlowBox tone="action">确认食品信息</FlowBox></div>
        </div>
        <div className="ml-auto mt-3 w-1/2 pl-4"><Arrow /><FlowBox tone="action">点击“开始分析”</FlowBox><Arrow /><FlowBox>显示分析中状态，等待结果</FlowBox></div>
        <Arrow />
        <div className="mx-auto flex h-24 w-24 rotate-45 items-center justify-center rounded-xl border-2 border-violet-300 bg-violet-50 shadow-sm"><span className="-rotate-45 text-center text-xs font-bold text-violet-900">分析请求<br />成功？</span></div>
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col items-center"><Arrow label="否" /><FlowBox tone="warning">显示错误提示 → 用户点击重试</FlowBox></div>
          <div className="flex flex-col items-center"><Arrow label="是" /><FlowBox tone="success">进入分析结果页并保存历史记录</FlowBox></div>
        </div>
        <div className="ml-auto w-1/2 pl-4"><Arrow /><div className="mx-auto w-fit rounded-full bg-emerald-600 px-6 py-2 text-sm font-bold text-white">完成</div></div>
      </div>
    </section>

    <section className="mt-12">
      <p className="text-sm font-semibold text-violet-600">DATA FLOW</p>
      <h3 className="mt-1 text-2xl font-bold">从输入到结果的完整流动</h3>
      <div className="mt-6 space-y-0">{FLOW.map((step, index) => <div key={step.no} className="relative flex gap-5 pb-8">
        {index < FLOW.length - 1 && <div className="absolute left-6 top-12 h-full w-px bg-violet-200" />}
        <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white shadow-md shadow-violet-200">{step.no}</div>
        <article className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex md:items-start md:justify-between md:gap-8">
          <div><h4 className="text-lg font-bold">{step.title}</h4><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{step.text}</p></div>
          <span className="mt-3 inline-block shrink-0 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 md:mt-0">{step.tag}</span>
        </article>
      </div>)}</div>
    </section>

    <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <h3 className="font-bold text-amber-900">数据边界</h3>
      <p className="mt-2 text-sm leading-6 text-amber-800">图片和条码用于识别食品；儿童档案用于生成个性化结果。页面只消费统一后的分析结果，不直接读取外部数据源，也不在浏览器中执行核心分析逻辑。</p>
    </section>
  </div>;
}
