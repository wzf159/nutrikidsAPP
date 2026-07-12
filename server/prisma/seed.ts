// 种子数据：字典 + 样例酸奶产品（由 mock JSON 转换）
// 运行: npm run seed  (或 prisma migrate reset 自动执行)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ---------- 字典：营养素 ----------
  const nutrients = [
    { id: 1, name: 'Iron', nameZh: '铁', icon: '🩸', unit: 'mg' },
    { id: 2, name: 'Zinc', nameZh: '锌', icon: '⚗️', unit: 'mg' },
    { id: 3, name: 'Omega-3', nameZh: 'Omega-3', icon: '🐟', unit: 'g' },
    { id: 4, name: 'B Vitamins', nameZh: 'B族维生素', icon: '🅱️', unit: '' },
    { id: 5, name: 'Calcium', nameZh: '钙', icon: '🦷', unit: 'mg' },
    { id: 6, name: 'Vitamin D', nameZh: '维生素D', icon: '☀️', unit: 'μg' },
    { id: 7, name: 'Phosphorus', nameZh: '磷', icon: '🔵', unit: 'mg' },
    { id: 8, name: 'Complex Carbs', nameZh: '复合碳水', icon: '🌾', unit: 'g' },
    { id: 9, name: 'Vitamin C', nameZh: '维生素C', icon: '🍊', unit: 'mg' },
    { id: 10, name: 'Selenium', nameZh: '硒', icon: '🔴', unit: 'μg' },
    { id: 11, name: 'Vitamin A', nameZh: '维生素A', icon: '🥕', unit: 'μg' },
    { id: 12, name: 'Vitamin B12', nameZh: '维生素B12', icon: '🅱️', unit: 'μg' },
    { id: 13, name: 'Protein', nameZh: '蛋白质', icon: '💪', unit: 'g' },
    { id: 14, name: 'Potassium', nameZh: '钾', icon: '🍌', unit: 'mg' },
    { id: 15, name: 'Sugars', nameZh: '糖', icon: '🍬', unit: 'g' },
    { id: 16, name: 'Energy', nameZh: '能量', icon: '🔥', unit: 'kcal' },
  ];
  for (const n of nutrients) await prisma.nutrient.upsert({ where: { id: n.id }, create: n, update: n });

  // ---------- 字典：过敏原 ----------
  const allergens = [
    { id: 1, code: 'milk', name: 'Milk', nameZh: '牛奶', icon: '🥛' },
    { id: 2, code: 'tree-nuts', name: 'Tree Nuts', nameZh: '坚果', icon: '🌰' },
    { id: 3, code: 'egg', name: 'Egg', nameZh: '鸡蛋', icon: '🥚' },
    { id: 4, code: 'soy', name: 'Soy', nameZh: '大豆', icon: '🫛' },
    { id: 5, code: 'wheat', name: 'Wheat', nameZh: '小麦', icon: '🌾' },
    { id: 6, code: 'peanuts', name: 'Peanuts', nameZh: '花生', icon: '🥜' },
    { id: 7, code: 'fish', name: 'Fish', nameZh: '鱼类', icon: '🐟' },
    { id: 8, code: 'shellfish', name: 'Shellfish', nameZh: '贝类/甲壳类', icon: '🦐' },
    { id: 9, code: 'sesame', name: 'Sesame', nameZh: '芝麻', icon: '🫙' },
  ];
  for (const a of allergens) await prisma.allergen.upsert({ where: { id: a.id }, create: a, update: a });
  //for (const a of allergens) await prisma.allergen.upsert({ where: { id: a.id }, create: a, update: a });

  // ---------- 字典：发育目标 ----------
  const goals = [
    { id: 1, icon: '🧠', label: 'Brain Development',  labelZh: '大脑发育'  },
    { id: 2, icon: '🦴', label: 'Bone Development',   labelZh: '骨骼发育'  },
    { id: 3, icon: '❤️', label: 'Heart Development',       labelZh: '心脏发育'  },
    { id: 4, icon: '💪', label: 'Muscle Development', labelZh: '肌肉发育'  },
    { id: 5, icon: '🛡️', label: 'Immune Development', labelZh: '免疫发育'  },
    { id: 6, icon: '🦠', label: 'Gut Development',    labelZh: '肠道发育'  },
    { id: 7, icon: '👀', label: 'Visual Development', labelZh: '视力发育'  },
    { id: 8, icon: '🦷', label: 'Dental Development', labelZh: '牙齿发育'  },
  ];
  for (const g of goals) await prisma.developmentGoal.upsert({ where: { id: g.id }, create: g, update: g });

  // ---------- 字典：添加剂 / 标签 / 暴露关注项 / 配料 ----------
  await prisma.additive.upsert({
    where: { id: 1 },
    create: { id: 1, name: 'Live Yogurt Cultures', nameZh: '活性酸奶菌', type: 'beneficial', status: 'approved' },
    update: {},
  });

  for (const [id, code] of [[1, 'organic'], [2, 'non-gmo'], [3, 'kosher'], [4, 'halal']] as const)
    await prisma.label.upsert({ where: { id }, create: { id, code }, update: { code } });

  const concerns = [
    { code: 'added_sugar', name: 'Added Sugar', nameZh: '添加糖', icon: '🍬' },
    { code: 'artificial_flavor', name: 'Artificial Flavor', nameZh: '人工香料', icon: '🧴' },
    { code: 'artificial_colors', name: 'Artificial Colors', nameZh: '人工色素', icon: '🎨' },
    { code: 'preservatives', name: 'Preservatives', nameZh: '防腐剂', icon: '⚗️' },
    { code: 'packaging', name: 'Packaging Chemicals', nameZh: '包装化学物质', icon: '⚛️' },
  ];
  for (const c of concerns) await prisma.exposureConcernType.upsert({ where: { code: c.code }, create: c, update: c });

  const ingredients = [
    { id: 1, name: 'Organic Pasteurized Milk', nameZh: '有机巴氏杀菌牛奶' },
    { id: 2, name: 'Organic Cane Sugar', nameZh: '有机蔗糖' },
    { id: 3, name: 'Organic Cream', nameZh: '有机奶油' },
    { id: 4, name: 'Organic Vanilla Extract', nameZh: '有机香草提取物' },
    { id: 5, name: 'Live Active Cultures', nameZh: '活性益生菌' },
  ];
  for (const i of ingredients) await prisma.ingredient.upsert({ where: { id: i.id }, create: i, update: i });

  // ---------- 产品目录 ----------
  await prisma.brand.upsert({ where: { id: 1 }, create: { id: 1, name: 'Stonyfield' }, update: {} });
  await prisma.category.upsert({
    where: { id: 1 },
    create: { id: 1, name: 'Organic Yogurt · Dairy Product', nameZh: '有机酸奶 · 乳制品' },
    update: {},
  });
  await prisma.manufacturer.upsert({
    where: { id: 1 },
    create: {
      id: 1, name: 'Stonyfield Farm, Inc.', location: 'Londonderry, NH, USA',
      certifications: JSON.stringify(['USDA Organic', 'QAI Certified Organic']),
    },
    update: {},
  });

  await prisma.product.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      barcode: '0063250175048',
      name: 'Stonyfield Organic Vanilla Yogurt',
      nameZh: 'Stonyfield有机香草酸奶',
      brandId: 1, manufacturerId: 1, categoryId: 1,
      imageUrl: 'https://images.openfoodfacts.org/images/products/006/325/017/5048/front_en.10.400.jpg',
      quantity: '170g', servingSize: '100g',
      novaScore: 3, nutriGrade: 'B', nutriScore: 65, ecoGrade: 'B', ecoScore: 68,
      carbonKgco2e: 0.45, waterL: 180, landM2: 0.03, verified: true,
      nutrients: {
        create: [
          { nutrientId: 13, value: 3.8, unit: 'g', dailyValue: 8 },
          { nutrientId: 5, value: 120, unit: 'mg', dailyValue: 15 },
          { nutrientId: 6, value: 2.5, unit: 'μg', dailyValue: 50 },
          { nutrientId: 11, value: 60, unit: 'μg', dailyValue: 8 },
          { nutrientId: 9, value: 1.2, unit: 'mg', dailyValue: 1 },
          { nutrientId: 12, value: 0.4, unit: 'μg', dailyValue: 17 },
          { nutrientId: 1, value: 0.1, unit: 'mg', dailyValue: 1 },
          { nutrientId: 14, value: 150, unit: 'mg', dailyValue: 3 },
          { nutrientId: 7, value: 90, unit: 'mg', dailyValue: 13 },
          { nutrientId: 15, value: 12.0, unit: 'g', dailyValue: 13 },
          { nutrientId: 16, value: 105, unit: 'kcal', dailyValue: 5 },
        ],
      },
      ingredients: {
        create: [
          { ingredientId: 1, percentage: 85, position: 1 },
          { ingredientId: 2, percentage: 8, position: 2 },
          { ingredientId: 3, percentage: 4, position: 3 },
          { ingredientId: 4, percentage: 2, position: 4 },
          { ingredientId: 5, percentage: 1, position: 5 },
        ],
      },
      additives: { create: [{ additiveId: 1 }] },
      labels: { create: [{ labelId: 1 }, { labelId: 2 }, { labelId: 3 }, { labelId: 4 }] },
      allergens: { create: [{ allergenId: 1, present: true }] },
    },
  });

  // ---------- 常见天然食物（实物分析兜底库，每100g，%DV按学龄儿童参考值折算） ----------
  await prisma.category.upsert({
    where: { id: 2 },
    create: { id: 2, name: 'Whole Food', nameZh: '天然食物' },
    update: {},
  });

  // [id, name, nameZh, nova, allergenId|null, nutrients[[nutrientId, value, unit, dv]]]
  type WholeFood = [number, string, string, number, number | null, [number, number | null, string, number][]];
  const wholeFoods: WholeFood[] = [
    [101, 'Apple', '苹果', 1, null, [[9, 4.6, 'mg', 18], [14, 107, 'mg', 5], [15, 10, 'g', 11], [16, 52, 'kcal', 3]]],
    [102, 'Banana', '香蕉', 1, null, [[9, 8.7, 'mg', 35], [14, 358, 'mg', 16], [4, null, '', 15], [15, 12, 'g', 13], [16, 89, 'kcal', 6]]],
    [103, 'Orange', '橙子', 1, null, [[9, 53, 'mg', 100], [5, 40, 'mg', 4], [14, 181, 'mg', 8], [15, 9, 'g', 10]]],
    [104, 'Tomato', '西红柿', 1, null, [[9, 14, 'mg', 56], [11, 42, 'μg', 11], [14, 237, 'mg', 10]]],
    [105, 'Carrot', '胡萝卜', 1, null, [[11, 835, 'μg', 100], [9, 6, 'mg', 24], [14, 320, 'mg', 14]]],
    [106, 'Broccoli', '西兰花', 1, null, [[9, 89, 'mg', 100], [11, 31, 'μg', 8], [5, 47, 'mg', 5], [1, 0.7, 'mg', 7], [14, 316, 'mg', 14]]],
    [107, 'Boiled Egg', '鸡蛋', 1, 3, [[13, 13, 'g', 43], [6, 2, 'μg', 13], [12, 1.1, 'μg', 61], [11, 160, 'μg', 40], [1, 1.2, 'mg', 12], [2, 1.1, 'mg', 22]]],
    [108, 'Milk', '牛奶', 1, 1, [[13, 3.4, 'g', 11], [5, 113, 'mg', 11], [6, 1.3, 'μg', 9], [12, 0.5, 'μg', 28], [14, 150, 'mg', 7]]],
    [109, 'Cooked Rice', '米饭', 1, null, [[8, 28, 'g', 22], [13, 2.7, 'g', 9], [16, 130, 'kcal', 8]]],
    [110, 'Salmon', '三文鱼', 1, null, [[13, 20, 'g', 67], [3, 2.2, 'g', 100], [6, 11, 'μg', 73], [12, 3.2, 'μg', 100], [10, 36, 'μg', 90]]],
    [111, 'Strawberry', '草莓', 1, null, [[9, 59, 'mg', 100], [14, 153, 'mg', 7], [15, 4.9, 'g', 5]]],
    [112, 'Cucumber', '黄瓜', 1, null, [[9, 2.8, 'mg', 11], [14, 147, 'mg', 6]]],
    [113, 'Potato', '土豆', 1, null, [[9, 19.7, 'mg', 79], [14, 425, 'mg', 18], [8, 17, 'g', 13]]],
    [114, 'Watermelon', '西瓜', 1, null, [[9, 8, 'mg', 32], [11, 28, 'μg', 7], [15, 6, 'g', 7]]],
    [115, 'Chicken Breast', '鸡胸肉', 1, null, [[13, 31, 'g', 100], [2, 1, 'mg', 20], [4, null, '', 30], [10, 27, 'μg', 68]]],
    [116, 'Tofu', '豆腐', 1, 4, [[13, 8, 'g', 27], [5, 350, 'mg', 35], [1, 5.4, 'mg', 54]]],
  ];

  for (const [id, name, nameZh, nova, allergenId, nutr] of wholeFoods) {
    await prisma.product.upsert({
      where: { id },
      update: {},
      create: {
        id, name, nameZh, categoryId: 2,
        servingSize: '100g', novaScore: nova, verified: true,
        nutrients: { create: nutr.map(([nutrientId, value, unit, dailyValue]) => ({ nutrientId, value, unit, dailyValue })) },
        ...(allergenId ? { allergens: { create: [{ allergenId, present: true }] } } : {}),
      },
    });
  }

  // ---------- 演示账号 + 孩子档案（前端游客模式自动登录用） ----------
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@nutrikids.app' },
    update: {},
    create: {
      email: 'demo@nutrikids.app',
      passwordHash: await bcrypt.hash('demo123456', 10),
      displayName: 'Demo Parent',
      locale: 'zh',
    },
  });

  const existingChild = await prisma.child.findFirst({ where: { userId: demoUser.id, name: 'Alex' } });
  if (!existingChild) {
    await prisma.child.create({
      data: {
        userId: demoUser.id,
        name: 'Alex',
        age: 8,
        stageKey: 'school_age',
        avatarEmoji: '👦',
        goals: { create: [1, 2, 3, 5].map((goalId) => ({ goalId })) }, // 骨骼/能量/免疫/大脑
        nutrients: { create: [1, 2, 5, 6, 12, 13].map((nutrientId) => ({ nutrientId })) },
        allergens: { create: [{ allergenId: 6 }] }, // 花生过敏
      },
    });
  }

  console.log('✅ 种子数据写入完成');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
