// MiniMax 多模态识别封装。
// 注意：MiniMax-M2.x 系列是纯文本模型，图像理解需要 MiniMax-M3（通过 MINIMAX_MODEL 配置）。

const BASE_URL = process.env.MINIMAX_BASE_URL ?? 'https://api.minimaxi.com/v1';
const MODEL = process.env.MINIMAX_MODEL ?? 'MiniMax-M3';

export interface FoodRecognition {
  isFood: boolean;
  kind: 'packaged' | 'whole' | 'dish';
  nameEn: string;
  nameZh: string;
  brand: string | null;
  barcode: string | null;
  confidence: number;
  alternatives: { nameEn: string; nameZh: string }[];
}

export interface GeneratedProductNutrition {
  nutrients: { nutrientId: number; value: number; unit: string; dailyValue: number }[];
  allergens: string[];
  novaScore: number | null;
  nutriGrade: string | null;
}

const PROMPT = `You are a food recognition engine for a children's nutrition app.
Look at the image and identify the food. Respond with ONLY a JSON object (no markdown, no explanations):
{
  "is_food": true/false,
  "kind": "packaged" (packaged product with label) | "whole" (raw fruit/vegetable/egg etc.) | "dish" (cooked meal),
  "name_en": "common English food name, short, e.g. 'Apple' or 'Stonyfield Organic Vanilla Yogurt'",
  "name_zh": "中文食品名称，简短",
  "brand": "brand name if a packaged product, else null",
  "barcode": "barcode digits if clearly visible on the package, else null",
  "confidence": 0.0-1.0,
  "alternatives": [{"name_en": "...", "name_zh": "..."}]  // up to 3 other possible identifications
}`;

// 模型是思考型模型：先剥掉 <think>，再从剩余文本中抠出第一个 JSON 对象
function extractJson(content: string): Record<string, unknown> {
  const cleaned = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('模型未返回 JSON');
  return JSON.parse(match[0]);
}

export async function recognizeFoodImage(imageBuffer: Buffer, mimeType: string): Promise<FoodRecognition> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw Object.assign(new Error('未配置 MINIMAX_API_KEY'), { statusCode: 500 });

  const dataUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw Object.assign(new Error(`MiniMax 请求失败: ${res.status} ${text.slice(0, 200)}`), { statusCode: 502 });
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw Object.assign(new Error(`MiniMax 返回异常: ${data.error?.message ?? '无内容'}`), { statusCode: 502 });
  }

  const j = extractJson(content);
  return {
    isFood: Boolean(j.is_food),
    kind: (['packaged', 'whole', 'dish'].includes(String(j.kind)) ? j.kind : 'whole') as FoodRecognition['kind'],
    nameEn: String(j.name_en ?? ''),
    nameZh: String(j.name_zh ?? ''),
    brand: j.brand ? String(j.brand) : null,
    barcode: j.barcode ? String(j.barcode).replace(/\D/g, '') || null : null,
    confidence: typeof j.confidence === 'number' ? j.confidence : 0.5,
    alternatives: Array.isArray(j.alternatives)
      ? j.alternatives.slice(0, 3).map((a) => ({
          nameEn: String((a as Record<string, unknown>).name_en ?? ''),
          nameZh: String((a as Record<string, unknown>).name_zh ?? ''),
        }))
      : [],
  };
}

const NUTRIENT_ID_MAP: Record<string, number> = {
  'iron': 1, '锌': 1,
  'zinc': 2, '铁': 2,
  'omega-3': 3, 'Omega-3': 3, 'omega3': 3, '欧米茄3': 3,
  'b-vitamins': 4, 'B族': 4, 'b族': 4, 'B vitamins': 4,
  'calcium': 5, '钙': 5,
  'vitamin-d': 6, '维生素D': 6, '维他命D': 6, 'vd': 6,
  'phosphorus': 7, '磷': 7,
  'complex-carb': 8, '复合碳水': 8, '碳水化合物': 8, 'carbohydrates': 8,
  'vitamin-c': 9, '维生素C': 9, '维他命C': 9, 'vc': 9,
  'selenium': 10, '硒': 10,
  'vitamin-a': 11, '维生素A': 11, '维他命A': 11, 'va': 11,
  'vitamin-b12': 12, '维生素B12': 12, '维他命B12': 12, 'b12': 12,
  'protein': 13, '蛋白质': 13,
  'potassium': 14, '钾': 14,
  'sugars': 15, '糖': 15, '糖分': 15,
  'energy': 16, '能量': 16, '热量': 16,
};

const AI_NUTRITION_PROMPT = `You are a nutrition database AI for a children's food analysis app.
Given a food name, generate realistic nutrition data per 100g.
Use your knowledge of typical nutritional values. Respond with ONLY a JSON object:
{
  "nutrients": [
    {"name": "iron", "value": number, "unit": "mg"},
    {"name": "zinc", "value": number, "unit": "mg"},
    {"name": "omega-3", "value": number, "unit": "g"},
    {"name": "b-vitamins", "value": number, "unit": "mg"},
    {"name": "calcium", "value": number, "unit": "mg"},
    {"name": "vitamin-d", "value": number, "unit": "μg"},
    {"name": "phosphorus", "value": number, "unit": "mg"},
    {"name": "complex-carb", "value": number, "unit": "g"},
    {"name": "vitamin-c", "value": number, "unit": "mg"},
    {"name": "selenium", "value": number, "unit": "μg"},
    {"name": "vitamin-a", "value": number, "unit": "μg"},
    {"name": "vitamin-b12", "value": number, "unit": "μg"},
    {"name": "protein", "value": number, "unit": "g"},
    {"name": "potassium", "value": number, "unit": "mg"},
    {"name": "sugars", "value": number, "unit": "g"},
    {"name": "energy", "value": number, "unit": "kcal"}
  ],
  "allergens": ["milk" | "egg" | "soy" | "wheat" | "tree-nuts" | "peanuts" | ...],
  "nova_score": 1-4,
  "nutri_grade": "A" | "B" | "C" | "D" | "E"
}

Rules:
- Include all 16 nutrients with realistic values for the food type
- NOVA: 1=unprocessed, 2=minimally processed, 3=processed, 4=ultra-processed
- For whole foods (fruits/veggies), NOVA=1, low sugar
- For packaged snacks, NOVA=3-4, possibly higher sugar
- Allergen codes: milk, egg, soy, wheat, tree-nuts, peanuts
- Return only JSON, no other text`;

const DV_REFS: Record<number, number> = {
  1: 10, 2: 5, 3: 0.5, 4: 2, 5: 1000, 6: 15, 7: 700, 8: 130, 9: 25, 10: 30, 11: 400, 12: 1.8, 13: 30, 14: 2300, 15: 25, 16: 1600,
};

export async function generateProductNutrition(nameEn: string, nameZh: string): Promise<GeneratedProductNutrition | null> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: `${AI_NUTRITION_PROMPT}\n\nFood: ${nameEn} ${nameZh}`,
          },
        ],
        max_tokens: 4096,
        temperature: 0.3,
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const j = extractJson(content);

    const nutrients = (Array.isArray(j.nutrients) ? j.nutrients : [])
      .map((n: Record<string, unknown>) => {
        const name = String(n.name ?? '').toLowerCase();
        const nutrientId = NUTRIENT_ID_MAP[name] || 0;
        if (!nutrientId) return null;
        const value = typeof n.value === 'number' ? n.value : 0;
        const unit = String(n.unit ?? '');
        const dvRef = DV_REFS[nutrientId] || 100;
        const dailyValue = nutrientId === 16 ? Math.round((value / dvRef) * 100) : Math.round((value / dvRef) * 100);
        return { nutrientId, value, unit, dailyValue };
      })
      .filter((n): n is { nutrientId: number; value: number; unit: string; dailyValue: number } => n !== null);

    const allergens = Array.isArray(j.allergens)
      ? j.allergens.map((a) => String(a).toLowerCase()).filter(Boolean)
      : [];

    const novaScore = typeof j.nova_score === 'number' && j.nova_score >= 1 && j.nova_score <= 4 ? j.nova_score : null;
    const nutriGrade = typeof j.nutri_grade === 'string' ? j.nutri_grade.toUpperCase() : null;

    if (nutrients.length === 0) return null;

    return { nutrients, allergens, novaScore, nutriGrade };
  } catch {
    return null;
  }
}
