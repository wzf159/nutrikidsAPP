export type AdditiveRisk = 'low' | 'medium' | 'high' | 'unknown';

export interface AdditiveInfo {
  name: string;
  nameZh: string;
  type: string;
  typeZh: string;
  risk: AdditiveRisk;
  desc: string;
  descZh: string;
  ansesInterest?: boolean;
  efsaOverexposureRisk?: 'no' | 'moderate' | 'high';
}

export interface WatchCard {
  code:
    | 'added-sugar'
    | 'flavorings'
    | 'colors'
    | 'preservatives'
    | 'sodium'
    | 'saturated-fat'
    | 'trans-fat'
    | 'hfcs';
  name: string;
  nameZh: string;
  icon: string;
  source: 'nutriments' | 'ingredients' | 'additives';
}

export const ADDITIVE_DICT: Record<string, AdditiveInfo> = {
  // ── Colors ────────────────────────────────────────────────
  E100: {
    name: 'Curcumin',
    nameZh: '姜黄素',
    type: 'Color',
    typeZh: '色素',
    risk: 'low',
    desc: 'Yellow food color derived from turmeric. Generally considered safe at permitted levels.',
    descZh: '源自姜黄的黄色食用色素，在法规允许用量下一般认为安全。',
  },
  E102: {
    name: 'Tartrazine',
    nameZh: '柠檬黄',
    type: 'Color',
    typeZh: '色素',
    risk: 'medium',
    desc: 'Synthetic yellow color. Some sensitive individuals may experience intolerance reactions.',
    descZh: '合成黄色素，少数敏感人群可能出现不耐受反应。',
    ansesInterest: true,
  },
  E110: {
    name: 'Sunset Yellow FCF',
    nameZh: '日落黄',
    type: 'Color',
    typeZh: '色素',
    risk: 'medium',
    desc: 'Synthetic orange-yellow color. Intake should remain within regulated limits.',
    descZh: '合成橙黄色素，摄入量应控制在法规允许范围内。',
    ansesInterest: true,
  },
  E120: {
    name: 'Cochineal, Carminic Acid and Carmines',
    nameZh: '胭脂虫红及胭脂红',
    type: 'Color',
    typeZh: '色素',
    risk: 'medium',
    desc: 'Red color derived from cochineal insects. Rare allergic reactions have been reported.',
    descZh: '由胭脂虫提取的红色素，少数人可能发生过敏反应。',
  },
  E122: {
    name: 'Azorubine',
    nameZh: '偶氮玉红',
    type: 'Color',
    typeZh: '色素',
    risk: 'medium',
    desc: 'Synthetic red color. Sensitive individuals may wish to limit intake.',
    descZh: '合成红色素，敏感人群可注意控制摄入。',
    ansesInterest: true,
  },
  E124: {
    name: 'Ponceau 4R',
    nameZh: '胭脂红4R',
    type: 'Color',
    typeZh: '色素',
    risk: 'medium',
    desc: 'Synthetic red food color. Intake should remain within permitted levels.',
    descZh: '合成红色食用色素，摄入量应保持在法规允许范围内。',
    ansesInterest: true,
  },
  E129: {
    name: 'Allura Red AC',
    nameZh: '诱惑红',
    type: 'Color',
    typeZh: '色素',
    risk: 'medium',
    desc: 'Synthetic red color. Some sensitive children may react to certain artificial colors.',
    descZh: '合成红色素，部分敏感儿童可能对某些人工色素产生反应。',
    ansesInterest: true,
  },
  E133: {
    name: 'Brilliant Blue FCF',
    nameZh: '亮蓝',
    type: 'Color',
    typeZh: '色素',
    risk: 'low',
    desc: 'Synthetic blue food color. Generally considered safe within regulated intake limits.',
    descZh: '合成蓝色食用色素，在法规规定摄入量内一般认为安全。',
  },
  E150A: {
    name: 'Plain Caramel',
    nameZh: '普通焦糖色',
    type: 'Color',
    typeZh: '色素',
    risk: 'low',
    desc: 'Caramel color produced without ammonium or sulphite compounds.',
    descZh: '不使用铵类或亚硫酸盐工艺制成的焦糖色。',
  },
  E150D: {
    name: 'Sulphite Ammonia Caramel',
    nameZh: '亚硫酸铵法焦糖色',
    type: 'Color',
    typeZh: '色素',
    risk: 'medium',
    desc: 'Caramel color commonly used in dark beverages. Exposure is regulated by an acceptable daily intake.',
    descZh: '常用于深色饮料的焦糖色，其摄入量受每日允许摄入量限制。',
    ansesInterest: true,
    efsaOverexposureRisk: 'no',
  },
  E151: {
    name: 'Brilliant Black BN',
    nameZh: '亮黑BN',
    type: 'Color',
    typeZh: '色素',
    risk: 'low',
    desc: 'Synthetic black food color. No simple overexposure warning is provided in the source taxonomy.',
    descZh: '合成黑色食用色素，来源 taxonomy 未提供简单的过量暴露警示。',
    efsaOverexposureRisk: 'no',
  },
  E160: {
    name: 'Carotenoids',
    nameZh: '类胡萝卜素',
    type: 'Color',
    typeZh: '色素',
    risk: 'low',
    desc: 'A family of yellow, orange and red pigments from natural or synthetic sources.',
    descZh: '一类黄色、橙色或红色色素，可来自天然或合成来源。',
  },

  // ── Preservatives ─────────────────────────────────────────
  E200: {
    name: 'Sorbic Acid',
    nameZh: '山梨酸',
    type: 'Preservative',
    typeZh: '防腐剂',
    risk: 'low',
    desc: 'Common preservative used to inhibit mold and yeast.',
    descZh: '用于抑制霉菌和酵母生长的常见防腐剂。',
  },
  E202: {
    name: 'Potassium Sorbate',
    nameZh: '山梨酸钾',
    type: 'Preservative',
    typeZh: '防腐剂',
    risk: 'low',
    desc: 'Common preservative generally considered safe at permitted levels.',
    descZh: '常见防腐剂，在法规允许用量下一般认为安全。',
  },
  E203: {
    name: 'Calcium Sorbate',
    nameZh: '山梨酸钙',
    type: 'Preservative',
    typeZh: '防腐剂',
    risk: 'low',
    desc: 'Calcium salt of sorbic acid used as a preservative.',
    descZh: '山梨酸的钙盐，用作食品防腐剂。',
  },
  E210: {
    name: 'Benzoic Acid',
    nameZh: '苯甲酸',
    type: 'Preservative',
    typeZh: '防腐剂',
    risk: 'medium',
    desc: 'Preservative used mainly in acidic foods and drinks. Intake should remain within regulated limits.',
    descZh: '主要用于酸性食品和饮料的防腐剂，摄入量应保持在法规允许范围内。',
    ansesInterest: true,
  },
  E211: {
    name: 'Sodium Benzoate',
    nameZh: '苯甲酸钠',
    type: 'Preservative',
    typeZh: '防腐剂',
    risk: 'high',
    desc: 'Common preservative. The source taxonomy reports a high EFSA overexposure-risk classification.',
    descZh: '常见防腐剂；来源 taxonomy 记录的 EFSA 过量暴露风险等级为高。',
    ansesInterest: true,
    efsaOverexposureRisk: 'high',
  },
  E220: {
    name: 'Sulphur Dioxide',
    nameZh: '二氧化硫',
    type: 'Preservative',
    typeZh: '防腐剂',
    risk: 'medium',
    desc: 'Preservative and antioxidant that may trigger reactions in sulphite-sensitive individuals.',
    descZh: '兼具防腐和抗氧化作用，亚硫酸盐敏感人群可能出现反应。',
  },
  E250: {
    name: 'Sodium Nitrite',
    nameZh: '亚硝酸钠',
    type: 'Preservative',
    typeZh: '防腐剂',
    risk: 'high',
    desc: 'Used mainly in cured meats. The source taxonomy reports a high EFSA overexposure-risk classification.',
    descZh: '主要用于腌制肉制品；来源 taxonomy 记录的 EFSA 过量暴露风险等级为高。',
    ansesInterest: true,
    efsaOverexposureRisk: 'high',
  },
  E251: {
    name: 'Sodium Nitrate',
    nameZh: '硝酸钠',
    type: 'Preservative',
    typeZh: '防腐剂',
    risk: 'medium',
    desc: 'Used in some cured foods. Intake should remain within regulated limits.',
    descZh: '用于部分腌制食品，摄入量应保持在法规允许范围内。',
    ansesInterest: true,
  },

  // ── Antioxidants ──────────────────────────────────────────
  E307B: {
    name: 'Concentrated Tocopherol',
    nameZh: '浓缩生育酚',
    type: 'Antioxidant',
    typeZh: '抗氧化剂',
    risk: 'low',
    desc: 'Vitamin E-related antioxidant used to reduce oxidation.',
    descZh: '与维生素E相关的抗氧化剂，用于减缓食品氧化。',
    efsaOverexposureRisk: 'no',
  },

  // ── Acidity regulators / raising agents ───────────────────
  E330: {
    name: 'Citric Acid',
    nameZh: '柠檬酸',
    type: 'Acidity Regulator',
    typeZh: '酸度调节剂',
    risk: 'low',
    desc: 'Common acidity regulator naturally present in citrus fruits.',
    descZh: '常见酸度调节剂，天然存在于柑橘类水果中。',
  },
  E331: {
    name: 'Sodium Citrates',
    nameZh: '柠檬酸钠',
    type: 'Acidity Regulator',
    typeZh: '酸度调节剂',
    risk: 'low',
    desc: 'Sodium salts of citric acid used for acidity control and stabilization.',
    descZh: '柠檬酸的钠盐，用于调节酸度和稳定食品。',
  },
  E338: {
    name: 'Phosphoric Acid',
    nameZh: '磷酸',
    type: 'Acidity Regulator',
    typeZh: '酸度调节剂',
    risk: 'medium',
    desc: 'Acidity regulator often used in cola beverages. Frequent high intake of phosphate-rich foods may be a concern.',
    descZh: '常用于可乐饮料的酸度调节剂，长期大量摄入富含磷酸盐的食品需注意。',
    ansesInterest: true,
  },
  E500: {
    name: 'Sodium Carbonates',
    nameZh: '碳酸钠类',
    type: 'Acidity Regulator',
    typeZh: '酸度调节剂',
    risk: 'low',
    desc: 'Used as an acidity regulator and raising agent.',
    descZh: '用作酸度调节剂和膨松剂。',
  },

  // ── Emulsifiers ───────────────────────────────────────────
  E322: {
    name: 'Lecithins',
    nameZh: '卵磷脂',
    type: 'Emulsifier',
    typeZh: '乳化剂',
    risk: 'low',
    desc: 'May be sourced from soy, sunflower or eggs. Check source-specific allergens separately.',
    descZh: '可来自大豆、葵花籽或鸡蛋，应另外检查具体原料来源及过敏原。',
  },
  E471: {
    name: 'Mono- and Diglycerides of Fatty Acids',
    nameZh: '脂肪酸单甘油酯和双甘油酯',
    type: 'Emulsifier',
    typeZh: '乳化剂',
    risk: 'low',
    desc: 'Common emulsifier. Its plant or animal origin may not always be specified.',
    descZh: '常见乳化剂，其植物或动物来源不一定会明确标示。',
  },
  E472E: {
    name: 'DATEM',
    nameZh: '单双甘油脂肪酸酯的二乙酰酒石酸酯',
    type: 'Emulsifier',
    typeZh: '乳化剂',
    risk: 'low',
    desc: 'Emulsifier commonly used in bread and baked products.',
    descZh: '常用于面包和烘焙食品的乳化剂。',
  },

  // ── Sweeteners ────────────────────────────────────────────
  E420: {
    name: 'Sorbitol',
    nameZh: '山梨糖醇',
    type: 'Sweetener',
    typeZh: '甜味剂',
    risk: 'low',
    desc: 'Sugar alcohol that may cause bloating or a laxative effect in large amounts.',
    descZh: '糖醇，大量摄入可能导致腹胀或轻泻作用。',
  },
  E950: {
    name: 'Acesulfame K',
    nameZh: '安赛蜜',
    type: 'Sweetener',
    typeZh: '甜味剂',
    risk: 'medium',
    desc: 'Non-nutritive sweetener. Intake should remain within the established acceptable daily intake.',
    descZh: '非营养性甜味剂，摄入量应保持在规定的每日允许摄入量以内。',
    ansesInterest: true,
  },
  E951: {
    name: 'Aspartame',
    nameZh: '阿斯巴甜',
    type: 'Sweetener',
    typeZh: '甜味剂',
    risk: 'medium',
    desc: 'Contains phenylalanine. People with phenylketonuria must avoid it.',
    descZh: '含苯丙氨酸，苯丙酮尿症患者必须避免摄入。',
    ansesInterest: true,
  },
  E952: {
    name: 'Cyclamates',
    nameZh: '甜蜜素',
    type: 'Sweetener',
    typeZh: '甜味剂',
    risk: 'medium',
    desc: 'Non-nutritive sweetener whose permitted uses vary by jurisdiction.',
    descZh: '非营养性甜味剂，其许可使用范围因国家或地区而异。',
  },
  E955: {
    name: 'Sucralose',
    nameZh: '三氯蔗糖',
    type: 'Sweetener',
    typeZh: '甜味剂',
    risk: 'medium',
    desc: 'Non-nutritive sweetener. Intake should remain within the established acceptable daily intake.',
    descZh: '非营养性甜味剂，摄入量应保持在规定的每日允许摄入量以内。',
    ansesInterest: true,
  },
  E959: {
    name: 'Neohesperidine Dihydrochalcone',
    nameZh: '新橙皮苷二氢查耳酮',
    type: 'Sweetener',
    typeZh: '甜味剂',
    risk: 'low',
    desc: 'High-intensity sweetener and flavor modifier.',
    descZh: '高倍甜味剂，也可用于改善风味。',
  },

  // ── Flavor enhancers ──────────────────────────────────────
  E621: {
    name: 'Monosodium Glutamate',
    nameZh: '谷氨酸钠',
    type: 'Flavor Enhancer',
    typeZh: '增味剂',
    risk: 'low',
    desc: 'Common flavor enhancer generally considered safe at normal dietary levels.',
    descZh: '常见增味剂，在一般膳食摄入水平下通常认为安全。',
  },
  E635: {
    name: 'Disodium 5′-Ribonucleotides',
    nameZh: '呈味核苷酸二钠',
    type: 'Flavor Enhancer',
    typeZh: '增味剂',
    risk: 'low',
    desc: 'Flavor enhancer often combined with glutamates.',
    descZh: '常与谷氨酸盐搭配使用的增味剂。',
  },

  // ── Thickeners / stabilizers ──────────────────────────────
  E410: {
    name: 'Locust Bean Gum',
    nameZh: '刺槐豆胶',
    type: 'Thickener',
    typeZh: '增稠剂',
    risk: 'low',
    desc: 'Plant-derived thickener obtained from carob seeds.',
    descZh: '从角豆种子中提取的植物性增稠剂。',
  },
  E412: {
    name: 'Guar Gum',
    nameZh: '瓜尔胶',
    type: 'Thickener',
    typeZh: '增稠剂',
    risk: 'low',
    desc: 'Plant-derived thickener. Large quantities may cause digestive discomfort.',
    descZh: '植物性增稠剂，大量摄入可能引起消化不适。',
  },
  E415: {
    name: 'Xanthan Gum',
    nameZh: '黄原胶',
    type: 'Thickener',
    typeZh: '增稠剂',
    risk: 'low',
    desc: 'Common thickener and stabilizer used in many processed foods.',
    descZh: '广泛用于加工食品的增稠剂和稳定剂。',
  },
  E440: {
    name: 'Pectins',
    nameZh: '果胶',
    type: 'Thickener',
    typeZh: '增稠剂',
    risk: 'low',
    desc: 'Fruit-derived fiber used as a gelling and thickening agent.',
    descZh: '来源于水果的纤维，用作凝胶剂和增稠剂。',
  },
  E553AII: {
    name: 'Magnesium Trisilicate',
    nameZh: '三硅酸镁',
    type: 'Thickener',
    typeZh: '增稠剂',
    risk: 'unknown',
    desc: 'Classified as a thickener. No simple risk classification is provided.',
    descZh: '被归类为增稠剂，但未提供可直接使用的简单风险等级。',
  },
};

export const RISK_COLOR: Record<
  AdditiveRisk,
  { bg: string; border: string; text: string; label: string; labelZh: string }
> = {
  low: {
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.3)',
    text: '#15803d',
    label: 'Low Concern',
    labelZh: '低关注',
  },
  medium: {
    bg: 'rgba(234,179,8,0.08)',
    border: 'rgba(234,179,8,0.3)',
    text: '#a16207',
    label: 'Use with Caution',
    labelZh: '需注意',
  },
  high: {
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.3)',
    text: '#dc2626',
    label: 'Higher Concern',
    labelZh: '较高关注',
  },
  unknown: {
    bg: 'rgba(100,116,139,0.08)',
    border: 'rgba(100,116,139,0.3)',
    text: '#475569',
    label: 'Not Rated',
    labelZh: '暂无评级',
  },
};

/**
 * Recommended eight cards for the current UI.
 *
 * Important:
 * - "Added Sugar", "Sodium", "Saturated Fat" and "Trans Fat" come from nutriments.
 * - "Flavorings" and "HFCS" come from ingredients text/tags.
 * - "Food Colors" and "Preservatives" come from additive tags.
 */
export const WATCH_CARDS: WatchCard[] = [
  { code: 'added-sugar', name: 'Added Sugar', nameZh: '添加糖', icon: '🍬', source: 'nutriments' },
  { code: 'flavorings', name: 'Flavorings', nameZh: '食用香料', icon: '🧪', source: 'ingredients' },
  { code: 'colors', name: 'Food Colors', nameZh: '食用色素', icon: '🎨', source: 'additives' },
  { code: 'preservatives', name: 'Preservatives', nameZh: '防腐剂', icon: '🫙', source: 'additives' },
  { code: 'sodium', name: 'Sodium', nameZh: '钠', icon: '🧂', source: 'nutriments' },
  { code: 'saturated-fat', name: 'Saturated Fat', nameZh: '饱和脂肪', icon: '🥩', source: 'nutriments' },
  { code: 'trans-fat', name: 'Trans Fat', nameZh: '反式脂肪', icon: '🛢️', source: 'nutriments' },
  { code: 'hfcs', name: 'High Fructose Corn Syrup', nameZh: '高果糖玉米糖浆', icon: '🌽', source: 'ingredients' },
];

export const WATCH_ADDITIVE_TYPES: Record<string, string[]> = {
  colors: ['Color'],
  preservatives: ['Preservative'],
};

/** Normalize Open Food Facts additive tags such as "en:e250" or "E250". */
export function normalizeAdditiveCode(tag: string): string {
  return tag
    .replace(/^en:/i, '')
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase();
}

export function getKnownAdditives(tags: string[] = []): Array<AdditiveInfo & { code: string }> {
  return tags
    .map(normalizeAdditiveCode)
    .map((code) => {
      const info = ADDITIVE_DICT[code];
      return info ? { code, ...info } : null;
    })
    .filter((item): item is AdditiveInfo & { code: string } => item !== null);
}

export function hasAdditiveType(tags: string[] = [], type: string): boolean {
  return getKnownAdditives(tags).some((item) => item.type === type);
}

export function containsHFCS(
  ingredientsText?: string | null,
  ingredientTags: string[] = [],
): boolean {
  const text = ingredientsText?.toLowerCase() ?? '';

  const textTerms = [
    'high fructose corn syrup',
    'high-fructose corn syrup',
    'high fructose maize syrup',
    '高果糖玉米糖浆',
    '果葡糖浆',
  ];

  const knownTags = new Set([
    'en:high-fructose-corn-syrup',
    'en:glucose-fructose-syrup',
    'en:fructose-glucose-syrup',
  ]);

  return (
    textTerms.some((term) => text.includes(term)) ||
    ingredientTags.some((tag) => knownTags.has(tag.toLowerCase()))
  );
}

export function containsFlavorings(
  ingredientsText?: string | null,
  ingredientTags: string[] = [],
): boolean {
  const text = ingredientsText?.toLowerCase() ?? '';

  const textTerms = [
    'flavor',
    'flavour',
    'flavoring',
    'flavouring',
    'natural flavor',
    'natural flavour',
    'artificial flavor',
    'artificial flavour',
    '香料',
    '食用香精',
    '天然香料',
  ];

  return (
    textTerms.some((term) => text.includes(term)) ||
    ingredientTags.some((tag) =>
      [
        'en:flavouring',
        'en:natural-flavouring',
        'en:artificial-flavouring',
      ].includes(tag.toLowerCase()),
    )
  );
}

/**
 * Product thresholds are app-level display rules, not Open Food Facts risk ratings.
 * Adjust them for the intended age group and serving basis.
 */
export function isHighSodium(sodium100g?: number | null): boolean {
  return typeof sodium100g === 'number' && sodium100g >= 0.6;
}

export function hasSaturatedFat(saturatedFat100g?: number | null): boolean {
  return typeof saturatedFat100g === 'number' && saturatedFat100g > 0;
}

export function hasTransFat(transFat100g?: number | null): boolean {
  return typeof transFat100g === 'number' && transFat100g > 0;
}

export function hasAddedSugar(
  addedSugar100g?: number | null,
  ingredientsText?: string | null,
): boolean {
  if (typeof addedSugar100g === 'number') return addedSugar100g > 0;

  const text = ingredientsText?.toLowerCase() ?? '';
  return [
    'sugar',
    'cane sugar',
    'brown sugar',
    'corn syrup',
    'glucose syrup',
    'dextrose',
    'maltose',
    'invert sugar',
    'added sugar',
    '白砂糖',
    '蔗糖',
    '葡萄糖浆',
    '麦芽糖',
  ].some((term) => text.includes(term));
}