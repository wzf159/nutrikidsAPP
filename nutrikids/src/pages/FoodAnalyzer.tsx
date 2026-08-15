import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate, NavLink } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { ADDITIVE_DICT, RISK_COLOR, WATCH_ADDITIVE_TYPES } from '../data/additives';
import {
  analyzeProduct, getAISummary, getChildren, lookupBarcode, recognizeImageUrl, recognizePhoto, searchProducts, fetchAnalysisHistory,
  type AnalysisResult, type AnalysisHistoryItem, type ProductMatch, type Recognition, type AISummary,
} from '../services/api';
import { flushSync } from 'react-dom';
/* ------------------------------------------------------------------ */
/* 常量与小工具                                                        */
/* ------------------------------------------------------------------ */

type Tier = 'core' | 'important' | 'supporting';

const TIER_COLOR: Record<Tier, string> = {
  core: '#4c1d95',
  important: '#a21caf',
  supporting: '#db2777',
};

const NUTRIENT_PALETTE = ['#0ea5e9', '#06b6d4', '#14b8a6', '#38bdf8', '#22d3ee', '#fbbf24'];

const GRADE_META: Record<string, { letter: string; color: string; en: string; zh: string; es: string }> = {
  Excellent: { letter: 'A', color: '#5aa860', en: 'GREAT', zh: '很棒', es: 'GENIAL' },
  Good: { letter: 'B', color: '#86c46a', en: 'GOOD', zh: '不错', es: 'BUENO' },
  Fair: { letter: 'C', color: '#f59e0b', en: 'FAIR', zh: '一般', es: 'REGULAR' },
  Poor: { letter: 'D', color: '#dc2626', en: 'POOR', zh: '较差', es: 'MALO' },
};

const NOVA_META: Record<number, { pos: string; en: string; zh: string; es: string; examples: string; examplesZh: string; examplesEs: string }> = {
  1: { pos: '12%', en: 'MINIMALLY PROCESSED', zh: '未/低度加工', es: 'POCO PROCESADO', examples: 'Fresh fruits, vegetables, eggs, milk', examplesZh: '新鲜水果、蔬菜、鸡蛋、牛奶', examplesEs: 'Frutas frescas, verduras, huevos, leche' },
  2: { pos: '38%', en: 'PROCESSED INGREDIENTS', zh: '加工配料', es: 'INGREDIENTES PROCESADOS', examples: 'Oils, butter, sugar, salt', examplesZh: '油、黄油、糖、盐', examplesEs: 'Aceites, mantequilla, azúcar, sal' },
  3: { pos: '62%', en: 'MODERATELY PROCESSED', zh: '中度加工', es: 'PROCESADO MODERADO', examples: 'Cheese, yogurt, canned vegetables, fresh bread', examplesZh: '奶酪、酸奶、罐装蔬菜、新鲜面包', examplesEs: 'Queso, yogur, verduras enlatadas, pan fresco' },
  4: { pos: '88%', en: 'ULTRA PROCESSED', zh: '超加工', es: 'SUPER PROCESADO', examples: 'Soft drinks, candy, instant noodles', examplesZh: '碳酸饮料、糖果、方便面', examplesEs: 'Bebidas gaseosas, dulces, fideos instantáneos' },
};

function SectionBadge({ n }: { n: number }) {
  return (
    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 text-white font-bold flex items-center justify-center text-lg shadow-md shadow-purple-200">
      {n}
    </span>
  );
}

const LEVEL_META: Record<number, {
  label: string; labelZh: string; labelEs: string;
  summary: string; summaryZh: string; summaryEs: string;
  color: string; bg: string; emoji: string;
}> = {
  5: { label: 'Strong Support', labelZh: '强力支持', labelEs: 'Apoyo Sólido', summary: "Strong overall alignment with children's developmental goals, with nutritional benefits clearly outweighing potential concerns.", summaryZh: '与儿童发育目标高度契合，营养益处明显优于潜在风险。', summaryEs: 'Fuerte alineación con los objetivos de desarrollo infantil.', color: '#16a34a', bg: 'rgba(22,163,74,0.08)', emoji: '💪' },
  4: { label: 'Good Support', labelZh: '良好支持', labelEs: 'Buen Apoyo', summary: 'Good overall alignment, with nutritional benefits outweighing potential concerns.', summaryZh: '整体契合度良好，营养益处优于潜在风险。', summaryEs: 'Buena alineación general con los objetivos de desarrollo.', color: '#65a30d', bg: 'rgba(101,163,13,0.08)', emoji: '✅' },
  3: { label: 'Moderate Support', labelZh: '适度支持', labelEs: 'Apoyo Moderado', summary: 'A balanced profile, with both nutritional benefits and potential concerns to consider.', summaryZh: '营养档案均衡，同时存在益处和需要关注的风险。', summaryEs: 'Un perfil equilibrado con beneficios y posibles preocupaciones.', color: '#d97706', bg: 'rgba(217,119,6,0.08)', emoji: '⚖️' },
  2: { label: 'Limited Support', labelZh: '有限支持', labelEs: 'Apoyo Limitado', summary: 'Limited overall benefit, as potential concerns begin to outweigh the nutritional support for developmental goals.', summaryZh: '整体益处有限，潜在风险开始超过营养支持。', summaryEs: 'Beneficio general limitado, las preocupaciones comienzan a superar el apoyo nutricional.', color: '#ea580c', bg: 'rgba(234,88,12,0.08)', emoji: '⚠️' },
  1: { label: 'Minimal Support', labelZh: '最低支持', labelEs: 'Apoyo mínimo', summary: 'Minimal overall support, as potential concerns outweigh the nutritional benefits for developmental goals.', summaryZh: '整体支持很少，因为潜在风险超过了对发育目标的营养益处。', summaryEs: 'Apoyo general mínimo, ya que las posibles preocupaciones superan los beneficios nutricionales para los objetivos de desarrollo.', color: '#dc2626', bg: 'rgba(220,38,38,0.08)', emoji: '🚫' },
};

function scoreToLevel(score: number): number {
  if (score >= 75) return 5;
  if (score >= 58) return 4;
  if (score >= 44) return 3;
  if (score >= 37) return 2;
  return 1;
}

const levelColors = ['#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a'];
const foodScoreLabels: Record<number, string> = {
  5: 'Strong',
  4: 'Good',
  3: 'Moderate',
  2: 'Limited',
  1: 'Minimal',
};

function HistoryLevelLabel({ score }: { score: number | null }) {
  if (score == null) return null;
  const level = scoreToLevel(score);

  return (
    <>
      <span className="text-gray-300 text-xs flex-shrink-0">·</span>
      <span
        className="text-xs font-extrabold flex-shrink-0"
        style={{ color: levelColors[level - 1] }}
      >
        {foodScoreLabels[level]}
      </span>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Sankey 布局（由接口数据驱动）                                       */
/* ------------------------------------------------------------------ */

const SK = { width: 1100, height: 920, nodeWidth: 24, leftX: 10, rightX: 1100 - 150, padTop: 20, gap: 30 };

interface NodeLayout { id: number; y0: number; y1: number }


function useSankeyLayout(view: AnalysisResult['view'] | null) {
  return useMemo(() => {
    const empty = {
      goalNodes: [] as NodeLayout[],
      nutrientNodes: [] as NodeLayout[],
      ribbons: [] as {
        goalId: number;
        nutrientId: number;
        value: number;
        path: string;
      }[],
    };

    if (!view) return empty;

    const normalizedFlows: {
      goalId: number;
      nutrientId: number;
      value: number;
    }[] = view.flows
      .map(flow => ({
        goalId: Number(flow.goalId),
        nutrientId: Number(flow.nutrientId),
        value: Number(flow.value),
      }))
      .filter(flow =>
        Number.isFinite(flow.goalId) &&
        Number.isFinite(flow.nutrientId) &&
        Number.isFinite(flow.value) &&
        flow.value > 0
      );

    const flowGoalIds = new Set(normalizedFlows.map(flow => flow.goalId));

    const activeGoals = view.goals.filter(goal =>
      goal.selected &&
      Boolean(goal.tier) &&
      flowGoalIds.has(Number(goal.id))
    );

    const activeGoalIds = new Set(
      activeGoals.map(goal => Number(goal.id))
    );

    const activeFlows = normalizedFlows.filter(flow =>
      activeGoalIds.has(flow.goalId)
    );

    const activeNutrientIds = new Set(
      activeFlows.map(flow => flow.nutrientId)
    );

    const activeNutrients = view.nutrients.filter(nutrient =>
      activeNutrientIds.has(Number(nutrient.id))
    );

    if (
      activeFlows.length === 0 ||
      activeGoals.length === 0 ||
      activeNutrients.length === 0
    ) {
      return empty;
    }

    const goalTotals: Record<number, number> = {};
    const nutrientTotals: Record<number, number> = {};

    for (const flow of activeFlows) {
      goalTotals[flow.goalId] =
        (goalTotals[flow.goalId] ?? 0) + flow.value;

      nutrientTotals[flow.nutrientId] =
        (nutrientTotals[flow.nutrientId] ?? 0) + flow.value;
    }

    const total = activeFlows.reduce(
      (sum, flow) => sum + flow.value,
      0
    );

    if (!Number.isFinite(total) || total <= 0) {
      return empty;
    }

    const goalIdsSorted = activeGoals
      .map(goal => Number(goal.id))
      .sort((a, b) => (goalTotals[b] ?? 0) - (goalTotals[a] ?? 0));

    const nutrientIdsSorted = activeNutrients
      .map(nutrient => Number(nutrient.id))
      .sort((a, b) => (nutrientTotals[b] ?? 0) - (nutrientTotals[a] ?? 0));

    // 左右两列分别按自身节点数量计算缩放，扣除各自间隙后都铺满同一高度，
    // 从而保证左侧（目标）与右侧（营养素）的整体高度一致。
    const usableHeight = SK.height - SK.padTop * 2;

    const goalScale =
      (usableHeight - SK.gap * Math.max(goalIdsSorted.length - 1, 0)) / total;

    const nutrientScale =
      (usableHeight - SK.gap * Math.max(nutrientIdsSorted.length - 1, 0)) / total;

    if (
      !Number.isFinite(goalScale) || goalScale <= 0 ||
      !Number.isFinite(nutrientScale) || nutrientScale <= 0
    ) {
      return empty;
    }

    const stack = (
      ids: number[],
      totals: Record<number, number>,
      scale: number
    ): NodeLayout[] => {
      const nodes: NodeLayout[] = [];
      let y = SK.padTop;

      for (const id of ids) {
        const height = Math.max(
          (totals[id] ?? 0) * scale,
          1.5
        );

        nodes.push({
          id,
          y0: y,
          y1: y + height,
        });

        y += height + SK.gap;
      }

      return nodes;
    };

    const goalNodes = stack(goalIdsSorted, goalTotals, goalScale);

    const nutrientNodes = stack(nutrientIdsSorted, nutrientTotals, nutrientScale);

    const goalOffsets: Record<number, number> = {};
    const nutrientOffsets: Record<number, number> = {};

    const ribbons = activeFlows.flatMap(flow => {
      const goalNode = goalNodes.find(
        node => node.id === flow.goalId
      );

      const nutrientNode = nutrientNodes.find(
        node => node.id === flow.nutrientId
      );

      if (!goalNode || !nutrientNode) {
        return [];
      }

      const goalHeight = Math.max(flow.value * goalScale, 1.5);
      const nutrientHeight = Math.max(flow.value * nutrientScale, 1.5);

      const goalY =
        goalNode.y0 + (goalOffsets[flow.goalId] ?? 0);

      const nutrientY =
        nutrientNode.y0 +
        (nutrientOffsets[flow.nutrientId] ?? 0);

      goalOffsets[flow.goalId] =
        (goalOffsets[flow.goalId] ?? 0) + goalHeight;

      nutrientOffsets[flow.nutrientId] =
        (nutrientOffsets[flow.nutrientId] ?? 0) + nutrientHeight;

      const x0 = SK.leftX + SK.nodeWidth;
      const x1 = SK.rightX;
      const cx = (x0 + x1) / 2;

      const path = [
        `M ${x0} ${goalY}`,
        `C ${cx} ${goalY}, ${cx} ${nutrientY}, ${x1} ${nutrientY}`,
        `L ${x1} ${nutrientY + nutrientHeight}`,
        `C ${cx} ${nutrientY + nutrientHeight}, ${cx} ${goalY + goalHeight}, ${x0} ${goalY + goalHeight}`,
        'Z',
      ].join(' ');

      return [{
        goalId: flow.goalId,
        nutrientId: flow.nutrientId,
        value: flow.value,
        path,
      }];
    });

    return {
      goalNodes,
      nutrientNodes,
      ribbons,
    };
  }, [view]);
}

/* ------------------------------------------------------------------ */
/* 条形码扫描弹窗（ZXing 调用摄像头）                                  */
/* ------------------------------------------------------------------ */

function BarcodeScanModal({ onCode, onClose, isZh }: { onCode: (code: string) => void; onClose: () => void; isZh: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let stopped = false;
    let stopFn: (() => void) | null = null;
    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, _err, controls) => {
        stopFn = () => controls.stop();
        if (result && !stopped) {
          stopped = true;
          controls.stop();
          console.log('barcode detected:', result.getText());
          console.log('onCodeRef.current:', onCodeRef.current?.toString().slice(0, 100));
          flushSync(() => {
            onCodeRef.current(result.getText());
          });
        }
      })
      .catch(() => setError(isZh ? '无法打开摄像头（需要授权，且要求 https 或 localhost）' : 'Camera unavailable (needs permission and https/localhost)'));
    return () => { stopped = true; stopFn?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isZh]);
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-gray-900">📊 {isZh ? '对准条形码' : 'Point at the barcode'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
        </div>
        {error
          ? <p className="text-red-500 text-sm">{error}</p>
          : <video ref={videoRef} className="w-full rounded-xl" />}
      </div>
    </div>
  );
}
/* ------------------------------------------------------------------ */
/* 页面                                                                */
/* ------------------------------------------------------------------ */

type Phase =
  | { name: 'idle' }
  | { name: 'busy'; msg: string }
  | { name: 'confirm'; recognition: Recognition; matches: ProductMatch[]; source?: 'local' | 'openfoodfacts' | 'ai' }
  | { name: 'error'; msg: string }
  | { name: 'ai-result'; productName: string; summary: AISummary };

export default function FoodAnalyzer() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const isEs = i18n.language === 'es';
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>({ name: 'idle' });
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProductMatch[]>([]);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  // 下拉是否展开：聚焦/输入时打开，选择或失焦后关闭
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const desktopCapsuleRef = useRef<HTMLDivElement>(null);
  const mobileCapsuleRef = useRef<HTMLDivElement>(null);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [selectedNutrient, setSelectedNutrient] = useState<number | null>(null);
  const [selectedWatch, setSelectedWatch] = useState<string | null>(null);
  // 顶部最右栏使用独立的小弹窗状态，避免和下方详情区互相干扰
  const [topWatchPopup, setTopWatchPopup] = useState<string | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const childIdRef = useRef<string | null>(null);
  const analysisRequestRef = useRef(0);
  // 启动时取孩子档案（演示账号自动登录）
  const ACTIVE_KEY = 'nutrikids_active_child_id';

  const loadChild = () => {
    setTimeout(() => {
      getChildren()
        .then(cs => {
          const activeId = localStorage.getItem(ACTIVE_KEY);
          const c = cs.find(c => c.id === activeId) ?? cs[0] ?? null;
          if (c) {
            childIdRef.current = c.id;
            setResult(null);
            setPhase({ name: 'idle' });
          }
        })
        .catch(() => setPhase({ name: 'error', msg: isZh ? '无法连接后端服务' : 'Cannot reach the API server' }));
    }, 50);
  };

  const refreshHistory = () => {
    fetchAnalysisHistory()
      .then(setHistory)
      .catch(() => setHistory([]));
  };

  // 历史记录按产品去重：同一产品只保留最近一次分析，避免下拉里重复出现
  const dedupedHistory = useMemo(() => {
    const seen = new Set<number>();
    return [...history]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter(h => {
        if (seen.has(h.productId)) return false;
        seen.add(h.productId);
        return true;
      });
  }, [history]);

  useEffect(() => {
    loadChild();
    refreshHistory();
    window.addEventListener('nutrikids:child-updated', loadChild);
    return () => window.removeEventListener('nutrikids:child-updated', loadChild);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const showDropdown = dropdownOpen && (suggestions.length > 0 || (!query.trim() && history.length > 0));
    if (!showDropdown) { setDropdownRect(null); return; }
    const updateRect = () => {
      const el = (desktopCapsuleRef.current?.offsetParent) ? desktopCapsuleRef.current : mobileCapsuleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setDropdownRect({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [suggestions, query, history, dropdownOpen]);

  // 搜索建议（防抖）
  useEffect(() => {
    const id = setTimeout(() => {
      if (query.trim().length >= 1) searchProducts(query).then(setSuggestions).catch(() => setSuggestions([]));
      else setSuggestions([]);
    }, 250);
    return () => clearTimeout(id);
  }, [query]);


  useEffect(() => {
    console.log("★★★★★ result changed ★★★★★");
    console.log(result);
  }, [result]);

  const view = result?.view ?? null;


  const { goalNodes, nutrientNodes, ribbons } = useSankeyLayout(view);

  const nutrientColor = (id: number) => {
    const idx = view?.nutrients.findIndex(n => n.id === id) ?? 0;
    return NUTRIENT_PALETTE[Math.max(idx, 0) % NUTRIENT_PALETTE.length];
  };
  const goalById = (id: number) => view!.goals.find(g => Number(g.id) === Number(id))!;
  const nutrientById = (id: number) => view!.nutrients.find(n => Number(n.id) === Number(id))!;


  async function runAiSummary(productName: string) {
    const activeChildId =
      childIdRef.current ?? undefined;

    setResult(null);
    setSelectedGoal(null);
    setSelectedNutrient(null);
    setSelectedWatch(null);
    setTopWatchPopup(null);

    setPhase({
      name: 'busy',
      msg: isZh
        ? 'AI 正在生成一般性营养建议…'
        : isEs
          ? 'La IA está generando orientación nutricional general…'
          : 'AI is generating general nutrition guidance…',
    });

    try {
      const language: 'en' | 'zh' | 'es' =
        isZh
          ? 'zh'
          : isEs
            ? 'es'
            : 'en';

      const summary = await getAISummary(
        productName,
        activeChildId,
        language,
      );

      setPhase({
        name: 'ai-result',
        productName,
        summary,
      });
    } catch (e) {
      setPhase({
        name: 'error',
        msg: (e as Error).message,
      });
    }
  }

  async function runAnalysis(
    productId: number,
    source: 'search' | 'barcode' | 'photo'
  ) {
    const activeChildId = childIdRef.current;
    if (!activeChildId) return;

    // 当前请求编号
    const requestId = ++analysisRequestRef.current;

    setPhase({
      name: 'busy',
      msg: isZh
        ? '正在为孩子计算评分…'
        : isEs
          ? 'Calculando puntuación para tu hijo…'
          : 'Scoring for your child…',
    });

    setSelectedGoal(null);
    setSelectedNutrient(null);
    setSelectedWatch(null);
    setTopWatchPopup(null);
    setResult(null);

    // 非photo来源时清空图片
    if (source !== 'photo') {
      setCapturedPhotoUrl(null);
    }

    try {
      const r = await analyzeProduct(activeChildId, productId, source);

      // 如果已经有更新的请求开始了，就丢弃旧结果
      if (requestId !== analysisRequestRef.current) {
        return;
      }

      setResult(r);
      setPhase({ name: 'idle' });
      refreshHistory();
    } catch (e) {
      // 如果已经不是最新请求，也不要更新页面
      if (requestId !== analysisRequestRef.current) {
        return;
      }

      setPhase({
        name: 'error',
        msg: (e as Error).message,
      });
    }
  }

  async function handleRecognized(recognition: Recognition, matches: ProductMatch[], source?: 'local' | 'openfoodfacts' | 'ai') {
    if (!recognition.isFood) {
      setPhase({ name: 'error', msg: isZh ? '图片中没有识别到食物，请重拍' : isEs ? 'No se detectó comida en la foto, vuelve a intentar' : 'No food detected in the photo' });
      return;
    }
    if (matches.length >= 1) {
      setPhase({ name: 'confirm', recognition, matches, source });
    } else {
      const aiProductName = [
        recognition.brand,
        recognition.nameEn,
      ]
        .filter(Boolean)
        .join(' · ');

      await runAiSummary(
        aiProductName || recognition.nameEn
      );
    }
  }
  async function handleImage(file: File) {
    setResult(null);
    setCapturedPhotoUrl(null); // 清掉上次的
    setPhase({ name: 'busy', msg: isZh ? '正在识别图片（约10秒）…' : isEs ? 'Reconociendo la imagen (~10s)…' : 'Recognizing the image (~10s)…' });
    try {
      const photoUrl = URL.createObjectURL(file);
      setCapturedPhotoUrl(photoUrl);
      const { recognition, matches, source } = await recognizePhoto(file);
      await handleRecognized(recognition, matches, source);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('MINIMAX_API_KEY') || msg.includes('OPENAI_API_KEY') || msg.includes('API key')) {
        setPhase({
          name: 'error',
          msg: isZh
            ? '图片识别功能暂时不可用。请在搜索框输入食品名称进行搜索分析。'
            : isEs
              ? 'La función de reconocimiento de imágenes no está disponible temporalmente. Por favor, ingrese el nombre del alimento en el cuadro de búsqueda.'
              : 'Image recognition is temporarily unavailable. Please enter the food name in the search box to search and analyze.',
        });
      } else {
        setPhase({ name: 'error', msg });
      }
    }
  }
  function ProductImage({ photoUrl, networkUrl, alt }: { photoUrl: string | null; networkUrl: string | null; alt: string }) {
    const [err, setErr] = useState(false);
    const src = photoUrl ?? networkUrl;
    if (!src || err) return <span className="text-3xl">🍽️</span>;
    return <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setErr(true)} />;
  }
  async function handleImageUrl(url: string) {
    setPhase({ name: 'busy', msg: isZh ? '正在获取并识别网页图片（约10秒）…' : isEs ? 'Obteniendo y reconociendo la imagen web (~10s)…' : 'Fetching & recognizing the web image (~10s)…' });
    try {
      const { recognition, matches, source } = await recognizeImageUrl(url);
      await handleRecognized(recognition, matches, source);
    } catch (e) {
      setPhase({ name: 'error', msg: (e as Error).message });
    }
  }

  const handleBarcode = useCallback(async (code: string) => {
    console.log('handleBarcode called:', code);
    try {
      setShowScan(false);
      setCapturedPhotoUrl(null);
      setResult(null);
      setSelectedGoal(null);
      setSelectedNutrient(null);
      setSelectedWatch(null);
      setTopWatchPopup(null);
      setPhase({ name: 'busy', msg: isZh ? `查询条形码 ${code}…` : isEs ? `Buscando código ${code}…` : `Looking up barcode ${code}…` });

      const { product } = await lookupBarcode(code);
      console.log('barcode product:', product.id, product);

      await runAnalysis(product.id, 'barcode');
    } catch (e) {
      console.error('handleBarcode error:', e);
      setPhase({ name: 'error', msg: (e as Error).message });
    }
  }, [isZh, isEs]);



  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) handleImage(file);
  };

  // 本地文件拖入是 Files；从网页拖图片过来则只有 text/html / text/uri-list（图片地址）
  const isDraggable = (dt: DataTransfer) =>
    dt.types.includes('Files') || dt.types.includes('text/uri-list') || dt.types.includes('text/html');

  // 从网页拖拽中提取图片地址：优先解析 HTML 里的 <img src>（uri-list 可能是外层链接）
  const extractImageUrl = (dt: DataTransfer): string | null => {
    const html = dt.getData('text/html');
    if (html) {
      const src = new DOMParser().parseFromString(html, 'text/html').querySelector('img')?.src;
      if (src) return src;
    }
    const uri = dt.getData('text/uri-list').split('\n').find(l => l && !l.startsWith('#'))?.trim();
    return uri || null;
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDraggable(e.dataTransfer)) return;
    dragDepth.current += 1;
    setDragging(true);
  };
  const onDragOver = (e: React.DragEvent) => {
    if (!isDraggable(e.dataTransfer)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = Math.max(dragDepth.current - 1, 0);
    if (dragDepth.current === 0) setDragging(false);
  };
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);

    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
    if (file) { handleImage(file); return; }

    const url = extractImageUrl(e.dataTransfer);
    if (url?.startsWith('data:image/')) {
      // 网页内嵌的 base64 图片：本地转成文件走上传通道
      const blob = await (await fetch(url)).blob();
      handleImage(new File([blob], 'dropped-image', { type: blob.type }));
      return;
    }
    if (url && /^https?:\/\//.test(url)) { handleImageUrl(url); return; }

    setPhase({ name: 'error', msg: isZh ? '请拖入图片文件或网页上的图片' : isEs ? 'Arrastra un archivo de imagen o una imagen de una página web' : 'Please drop an image file or an image from a web page' });
  };

  const levelLabel = (lvl: string) => {
    if (isZh) return ({ High: '高', Moderate: '中等', Low: '低' } as Record<string, string>)[lvl];
    if (isEs) return ({ High: 'Alto', Moderate: 'Moderado', Low: 'Bajo' } as Record<string, string>)[lvl];
    return lvl;
  };
  // 只统计真正有有效 flow 连接的已选择目标，确保顶部数字与桑基图一致。
  const supportedGoalIds = new Set(
    (view?.goals ?? [])
      .filter(g => {
        const supportDV = Number(g.supportDV);
        return (
          g.selected &&
          Number.isFinite(supportDV) &&
          supportDV > 0
        );
      })
      .map(g => Number(g.id))
  );
  const tierCounts = view ? {
    core: view.goals.filter(
      g =>
        g.selected &&
        g.tier === 'core' &&
        supportedGoalIds.has(Number(g.id))
    ).length,

    important: view.goals.filter(
      g =>
        g.selected &&
        g.tier === 'important' &&
        supportedGoalIds.has(Number(g.id))
    ).length,

    supporting: view.goals.filter(
      g =>
        g.selected &&
        g.tier === 'supporting' &&
        supportedGoalIds.has(Number(g.id))
    ).length,
  } : null;



  const grade = result
    ? result.grade
      ? GRADE_META[result.grade] ?? GRADE_META.Fair
      : GRADE_META.Fair
    : null;
  const nova = view?.product.novaScore ? NOVA_META[view.product.novaScore] : null;
  const showProcessingWarning = view?.product.novaScore === 4 && nova != null;
  const processingWarningLabel = isZh
    ? '超加工食品'
    : isEs
      ? 'Alimento ultraprocesado'
      : 'Ultra Processed food';
  const topNutrients = view?.nutrients.filter(n => n.level === 'High').slice(0, 2) ?? []; // 只有当某个营养素含量真正达到每日推荐量20%以上时，才会被算作"富含"候选
  const highNutrients = view?.nutrients.filter(n => n.level === 'High') ?? []; // 面板1：所有 %DNC 为 High 的营养元素
  const selectedGoalData = selectedGoal != null && view ? goalById(selectedGoal) : null;
  const selectedNutrientData = selectedNutrient != null && view ? nutrientById(selectedNutrient) : null;
  const selectedWatchData = selectedWatch != null && view ? view.watch.find(w => w.code === selectedWatch) : null;
  const topWatchPopupData = topWatchPopup != null && view
    ? view.watch.find(w => w.code === topWatchPopup)
    : null;

  const ribbonActive = (r: { goalId: number; nutrientId: number }) =>
    (selectedGoal == null && selectedNutrient == null) || r.goalId === selectedGoal || r.nutrientId === selectedNutrient;
  const toggleGoal = (id: number) => { setSelectedNutrient(null); setSelectedGoal(p => (p === id ? null : id)); };
  const toggleNutrient = (id: number) => { setSelectedGoal(null); setSelectedNutrient(p => (p === id ? null : id)); };

  const productTitle = view ? (isZh ? view.product.nameZh ?? view.product.name : view.product.name) : '';
  const levelNum = result?.overallScore != null ? scoreToLevel(result.overallScore) : 1;
  const levelMeta = LEVEL_META[levelNum];
  // level 1/2 为低分“垃圾食品”，只强调风险，不展示益处面板
  const isLowLevel = levelNum <= 2;
  //const hasAllergen = view ? (!view.allergenSafe && view.matchedAllergens.length > 0) : false;
  const hasAllergen = view?.allergenSafe === false;
  const highRiskAdditives = view?.harmfulAdditives ?? [];

  const hasHighRiskAdditive = highRiskAdditives.length > 0;
  const hasSafetyRisk = hasAllergen || hasHighRiskAdditive;

  const displayScore = hasSafetyRisk
    ? 0
    : Math.round(result?.overallScore ?? 0);

  const displayLevel = hasSafetyRisk
    ? 0
    : levelNum;

  const safetyTitle = hasAllergen && hasHighRiskAdditive
    ? {
      en: 'Allergen & Harmful Additives Detected',
      zh: '检测到过敏原及有害添加剂',
      es: 'Alérgenos y aditivos nocivos detectados',
    }
    : hasAllergen
      ? {
        en: 'Allergen Detected',
        zh: '检测到过敏原',
        es: 'Alérgeno detectado',
      }
      : {
        en: 'Harmful Additives Detected',
        zh: '检测到有害添加剂',
        es: 'Aditivos nocivos detectados',
      };

  const safetySummary = hasAllergen
    ? {
      en: 'This product is not recommended because it contains an allergen associated with this child.',
      zh: '该产品含有与当前儿童匹配的过敏原，因此不建议食用。',
      es: 'Este producto no se recomienda porque contiene un alérgeno asociado con este niño.',
    }
    : {
      en: 'This product is not recommended because it contains high-risk additives.',
      zh: '该产品含有高风险添加剂，因此不建议食用。',
      es: 'Este producto no se recomienda porque contiene aditivos de alto riesgo.',
    };

  const [showPhotoMenu, setShowPhotoMenu] = useState(false);

  const TIER_CONFIG: Record<'core' | 'important' | 'supporting', {
    color: string; labelZh: string; labelEs: string; label: string;
  }> = {
    core: { color: '#4c1d95', label: 'Core', labelZh: '核心', labelEs: 'Esencial' },
    important: { color: '#a21caf', label: 'Important', labelZh: '重要', labelEs: 'Importante' },
    supporting: { color: '#db2777', label: 'Supporting', labelZh: '辅助', labelEs: 'Complementario' },
  };

  const [goalPopup, setGoalPopup] = useState<number | null>(null);

  const NOVA_ICON: Record<number, string> = {
    1: '🍎',  // 未加工/天然食物
    2: '🧂',  // 加工烹饪食材
    3: '🧀',  // 加工食品
    4: '🍭',  // 超加工食品
  };

  const NUTRIENT_WATCH_CODES = new Set([
    'added_sugar',
    'sodium',
    'satfat',
    'transfat',
  ]);

  const WATCH_LIMIT_CODES = new Set(['added_sugar', 'sodium', 'satfat']);

  const watchLevel = (code: string, present: boolean, dailyValue = 0) => {
    // Trans fat is binary: display only present/absent, never High/Moderate/Low.
    if (code === 'transfat') {
      return present
        ? {
          key: 'high' as const,
          label: isZh ? '有' : isEs ? 'PRESENTE' : 'PRESENT',
          color: '#dc2626',
          bg: 'rgba(255,237,213,0.82)',
        }
        : {
          key: 'low' as const,
          label: isZh ? '无' : isEs ? 'AUSENTE' : 'ABSENT',
          color: '#a7a7b7',
          bg: 'rgba(255,255,255,0.38)',
        };
    }

    const percent = Number.isFinite(Number(dailyValue))
      ? Number(dailyValue)
      : 0;

    if (percent >= 20) {
      return {
        key: 'high' as const,
        label: isZh ? '高' : isEs ? 'ALTO' : 'HIGH',
        color: '#dc2626',
        bg: 'rgba(255,237,213,0.82)',
      };
    }

    if (percent > 5) {
      return {
        key: 'moderate' as const,
        label: isZh ? '中等' : isEs ? 'MODERADO' : 'MODERATE',
        color: '#d97706',
        bg: 'rgba(255,247,237,0.82)',
      };
    }

    return {
      key: 'low' as const,
      label: isZh ? '低' : isEs ? 'BAJO' : 'LOW',
      color: '#a7a7b7',
      bg: 'rgba(255,255,255,0.38)',
    };
  };

  const watchDailyValue = (w: AnalysisResult['view']['watch'][number]) =>
    Number(w.dailyValue ?? 0);

  const watchStatus = (w: AnalysisResult['view']['watch'][number]) => {
    if (w.available === false) {
      return {
        key: 'unknown' as const,
        label: isZh ? '数据不可用' : isEs ? 'SIN DATOS' : 'DATA UNAVAILABLE',
        color: '#a7a7b7',
        bg: 'rgba(255,255,255,0.38)',
      };
    }

    // Added sugar, sodium and saturated fat display "None" when the
    // standardized per-100g value is explicitly zero. Missing values are
    // handled above and must not be treated as zero.
    if (
      WATCH_LIMIT_CODES.has(w.code) &&
      w.value100g != null &&
      Number(w.value100g) === 0
    ) {
      return {
        key: 'low' as const,
        label: isZh ? '无' : isEs ? 'AUSENTE' : 'NONE',
        color: '#a7a7b7',
        bg: 'rgba(255,255,255,0.38)',
      };
    }

    return watchLevel(w.code, w.present, watchDailyValue(w));
  };

  const shouldHighlightWatch = (w: AnalysisResult['view']['watch'][number]) => {
    if (w.available === false) return false;
    if (!NUTRIENT_WATCH_CODES.has(w.code)) return w.present;
    if (w.code === 'transfat') return w.present;
    return WATCH_LIMIT_CODES.has(w.code) &&
      watchStatus(w).key === 'high';
  };
  const presentWatch = view?.watch.filter(w => w.present) ?? [];
  // 反式脂肪：只要出现（present）即高亮/标注
  const transFatWatch = view?.watch.find((w) => w.code === 'transfat') ?? null;
  // Panel 3 summary only lights up: High added sugar/sodium/saturated fat,
  // detected trans fat, and detected ingredient/additive groups.
  const summaryWatch = view?.watch.filter(shouldHighlightWatch) ?? [];

  const ingredientStatus = (present: boolean) => ({
    label: present
      ? (isZh ? '存在' : isEs ? 'PRESENTE' : 'PRESENT')
      : (isZh ? '未检出' : isEs ? 'NO DETECTADO' : 'NOT DETECTED'),
    color: present ? '#dc2626' : '#b3b3c3',
  });

  const growthBenefitsRef = useRef<HTMLElement>(null);
  const thingsToWatchRef = useRef<HTMLElement>(null);
  const svgWidth = SK.width + 10;
  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-[#d8ccf5] via-[#e8ccec] to-[#f5cce0]">
      <div className="px-6 py-2">
        <NavLink to="/" className="text-sm text-gray-500 hover:text-[#893ce3] inline-flex items-center gap-1">
          ← {t('input.backToHome')}
        </NavLink>
      </div>

      <div className="flex-1 px-4 sm:px-6 pb-8 max-w-6xl mx-auto w-full">
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
        <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

        <div
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative mb-5 flex flex-col sm:flex-row sm:items-center gap-3 transition-shadow`}
        >
          {dragging && (
            <div className="absolute inset-0 z-30 rounded-[28px] sm:rounded-full bg-purple-50/95 border-2 border-dashed border-[#893ce3] flex items-center justify-center gap-2 font-bold text-[#893ce3] text-sm pointer-events-none">
              🖼️ {isZh ? '松开图片，立即开始分析' : isEs ? 'Suelta la imagen para analizar' : 'Drop the image to analyze'}
            </div>
          )}

          {/* 桌面端：单行胶囊（≥sm 显示） */}
          <div
            ref={desktopCapsuleRef}
            className={`hidden sm:flex relative w-full bg-white/52 backdrop-blur-xl saturate-180 rounded-full px-5 py-3 items-center gap-3 ${dragging ? 'ring-2 ring-[#893ce3] ring-offset-2' : ''}`}
            style={{ border: '1px solid rgba(255,255,255,0.8)' }}
          >
            <span className="flex items-center gap-2 font-extrabold tracking-wide text-gray-500 text-sm">
              🔍 {isZh ? '你的食物里有什么？' : isEs ? '¿QUÉ HAY EN TU COMIDA?' : "WHAT'S IN YOUR FOOD?"}
            </span>
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setDropdownOpen(true); }}
              onFocus={() => setDropdownOpen(true)}
              onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
              placeholder={isZh ? '搜索食品名称，或拖入图片…' : isEs ? 'Busca alimentos, o arrastra una imagen…' : 'Search a food, or drop an image…'}
              className="flex-1 min-w-40 bg-transparent outline-none text-[#0f0f1a] text-[16px] placeholder-gray-400 font-[Nunito,sans-serif]"
            />
            <button
              onClick={() => setShowPhotoMenu(true)}
              className="px-4 py-2 rounded-full bg-white/90 border border-[rgba(100,120,160,0.15)] text-sm font-bold text-[#2a2a4a] hover:bg-[rgba(124,58,237,0.06)] transition"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              📷 {isZh ? '添加食品' : 'Add Food'}
            </button>
            <button onClick={() => {
              if (query.trim() && suggestions.length > 0) {
                setQuery('');
                setSuggestions([]);
                runAnalysis(suggestions[0].id, 'search');
              } else if (query.trim()) {
                searchProducts(query).then(matches => {
                  if (matches.length > 0) {
                    setQuery('');
                    setSuggestions([]);
                    runAnalysis(matches[0].id, 'search');
                  } else {
                    setPhase({ name: 'error', msg: isZh ? '未找到匹配的食品' : isEs ? 'No se encontraron alimentos coincidentes' : 'No matching foods found' });
                  }
                }).catch(() => {
                  setPhase({ name: 'error', msg: isZh ? '搜索失败，请重试' : isEs ? 'Error en la búsqueda, intenta de nuevo' : 'Search failed, please try again' });
                });
              } else {
                uploadInputRef.current?.click();
              }
            }} className="px-5 py-2 rounded-full bg-gradient-to-r from-[#893ce3] to-[#ec4899] text-white text-sm font-bold shadow-[0_2px_12px_rgba(236,72,153,0.3)] whitespace-nowrap hover:scale-[1.04] transition" style={{ fontFamily: 'Poppins, sans-serif' }}>
              🔮 {isZh ? '分析' : isEs ? 'Analizar' : 'Analyze'}
            </button>

            {
              dropdownOpen && (suggestions.length > 0 || (!query.trim() && history.length > 0)) && dropdownRect && createPortal(
                <div
                  className="fixed bg-white/96 backdrop-blur-xl rounded-[18px] shadow-[0_16px_56px_rgba(124,58,237,0.16),0_2px_12px_rgba(0,0,0,0.08)] border border-[rgba(124,58,237,0.15)] overflow-hidden"
                  style={{ top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width, zIndex: 9999 }}
                >
                  {!query.trim() && history.length > 0 ? (
                    <>
                      <div className="px-4 py-2 border-b border-purple-50">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('search.history')}</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {dedupedHistory.slice(0, 30).map(h => (
                          <button
                            key={h.id}
                            onClick={() => { setQuery(''); setSuggestions([]); setDropdownOpen(false); runAnalysis(h.productId, 'search'); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-purple-50 text-sm text-gray-700 flex items-center gap-2"
                          >
                            <span>🕐</span>
                            <span className="font-medium truncate">{isZh ? h.product.nameZh ?? h.product.name : h.product.name}</span>
                            <span className="text-gray-400 text-xs flex-shrink-0">{h.child.name}</span>
                            <HistoryLevelLabel score={h.overallScore} />
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    suggestions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setQuery(''); setSuggestions([]); setDropdownOpen(false); runAnalysis(s.id, 'search'); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-purple-50 text-sm text-gray-700 flex items-center gap-2"
                      >
                        <span>🍽️</span>
                        <span className="font-medium truncate">{isZh ? s.nameZh ?? s.name : s.name}</span>
                        {s.brand?.name && <span className="text-gray-400 text-xs flex-shrink-0">{s.brand.name}</span>}
                      </button>
                    ))
                  )}
                </div>,
                document.body
              )
            }
          </div>

          {/* 手机端：两行胶囊（<sm 显示） */}
          <div className="flex sm:hidden flex-col gap-3 w-full">
            {/* 第一行：搜索输入 */}
            <div
              className={`relative z-20 bg-white/52 backdrop-blur-xl saturate-180 rounded-full px-5 py-3 flex items-center gap-2 ${dragging ? 'ring-2 ring-[#893ce3] ring-offset-2' : ''
                }`}
              style={{ border: '1px solid rgba(255,255,255,0.8)' }}
            >
              <span className="text-sm flex-shrink-0">🔍</span>
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setDropdownOpen(true); }}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                placeholder={isZh ? '搜索食品，或拖入图片…' : isEs ? 'Busca o arrastra una imagen…' : 'Search or drop an image…'}
                className="flex-1 min-w-0 bg-transparent outline-none text-[#0f0f1a] text-[16px] placeholder-gray-400 font-[Nunito,sans-serif]"
              />

              {dropdownOpen && (suggestions.length > 0 || (!query.trim() && history.length > 0)) && (
                <div className="absolute left-2 right-2 top-full mt-2 bg-white/96 backdrop-blur-xl rounded-[18px] shadow-[0_16px_56px_rgba(124,58,237,0.16),0_2px_12px_rgba(0,0,0,0.08)] border border-[rgba(124,58,237,0.15)] z-50 overflow-hidden">
                  {!query.trim() && history.length > 0 ? (
                    <>
                      <div className="px-4 py-2 border-b border-purple-50">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('search.history')}</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {dedupedHistory.slice(0, 30).map(h => (
                          <button
                            key={h.id}
                            onClick={() => { setQuery(''); setSuggestions([]); setDropdownOpen(false); runAnalysis(h.productId, 'search'); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-purple-50 text-sm text-gray-700 flex items-center gap-2"
                          >
                            <span>🕐</span>
                            <span className="font-medium truncate">{isZh ? h.product.nameZh ?? h.product.name : h.product.name}</span>
                            <span className="text-gray-400 text-xs flex-shrink-0">{h.child.name}</span>
                            <HistoryLevelLabel score={h.overallScore} />
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    suggestions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setQuery(''); setSuggestions([]); setDropdownOpen(false); runAnalysis(s.id, 'search'); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-purple-50 text-sm text-gray-700 flex items-center gap-2"
                      >
                        <span>🍽️</span>
                        <span className="font-medium truncate">{isZh ? s.nameZh ?? s.name : s.name}</span>
                        {s.brand?.name && <span className="text-gray-400 text-xs flex-shrink-0">{s.brand.name}</span>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 第二行：两个按钮 */}
            <div className="bg-white/52 backdrop-blur-xl saturate-180 rounded-full px-2 py-2 flex items-center gap-1.5" style={{ border: '1px solid rgba(255,255,255,0.8)' }}>
              <button
                onClick={() => setShowPhotoMenu(true)}
                className="flex-1 min-w-0 px-2 py-2 rounded-full bg-white/90 border border-[rgba(100,120,160,0.15)] text-xs font-bold text-[#2a2a4a] hover:bg-[rgba(124,58,237,0.06)] transition truncate"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                📷 {isZh ? '添加食品' : isEs ? 'Añadir' : 'Add Food'}
              </button>
              <button
                onClick={() => {
                  if (query.trim() && suggestions.length > 0) {
                    setQuery('');
                    setSuggestions([]);
                    runAnalysis(suggestions[0].id, 'search');
                  } else if (query.trim()) {
                    searchProducts(query).then(matches => {
                      if (matches.length > 0) {
                        setQuery('');
                        setSuggestions([]);
                        runAnalysis(matches[0].id, 'search');
                      } else {
                        setPhase({ name: 'error', msg: isZh ? '未找到匹配的食品' : isEs ? 'No se encontraron alimentos coincidentes' : 'No matching foods found' });
                      }
                    }).catch(() => {
                      setPhase({ name: 'error', msg: isZh ? '搜索失败，请重试' : isEs ? 'Error en la búsqueda, intenta de nuevo' : 'Search failed, please try again' });
                    });
                  }
                }}
                className="flex-1 min-w-0 px-2 py-2 rounded-full bg-gradient-to-r from-[#893ce3] to-[#ec4899] text-white text-xs font-bold shadow-[0_2px_12px_rgba(236,72,153,0.3)] hover:scale-[1.04] transition truncate"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                🔮 {isZh ? '分析' : isEs ? 'Analizar' : 'Analyze'}
              </button>
            </div>
          </div>
        </div>

        {/* 状态条 */}
        {phase.name === 'busy' && (
          <div className="bg-white rounded-3xl shadow-sm p-6 mb-5 flex items-center gap-3 animate-pulse">
            <span className="text-2xl">🔮</span>
            <span className="font-semibold text-gray-700">{phase.msg}</span>
          </div>
        )}
        {phase.name === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-5 mb-5 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <span className="font-semibold text-red-700 text-sm">{phase.msg}</span>
            <button onClick={() => setPhase({ name: 'idle' })} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}
        {phase.name === 'confirm' && (
          <div className="bg-white rounded-3xl shadow-sm p-6 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🤔</span>
                <div>
                  <p className="font-bold text-gray-800">
                    {isZh
                      ? `识别结果：「${phase.recognition.nameZh || phase.recognition.nameEn}」`
                      : isEs
                        ? `Reconocido: "${phase.recognition.nameEn}"`
                        : `Recognized: "${phase.recognition.nameEn}"`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {isZh ? `置信度 ${Math.round(phase.recognition.confidence * 100)}%` : isEs ? `Confianza ${Math.round(phase.recognition.confidence * 100)}%` : `Confidence ${Math.round(phase.recognition.confidence * 100)}%`}
                    {phase.recognition.barcode && ` · ${isZh ? '条形码' : isEs ? 'Código de barras' : 'Barcode'}: ${phase.recognition.barcode}`}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {isZh ? '请确认以下产品是否正确，然后开始分析：' : isEs ? 'Confirma si el producto es correcto y comienza el análisis:' : 'Confirm the product and start analysis:'}
            </p>

            <div className="flex flex-col gap-3">
              {phase.matches.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => runAnalysis(m.id, 'photo')}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${idx === 0
                    ? 'border-purple-300 bg-purple-50/50 hover:border-purple-400 hover:bg-purple-50'
                    : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${idx === 0 ? 'bg-purple-100' : 'bg-gray-100'}`}>
                    {m.imageUrl ? <img src={m.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" /> : '🍽️'}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-800">
                      {isZh ? m.nameZh ?? m.name : m.name}
                    </p>
                    {m.brand?.name && (
                      <p className="text-sm text-gray-500">{isZh ? '品牌' : isEs ? 'Marca' : 'Brand'}: {m.brand.name}</p>
                    )}
                  </div>
                  <span className={`text-xl ${idx === 0 ? 'text-purple-500' : 'text-gray-400'}`}>→</span>
                </button>
              ))}
            </div>

            {/* 条形码纠正 */}
            <button
              onClick={() => setShowScan(true)}
              className="mt-3 w-full py-3 rounded-2xl border-[1.5px] border-[rgba(124,58,237,0.2)] text-sm font-bold text-[#893ce3] flex items-center justify-center gap-2 hover:bg-purple-50 transition"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              📊 {isZh ? '识别结果不对？扫条形码纠正' : isEs ? '¿No es correcto? Escanea el código de barras' : 'Not right? Scan barcode to correct'}
            </button>
            {/* AI 兜底 */}
            <button
              onClick={async () => {
                if (phase.name !== 'confirm') return;

                const aiProductName = [
                  phase.recognition.brand,
                  phase.recognition.nameEn,
                ]
                  .filter(Boolean)
                  .join(' · ');

                await runAiSummary(
                  aiProductName || phase.recognition.nameEn
                );
              }}
              className="w-full py-3 mb-2 text-sm font-semibold text-gray-500 hover:text-[#893ce3] transition"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              🤖 {isZh ? '不是这个？用 AI 直接分析' : isEs ? '¿No es esto? Analizar con IA' : "None of these? Analyze with AI"}
            </button>
            <button
              onClick={() => setPhase({ name: 'idle' })}
              className="mt-2 w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              {isZh ? '取消，重新识别' : isEs ? 'Cancelar, reconoce de nuevo' : 'Cancel, recognize again'}
            </button>
          </div>
        )}

        {phase.name === 'ai-result' && (
          <div className="bg-white rounded-[26px] shadow-sm p-5 sm:p-7 mb-5">
            {/* Product + AI badge */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-xl">
                🤖
              </div>

              <div className="min-w-0 flex-1">
                <h3
                  className="font-extrabold text-[#273044] text-lg leading-tight"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {phase.productName}
                </h3>
              </div>

              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-100 text-purple-600 whitespace-nowrap">
                AI GENERATED
              </span>
            </div>

            {/* Reference UI: yellow quick-tip style disclaimer */}
            <div className="rounded-[24px] bg-[#fffbea] border border-[#f2dd84] px-5 py-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#fff3bd] flex items-center justify-center text-lg flex-shrink-0">
                  💡
                </div>

                <div className="min-w-0">
                  <p
                    className="text-[14px] font-extrabold text-[#6b5a2f] mb-1"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                  >
                    {isZh ? '温馨提示' : isEs ? 'Recordatorio amable' : 'Kindly Reminder'}
                  </p>

                  <p
                    className="text-[13px] font-bold text-[#4b4639] leading-relaxed"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                  >
                    {isZh
                      ? 'Growtrition 数据库中目前没有此产品。'
                      : isEs
                        ? 'Este producto no está disponible actualmente en la base de datos de Growtrition.'
                        : "This product isn't currently available in the Growtrition database."}
                  </p>

                  <p
                    className="text-[12px] text-[#6f6857] leading-relaxed mt-1"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                  >
                    {isZh
                      ? 'Growtrition 无法生成标准的循证评估。以下摘要由 AI 生成，仅用于一般性参考。'
                      : isEs
                        ? 'Growtrition no puede generar su evaluación estándar basada en evidencia. El resumen siguiente fue generado por IA y está destinado únicamente a orientación general.'
                        : 'Growtrition cannot generate its standard evidence-based evaluation. The summary below is AI-generated and intended for general guidance only.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Reference UI: large outlined recommendation card */}
            <div
              className={`rounded-[26px] border-2 p-4 sm:p-5 ${phase.summary.recommendationLevel === 'recommended'
                ? 'border-emerald-200'
                : phase.summary.recommendationLevel === 'moderate'
                  ? 'border-amber-200'
                  : 'border-rose-200'
                }`}
            >
              {/* Header like "Good choices of the day" */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-[14px] font-extrabold flex-shrink-0 ${phase.summary.recommendationLevel === 'recommended'
                    ? 'bg-emerald-500'
                    : phase.summary.recommendationLevel === 'moderate'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                    }`}
                >
                  {phase.summary.recommendationLevel === 'recommended'
                    ? 'A'
                    : phase.summary.recommendationLevel === 'moderate'
                      ? 'B'
                      : 'C'}
                </div>

                <div className="min-w-0">
                  <p
                    className={`text-[18px] sm:text-[20px] font-extrabold leading-tight ${phase.summary.recommendationLevel === 'recommended'
                      ? 'text-emerald-800'
                      : phase.summary.recommendationLevel === 'moderate'
                        ? 'text-amber-800'
                        : 'text-rose-800'
                      }`}
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {phase.summary.recommendationLevel === 'recommended'
                      ? (isZh ? '适合选择' : isEs ? 'Buena opción' : 'Good choice')
                      : phase.summary.recommendationLevel === 'moderate'
                        ? (isZh ? '适量选择' : isEs ? 'Con moderación' : 'Choose in moderation')
                        : (isZh ? '建议限制' : isEs ? 'Mejor limitar' : 'Best limited')}
                  </p>
                </div>
              </div>

              {/* Recommendation sentence */}
              <div
                className={`rounded-[18px] px-4 py-3 mb-4 ${phase.summary.recommendationLevel === 'recommended'
                  ? 'bg-emerald-50'
                  : phase.summary.recommendationLevel === 'moderate'
                    ? 'bg-amber-50'
                    : 'bg-rose-50'
                  }`}
              >
                <p
                  className="text-[13px] sm:text-[14px] font-bold text-gray-700 leading-relaxed"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  {phase.summary.recommendation}
                </p>
              </div>

              {/* Exactly 3 numbered rows, matching reference layout */}
              <div className="flex flex-col gap-3">
                {phase.summary.considerations.map((item, index) => {
                  const positive = item.type === 'positive';

                  return (
                    <div
                      key={`${item.title}-${index}`}
                      className={`rounded-[22px] px-4 py-3.5 ${positive ? 'bg-[#e9fbf3]' : 'bg-[#fff4e8]'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-[14px] flex-shrink-0 ${positive
                            ? 'bg-[#bdf4da] text-emerald-700'
                            : 'bg-[#ffe1b8] text-amber-700'
                            }`}
                        >
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p
                              className={`text-[14px] sm:text-[15px] font-extrabold leading-tight ${positive ? 'text-[#166b55]' : 'text-[#9a5a17]'
                                }`}
                              style={{ fontFamily: 'Poppins, sans-serif' }}
                            >
                              {item.title}
                            </p>

                            <span className="text-[12px]">
                              {positive ? '✓' : '⚠️'}
                            </span>
                          </div>

                          <p
                            className="text-[12px] sm:text-[13px] text-[#4f5c55] leading-relaxed"
                            style={{ fontFamily: 'Nunito, sans-serif' }}
                          >
                            {item.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                setPhase({ name: 'idle' });
                setCapturedPhotoUrl(null);
              }}
              className="mt-5 w-full py-2 text-sm text-gray-400 hover:text-[#893ce3] font-bold transition"
            >
              {isZh ? '重新搜索' : isEs ? 'Buscar de nuevo' : 'Search again'}
            </button>
          </div>
        )}

        {/* 空状态引导 */}
        {!result && phase.name === 'idle' && (
          <div className="bg-white rounded-3xl shadow-sm p-10 text-center text-gray-500">

            <p className="font-bold text-gray-700 text-lg mb-1">{isZh ? '搜索、拍照或上传图片，开始分析' : isEs ? 'Busca, toma una foto o sube una imagen para empezar' : 'Search, snap a photo, or upload an image to start'}</p>
            <p className="text-sm">{isZh ? 'AI 会识别食物并结合孩子的成长档案给出个性化评估' : isEs ? 'AI reconoce la comida y la evalúa según el perfil de tu hijo' : 'AI recognizes the food and scores it against your child’s profile'}</p>
          </div>
        )}

        {view && result && grade && (
          <>

            {/* ① 食物评估 */}
            <section
              key={`${view.product.id}-${result.overallScore}`}
              className="bg-white/70 backdrop-blur-xl rounded-[18px] border-none shadow-[0_8px_32px_rgba(120,80,200,0.14),0_2px_8px_rgba(120,80,200,0.06),inset_0_1.5px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(200,180,255,0.15)] p-[18px] mb-5 animate-fade-in-up relative overflow-visible"
            >
              <div className="relative">
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.1fr_0.9fr] gap-0">
                  {/* 左栏 */}
                  <div className="pb-4 mb-4 border-b lg:pb-0 lg:mb-0 lg:border-b-0 lg:border-r border-[rgba(160,120,210,0.35)] px-[18px] py-0">
                    <div className="flex items-center gap-2 mb-3">
                      <SectionBadge n={1} />
                      <h2 className="text-xl font-extrabold text-gray-900">{isZh ? '综合评估' : isEs ? 'Evaluación general' : 'Overall Assessment'}</h2>
                    </div>
                    {/* 产品图片 */}
                    <div className="flex gap-4 items-start mb-4">
                      <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                        <div className="w-[90px] h-[90px] rounded-[12px] bg-gradient-to-br from-white/70 to-[rgba(200,240,254,0.5)] border border-[rgba(124,58,237,0.15)] flex items-center justify-center overflow-hidden">
                          <ProductImage photoUrl={capturedPhotoUrl} networkUrl={view.product.imageUrl ?? null} alt={productTitle} />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 text-center leading-tight max-w-[90px]">{productTitle}</p>
                      </div>

                      {/* 评分圆圈 + 标题 + 摘要 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-[64px] h-[64px] rounded-full flex-shrink-0 flex flex-col items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.15)]"
                            style={{
                              background: hasSafetyRisk
                                ? 'linear-gradient(135deg, #c7c7c7, #a8a8a8)'
                                : `linear-gradient(135deg, ${levelMeta.color}, ${levelMeta.color}cc)`,
                            }}
                          >
                            <span
                              className="text-[20px] font-extrabold text-white leading-none"
                              style={{ fontFamily: 'Poppins, sans-serif' }}
                            >
                              {displayScore}
                            </span>

                            <span className="text-[9px] font-bold text-white/85 tracking-wider mt-0.5">
                              {hasSafetyRisk ? 'NO SCORE' : foodScoreLabels[displayLevel]}
                            </span>
                          </div>

                          <div className="flex-1">
                            <h3
                              className={`text-[18px] font-extrabold leading-tight ${hasSafetyRisk ? 'text-red-700' : 'text-[#1a1a3a]'
                                }`}
                              style={{ fontFamily: 'Poppins, sans-serif' }}
                            >
                              {hasSafetyRisk ? (
                                <>
                                  🚨{' '}
                                  {isZh
                                    ? safetyTitle.zh
                                    : isEs
                                      ? safetyTitle.es
                                      : safetyTitle.en}
                                </>
                              ) : (
                                <>
                                  {levelMeta.emoji}{' '}
                                  {isZh
                                    ? levelMeta.labelZh
                                    : isEs
                                      ? levelMeta.labelEs
                                      : levelMeta.label}
                                </>
                              )}
                            </h3>

                            {!view.product.verified && view.product.isAiGenerated && (
                              <div className="rounded-xl bg-yellow-50 border border-yellow-300 px-4 py-2.5 mb-2 flex items-start gap-2">
                                <span className="text-base">🤖</span>

                                <div>
                                  <p className="text-[12px] font-extrabold text-yellow-800">
                                    {isZh
                                      ? 'AI 估算营养信息'
                                      : isEs
                                        ? 'Información nutricional estimada por IA'
                                        : 'AI-Estimated Nutrition'}
                                  </p>

                                  <p
                                    className="text-[11px] text-yellow-700"
                                    style={{ fontFamily: 'Nunito, sans-serif' }}
                                  >
                                    {isZh
                                      ? '该产品未经过官方验证，营养数据由 AI 根据包装信息推断，仅供参考。'
                                      : isEs
                                        ? 'Este producto no ha sido verificado oficialmente. Los valores nutricionales fueron estimados por IA y son solo de referencia.'
                                        : 'This product has not been officially verified. Nutrition values were estimated by AI from the package and should be used as reference only.'}
                                  </p>
                                </div>
                              </div>
                            )}
                            <p
                              className={`text-[11px] leading-relaxed mt-0.5 ${hasSafetyRisk ? 'text-gray-400' : 'text-gray-500'
                                }`}
                              style={{ fontFamily: 'Nunito, sans-serif' }}
                            >
                              {hasSafetyRisk
                                ? isZh
                                  ? safetySummary.zh
                                  : isEs
                                    ? safetySummary.es
                                    : safetySummary.en
                                : isZh
                                  ? levelMeta.summaryZh
                                  : isEs
                                    ? levelMeta.summaryEs
                                    : levelMeta.summary}
                            </p>
                          </div>
                        </div>

                        {/* 反式脂肪：只要出现即标注，不依赖评分分支 */}
                        {transFatWatch?.present && (
                          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 mb-2 flex items-start gap-2">
                            <span className="text-base">⛽</span>

                            <div>
                              <p className="text-[12px] font-extrabold text-red-700">
                                {isZh ? '含反式脂肪' : isEs ? 'Contiene grasas trans' : 'Contains Trans Fat'}
                              </p>

                              <p
                                className="text-[11px] text-red-600"
                                style={{ fontFamily: 'Nunito, sans-serif' }}
                              >
                                {isZh
                                  ? '配料或营养标签中检测到反式脂肪。'
                                  : isEs
                                    ? 'Se detectaron grasas trans en los ingredientes o en la etiqueta nutricional.'
                                    : 'Trans fat detected in ingredients or on the nutrition label.'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 安全风险优先 */}
                        {hasSafetyRisk ? (
                          <>
                            {hasAllergen && (
                              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 mb-2 flex items-start gap-2">
                                <span className="text-base">🚨</span>

                                <div>
                                  <p className="text-[12px] font-extrabold text-red-700">
                                    {isZh
                                      ? '检测到过敏原'
                                      : isEs
                                        ? 'Alérgeno detectado'
                                        : 'Allergen Detected'}
                                  </p>

                                  <p
                                    className="text-[11px] text-red-600"
                                    style={{ fontFamily: 'Nunito, sans-serif' }}
                                  >
                                    {view.matchedAllergens
                                      .map(a =>
                                        isZh
                                          ? a.nameZh ?? a.name
                                          : a.name
                                      )
                                      .join(', ')}
                                  </p>
                                </div>
                              </div>
                            )}

                            {hasHighRiskAdditive && (
                              <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-2.5 mb-2 flex items-start gap-2">
                                <span className="text-base">⚗️</span>

                                <div>
                                  <p className="text-[11px] text-orange-700" style={{ fontFamily: 'Nunito, sans-serif' }}>
                                    {isZh
                                      ? '具体物质：'
                                      : isEs
                                        ? 'Sustancia detectada: '
                                        : 'Detected substance: '}
                                    {highRiskAdditives
                                      .map(a => isZh ? a.nameZh ?? a.name : a.name)
                                      .join(', ')}
                                  </p>
                                </div>
                              </div>
                            )}
                          </>
                        ) : highNutrients.length > 0 ? (
                          <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-2.5 mb-3 flex items-center gap-2">
                            <span>⭐</span>

                            <p
                              className="text-[12px] font-semibold text-green-700"
                              style={{ fontFamily: 'Nunito, sans-serif' }}
                            >
                              <span className="font-bold">
                                {isZh ? '富含 ' : isEs ? 'Buena fuente de ' : 'Good source of '}
                              </span>

                              {highNutrients.map((n, i) => (
                                <span
                                  key={n.id}
                                  className="font-extrabold"
                                  style={{ color: nutrientColor(n.id) }}
                                >
                                  {isZh
                                    ? n.nameZh ?? n.name
                                    : n.name}

                                  {i < highNutrients.length - 1 ? ' & ' : ''}
                                </span>
                              ))}
                            </p>
                          </div>
                        ) : (
                          presentWatch.length > 0 && (
                            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 mb-2 flex items-center gap-2 flex-wrap">
                              <span className="text-base">⚠️</span>

                              <span className="text-[12px] font-extrabold text-amber-700">
                                {isZh ? '注意：' : isEs ? 'Atención:' : 'Watch:'}
                              </span>

                              {presentWatch.slice(0, 3).map(w => (
                                <span
                                  key={w.code}
                                  className="text-[11px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full"
                                >
                                  {isZh ? w.nameZh : w.name}
                                </span>
                              ))}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* 5级进度条 */}
                    <div className="mb-3">
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-gray-400 mb-1.5">
                        {isZh ? 'NUTRISCORE FOR KIDS · 发育益处 vs. 风险' : 'NUTRISCORE FOR KIDS · DEV. BENEFIT VS. ADDITIVE RISK'}
                      </p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(lv => (
                          <div key={lv} className="flex-1 flex flex-col items-center gap-0.5">
                            <div
                              className="w-full rounded-full"
                              style={{
                                background: hasSafetyRisk ? '#c7c7c7' : levelColors[lv - 1],
                                opacity: hasSafetyRisk ? 0.55 : lv === levelNum ? 1 : 0.2,
                                height: !hasSafetyRisk && lv === levelNum ? '12px' : '8px',
                              }}
                            />
                            <span className="text-[9px] font-bold" style={{
                              color: !hasSafetyRisk && lv === levelNum ? levelColors[lv - 1] : '#9ca3af',
                              fontFamily: 'Nunito, sans-serif',
                            }}>
                              {foodScoreLabels[lv]}{!hasSafetyRisk && lv === levelNum ? ' ✓' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>


                    <span
                      onClick={() => navigate('/about', { state: { tab: 'sources' } })}
                      className="mt-2 text-[10px] font-semibold text-gray-400 flex items-center gap-1 cursor-pointer hover:text-[#893ce3] transition-colors"
                    >
                      👆 {isZh ? '查看计算方法' : 'View calculation details'}
                    </span>

                  </div>

                  {/* 中栏 — BENEFITS：所有等级保留面板，低分档显示风险引导 */}
                  <div className={`pb-4 mb-4 border-b lg:pb-0 lg:mb-0 lg:border-b-0 lg:border-r border-[rgba(160,120,210,0.35)] px-[18px] py-0 ${hasSafetyRisk ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-[#5b21b6] tracking-wide text-sm">{isZh ? '益处' : 'BENEFITS'}</h4>
                      <span
                        onClick={() => growthBenefitsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        className="text-[10px] font-semibold text-[#893ce3] flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        👆 {isZh ? '点击了解更多' : 'Tap to know more'}
                      </span>
                    </div>
                    {isLowLevel ? (
                      <div className="rounded-xl bg-white/55 border border-[rgba(137,60,227,0.12)] px-3 py-3 mb-3">
                        <p className="text-[11px] font-bold text-[#6b6b8a] leading-relaxed">
                          {isZh
                            ? '该食品无明显营养益处，请重点关注右侧“需要留意”的内容。'
                            : isEs
                              ? 'Este alimento ofrece pocos beneficios nutricionales; presta atención a los aspectos a vigilar.'
                              : 'This food offers little nutritional benefit; please focus on the things to watch.'}
                        </p>
                      </div>
                    ) : (
                      <>
                        {tierCounts && (
                          <p className="text-[10px] font-bold text-[#6b6b8a] mb-2.5 leading-relaxed">
                            {isZh ? `支持 ${tierCounts.core + tierCounts.important + tierCounts.supporting} 项目标` : `Supports ${tierCounts.core + tierCounts.important + tierCounts.supporting} goals`} ·{' '}
                            <span className="text-[#4c1d95] font-extrabold">{tierCounts.core} {isZh ? '核心' : 'Core'}</span> ·{' '}
                            <span className="text-[#a21caf] font-extrabold">{tierCounts.important} {isZh ? '重要' : 'Important'}</span> ·{' '}
                            <span className="text-[#db2777] font-extrabold">{tierCounts.supporting} {isZh ? '辅助' : 'Supporting'}</span>
                          </p>
                        )}

                        {tierCounts &&
                          tierCounts.core + tierCounts.important + tierCounts.supporting === 0 && (
                            <div className="rounded-xl bg-white/55 border border-[rgba(137,60,227,0.12)] px-3 py-3 mb-3">
                              <p className="text-[11px] font-bold text-[#6b6b8a] leading-relaxed">
                                {isZh
                                  ? '该食品目前没有足够的营养证据支持所选发育目标。'
                                  : 'This food does not currently provide enough nutrient evidence to support the selected developmental goals.'}
                              </p>
                            </div>
                          )}

                        {/* 按 tier 分组 */}
                        {(['core', 'important', 'supporting'] as const).map(tier => {
                          const goalsInTier = view.goals.filter(
                            g =>
                              g.selected &&
                              g.tier === tier &&
                              supportedGoalIds.has(Number(g.id))
                          );
                          const inactiveGoals = view.goals.filter(
                            g =>
                              g.selected &&
                              g.tier === tier &&
                              !supportedGoalIds.has(Number(g.id))
                          );
                          if (goalsInTier.length === 0 && inactiveGoals.length === 0) return null;
                          const tc = TIER_CONFIG[tier];
                          return (
                            <div key={tier} className="mb-3 relative">
                              <p className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wide pb-1.5 mb-3 border-b"
                                style={{ color: tc.color, borderColor: `${tc.color}33` }}>
                                <span className="w-[6px] h-[6px] rounded-full inline-block" style={{ background: tc.color }} />
                                {isZh ? `${tc.labelZh}目标` : `${tc.label} Goals`}
                              </p>
                              <div className="grid grid-cols-3 gap-2">
                                {goalsInTier.map(g => (
                                  <button key={g.id} onClick={() => { if (!g.tier) return; setTopWatchPopup(null); setGoalPopup(goalPopup === g.id ? null : g.id); }} className="flex flex-col items-center gap-1 cursor-pointer">
                                    <span
                                      className={`w-[46px] h-[46px] rounded-full flex items-center justify-center text-[16px] transition-all bg-white/88 shadow-[0_0_0_3px_rgba(137,60,227,0.18),0_4px_12px_rgba(137,60,227,0.3)] ${selectedGoal === g.id ? 'scale-110' : ''}`}
                                      style={{ border: `3px solid ${tc.color}` }}
                                    >
                                      {g.icon}
                                    </span>
                                    <span className="text-[9px] font-bold text-center leading-tight text-[#5a1d8a]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                                      {isZh ? g.labelZh ?? g.label : g.label}
                                    </span>
                                  </button>
                                ))}
                                {inactiveGoals.map(g => (
                                  <button key={g.id} className="flex flex-col items-center gap-1 cursor-default opacity-40">
                                    <span className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-[16px] bg-[rgba(237,220,255,0.5)] grayscale border-2 border-[rgba(137,60,227,0.18)]">
                                      {g.icon}
                                    </span>
                                    <span className="text-[9px] font-bold text-center leading-tight text-[#b0aabf]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                                      {isZh ? g.labelZh ?? g.label : g.label}
                                    </span>
                                  </button>
                                ))}
                              </div>
                              {goalPopup !== null && (() => {
                                const g = view.goals.find(g => Number(g.id) === Number(goalPopup));
                                if (!g || g.tier !== tier) return null;
                                const nutrients = view.flows
                                  .filter(f => Number(f.goalId) === Number(goalPopup))
                                  .map(f => view.nutrients.find(n => Number(n.id) === Number(f.nutrientId)))
                                  .filter(Boolean);
                                return (
                                  <div
                                    className="absolute z-40 top-[72px] left-1/2 -translate-x-1/2 w-[260px] max-w-[calc(100vw-32px)] rounded-[18px] border border-[rgba(124,58,237,0.14)] bg-white/98 shadow-[0_12px_30px_rgba(80,40,160,0.18)] overflow-hidden"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <div className="flex items-start gap-2.5 px-4 py-3 border-b border-[#eee8f7]">
                                      <span className="text-[24px] leading-none">{g.icon}</span>
                                      <div className="min-w-0 flex-1">
                                        <h3 className="text-[15px] leading-tight font-extrabold text-[#1a1040]">
                                          {isZh ? g.labelZh ?? g.label : g.label}
                                        </h3>
                                        <p className="mt-0.5 text-[10px] leading-tight text-gray-400">
                                          {isZh ? '贡献营养素' : 'Contributing nutrients'}
                                        </p>
                                      </div>
                                      <button type="button" onClick={() => setGoalPopup(null)} className="w-6 h-6 flex items-center justify-center rounded-full text-[14px] text-gray-400 hover:bg-black/5">✕</button>
                                    </div>
                                    <div className="px-4 py-2 max-h-[190px] overflow-y-auto">
                                      {nutrients.map(n => n && (
                                        <div key={n.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#893ce3] flex-shrink-0" />
                                            <span className="text-[12px] font-semibold text-[#1a1040] truncate">{isZh ? n.nameZh ?? n.name : n.name}</span>
                                          </div>
                                          <span className="text-[11px] font-bold text-[#893ce3] whitespace-nowrap">
                                            {n.value != null ? `${n.value}${n.unit ?? ''}` : `${Number(n.dailyValue ?? 0).toFixed(2)}% DNC`}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    <p className="px-4 pb-3 text-[9px] leading-snug text-gray-400">{isZh ? '来源：' : isEs ? 'Fuente: ' : 'Source: '}{productTitle} · {isZh ? 'DNC（每日营养贡献）' : isEs ? 'DNC (Contribución Nutricional Diaria)' : 'DNC (Daily Nutrient Contribution)'}</p>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })}
                      </>
                    )}


                  </div>

                  {/* 右栏 — THINGS TO WATCH */}
                  <div className={`px-[18px] py-0 ${hasSafetyRisk ? 'opacity-40 pointer-events-none' : ''}`}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-[#5b21b6] tracking-wide text-sm">{isZh ? '需要留意' : 'THINGS TO WATCH'}</h4>
                      <span
                        onClick={() => thingsToWatchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        className="text-[10px] font-semibold text-[#893ce3] flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        👆 {isZh ? '点击了解更多' : 'Tap to know more'}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-[#6B6B8A] mb-2.5">
                      {isZh
                        ? `${summaryWatch.length} 项值得注意的成分${showProcessingWarning ? ` · ${processingWarningLabel}` : ''}`
                        : `${summaryWatch.length} ingredients worth noting${showProcessingWarning ? ` · ${processingWarningLabel}` : ''}`}
                    </p>
                    <div className="relative">
                      <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                        {/* 仅显示需要高亮的项目：High营养素、检测到的反式脂肪和添加剂 */}
                        {summaryWatch.map(w => {
                          const isNutrient = NUTRIENT_WATCH_CODES.has(w.code);
                          const status = isNutrient
                            ? watchStatus(w)
                            : ingredientStatus(w.present);

                          return (
                            <button
                              key={w.code}
                              type="button"
                              onClick={() => {
                                setGoalPopup(null);
                                setTopWatchPopup(p => (p === w.code ? null : w.code));
                              }}
                              className="flex flex-col items-center gap-1 cursor-pointer"
                            >
                              <span
                                className={`w-[48px] h-[48px] rounded-full bg-[rgba(255,237,213,0.8)] border-2 border-[rgba(249,115,22,0.35)] flex items-center justify-center text-[22px] transition-transform ${topWatchPopup === w.code ? 'scale-110' : ''
                                  }`}
                              >
                                {w.icon}
                              </span>

                              <span
                                className="text-[10px] font-bold text-[#1a1a3a] text-center leading-tight"
                                style={{ fontFamily: 'Nunito, sans-serif' }}
                              >
                                {isZh ? w.nameZh : w.name}
                              </span>

                              {/* 顶部小圆下方显示 HIGH / MODERATE / LOW / PRESENT */}
                              <span
                                className="text-[9px] font-extrabold tracking-wide"
                                style={{ color: status.color }}
                              >
                                {status.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* 顶部最右栏：结构化详情卡 —— 用 portal 渲染到 body，避免被后面的卡片盖住/裁切 */}
                      {topWatchPopupData?.present && (() => {
                        const watchData = topWatchPopupData as typeof topWatchPopupData & {
                          value?: number;
                          unit?: string;
                          dailyValue?: number;
                          ageLimit?: number | null;
                          ageLimitUnit?: string;
                          threshold?: number;
                          referenceBasis?: string;
                          value100g?: number;
                          categoryAverage?: number;
                          categoryDifferencePercent?: number;
                        };

                        const isNutrient = NUTRIENT_WATCH_CODES.has(watchData.code);
                        const hasNumericThreshold = WATCH_LIMIT_CODES.has(watchData.code);
                        const status = isNutrient
                          ? watchStatus(watchData)
                          : ingredientStatus(true);

                        return (
                          <div className="absolute right-0 top-full z-30 mt-2 w-[360px] max-w-[calc(100vw-32px)] max-h-[70vh] overflow-y-auto rounded-[22px] border border-[rgba(137,60,227,0.18)] bg-white shadow-[0_18px_48px_rgba(80,40,120,0.24)]">
                            <div className="sticky top-0 z-10 flex items-start gap-2.5 bg-white px-4 py-3 border-b border-[#eee8f7]">
                              <span className="text-[24px] leading-none">{watchData.icon}</span>

                              <div className="min-w-0 flex-1">
                                <h3 className="text-[15px] leading-tight font-extrabold text-[#1a1040]">
                                  {isZh ? watchData.nameZh : watchData.name}
                                </h3>

                                <p className="mt-0.5 text-[10px] leading-tight text-gray-400">
                                  {hasNumericThreshold
                                    ? (isZh ? '每100g/100ml含量、每日上限与同品类对比' : 'Per-100g content, daily limit and category comparison')
                                    : (isZh ? '检测结果与配料说明' : 'Detection and ingredient details')}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => setTopWatchPopup(null)}
                                className="w-6 h-6 flex items-center justify-center rounded-full text-[14px] text-gray-400 hover:bg-black/5"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="px-4 py-2">
                              {hasNumericThreshold ? (
                                <>
                                  <div className="py-3 border-b border-gray-100">
                                    <p className="text-[12px] font-semibold text-[#1a1040]">
                                      {isZh ? '每100g / 100ml 含量' : 'Per 100 g / 100 ml'}
                                    </p>
                                    <p className="mt-1 text-[13px] font-extrabold text-[#f97316]">
                                      {Number.isFinite(Number(watchData.value100g ?? watchData.value))
                                        ? `${Number(watchData.value100g ?? watchData.value).toLocaleString(undefined, {
                                          maximumFractionDigits: 3,
                                        })}${watchData.unit ?? ''}`
                                        : (isZh ? '暂无数值' : 'Value unavailable')}
                                      <span className="ml-1 font-semibold text-[#1a1040]">
                                        {isZh ? '每 100 g / 100 ml' : 'for 100 g / 100 ml'}
                                      </span>
                                    </p>
                                  </div>

                                  <div className="py-3 border-b border-gray-100">
                                    <p className="text-[12px] font-semibold text-[#1a1040]">
                                      {isZh ? '年龄对应每日上限' : 'Age-Specific Daily Limit'}
                                    </p>
                                    <p className="mt-1 text-[13px] font-extrabold" style={{ color: status.color }}>
                                      {Number(watchData.dailyValue ?? 0).toLocaleString(undefined, {
                                        maximumFractionDigits: 2,
                                      })}%, {status.label}
                                    </p>
                                    <p className="mt-1 text-[10px] leading-snug text-gray-400">
                                      {watchData.ageLimit === null
                                        ? (isZh ? '该年龄段暂无明确每日上限' : 'No established daily limit for this age group')
                                        : (isZh
                                          ? `每日参考上限：${watchData.ageLimit ?? '—'}${watchData.ageLimitUnit ?? ''}；基于标准化100g参考`
                                          : `Daily reference limit: ${watchData.ageLimit ?? '—'}${watchData.ageLimitUnit ?? ''}; based on a standardized 100 g reference`)}
                                    </p>
                                  </div>

                                  <div className="py-3">
                                    <p className="text-[12px] font-semibold text-[#1a1040]">
                                      {isZh ? '同品类平均' : 'Category Average'}
                                    </p>
                                    {Number.isFinite(Number(watchData.categoryAverage)) ? (
                                      <p className="mt-1 text-[13px] font-extrabold text-[#f97316]">
                                        {Number(watchData.categoryAverage).toLocaleString(undefined, {
                                          maximumFractionDigits: 3,
                                        })}{watchData.unit ?? ''}
                                        {Number.isFinite(Number(watchData.categoryDifferencePercent)) && (
                                          <span className="ml-1">
                                            {Number(watchData.categoryDifferencePercent) > 0
                                              ? (isZh
                                                ? `，高 ${Math.abs(Number(watchData.categoryDifferencePercent)).toFixed(0)}%`
                                                : `, ${Math.abs(Number(watchData.categoryDifferencePercent)).toFixed(0)}% higher`)
                                              : Number(watchData.categoryDifferencePercent) < 0
                                                ? (isZh
                                                  ? `，低 ${Math.abs(Number(watchData.categoryDifferencePercent)).toFixed(0)}%`
                                                  : `, ${Math.abs(Number(watchData.categoryDifferencePercent)).toFixed(0)}% lower`)
                                                : (isZh ? '，与平均值相同' : ', same as average')}
                                          </span>
                                        )}
                                      </p>
                                    ) : (
                                      <p className="mt-1 text-[11px] text-gray-400">
                                        {isZh ? 'Open Food Facts 暂无同品类平均数据' : 'No category average available from Open Food Facts'}
                                      </p>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-100">
                                    <span className="text-[12px] font-semibold text-[#1a1040] truncate">
                                      {isZh ? '检测状态' : 'Detection Status'}
                                    </span>
                                    <span className="text-[11px] font-bold text-[#dc2626] whitespace-nowrap">
                                      {status.label}
                                    </span>
                                  </div>

                                  <div className="py-2 border-b border-gray-100">
                                    <p className="text-[12px] font-semibold text-[#1a1040] mb-1">
                                      {isZh ? '为什么需要注意' : 'Why It Matters'}
                                    </p>
                                    <p className="text-[11px] leading-relaxed text-[#615c73]">
                                      {isZh ? watchData.detailZh : watchData.detail}
                                    </p>
                                  </div>

                                  <div className="py-2">
                                    <p className="text-[12px] font-semibold text-[#1a1040] mb-1">
                                      {isZh ? '数据来源' : 'Evidence Source'}
                                    </p>
                                    <p className="text-[11px] font-bold text-[#f97316]">
                                      {isZh
                                        ? '产品配料表与 Open Food Facts 添加剂标签'
                                        : 'Ingredient list and Open Food Facts additive tags'}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    {showProcessingWarning && (
                      <div className="bg-[rgba(249,115,22,0.08)] border-l-3 border-[#f97316] rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                        <span className="text-[22px] flex-shrink-0 mt-0.5">
                          {NOVA_ICON[view.product.novaScore ?? 4] ?? '🍭'}
                        </span>
                        <span className="text-[10px] font-bold text-[#9a3412] tracking-wide" style={{ fontFamily: 'Nunito, sans-serif' }}>
                          {processingWarningLabel}
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </div>
              <div className="border-t border-[rgba(160,120,210,0.25)] pt-3 pb-1 px-[18px] mb-5">
                <div className="flex items-center flex-wrap gap-2 mb-1.5">
                  <span className="text-[9px] font-extrabold text-gray-400 tracking-wide mr-1">
                    {isZh ? '来源：' : 'SOURCES:'}
                  </span>
                  {[
                    'WHO', 'AAP', 'AHA', 'BioRxiv', 'CDC', 'Front. Nutr', 'IJORO',
                    'MMPE', 'NCBI', 'NIH ODS', 'PMC + NCBI', 'Karger',
                    'ScienceDirect', 'NDC', 'USPSTF', 'Open Food Facts',
                  ].map(src => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => navigate('/about', { state: { tab: 'sources', source: src } })}
                      className="px-2.5 py-0.5 rounded-full bg-[rgba(137,60,227,0.08)] border border-[rgba(137,60,227,0.22)] text-[9px] font-bold text-[#7c3aed] hover:bg-[rgba(137,60,227,0.16)] cursor-pointer transition-colors"
                    >
                      {src}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-gray-400">
                  👆 {isZh ? '点击了解更多' : 'Tap to know more'}
                </span>
              </div>
            </section>

            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-5 ${hasSafetyRisk ? 'opacity-40 pointer-events-none' : ''} `}>
              {/* ② 成长益处 */}
              <section
                ref={growthBenefitsRef}
                className={`bg-white/70 backdrop-blur-xl rounded-[18px] border-[1.5px] border-white/90 shadow-[0_8px_32px_rgba(139,92,246,0.1),inset_0_1.5px_0_rgba(255,255,255,0.95)] p-5 animate-fade-in-up delay-100 relative overflow-visible ${hasSafetyRisk ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <SectionBadge n={2} />
                    <h2 className="text-xl font-extrabold text-gray-900">{isZh ? '成长益处' : isEs ? 'Beneficios para el Crecimiento' : 'Growth Benefits'}</h2>
                    <span className="text-gray-300 cursor-help" title={isZh ? '基于该食物营养成分与孩子发育目标的匹配' : isEs ? 'Basado en la coincidencia de los nutrientes de este alimento con los objetivos de desarrollo de tu hijo' : 'Based on matching this food’s nutrients to your child’s development goals'}>ⓘ</span>
                  </div>

                  {isLowLevel ? (
                    <p className="text-sm text-gray-500 py-6">{isZh ? '该食品营养益处有限，请重点关注「家长须知」中的风险提示。' : isEs ? 'Este alimento ofrece beneficios nutricionales limitados; consulta las advertencias para padres a continuación.' : 'This food offers limited nutritional benefit; please review the parental guidance below.'}</p>
                  ) : ribbons.length === 0 ? (
                    <p className="text-sm text-gray-500 py-6">{isZh ? '该食物对孩子当前的发育目标没有明显的营养支持。' : isEs ? 'Este alimento ofrece poco apoyo nutricional para los objetivos de desarrollo seleccionados.' : 'This food offers little nutrient support for the selected development goals.'}</p>
                  ) : (
                    <>
                      <div className="bg-[rgba(167,139,250,0.12)] border-l-4 border-[#a78bfa] rounded-[10px] px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
                        <span className="font-bold text-[#0f0f1a]" style={{ fontFamily: 'Nunito, sans-serif', fontSize: '13px' }}>
                          ⭐ {isZh ? '支持' : 'Supports'} <span className="text-[#893ce3]">{tierCounts?.core ?? 0} {isZh ? '核心' : 'Core'}</span>,{' '}
                          <span className="text-[#b441c3]">{tierCounts?.important ?? 0} {isZh ? '重要' : 'Important'}</span> {isZh ? '和' : 'and'} <span className="text-[#db46a6]">{tierCounts?.supporting ?? 0} {isZh ? '辅助' : 'Supporting'}</span> {isZh ? '目标' : 'Goal'}
                        </span>
                        {topNutrients.length > 0 && (
                          <span className="text-[#0f0f1a]" style={{ fontFamily: 'Nunito, sans-serif', fontSize: '12px' }}>
                            · {isZh ? '富含' : 'Good source of'}{' '}
                            {topNutrients.map((n, i) => (
                              <span key={n.id} className="font-bold" style={{ color: nutrientColor(n.id) }}>
                                {isZh ? n.nameZh ?? n.name : n.name}{i < topNutrients.length - 1 ? (isZh ? '、' : ' & ') : ''}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-[#5b21b6] tracking-wide mb-1">{isZh ? '食物如何帮助成长' : isEs ? 'CÓMO AYUDA ESTE ALIMENTO' : 'HOW THIS FOOD HELPS'}</h4>
                      <p className="text-sm text-gray-400 mb-3">👆 {isZh ? '点击任意目标或营养素查看详情' : isEs ? 'Toca cualquier objetivo o nutriente para ver detalles' : 'Tap any goal or nutrient to see details'}</p>

                      <div className="relative">
                        <svg viewBox={`0 0 ${svgWidth} ${SK.height}`} className="w-full h-auto select-none">
                          <defs>
                            {ribbons.map((r: any, i: number) => (
                              <linearGradient key={i} id={`flow-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={TIER_COLOR[goalById(r.goalId).tier!]} />
                                <stop offset="100%" stopColor={nutrientColor(r.nutrientId)} />
                              </linearGradient>
                            ))}
                          </defs>

                          {ribbons.map((r: any, i: number) => (
                            <path key={i} d={r.path} fill={`url(#flow-${i})`}
                              opacity={ribbonActive(r) ? (selectedGoal != null || selectedNutrient != null ? 0.65 : 0.3) : 0.07}
                              className="transition-opacity duration-300 cursor-pointer" onClick={() => toggleGoal(r.goalId)} />
                          ))}

                          {goalNodes.map((n: any) => {
                            const g = goalById(n.id);
                            return (
                              <g key={n.id} className="cursor-pointer" onClick={() => toggleGoal(n.id)}>
                                <rect x={SK.leftX} y={n.y0} width={SK.nodeWidth} height={n.y1 - n.y0} rx={8} fill={TIER_COLOR[g.tier!]} opacity={selectedGoal == null || selectedGoal === n.id ? 1 : 0.3} className="transition-opacity" />
                                <text x={SK.leftX + SK.nodeWidth + 12} y={(n.y0 + n.y1) / 2 + 1} dominantBaseline="middle" fontSize="26" fontWeight="800" fill={TIER_COLOR[g.tier!]}>
                                  {g.icon} {isZh ? g.labelZh ?? g.label : (g.label ?? '').replace('Development', 'Dev.')}
                                </text>
                              </g>
                            );
                          })}

                          {nutrientNodes.map((n: any) => {
                            const nt = nutrientById(n.id);
                            const color = nutrientColor(n.id);
                            return (
                              <g key={n.id} className="cursor-pointer" onClick={() => toggleNutrient(n.id)}>
                                <rect x={SK.rightX} y={n.y0} width={SK.nodeWidth} height={n.y1 - n.y0} rx={8} fill={color} opacity={selectedNutrient == null || selectedNutrient === n.id ? 1 : 0.3} className="transition-opacity" />
                                <text
                                  x={SK.rightX + SK.nodeWidth + 12}
                                  y={(n.y0 + n.y1) / 2}
                                  textAnchor="start"
                                  dominantBaseline="middle"
                                >
                                  <tspan
                                    x={SK.rightX + SK.nodeWidth + 12}
                                    dy="-0.55em"
                                    fontSize="26"
                                    fontWeight="800"
                                    fill={color}
                                  >
                                    {isZh ? nt.nameZh ?? nt.name : nt.name}
                                  </tspan>

                                  <tspan
                                    x={SK.rightX + SK.nodeWidth + 12}
                                    dy="1.35em"
                                    fontSize="18"
                                    fontWeight="500"
                                    fill={color}
                                  >
                                    {levelLabel(nt.level)}
                                  </tspan>
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                        {selectedNutrientData && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setSelectedNutrient(null)}
                            />
                            <div
                              className="absolute left-1/2 -translate-x-1/2 z-50 bg-white rounded-[20px] shadow-[0_8px_32px_rgba(80,40,160,0.18)] p-5 w-[300px]"
                              style={{ top: 0 }}
                              onClick={e => e.stopPropagation()}
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <span className="text-3xl">🔬</span>
                                  <div>
                                    <h3 className="text-[15px] font-extrabold text-[#1a1040]">
                                      {isZh ? selectedNutrientData.nameZh ?? selectedNutrientData.name : selectedNutrientData.name}
                                    </h3>
                                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full mt-1 inline-block ${selectedNutrientData.level === 'High' ? 'bg-green-100 text-green-700' :
                                      selectedNutrientData.level === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-600'
                                      }`}>
                                      {levelLabel(selectedNutrientData.level)} {isZh ? '来源' : 'Source'}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setSelectedNutrient(null)}
                                  className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-black/5 transition"
                                >
                                  ✕
                                </button>
                              </div>

                              {[
                                { label: isZh ? '每100g含量' : isEs ? 'Por 100g' : 'Per 100g', value: selectedNutrientData.value100g != null ? `${selectedNutrientData.value100g}${selectedNutrientData.unit ?? ''}` : '—' },
                                { label: '% DNC', value: `${Number(selectedNutrientData.dailyValue ?? 0).toFixed(2)}%` },
                                ...(selectedNutrientData.dailyReference != null
                                  ? [{ label: isZh ? '每日需求' : isEs ? 'Necesidad Diaria' : 'Daily Need', value: `${selectedNutrientData.dailyReference}${selectedNutrientData.unit ?? ''}` }]
                                  : []),
                              ].map(row => (
                                <div key={row.label} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#0ea5e9] flex-shrink-0" />
                                    <span className="text-[14px] font-semibold text-[#1a1040]">{row.label}</span>
                                  </div>
                                  <span className="text-[14px] font-bold text-[#0ea5e9]">{row.value}</span>
                                </div>
                              ))}

                              <p className="mt-3 text-[11px] text-gray-400">
                                {isZh ? '来源：' : 'Source: '}{productTitle}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      {(selectedGoalData || selectedNutrientData) && (
                        <div className="mt-3 rounded-2xl bg-purple-50/70 border border-purple-100 px-4 py-3 text-sm text-gray-700 animate-fade-in-up">
                          {selectedGoalData && (
                            <>
                              <p className="font-bold text-[#893ce3] mb-1">{selectedGoalData.icon} {isZh ? selectedGoalData.labelZh ?? selectedGoalData.label : selectedGoalData.label}</p>
                              <p>
                                {isZh
                                  ? `该食物为此目标提供约 ${selectedGoalData.supportDV}% 的每日营养支持，主要来自：`
                                  : `This food provides ~${selectedGoalData.supportDV}% daily nutrient support for this goal, mainly from: `}
                                {view.flows.filter(f => Number(f.goalId) === Number(selectedGoalData.id)).map(f => {
                                  const nt = nutrientById(f.nutrientId);
                                  return isZh ? nt.nameZh ?? nt.name : nt.name;
                                }).join(isZh ? '、' : ', ')}
                              </p>
                            </>
                          )}
                          {selectedNutrientData && (
                            <>
                              <p className="font-bold mb-1" style={{ color: nutrientColor(selectedNutrientData.id) }}>
                                {isZh ? selectedNutrientData.nameZh ?? selectedNutrientData.name : selectedNutrientData.name} · {levelLabel(selectedNutrientData.level)}
                              </p>
                              <p>
                                {isZh
                                  ? `约占每日营养贡献（Daily Nutrient Contribution, DNC）的 ${Number(selectedNutrientData.dailyValue ?? 0).toFixed(2)}%${selectedNutrientData.value100g != null ? `（每100g含 ${selectedNutrientData.value100g}${selectedNutrientData.unit ?? ''}）` : ''}。`
                                  : isEs
                                    ? `~${Number(selectedNutrientData.dailyValue ?? 0).toFixed(2)}% DNC (Contribución Nutricional Diaria)${selectedNutrientData.value100g != null ? ` (${selectedNutrientData.value100g}${selectedNutrientData.unit ?? ''} per 100g)` : ''}.`
                                    : `~${Number(selectedNutrientData.dailyValue ?? 0).toFixed(2)}% DNC (Daily Nutrient Contribution)${selectedNutrientData.value100g != null ? ` (${selectedNutrientData.value100g}${selectedNutrientData.unit ?? ''} per 100g)` : ''}.`}
                              </p>
                            </>
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                        <div className="space-y-1.5 text-sm font-semibold">
                          <p className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded" style={{ background: TIER_COLOR.core }} /> <span className="text-[#4c1d95]">{isZh ? '核心目标' : 'Core Goals'}</span></p>
                          <p className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded" style={{ background: TIER_COLOR.important }} /> <span className="text-[#a21caf]">{isZh ? '重要目标' : 'Important Goals'}</span></p>
                          <p className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded" style={{ background: TIER_COLOR.supporting }} /> <span className="text-[#db2777]">{isZh ? '辅助目标' : 'Supporting Goals'}</span></p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p className="font-bold text-gray-700 text-sm mb-0.5">% {isZh ? '每日营养贡献说明（DNC）' : isEs ? 'Guía de DNC' : 'DNC guide'}</p>
                          <p className="mb-1">{isZh ? 'DNC = 每100g/100mL营养素含量 ÷ 该年龄段每日推荐摄入量 × 100' : isEs ? 'DNC = Cantidad de nutriente por 100g/100mL ÷ Ingesta diaria recomendada × 100' : 'DNC = Nutrient amount per 100g/100mL ÷ Age-specific daily recommended intake × 100'}</p>
                          <p>{isZh ? '高 ≥ 20%' : 'High ≥ 20%'}</p>
                          <p>{isZh ? '中等 10–19%' : 'Moderate 10–19%'}</p>
                          <p>{isZh ? '低 < 10%' : 'Low < 10%'}</p>
                          <p>{isZh ? `基于${view.child.age ?? 8}岁儿童膳食参考摄入量` : `based on age ${view.child.age ?? 8} DRI`}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {!isLowLevel && (<div className="pt-4 pb-1 px-[18px] mb-5">
                  <div className="flex items-center flex-wrap gap-2 mb-1.5">
                    <span className="text-[9px] font-extrabold text-gray-400 tracking-wide mr-1">
                      {isZh ? '来源：' : 'SOURCES:'}
                    </span>
                    {[
                      'NIH ODS', 'AAP', 'IOM · DRI',
                    ].map(src => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => navigate('/about', { state: { tab: 'sources', source: src } })}
                        className="px-2.5 py-0.5 rounded-full bg-[rgba(137,60,227,0.08)] border border-[rgba(137,60,227,0.22)] text-[9px] font-bold text-[#7c3aed] hover:bg-[rgba(137,60,227,0.16)] cursor-pointer transition-colors"
                      >
                        {src}
                      </button>
                    ))}
                    <span className="text-[11px] font-semibold text-gray-400">
                      👆 {isZh ? '点击了解更多' : 'Tap to know more'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed mb-1">
                    {isZh
                      ? 'DNC（每日营养贡献）依据 DRI（美国医学研究所 IOM）分龄推荐量；发育目标↔营养素映射依据 AAP 与 NIH ODS 营养学资料。'
                      : isEs
                        ? 'La DNC se basa en las DRI (Instituto de Medicina, IOM); el mapeo de objetivos de desarrollo se basa en AAP y NIH ODS.'
                        : 'Daily Nutrient Contribution (DNC) is based on DRI (Institute of Medicine, IOM); development goal–nutrient mapping is based on AAP and NIH ODS.'}
                  </p>
                </div>
                )}
              </section>

              {/* ③ 家长须知 */}
              <section
                ref={thingsToWatchRef}
                className={`bg-white/70 backdrop-blur-xl rounded-[18px] border-[1.5px] border-white/90 shadow-[0_8px_32px_rgba(220,100,80,0.08),inset_0_1.5px_0_rgba(255,255,255,0.95)] p-5 animate-fade-in-up delay-200 relative overflow-visible ${hasSafetyRisk ? 'opacity-40 pointer-events-none' : ''}`}
              >   <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <SectionBadge n={3} />
                    <h2 className="text-xl font-extrabold text-gray-900">{isZh ? '家长须知' : 'Things Parents Should Know'}</h2>
                    <span className="text-gray-300 cursor-help ml-auto" title={isZh ? '基于配料表与NOVA加工等级' : 'Based on the ingredient list and NOVA processing classification'}>ⓘ</span>
                  </div>

                  <div className="bg-[rgba(249,115,22,0.18)] border-l-5 border-[#f97316] rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2">
                    <span>🔴</span>
                    <span className="text-xs font-bold text-[#9a3412]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {isZh
                        ? `${presentWatch.length} 项值得注意的成分${showProcessingWarning ? ` · ${processingWarningLabel}` : ''}`
                        : `${presentWatch.length} ingredients worth noting${showProcessingWarning ? ` · ${processingWarningLabel}` : ''}`}
                    </span>
                  </div>

                  {(() => {
                    // 只展示真正需要注意 / 实际检测到的项目。
                    // 下方详细栏显示全部项目；未检测到的项目自动置灰
                    const nutrientWatch = view.watch.filter(
                      w => NUTRIENT_WATCH_CODES.has(w.code)
                    );
                    const ingredientWatch = view.watch.filter(
                      w => !NUTRIENT_WATCH_CODES.has(w.code)
                    );

                    const renderWatchPopup = () => {
                      if (!selectedWatchData) return null;

                      const isNutrient = NUTRIENT_WATCH_CODES.has(selectedWatchData.code);
                      const hasNumericThreshold = WATCH_LIMIT_CODES.has(selectedWatchData.code);

                      // Added sugar / sodium / saturated fat remain clickable
                      // even when their level is Moderate or Low. Ingredient
                      // cards and trans fat still require present === true.
                      if (!isNutrient && !selectedWatchData.present) return null;
                      if (selectedWatchData.code === 'transfat' && !selectedWatchData.present) return null;
                      const wd = selectedWatchData as typeof selectedWatchData & {
                        value?: number;
                        unit?: string;
                        dailyValue?: number;
                        ageLimit?: number | null;
                        ageLimitUnit?: string;
                        referenceBasis?: string;
                        value100g?: number;
                        categoryAverage?: number;
                        categoryDifferencePercent?: number;
                      };
                      const status = isNutrient
                        ? watchStatus(wd)
                        : ingredientStatus(wd.present);

                      return (
                        <div className="relative z-20 w-[360px] rounded-[18px] border border-[rgba(249,115,22,0.22)] bg-white/95 shadow-[0_10px_26px_rgba(80,40,120,0.15)]">
                          {/* Header */}
                          <div className="flex items-start gap-2.5 px-4 py-3 border-b border-[#eee8f7]">
                            <span className="text-[24px] leading-none">{wd.icon}</span>

                            <div className="min-w-0 flex-1">
                              <h3 className="text-[15px] leading-tight font-extrabold text-[#1a1040]">
                                {isZh ? wd.nameZh : wd.name}
                              </h3>
                              <p className="mt-0.5 text-[10px] leading-tight text-gray-400">
                                {hasNumericThreshold
                                  ? (isZh ? '每100g/100ml含量、每日上限与同品类对比' : 'Per-100g content, daily limit and category comparison')
                                  : (isZh ? '检测结果与配料说明' : 'Detection and ingredient details')}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedWatch(null)}
                              className="w-6 h-6 flex items-center justify-center rounded-full text-[14px] text-gray-400 hover:bg-black/5"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Body */}
                          {hasNumericThreshold ? (
                            <div className="px-4 py-2">
                              <div className="flex items-start gap-2.5 py-2.5 border-b border-gray-100">
                                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#893ce3]" />
                                <div>
                                  <p className="text-[12px] font-semibold text-[#1a1040]">
                                    {isZh ? '每100g / 100ml 含量' : 'Per 100 g / 100 ml'}
                                  </p>
                                  <p className="mt-0.5 text-[13px] font-bold text-[#f97316]">
                                    {Number.isFinite(Number(wd.value100g ?? wd.value))
                                      ? `${Number(wd.value100g ?? wd.value).toLocaleString(undefined, { maximumFractionDigits: 3 })}${wd.unit ?? ''}`
                                      : (isZh ? '暂无数值' : 'Value unavailable')}
                                    <span className="ml-1 font-semibold text-[#1a1040]">
                                      {isZh ? '每 100 g / 100 ml' : 'for 100 g / 100 ml'}
                                    </span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2.5 py-2.5 border-b border-gray-100">
                                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#893ce3]" />
                                <div>
                                  <p className="text-[12px] font-semibold text-[#1a1040]">
                                    {isZh ? '年龄对应每日上限' : 'Age-Specific Daily Limit'}
                                  </p>
                                  <p className="mt-0.5 text-[13px] font-bold" style={{ color: status.color }}>
                                    {Number(wd.dailyValue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}%, {status.label}
                                  </p>
                                  <p className="mt-0.5 text-[10px] text-gray-400">
                                    {wd.ageLimit === null
                                      ? (isZh ? '该年龄段暂无明确每日上限' : 'No established daily limit for this age group')
                                      : (isZh
                                        ? `每日参考上限：${wd.ageLimit ?? '—'}${wd.ageLimitUnit ?? ''}；基于标准化100g参考`
                                        : `Daily reference limit: ${wd.ageLimit ?? '—'}${wd.ageLimitUnit ?? ''}; based on a standardized 100 g reference`)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2.5 py-2.5">
                                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#893ce3]" />
                                <div>
                                  <p className="text-[12px] font-semibold text-[#1a1040]">
                                    {isZh ? '同品类平均' : 'Category Average'}
                                  </p>
                                  {Number.isFinite(Number(wd.categoryAverage)) ? (
                                    <p className="mt-0.5 text-[13px] font-bold text-[#f97316]">
                                      {Number(wd.categoryAverage).toLocaleString(undefined, { maximumFractionDigits: 3 })}{wd.unit ?? ''}
                                      {Number.isFinite(Number(wd.categoryDifferencePercent)) && (
                                        <span className="ml-1">
                                          {Number(wd.categoryDifferencePercent) > 0
                                            ? (isZh
                                              ? `高 ${Math.abs(Number(wd.categoryDifferencePercent)).toFixed(0)}%`
                                              : `${Math.abs(Number(wd.categoryDifferencePercent)).toFixed(0)}% higher`)
                                            : Number(wd.categoryDifferencePercent) < 0
                                              ? (isZh
                                                ? `低 ${Math.abs(Number(wd.categoryDifferencePercent)).toFixed(0)}%`
                                                : `${Math.abs(Number(wd.categoryDifferencePercent)).toFixed(0)}% lower`)
                                              : (isZh ? '与平均值相同' : 'same as average')}
                                        </span>
                                      )}
                                    </p>
                                  ) : (
                                    <p className="mt-0.5 text-[10px] text-gray-400">
                                      {isZh ? 'Open Food Facts 暂无同品类平均数据' : 'No category average available from Open Food Facts'}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="px-4 py-3">
                              <p className="text-[11px] leading-[1.5] text-[#615c73]">
                                {isZh ? wd.detailZh : wd.detail}
                              </p>

                              {view.additiveTags
                                .filter(a => {
                                  const info = ADDITIVE_DICT[a.code];
                                  return info && WATCH_ADDITIVE_TYPES[wd.code]?.includes(info.type);
                                })
                                .map(a => {
                                  const info = ADDITIVE_DICT[a.code]!;
                                  const risk = RISK_COLOR[info.risk];
                                  return (
                                    <div
                                      key={a.code}
                                      className="mt-2.5 rounded-[12px] border px-3 py-2.5"
                                      style={{ background: risk.bg, borderColor: risk.border }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-extrabold" style={{ color: risk.text }}>
                                          {a.code}
                                        </span>
                                        <span className="text-[11px] font-bold text-[#29233f]">
                                          {isZh ? info.nameZh : info.name}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-[10px] leading-[1.45] text-gray-600">
                                        {isZh ? info.descZh : info.desc}
                                      </p>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      );
                    };

                    return (
                      <>
                        {/* ① Nutrients to Watch */}
                        <div className="mb-7">
                          <div className="mb-4">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-[#f97316] flex-shrink-0" />
                              <h3 className="text-[17px] font-extrabold tracking-wide text-[#c2410c] uppercase">
                                {isZh ? '需要关注的营养素' : 'Nutrients to Watch'}
                              </h3>
                            </div>
                            <div className="h-px bg-[rgba(249,115,22,0.28)] mt-3" />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {nutrientWatch.map(w => {
                              const level = watchStatus(w);

                              const canOpen =
                                w.available !== false && (
                                  w.code === 'transfat'
                                    ? w.present
                                    : ['added_sugar', 'sodium', 'satfat'].includes(w.code)
                                );
                              const isHighlighted = shouldHighlightWatch(w);
                              const isSelected =
                                canOpen &&
                                selectedWatch === w.code &&
                                NUTRIENT_WATCH_CODES.has(w.code);

                              return (
                                <div key={w.code} className="relative">
                                  <button
                                    disabled={!canOpen}
                                    onClick={() =>
                                      canOpen &&
                                      setSelectedWatch(selectedWatch === w.code ? null : w.code)
                                    }
                                    className={`aspect-square w-full rounded-[18px] px-2 py-3 flex flex-col items-center justify-center gap-2 border transition-all
          ${canOpen
                                        ? 'cursor-pointer hover:-translate-y-0.5 shadow-[0_8px_24px_rgba(249,115,22,0.12)]'
                                        : 'cursor-default opacity-60'
                                      }
          ${isSelected
                                        ? 'ring-2 ring-orange-300'
                                        : ''
                                      }`}
                                    style={{
                                      background: isHighlighted ? level.bg : 'rgba(255,255,255,0.38)',
                                      borderColor: isHighlighted
                                        ? 'rgba(251,146,60,0.42)'
                                        : 'rgba(255,255,255,0.65)',
                                    }}
                                  >
                                    <span
                                      className={`w-[70px] h-[70px] rounded-full flex items-center justify-center text-[31px] border-2
            ${isHighlighted ? '' : 'grayscale opacity-65'}`}
                                      style={{
                                        background: isHighlighted
                                          ? 'rgba(255,247,237,0.88)'
                                          : 'rgba(255,255,255,0.45)',
                                        borderColor: isHighlighted
                                          ? 'rgba(251,146,60,0.38)'
                                          : 'rgba(230,225,235,0.55)',
                                      }}
                                    >
                                      {w.icon}
                                    </span>

                                    <span
                                      className={`text-[12px] font-extrabold text-center leading-tight ${isHighlighted ? 'text-[#29233f]' : 'text-[#6f6b85]'
                                        }`}
                                    >
                                      {isZh ? w.nameZh : w.name}
                                    </span>

                                    <span
                                      className="text-[10px] font-extrabold tracking-wide"
                                      style={{ color: level.color }}
                                    >
                                      {level.label}
                                    </span>
                                  </button>

                                  {isSelected && (
                                    <div className="absolute right-0 top-full z-50 mt-2 w-[360px]">
                                      {renderWatchPopup()}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* ② Ingredients to Be Aware Of */}
                        <div className="mb-2">
                          <div className="mb-4">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-[#a855f7] flex-shrink-0" />
                              <h3 className="text-[17px] font-extrabold tracking-wide text-[#9333ea] uppercase">
                                {isZh ? '需要留意的配料' : 'Ingredients to Be Aware Of'}
                              </h3>
                            </div>
                            <div className="h-px bg-[rgba(168,85,247,0.28)] mt-3" />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {ingredientWatch.map(w => {
                              const isSelected =
                                w.present &&
                                selectedWatch === w.code &&
                                !NUTRIENT_WATCH_CODES.has(w.code);

                              return (
                                <div key={w.code} className="relative">
                                  <button
                                    disabled={!w.present}
                                    onClick={() =>
                                      w.present &&
                                      setSelectedWatch(selectedWatch === w.code ? null : w.code)
                                    }
                                    className={`aspect-square w-full rounded-[18px] px-2 py-3 flex flex-col items-center justify-center gap-2 border transition-all
          ${w.present
                                        ? 'bg-[rgba(255,247,237,0.78)] border-[rgba(251,146,60,0.38)] cursor-pointer hover:-translate-y-0.5 shadow-[0_8px_24px_rgba(249,115,22,0.10)]'
                                        : 'bg-white/35 border-white/65 cursor-default opacity-60'
                                      }
          ${w.present && selectedWatch === w.code
                                        ? 'ring-2 ring-orange-300'
                                        : ''
                                      }`}
                                  >
                                    <span
                                      className={`text-[34px] ${w.present ? '' : 'grayscale opacity-60'
                                        }`}
                                    >
                                      {w.icon}
                                    </span>

                                    <span
                                      className={`text-[12px] font-extrabold text-center leading-tight ${w.present ? 'text-[#29233f]' : 'text-[#6f6b85]'
                                        }`}
                                    >
                                      {isZh ? w.nameZh : w.name}
                                    </span>

                                    {w.present && (
                                      <span className="text-[10px] font-extrabold tracking-wide text-red-600">
                                        {isZh ? '已检出' : isEs ? 'PRESENTE' : 'PRESENT'}
                                      </span>
                                    )}
                                  </button>

                                  {isSelected && (
                                    <div className="absolute right-0 top-full z-50 mt-2 w-[360px]">
                                      {renderWatchPopup()}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {nutrientWatch.length === 0 && ingredientWatch.length === 0 && (
                          <div className="rounded-[18px] bg-white/45 border border-white/70 px-4 py-5 mb-6">
                            <p className="text-[13px] font-bold text-[#6b6b8a]">
                              {isZh
                                ? '未检测到需要特别注意的营养素或配料。'
                                : 'No nutrients or ingredients requiring special attention were detected.'}
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {showProcessingWarning && (
                    <div className="border-t border-[rgba(200,160,100,0.25)] pt-4 mt-3">
                      <h4 className="font-extrabold text-[#a07040] tracking-wide mb-2">{isZh ? '加工程度' : 'PROCESSING'}</h4>
                      <div className="flex items-baseline gap-2.5 mb-3">
                        <span className="text-[26px] font-extrabold text-[#ea6c00] italic" style={{ fontFamily: 'Poppins, sans-serif' }}>{processingWarningLabel}</span>
                      </div>

                      <div className="flex justify-between mb-1.5">
                        <div className="flex-1 text-center">
                          <span className="block text-[10px] font-extrabold text-[#22c55e]">{isZh ? '低度加工' : 'Minimally Processed'}</span>
                        </div>
                        <div className="flex-1 text-center">
                          <span className="block text-[10px] font-extrabold text-[#d4c000]">{isZh ? '烹饪配料' : 'Culinary Ingredients'}</span>
                        </div>
                        <div className="flex-1 text-center">
                          <span className="block text-[10px] font-extrabold text-[#f97316]">{isZh ? '加工食品' : 'Processed Foods'}</span>
                        </div>
                        <div className="flex-1 text-center">
                          <span className="block text-[10px] font-extrabold text-[#ef4444]">{processingWarningLabel}</span>
                        </div>
                      </div>

                      <div className="relative mb-1.5">
                        <div className="h-[12px] rounded-full overflow-hidden flex">
                          <div className="flex-1 bg-[#22c55e]" />
                          <div className="flex-1 bg-[#fde047]" />
                          <div className="flex-1 bg-[#f97316]" />
                          <div className="flex-1 bg-[#ef4444]" />
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-[3px] border-[#4a4a6a] shadow" style={{ left: `calc(${nova.pos} - 10px)` }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 font-medium mb-3.5">
                        <span className="text-center">
                          <span className="text-[16px]">🍎</span>
                          <br />
                          <span className="text-[10px]" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>{isZh ? '低度加工' : 'Minimally Processed'}</span>
                        </span>
                        <span className="text-center">
                          <span className="text-[16px]">🍭</span>
                          <br />
                          <span className="text-[10px]" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>{processingWarningLabel}</span>
                        </span>
                      </div>

                      <div className="relative rounded-[10px] border-[2.5px] border-[#f97316] bg-[rgba(249,115,22,0.12)] px-3 py-2.5 flex gap-2.5 items-start">
                        <span className="text-[22px] flex-shrink-0 mt-0.5">
                          {NOVA_ICON[view.product.novaScore ?? 4] ?? '🍭'}
                        </span>
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-[#9a3412] tracking-wide" style={{ fontFamily: 'Nunito, sans-serif' }}>
                            {processingWarningLabel}
                          </p>
                          <p className="text-[11px] font-semibold text-[#4a5568] mt-0.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
                            {isZh ? nova.examplesZh : nova.examples}
                          </p>
                        </div>
                        <span className="absolute -top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-[#f97316] text-white text-[10px] font-bold" style={{ fontFamily: 'Nunito, sans-serif' }}>
                          👆 {isZh ? '当前食物' : 'THIS FOOD'}
                        </span>
                      </div>
                      <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">
                        {isZh
                          ? '加工等级来源：NOVA 食品分类系统，巴西圣保罗大学 Monteiro 等 · 成分检测基于产品配料表'
                          : isEs
                            ? 'Fuente: Sistema de clasificación NOVA, Monteiro et al., Universidad de São Paulo · Detección de ingredientes basada en la lista de ingredientes del producto'
                            : 'Source: NOVA food classification system, Monteiro et al., University of São Paulo · Ingredient detection based on product ingredient list'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="border-t border-[rgba(160,120,210,0.25)] pt-3 pb-1 px-[18px] mb-5">
                  <div className="flex items-center flex-wrap gap-2 mb-1.5">
                    <span className="text-[11px] font-extrabold text-gray-400 tracking-wide mr-1">
                      {isZh ? '来源：' : 'SOURCES:'}
                    </span>
                    {[
                      'Open Food Facts',
                    ].map(src => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => navigate('/about', { state: { tab: 'sources', source: src } })}
                        className="px-2.5 py-0.5 rounded-full bg-[rgba(137,60,227,0.08)] border border-[rgba(137,60,227,0.22)] text-[9px] font-bold text-[#7c3aed] hover:bg-[rgba(137,60,227,0.16)] cursor-pointer transition-colors"
                      >
                        {src}
                      </button>
                    ))}
                  </div>
                  <span className="text-[9px] font-extrabold text-gray-400 tracking-wide mr-1">
                    👆 {isZh ? '点击了解更多' : 'Tap to know more'}
                  </span>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
      {showPhotoMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
          onClick={() => setShowPhotoMenu(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-[24px] p-6 pb-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <h3 className="text-[16px] font-extrabold text-[#1a1040] mb-5" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {isZh ? '添加食品' : 'Add Food'}
            </h3>
            <div className="flex flex-col gap-3">

              <button
                onClick={() => { setShowPhotoMenu(false); setShowScan(true); }}
                className="flex items-center gap-4 p-4 rounded-2xl border-[1.5px] border-[rgba(124,58,237,0.15)] hover:bg-purple-50 transition text-left"
              >
                <span className="text-3xl">📊</span>
                <div>
                  <p className="text-[14px] font-bold text-[#1a1040]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {isZh ? '扫条形码' : 'Scan Barcode'}
                  </p>
                  <p className="text-[12px] text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {isZh ? '对准条形码，即时查询数据库' : 'Point at the barcode for instant lookup'}
                  </p>
                </div>
              </button>

              <button
                onClick={() => { setShowPhotoMenu(false); cameraInputRef.current?.click(); }}
                className="flex items-center gap-4 p-4 rounded-2xl border-[1.5px] border-[rgba(124,58,237,0.15)] hover:bg-purple-50 transition text-left"
              >
                <span className="text-3xl">📷</span>
                <div>
                  <p className="text-[14px] font-bold text-[#1a1040]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {isZh ? '拍照识别' : 'Take Photo'}
                  </p>
                  <p className="text-[12px] text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {isZh ? '拍摄包装正面，AI 自动识别并提取条形码' : 'Snap the front of the package — AI will identify it'}
                  </p>
                </div>
              </button>


              <button
                onClick={() => { setShowPhotoMenu(false); uploadInputRef.current?.click(); }}
                className="flex items-center gap-4 p-4 rounded-2xl border-[1.5px] border-[rgba(124,58,237,0.15)] hover:bg-purple-50 transition text-left"
              >
                <span className="text-3xl">🖼️</span>
                <div>
                  <p className="text-[14px] font-bold text-[#1a1040]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {isZh ? '从相册选择' : 'Upload from Library'}
                  </p>
                  <p className="text-[12px] text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {isZh ? '从手机相册选择已有照片' : 'Choose an existing photo from your library'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      {showScan && <BarcodeScanModal isZh={isZh} onClose={() => setShowScan(false)} onCode={handleBarcode} />}
    </div>
  );

}
