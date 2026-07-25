export const ADDITIVE_DICT: Record<string, {
  name: string; nameZh: string;
  type: string; typeZh: string;
  risk: 'low' | 'medium' | 'high';
  desc: string; descZh: string;
}> = {
  // ── Colors ──
  'E100':  { name: 'Curcumin',           nameZh: '姜黄素',         type: 'Color', typeZh: '色素', risk: 'low',    desc: 'Natural yellow color from turmeric. Generally safe.',                              descZh: '来自姜黄的天然黄色素，一般安全。' },
  'E102':  { name: 'Tartrazine',          nameZh: '柠檬黄',         type: 'Color', typeZh: '色素', risk: 'high',   desc: 'Artificial yellow dye linked to hyperactivity in children.',                       descZh: '人工黄色素，与儿童多动症有关联。' },
  'E110':  { name: 'Sunset Yellow',       nameZh: '日落黄',         type: 'Color', typeZh: '色素', risk: 'high',   desc: 'Artificial orange dye, may cause hyperactivity.',                                  descZh: '人工橙色素，可能引起多动。' },
  'E120':  { name: 'Carmine',             nameZh: '胭脂红',         type: 'Color', typeZh: '色素', risk: 'medium', desc: 'Red color from insects. May cause allergic reactions.',                            descZh: '从昆虫提取的红色素，可能引起过敏。' },
  'E122':  { name: 'Azorubine',           nameZh: '偶氮玉红',       type: 'Color', typeZh: '色素', risk: 'high',   desc: 'Artificial red dye, linked to hyperactivity.',                                     descZh: '人工红色素，与儿童多动相关。' },
  'E124':  { name: 'Ponceau 4R',          nameZh: '胭脂红4R',       type: 'Color', typeZh: '色素', risk: 'high',   desc: 'Artificial red dye, linked to hyperactivity in children.',                         descZh: '人工红色素，与儿童多动症有关联。' },
  'E129':  { name: 'Allura Red',          nameZh: '诱惑红',         type: 'Color', typeZh: '色素', risk: 'high',   desc: 'Artificial red dye, may cause hyperactivity.',                                     descZh: '人工红色素，可能引起多动。' },
  'E133':  { name: 'Brilliant Blue',      nameZh: '亮蓝',           type: 'Color', typeZh: '色素', risk: 'medium', desc: 'Artificial blue dye. Some concern for children.',                                  descZh: '人工蓝色素，儿童需关注。' },
  'E150A': { name: 'Caramel Color I',     nameZh: '焦糖色素I',      type: 'Color', typeZh: '色素', risk: 'low',    desc: 'Plain caramel color, generally safe.',                                             descZh: '普通焦糖色素，一般安全。' },
  'E150D': { name: 'Caramel Color IV',    nameZh: '焦糖色素IV',     type: 'Color', typeZh: '色素', risk: 'medium', desc: 'Used in cola. Contains 4-MEI, a potential carcinogen under investigation.',         descZh: '用于可乐饮料，含潜在致癌物4-甲基咪唑，仍在研究中。' },
  'E151':  { name: 'Brilliant Black',     nameZh: '亮黑',           type: 'Color', typeZh: '色素', risk: 'medium', desc: 'Artificial black dye, some hypersensitivity concerns.',                            descZh: '人工黑色素，有过敏风险。' },
  'E160':  { name: 'Carotenoids',         nameZh: '类胡萝卜素',     type: 'Color', typeZh: '色素', risk: 'low',    desc: 'Natural orange-yellow colors. Generally safe.',                                    descZh: '天然橙黄色素，一般安全。' },

  // ── Preservatives ──
  'E200':  { name: 'Sorbic Acid',         nameZh: '山梨酸',         type: 'Preservative', typeZh: '防腐剂', risk: 'low',    desc: 'Natural preservative, generally safe.',                                    descZh: '天然防腐剂，一般安全。' },
  'E202':  { name: 'Potassium Sorbate',   nameZh: '山梨酸钾',       type: 'Preservative', typeZh: '防腐剂', risk: 'low',    desc: 'Common preservative, generally recognized as safe.',                       descZh: '常见防腐剂，一般认为安全。' },
  'E210':  { name: 'Benzoic Acid',        nameZh: '苯甲酸',         type: 'Preservative', typeZh: '防腐剂', risk: 'high',   desc: 'May react with Vitamin C to form benzene. Linked to hyperactivity.',        descZh: '与维生素C结合可生成苯，与儿童多动相关。' },
  'E211':  { name: 'Sodium Benzoate',     nameZh: '苯甲酸钠',       type: 'Preservative', typeZh: '防腐剂', risk: 'high',   desc: 'May form benzene with Vitamin C. Linked to hyperactivity in children.',     descZh: '与维生素C结合可生成苯，与儿童多动症有关联。' },
  'E220':  { name: 'Sulphur Dioxide',     nameZh: '二氧化硫',       type: 'Preservative', typeZh: '防腐剂', risk: 'medium', desc: 'Can trigger asthma in sensitive individuals.',                             descZh: '可能诱发哮喘，敏感人群需注意。' },
  'E250':  { name: 'Sodium Nitrite',      nameZh: '亚硝酸钠',       type: 'Preservative', typeZh: '防腐剂', risk: 'high',   desc: 'Used in processed meats. May form carcinogenic nitrosamines.',             descZh: '用于加工肉类，可能形成致癌亚硝胺。' },
  'E251':  { name: 'Sodium Nitrate',      nameZh: '硝酸钠',         type: 'Preservative', typeZh: '防腐剂', risk: 'high',   desc: 'Used in cured meats. Potential carcinogen when heated.',                   descZh: '用于腌制肉类，加热后可能产生致癌物。' },

  // ── Acidity Regulators ──
  'E330':  { name: 'Citric Acid',         nameZh: '柠檬酸',         type: 'Acidity Regulator', typeZh: '酸度调节剂', risk: 'low',    desc: 'Natural acid from citrus. Generally safe.',                       descZh: '天然柠檬酸，一般安全。' },
  'E331':  { name: 'Sodium Citrate',      nameZh: '柠檬酸钠',       type: 'Acidity Regulator', typeZh: '酸度调节剂', risk: 'low',    desc: 'Salt of citric acid, generally safe.',                             descZh: '柠檬酸钠，一般安全。' },
  'E338':  { name: 'Phosphoric Acid',     nameZh: '磷酸',           type: 'Acidity Regulator', typeZh: '酸度调节剂', risk: 'medium', desc: 'Used in cola. Excess may impair calcium absorption and bone health.', descZh: '用于可乐，过量摄入影响钙吸收和骨骼发育。' },

  // ── Emulsifiers ──
  'E322':  { name: 'Lecithin',            nameZh: '卵磷脂',         type: 'Emulsifier', typeZh: '乳化剂', risk: 'low',    desc: 'Natural emulsifier from soy or eggs. Generally safe.',                    descZh: '来自大豆或鸡蛋的天然乳化剂，一般安全。' },
  'E471':  { name: 'Mono/Diglycerides',   nameZh: '单双甘油脂肪酸酯', type: 'Emulsifier', typeZh: '乳化剂', risk: 'low', desc: 'Common emulsifier, generally safe.',                                       descZh: '常见乳化剂，一般安全。' },
  'E472E': { name: 'DATEM',               nameZh: '二乙酰酒石酸单双甘油酯', type: 'Emulsifier', typeZh: '乳化剂', risk: 'low', desc: 'Used in baked goods. Generally recognized as safe.',                descZh: '用于烘焙食品，一般认为安全。' },

  // ── Sweeteners ──
  'E420':  { name: 'Sorbitol',            nameZh: '山梨糖醇',       type: 'Sweetener', typeZh: '甜味剂', risk: 'low',    desc: 'Sugar alcohol, may cause digestive discomfort in large amounts.',          descZh: '糖醇，大量摄入可能引起消化不适。' },
  'E950':  { name: 'Acesulfame K',        nameZh: '安赛蜜',         type: 'Sweetener', typeZh: '甜味剂', risk: 'medium', desc: 'Artificial sweetener. Some studies suggest concerns for children.',        descZh: '人工甜味剂，部分研究对儿童摄入存有顾虑。' },
  'E951':  { name: 'Aspartame',           nameZh: '阿斯巴甜',       type: 'Sweetener', typeZh: '甜味剂', risk: 'medium', desc: 'Artificial sweetener. Avoid for children with PKU.',                      descZh: '人工甜味剂，苯丙酮尿症患儿禁用。' },
  'E955':  { name: 'Sucralose',           nameZh: '三氯蔗糖',       type: 'Sweetener', typeZh: '甜味剂', risk: 'medium', desc: 'Artificial sweetener. Long-term effects on gut microbiome unclear.',       descZh: '人工甜味剂，对肠道菌群的长期影响尚不明确。' },

  // ── Flavor Enhancers ──
  'E621':  { name: 'MSG',                 nameZh: '味精',           type: 'Flavor Enhancer', typeZh: '增味剂', risk: 'low',  desc: 'Monosodium glutamate. Generally safe in moderate amounts.',              descZh: '谷氨酸钠，适量使用一般安全。' },
  'E635':  { name: 'Disodium Ribonucleotide', nameZh: '呈味核苷酸二钠', type: 'Flavor Enhancer', typeZh: '增味剂', risk: 'low', desc: 'Flavor enhancer, generally safe.',                                 descZh: '增味剂，一般安全。' },

  // ── Thickeners / Stabilizers ──
  'E410':  { name: 'Locust Bean Gum',     nameZh: '刺槐豆胶',       type: 'Thickener', typeZh: '增稠剂', risk: 'low',    desc: 'Natural thickener from carob seeds. Generally safe.',                     descZh: '来自角豆的天然增稠剂，一般安全。' },
  'E412':  { name: 'Guar Gum',            nameZh: '瓜尔胶',         type: 'Thickener', typeZh: '增稠剂', risk: 'low',    desc: 'Natural thickener. Generally safe.',                                       descZh: '天然增稠剂，一般安全。' },
  'E415':  { name: 'Xanthan Gum',         nameZh: '黄原胶',         type: 'Thickener', typeZh: '增稠剂', risk: 'low',    desc: 'Common thickener. Generally safe.',                                        descZh: '常见增稠剂，一般安全。' },
  'E440':  { name: 'Pectin',              nameZh: '果胶',           type: 'Thickener', typeZh: '增稠剂', risk: 'low',    desc: 'Natural fiber from fruit. Generally safe.',                                descZh: '来自水果的天然纤维，一般安全。' },
};

export const RISK_COLOR: Record<'low' | 'medium' | 'high', {
  bg: string; border: string; text: string; label: string; labelZh: string;
}> = {
  low:    { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.3)',   text: '#15803d', label: 'Low Risk',      labelZh: '低风险' },
  medium: { bg: 'rgba(234,179,8,0.08)',   border: 'rgba(234,179,8,0.3)',   text: '#a16207', label: 'Caution',       labelZh: '需注意' },
  high:   { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.3)',   text: '#dc2626', label: 'High Concern',  labelZh: '高关注' },
};

// 每个 watch code 对应哪些 additive type
export const WATCH_ADDITIVE_TYPES: Record<string, string[]> = {
  colors:        ['Color'],
  preservatives: ['Preservative'],
  flavors:       ['Flavor Enhancer'],
  hfcs:          ['Sweetener'],
  sodium:        ['Acidity Regulator'], 
};