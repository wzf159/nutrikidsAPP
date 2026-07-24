import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate, NavLink } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import {
  analyzeProduct, getChildren, lookupBarcode, recognizeImageUrl, recognizePhoto, searchProducts,
  type AnalysisResult, type ProductMatch, type Recognition,
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
  1: { label: 'Limited Benefit', labelZh: '益处有限', labelEs: 'Beneficio Limitado', summary: 'Limited overall benefit, as potential concerns outweigh the nutritional support for developmental goals.', summaryZh: '整体益处有限，潜在风险超过营养支持。', summaryEs: 'Beneficio general limitado, las preocupaciones superan el apoyo nutricional.', color: '#dc2626', bg: 'rgba(220,38,38,0.08)', emoji: '🚫' },
};

function scoreToLevel(score: number): number {
  if (score >= 75) return 5;
  if (score >= 58) return 4;
  if (score >= 44) return 3;
  if (score >= 37) return 2;
  return 1;
}

const levelColors = ['#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a'];

/* ------------------------------------------------------------------ */
/* Sankey 布局（由接口数据驱动）                                       */
/* ------------------------------------------------------------------ */

const SK = { width: 1100, height: 750, nodeWidth: 24, leftX: 10, rightX: 1100 - 150, padTop: 16, gap: 30 };

interface NodeLayout { id: number; y0: number; y1: number }

function useSankeyLayout(view: AnalysisResult['view'] | null) {
  return useMemo(() => {
    if (!view) return { goalNodes: [] as NodeLayout[], nutrientNodes: [] as NodeLayout[], ribbons: [] as { goalId: number; nutrientId: number; value: number; path: string }[] };

    const activeGoals = view.goals.filter(g => g.tier);
    const activeGoalIds = new Set(activeGoals.map(g => g.id));
    const activeFlows = view.flows.filter(f => activeGoalIds.has(f.goalId));
    const activeNutrientIds = new Set(activeFlows.map(f => f.nutrientId));
    const activeNutrients = view.nutrients.filter(n => activeNutrientIds.has(n.id));

    if (!activeFlows.length || !activeGoals.length || !activeNutrients.length)
      return { goalNodes: [], nutrientNodes: [], ribbons: [] };

    const goalTotals: Record<number, number> = {};
    const nutrientTotals: Record<number, number> = {};
    for (const f of activeFlows) {
      goalTotals[f.goalId] = (goalTotals[f.goalId] || 0) + f.value;
      nutrientTotals[f.nutrientId] = (nutrientTotals[f.nutrientId] || 0) + f.value;
    }
    const total = activeFlows.reduce((s, f) => s + f.value, 0);
    const rows = Math.max(activeGoals.length, activeNutrients.length);
    const avail = SK.height - SK.padTop * 2 - SK.gap * (rows - 1);
    const scale = avail / total;

    const stack = (ids: number[], totals: Record<number, number>): NodeLayout[] => {
      const out: NodeLayout[] = [];
      let y = SK.padTop;
      for (const id of ids) {
        const h = Math.max((totals[id] ?? 0) * scale, 6);
        out.push({ id, y0: y, y1: y + h });
        y += h + SK.gap;
      }
      return out;
    };

    const goalNodes = stack(activeGoals.map(g => g.id), goalTotals);
    const nutrientNodes = stack(activeNutrients.map(n => n.id), nutrientTotals);

    const goalOffset: Record<number, number> = {};
    const nutrientOffset: Record<number, number> = {};
    const ribbons = activeFlows.flatMap(f => {
      const g = goalNodes.find(n => n.id === f.goalId);
      const n = nutrientNodes.find(nd => nd.id === f.nutrientId);
      if (!g || !n) return [];
      const h = f.value * scale;
      const gy = g.y0 + (goalOffset[f.goalId] || 0);
      const ny = n.y0 + (nutrientOffset[f.nutrientId] || 0);
      goalOffset[f.goalId] = (goalOffset[f.goalId] || 0) + h;
      nutrientOffset[f.nutrientId] = (nutrientOffset[f.nutrientId] || 0) + h;
      const x0 = SK.leftX + SK.nodeWidth;
      const x1 = SK.rightX;
      const cx = (x0 + x1) / 2;
      const path = [`M ${x0} ${gy}`, `C ${cx} ${gy}, ${cx} ${ny}, ${x1} ${ny}`, `L ${x1} ${ny + h}`, `C ${cx} ${ny + h}, ${cx} ${gy + h}, ${x0} ${gy + h}`, 'Z'].join(' ');
      return [{ ...f, path }];
    });

    return { goalNodes, nutrientNodes, ribbons };
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
  | { name: 'error'; msg: string };

export default function FoodAnalyzer() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const isEs = i18n.language === 'es';
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>({ name: 'idle' });
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProductMatch[]>([]);
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

  useEffect(() => {
    loadChild();
    window.addEventListener('nutrikids:child-updated', loadChild);
    return () => window.removeEventListener('nutrikids:child-updated', loadChild);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (suggestions.length === 0) { setDropdownRect(null); return; }
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
  }, [suggestions]);

  // 搜索建议（防抖）
  useEffect(() => {
    const id = setTimeout(() => {
      if (query.trim().length >= 1) searchProducts(query).then(setSuggestions).catch(() => setSuggestions([]));
      else setSuggestions([]);
    }, 250);
    return () => clearTimeout(id);
  }, [query]);



  const view = result?.view ?? null;
  const { goalNodes, nutrientNodes, ribbons } = useSankeyLayout(view);

  const nutrientColor = (id: number) => {
    const idx = view?.nutrients.findIndex(n => n.id === id) ?? 0;
    return NUTRIENT_PALETTE[Math.max(idx, 0) % NUTRIENT_PALETTE.length];
  };
  const goalById = (id: number) => view!.goals.find(g => g.id === id)!;
  const nutrientById = (id: number) => view!.nutrients.find(n => n.id === id)!;


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

    try {
      const r = await analyzeProduct(activeChildId, productId, source);

      // 如果已经有更新的请求开始了，就丢弃旧结果
      if (requestId !== analysisRequestRef.current) {
        return;
      }

      setResult(r);
      setPhase({ name: 'idle' });
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
      setPhase({
        name: 'error',
        msg: isZh
          ? `识别为「${recognition.nameZh || recognition.nameEn}」，但食品库暂未收录该食品`
          : isEs
            ? `Reconocido como "${recognition.nameEn}" pero aún no está en la base de datos de alimentos`
            : `Recognized "${recognition.nameEn}" but it is not in the food database yet`,
      });
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
      setPhase({ name: 'busy', msg: isZh ? `查询条形码 ${code}…` : isEs ? `Buscando código ${code}…` : `Looking up barcode ${code}…` });

      const { product } = await lookupBarcode(code);
      console.log('barcode product:', product.id, product);

      await runAnalysis(product.id, 'barcode');
    } catch (e) {
      console.error('handleBarcode error:', e);
      setPhase({ name: 'error', msg: (e as Error).message });
    }
  }, [isZh, isEs]);

  async function decodeBarcodeFromFile(file: File) {
    setPhase({ name: 'busy', msg: isZh ? '正在从图片识别条形码…' : isEs ? 'Reconociendo código de barras de la imagen…' : 'Recognizing barcode from image…' });
    try {
      const reader = new BrowserMultiFormatReader();
      const imageUrl = URL.createObjectURL(file);
      const result = await reader.decodeFromImageUrl(imageUrl);
      URL.revokeObjectURL(imageUrl);
      await handleBarcode(result.getText());
    } catch (e) {
      setPhase({ name: 'error', msg: isZh ? '无法从图片识别条形码，请确保图片清晰并包含完整的条形码' : isEs ? 'No se pudo reconocer el código de barras de la imagen, asegúrese de que la imagen sea clara y contenga el código de barras completo' : 'Could not recognize barcode from image, please ensure the image is clear and contains a complete barcode' });
    }
  }

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
  const tierCounts = view ? {
    core: view.goals.filter(g => g.tier === 'core').length,
    important: view.goals.filter(g => g.tier === 'important').length,
    supporting: view.goals.filter(g => g.tier === 'supporting').length,
  } : null;
  const presentWatch = view?.watch.filter(w => w.present) ?? [];
  const grade = result ? GRADE_META[result.grade] ?? GRADE_META.Fair : null;
  const nova = view?.product.novaScore ? NOVA_META[view.product.novaScore] : null;
  const topNutrients = view?.nutrients.filter(n => n.level === 'High').slice(0, 2) ?? []; // 只有当某个营养素含量真正达到每日推荐量20%以上时，才会被算作"富含"候选
  const selectedGoalData = selectedGoal != null && view ? goalById(selectedGoal) : null;
  const selectedNutrientData = selectedNutrient != null && view ? nutrientById(selectedNutrient) : null;
  const selectedWatchData = selectedWatch != null && view ? view.watch.find(w => w.code === selectedWatch) : null;

  const ribbonActive = (r: { goalId: number; nutrientId: number }) =>
    (selectedGoal == null && selectedNutrient == null) || r.goalId === selectedGoal || r.nutrientId === selectedNutrient;
  const toggleGoal = (id: number) => { setSelectedNutrient(null); setSelectedGoal(p => (p === id ? null : id)); };
  const toggleNutrient = (id: number) => { setSelectedGoal(null); setSelectedNutrient(p => (p === id ? null : id)); };

  const productTitle = view ? (isZh ? view.product.nameZh ?? view.product.name : view.product.name) : '';
  const levelNum = result ? scoreToLevel(result.overallScore) : 1;
  const levelMeta = LEVEL_META[levelNum];
  const isPositive = levelNum >= 3;
  const hasAllergen = view ? (!view.allergenSafe && view.matchedAllergens.length > 0) : false;

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-[#d8ccf5] via-[#e8ccec] to-[#f5cce0]">
      <div className="px-6 py-2">
        <NavLink to="/" className="text-sm text-gray-500 hover:text-[#893ce3] flex items-center gap-1">
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
              onChange={e => setQuery(e.target.value)}
              placeholder={isZh ? '搜索食品名称，或拖入图片…' : isEs ? 'Busca alimentos, o arrastra una imagen…' : 'Search a food, or drop an image…'}
              className="flex-1 min-w-40 bg-transparent outline-none text-[#0f0f1a] text-[16px] placeholder-gray-400 font-[Nunito,sans-serif]"
            />
            <button onClick={() => cameraInputRef.current?.click()} className="px-4 py-2 rounded-full bg-white/90 border border-[rgba(100,120,160,0.15)] text-sm font-bold text-[#2a2a4a] hover:bg-[rgba(124,58,237,0.06)] transition whitespace-nowrap" style={{ fontFamily: 'Nunito, sans-serif' }}>
              📷 {isZh ? '拍照识别' : isEs ? 'Tomar Foto' : 'Snap Photo'}
            </button>
            <button
              onClick={() => setShowScan(true)}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file && file.type.startsWith('image/')) decodeBarcodeFromFile(file); }}
              className="px-4 py-2 rounded-full bg-white/90 border border-[rgba(100,120,160,0.15)] text-sm font-bold text-[#2a2a4a] hover:bg-[rgba(124,58,237,0.06)] transition whitespace-nowrap"
              style={{ fontFamily: 'Nunito, sans-serif' }}
              title={isZh ? '点击扫描或拖拽条形码图片到此处' : isEs ? 'Haga clic para escanear o arrastre una imagen de código de barras aquí' : 'Click to scan or drag barcode image here'}
            >
              📊 {isZh ? '扫条形码' : isEs ? 'Escanear Código' : 'Scan Barcode'}
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
              suggestions.length > 0 && dropdownRect && createPortal(
                <div
                  className="fixed bg-white/96 backdrop-blur-xl rounded-[18px] shadow-[0_16px_56px_rgba(124,58,237,0.16),0_2px_12px_rgba(0,0,0,0.08)] border border-[rgba(124,58,237,0.15)] overflow-hidden"
                  style={{ top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width, zIndex: 9999 }}
                >
                  {suggestions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setQuery(''); setSuggestions([]); runAnalysis(s.id, 'search'); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-purple-50 text-sm text-gray-700 flex items-center gap-2"
                    >
                      <span>🍽️</span>
                      <span className="font-medium truncate">{isZh ? s.nameZh ?? s.name : s.name}</span>
                      {s.brand?.name && <span className="text-gray-400 text-xs flex-shrink-0">{s.brand.name}</span>}
                    </button>
                  ))}
                </div>,
                document.body
              )
            }
          </div>

          {/* 手机端：两行胶囊（<sm 显示） */}
          <div className="flex sm:hidden flex-col gap-3 w-full">
            {/* 第一行：搜索输入 */}
            <div
              className={`relative bg-white/52 backdrop-blur-xl saturate-180 rounded-full px-5 py-3 flex items-center gap-2 ${dragging ? 'ring-2 ring-[#893ce3] ring-offset-2' : ''
                }`}
              style={{ border: '1px solid rgba(255,255,255,0.8)' }}
            >
              <span className="text-sm flex-shrink-0">🔍</span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={isZh ? '搜索食品，或拖入图片…' : isEs ? 'Busca o arrastra una imagen…' : 'Search or drop an image…'}
                className="flex-1 min-w-0 bg-transparent outline-none text-[#0f0f1a] text-[16px] placeholder-gray-400 font-[Nunito,sans-serif]"
              />

              {suggestions.length > 0 && (
                <div className="absolute left-2 right-2 top-full mt-2 bg-white/96 backdrop-blur-xl rounded-[18px] shadow-[0_16px_56px_rgba(124,58,237,0.16),0_2px_12px_rgba(0,0,0,0.08)] border border-[rgba(124,58,237,0.15)] z-50 overflow-hidden">
                  {suggestions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setQuery(''); setSuggestions([]); runAnalysis(s.id, 'search'); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-purple-50 text-sm text-gray-700 flex items-center gap-2"
                    >
                      <span>🍽️</span>
                      <span className="font-medium truncate">{isZh ? s.nameZh ?? s.name : s.name}</span>
                      {s.brand?.name && <span className="text-gray-400 text-xs flex-shrink-0">{s.brand.name}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 第二行：三个按钮三等分 */}
            <div className="bg-white/52 backdrop-blur-xl saturate-180 rounded-full px-2 py-2 flex items-center gap-1.5" style={{ border: '1px solid rgba(255,255,255,0.8)' }}>
              <button onClick={() => cameraInputRef.current?.click()} className="flex-1 min-w-0 px-2 py-2 rounded-full bg-white/90 border border-[rgba(100,120,160,0.15)] text-xs font-bold text-[#2a2a4a] hover:bg-[rgba(124,58,237,0.06)] transition truncate" style={{ fontFamily: 'Nunito, sans-serif' }}>
                📷 {isZh ? '拍照' : isEs ? 'Foto' : 'Snap'}
              </button>
              <button
                onClick={() => setShowScan(true)}
                className="flex-1 min-w-0 px-2 py-2 rounded-full bg-white/90 border border-[rgba(100,120,160,0.15)] text-xs font-bold text-[#2a2a4a] hover:bg-[rgba(124,58,237,0.06)] transition truncate"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                📊 {isZh ? '条码' : isEs ? 'Código' : 'Scan'}
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
              }} className="flex-1 min-w-0 px-2 py-2 rounded-full bg-gradient-to-r from-[#893ce3] to-[#ec4899] text-white text-xs font-bold shadow-[0_2px_12px_rgba(236,72,153,0.3)] hover:scale-[1.04] transition truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
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
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${idx === 0 ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
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

            <button
              onClick={() => setPhase({ name: 'idle' })}
              className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              {isZh ? '取消，重新识别' : isEs ? 'Cancelar, reconoce de nuevo' : 'Cancel, recognize again'}
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
              className="bg-white/70 backdrop-blur-xl rounded-[18px] border-none shadow-[0_8px_32px_rgba(120,80,200,0.14),0_2px_8px_rgba(120,80,200,0.06),inset_0_1.5px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(200,180,255,0.15)] p-[18px] mb-5 animate-fade-in-up relative overflow-hidden"
            >
              <div className="relative">
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.1fr_0.9fr] gap-0">

                  {/* 左栏 — 新设计 */}
                  {/* 左栏 */}
                  <div className="pb-4 mb-4 border-b lg:pb-0 lg:mb-0 lg:border-b-0 lg:border-r border-[rgba(160,120,210,0.35)] px-[18px] py-0">

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
                            style={{ background: `linear-gradient(135deg, ${levelMeta.color}, ${levelMeta.color}cc)` }}
                          >
                            <span className="text-[20px] font-extrabold text-white leading-none" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {Math.round(result.overallScore)}
                            </span>
                            <span className="text-[9px] font-bold text-white/85 tracking-wider mt-0.5">LEVEL {levelNum}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-[18px] font-extrabold text-[#1a1a3a] leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {levelMeta.emoji} {isZh ? levelMeta.labelZh : isEs ? levelMeta.labelEs : levelMeta.label}
                            </h3>
                            <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
                              {isZh ? levelMeta.summaryZh : isEs ? levelMeta.summaryEs : levelMeta.summary}
                            </p>
                          </div>
                        </div>
                        {topNutrients.length > 0 && (
                          <p className="text-[12px] font-semibold mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>
                            ⭐ <span className="text-[#16a34a] font-bold">{isZh ? '富含' : 'Good source of'}</span>{' '}
                            {topNutrients.map((n, i) => (
                              <span key={n.id} className="font-extrabold" style={{ color: nutrientColor(n.id) }}>
                                {isZh ? n.nameZh ?? n.name : n.name}{i < topNutrients.length - 1 ? ' & ' : ''}
                              </span>
                            ))}
                          </p>
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
                                background: levelColors[lv - 1],
                                opacity: lv === levelNum ? 1 : 0.2,
                                height: lv === levelNum ? '12px' : '8px',
                              }}
                            />
                            <span className="text-[9px] font-bold" style={{
                              color: lv === levelNum ? levelColors[lv - 1] : '#9ca3af',
                              fontFamily: 'Nunito, sans-serif',
                            }}>
                              Level {lv}{lv === levelNum ? ' ✓' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 过敏原警告 */}
                    {hasAllergen && (
                      <div className="rounded-lg bg-red-50 border-l-4 border-red-500 px-3 py-2 mb-2 flex items-start gap-2">
                        <span className="text-base flex-shrink-0">🚨</span>
                        <div>
                          <p className="text-[12px] font-extrabold text-red-700">
                            {isZh ? '检测到过敏原 · 不适合食用' : 'Allergen Detected · Not Suitable'}
                          </p>
                          <p className="text-[11px] text-red-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                            {isZh
                              ? `含有过敏原：${view.matchedAllergens.map(a => a.nameZh ?? a.name).join('、')}`
                              : `Contains: ${view.matchedAllergens.map(a => a.name).join(', ')}`}
                          </p>
                        </div>
                      </div>
                    )}

                    

                    <span
                      onClick={() => navigate('/about', { state: { tab: 'sources' } })}
                      className="mt-2 text-[10px] font-semibold text-gray-400 flex items-center gap-1 cursor-pointer hover:text-[#893ce3] transition-colors"
                    >
                      👆 {isZh ? '查看计算方法' : 'Report a review'}
                    </span>

                  </div>

                  {/* 中栏 — BENEFITS */}
                  <div className="pb-4 mb-4 border-b lg:pb-0 lg:mb-0 lg:border-b-0 lg:border-r border-[rgba(160,120,210,0.35)] px-[18px] py-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-[#5b21b6] tracking-wide text-sm">{isZh ? '益处' : 'BENEFITS'}</h4>
                      <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">👆 {isZh ? '点击了解更多' : 'Tap to know more'}</span>
                    </div>
                    {tierCounts && (
                      <p className="text-[10px] font-bold text-[#6b6b8a] mb-2.5 leading-relaxed">
                        {isZh ? `支持 ${tierCounts.core + tierCounts.important + tierCounts.supporting} 项目标` : `Supports ${tierCounts.core + tierCounts.important + tierCounts.supporting} goals`} ·{' '}
                        <span className="text-[#4c1d95] font-extrabold">{tierCounts.core} {isZh ? '核心' : 'Core'}</span> ·{' '}
                        <span className="text-[#a21caf] font-extrabold">{tierCounts.important} {isZh ? '重要' : 'Important'}</span> ·{' '}
                        <span className="text-[#db2777] font-extrabold">{tierCounts.supporting} {isZh ? '辅助' : 'Supporting'}</span>
                      </p>
                    )}
                    <div className="grid grid-cols-4 gap-1.5">
                      {view.goals.map(g => (
                        <button key={g.id} onClick={() => g.tier && toggleGoal(g.id)} className={`flex flex-col items-center gap-1 ${g.tier ? 'cursor-pointer' : 'cursor-default'}`}>
                          <span
                            className={`w-[46px] h-[46px] rounded-full flex items-center justify-center text-[16px] transition-all ${g.tier ? 'bg-white/88 shadow-[0_0_0_3px_rgba(137,60,227,0.18),0_4px_12px_rgba(137,60,227,0.3)]' : 'bg-[rgba(237,220,255,0.5)] opacity-32 grayscale border-2 border-[rgba(137,60,227,0.18)]'} ${selectedGoal === g.id ? 'scale-110' : ''}`}
                            style={g.tier ? { border: `3px solid ${TIER_COLOR[g.tier]}` } : undefined}
                          >
                            {g.icon}
                          </span>
                          <span className={`text-[9px] font-bold text-center leading-tight ${g.tier ? 'text-[#5a1d8a]' : 'text-[#b0aabf]'}`} style={{ fontFamily: 'Nunito, sans-serif' }}>
                            {isZh ? g.labelZh ?? g.label : g.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 右栏 — THINGS TO WATCH */}
                  <div className="px-[18px] py-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-[#5b21b6] tracking-wide text-sm">{isZh ? '需要留意' : 'THINGS TO WATCH'}</h4>
                      <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">👆 {isZh ? '点击了解更多' : 'Tap to know more'}</span>
                    </div>
                    <p className="text-[10px] font-bold text-[#6B6B8A] mb-2.5">
                      {isZh
                        ? `${presentWatch.length} 项值得注意的成分${nova ? ` · NOVA ${view.product.novaScore} ${nova.zh}` : ''}`
                        : `${presentWatch.length} ingredients worth noting${nova ? ` · NOVA ${view.product.novaScore} ${nova.en}` : ''}`}
                    </p>
                    <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                      {presentWatch.map(w => (
                        <button key={w.code} onClick={() => setSelectedWatch(p => (p === w.code ? null : w.code))} className="flex flex-col items-center gap-1 cursor-pointer">
                          <span className={`w-[48px] h-[48px] rounded-full bg-[rgba(255,237,213,0.8)] border-2 border-[rgba(249,115,22,0.35)] flex items-center justify-center text-[22px] ${selectedWatch === w.code ? 'scale-110' : ''} transition-transform`}>
                            {w.icon}
                          </span>
                          <span className="text-[10px] font-bold text-[#1a1a3a] text-center leading-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>{isZh ? w.nameZh : w.name}</span>
                        </button>
                      ))}
                    </div>
                    {nova && (
                      <div className="bg-[rgba(249,115,22,0.08)] border-l-3 border-[#f97316] rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                        <span className="text-[18px]">🧀</span>
                        <span className="text-[10px] font-bold text-[#9a3412] tracking-wide" style={{ fontFamily: 'Nunito, sans-serif' }}>
                          {isZh ? `等级 ${view.product.novaScore} · ${nova.zh}` : `LEVEL ${view.product.novaScore} · ${nova.en}`}
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* ② 成长益处 */}
              <section className="bg-white/70 backdrop-blur-xl rounded-[18px] border-[1.5px] border-white/90 shadow-[0_8px_32px_rgba(139,92,246,0.1),inset_0_1.5px_0_rgba(255,255,255,0.95)] p-5 animate-fade-in-up delay-100 relative overflow-hidden">
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <SectionBadge n={2} />
                    <h2 className="text-xl font-extrabold text-gray-900">{isZh ? '成长益处' : isEs ? 'Beneficios para el Crecimiento' : 'Growth Benefits'}</h2>
                    <span className="text-gray-300 cursor-help" title={isZh ? '基于该食物营养成分与孩子发育目标的匹配' : isEs ? 'Basado en la coincidencia de los nutrientes de este alimento con los objetivos de desarrollo de tu hijo' : 'Based on matching this food’s nutrients to your child’s development goals'}>ⓘ</span>
                  </div>

                  {ribbons.length === 0 ? (
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

                      <svg viewBox={`0 0 ${SK.width} ${SK.height}`} className="w-full h-auto select-none">
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
                              <text x={SK.leftX + SK.nodeWidth + 12} y={(n.y0 + n.y1) / 2 + 1} dominantBaseline="middle" fontSize="20" fontWeight="700" fill={TIER_COLOR[g.tier!]}>
                                {g.icon} {isZh ? g.labelZh ?? g.label : g.label}
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
                              <text x={SK.rightX + SK.nodeWidth + 12} y={(n.y0 + n.y1) / 2 - 8} fontSize="20" fontWeight="700" fill={color}>
                                {isZh ? nt.nameZh ?? nt.name : nt.name}
                              </text>
                              <text x={SK.rightX + SK.nodeWidth + 12} y={(n.y0 + n.y1) / 2 + 14} fontSize="15" fill="#6b7280">
                                {levelLabel(nt.level)} · {nt.dailyValue}% DV
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                      {selectedNutrientData && (
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setSelectedNutrient(null)}
                        >
                          <div
                            className="absolute left-1/2 -translate-x-1/2 bg-white rounded-[20px] shadow-[0_8px_32px_rgba(80,40,160,0.18)] p-5 w-[300px]"
                            style={{ top: '40%' }}
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <span className="text-3xl">🔬</span>
                                <div>
                                  <h3 className="text-[17px] font-extrabold text-[#1a1040]">
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
                              { label: isZh ? '每份含量' : 'Per Serving', value: selectedNutrientData.value != null ? `${selectedNutrientData.value}${selectedNutrientData.unit ?? ''}` : '—' },
                              { label: '% DV', value: `${selectedNutrientData.dailyValue}%` },
                              { label: isZh ? '单位' : 'Unit', value: selectedNutrientData.unit ?? '—' },
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
                        </div>
                      )}
                      {(selectedGoalData || selectedNutrientData) && (
                        <div className="mt-3 rounded-2xl bg-purple-50/70 border border-purple-100 px-4 py-3 text-sm text-gray-700 animate-fade-in-up">
                          {selectedGoalData && (
                            <>
                              <p className="font-bold text-[#893ce3] mb-1">{selectedGoalData.icon} {isZh ? selectedGoalData.labelZh ?? selectedGoalData.label : selectedGoalData.label}</p>
                              <p>
                                {isZh
                                  ? `该食物为此目标提供约 ${selectedGoalData.supportDV}% 的每日营养支持，主要来自：`
                                  : `This food provides ~${selectedGoalData.supportDV}% daily nutrient support for this goal, mainly from: `}
                                {view.flows.filter(f => f.goalId === selectedGoalData.id).map(f => {
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
                                  ? `每份约占每日需求(Daily Value, DV)的 ${selectedNutrientData.dailyValue}%${selectedNutrientData.value != null ? `（${selectedNutrientData.value}${selectedNutrientData.unit ?? ''}/份）` : ''}。`
                                  : `~${selectedNutrientData.dailyValue}% DV per serving${selectedNutrientData.value != null ? ` (${selectedNutrientData.value}${selectedNutrientData.unit ?? ''})` : ''}.`}
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
                          <p className="font-bold text-gray-700 text-sm mb-0.5">% {isZh ? '每日营养参考值说明' : 'Daily Value guide'}</p>
                          <p>{isZh ? '高 ≥ 20% · 中等 10–19%' : 'High ≥ 20% · Moderate 10–19%'}</p>
                          <p>{isZh ? `低 < 10% · 基于${view.child.age ?? 8}岁儿童膳食参考摄入量` : `Low < 10% · based on age ${view.child.age ?? 8} DRI`}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">
                        {isZh
                          ? '数据来源：Dietary Reference Intakes (DRI)，美国医学研究所（IOM）· 发育目标基于 NIH ODS 营养学资料'
                          : isEs
                            ? 'Fuente: Dietary Reference Intakes (DRI), Instituto de Medicina · Objetivos de desarrollo basados en NIH ODS'
                            : 'Source: Dietary Reference Intakes (DRI), Institute of Medicine · Development goals based on NIH ODS nutrition data'}
                      </p>
                    </>
                  )}
                </div>
              </section>

              {/* ③ 家长须知 */}
              <section className="bg-white/70 backdrop-blur-xl rounded-[18px] border-[1.5px] border-white/90 shadow-[0_8px_32px_rgba(220,100,80,0.08),inset_0_1.5px_0_rgba(255,255,255,0.95)] p-5 animate-fade-in-up delay-200 relative overflow-hidden">
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <SectionBadge n={3} />
                    <h2 className="text-xl font-extrabold text-gray-900">{isZh ? '家长须知' : 'Things Parents Should Know'}</h2>
                    <span className="text-gray-300 cursor-help ml-auto" title={isZh ? '基于配料表与NOVA加工等级' : 'Based on the ingredient list and NOVA processing classification'}>ⓘ</span>
                  </div>

                  <div className="bg-[rgba(249,115,22,0.18)] border-l-5 border-[#f97316] rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2">
                    <span>🔴</span>
                    <span className="text-xs font-bold text-[#9a3412]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {isZh
                        ? `${presentWatch.length} 项值得注意的成分${nova ? ` · ${nova.zh}` : ''}`
                        : `${presentWatch.length} ingredients worth noting${nova ? ` · ${nova.en}` : ''}`}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-[#5b21b6] tracking-wide mb-1">{isZh ? '需要了解' : 'THINGS TO KNOW'}</h4>
                  <p className="text-sm text-gray-400 mb-3">👆 {isZh ? '点击高亮图标查看详情' : 'Tap highlighted icons to see details'}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                    {view.watch.map(w => (
                      <button
                        key={w.code}
                        onClick={() => w.present && setSelectedWatch(p => (p === w.code ? null : w.code))}
                        className={`rounded-xl p-3 flex flex-col items-center gap-1.5 border transition-all ${w.present
                          ? `bg-[rgba(255,237,213,0.6)] backdrop-blur-sm border-[rgba(255,220,180,0.8)] cursor-pointer hover:scale-106 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.9),0_4px_16px_rgba(249,115,22,0.18)] ${selectedWatch === w.code ? 'border-orange-400 ring-2 ring-orange-200' : ''}`
                          : 'bg-white/35 backdrop-blur-sm border-white/65 opacity-70 cursor-default'
                          }`}
                      >
                        <span className={`text-[28px] ${w.present ? '' : 'grayscale-[0.6] opacity-75'}`}>{w.icon}</span>
                        <span className={`text-[10px] font-bold text-center leading-tight ${w.present ? 'text-[#2a2a4a]' : 'text-gray-400'}`} style={{ fontFamily: 'Nunito, sans-serif' }}>
                          {isZh ? w.nameZh : w.name}
                        </span>
                      </button>
                    ))}
                  </div>

                  {selectedWatchData?.present && (
                    <div className="rounded-2xl bg-orange-50/70 border border-orange-200 px-4 py-3 mb-4 text-sm text-gray-700 animate-fade-in-up">
                      <p className="font-bold text-orange-700 mb-1">{selectedWatchData.icon} {isZh ? selectedWatchData.nameZh : selectedWatchData.name}</p>
                      <p>{isZh ? selectedWatchData.detailZh : selectedWatchData.detail}</p>
                    </div>
                  )}

                  {nova && (
                    <div className="border-t border-[rgba(200,160,100,0.25)] pt-4 mt-3">
                      <h4 className="font-extrabold text-[#a07040] tracking-wide mb-2">{isZh ? '加工程度' : 'PROCESSING'}</h4>
                      <div className="flex items-baseline gap-2.5 mb-3">
                        <span className="text-[26px] font-extrabold text-[#ea6c00] italic" style={{ fontFamily: 'Poppins, sans-serif' }}>NOVA {view.product.novaScore}</span>
                        <span className="text-sm font-semibold text-[#f97316]" style={{ fontFamily: 'Nunito, sans-serif' }}>{isZh ? nova.zh : nova.en}</span>
                      </div>

                      <div className="relative mb-1.5">
                        <div className="h-[12px] rounded-full bg-gradient-to-r from-[#22c55e] via-[#86efac] via-[#fde047] to-[#f97316] to-[#ef4444]" />
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
                          <span className="text-[10px]" style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>{isZh ? '超加工' : 'Ultra Processed'}</span>
                        </span>
                      </div>

                      <div className="relative rounded-[10px] border-[2.5px] border-[#f97316] bg-[rgba(249,115,22,0.12)] px-3 py-2.5 flex gap-2.5 items-start">
                        <span className="text-[22px] flex-shrink-0 mt-0.5">🧀</span>
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-[#9a3412] tracking-wide" style={{ fontFamily: 'Nunito, sans-serif' }}>
                            {isZh ? `等级 ${view.product.novaScore} · ${nova.zh}` : `LEVEL ${view.product.novaScore} · ${nova.en}`}
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
              </section>
            </div>
          </>
        )}
      </div>

      {showScan && <BarcodeScanModal isZh={isZh} onClose={() => setShowScan(false)} onCode={handleBarcode} />}
    </div>
  );
}