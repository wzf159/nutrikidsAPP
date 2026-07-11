import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface FoodRecognition {
  isFood: boolean;
  nameEn: string;
  nameZh: string;
  brand?: string;
  barcode?: string;
  confidence: number; 
  alternatives: { nameEn: string; nameZh: string }[];
}

export async function recognizeFoodImage(buf: Buffer, mimetype: string): Promise<FoodRecognition> {
  const base64 = buf.toString('base64');
  const dataUrl = `data:${mimetype};base64,${base64}`;

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: dataUrl, detail: 'high' },
          },
          {
            type: 'text',
            text: `You are a food recognition expert. Analyze this image carefully.

If you see a food product with a label/package, extract the exact brand name and product name from the label.
If you see fresh/unpackaged food, identify what it is.
If it's not food at all, set isFood to false.

Return ONLY this JSON object, no markdown, no explanation:
{
  "isFood": true,
  "nameEn": "exact product name in English",
  "nameZh": "中文名称",
  "brand": "brand name if visible, otherwise null",
  "barcode": "barcode digits if clearly visible, otherwise null",
  "confidence": 0.95,
  "alternatives": [
    {"nameEn": "alternative name 1", "nameZh": "备选名称1"},
    {"nameEn": "alternative name 2", "nameZh": "备选名称2"}
  ]
}

Be as specific as possible with product names (e.g. "Lay's Classic Potato Chips" not just "chips").`,
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  const text = res.choices[0]?.message?.content ?? '';
  try {
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) throw new Error('No JSON in response');
    const parsed = JSON.parse(json);
    return {
      isFood: parsed.isFood ?? false,
      nameEn: parsed.nameEn ?? '',
      nameZh: parsed.nameZh ?? '',
      brand: parsed.brand ?? undefined,
      barcode: parsed.barcode ?? undefined,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
    };
  } catch {
    return { isFood: false, nameEn: '', nameZh: '', confidence: 0, alternatives: [] };
  }
}

export interface GeneratedProductNutrition {
  nutrients: { nutrientId: number; value: number; unit: string; dailyValue: number }[];
  allergens: string[];
  novaScore: number | null;
  nutriGrade: string | null;
}

const NUTRIENT_ID_MAP: Record<string, number> = {
  protein: 13, proteins: 13,
  iron: 1,
  zinc: 2,
  calcium: 5,
  'vitamin d': 6, 'vitamin-d': 6,
  phosphorus: 7,
  potassium: 14,
  'vitamin c': 9, 'vitamin-c': 9,
  'vitamin a': 11, 'vitamin-a': 11,
  'vitamin b12': 12, 'vitamin-b12': 12,
  sugars: 15, sugar: 15,
  energy: 16, calories: 16,
  'saturated fat': 17, 'saturated fats': 17,
  'sodium': 18,
  'fat': 19, 'fats': 19, 'total fat': 19,
  'fiber': 20, 'fibre': 20, 'dietary fiber': 20,
  'carbohydrates': 21, 'carbohydrate': 21, 'total carbohydrate': 21,
};

const DV_REFS: Record<number, number> = {
  13: 50, 1: 18, 2: 11, 5: 1300, 6: 20,
  7: 1250, 14: 4700, 9: 90, 11: 900, 12: 2.4,
  15: 50, 16: 2000,
  17: 20, 18: 2300, 19: 65, 20: 28, 21: 275,
};

export async function generateProductNutrition(nameEn: string, nameZh: string): Promise<GeneratedProductNutrition | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Estimate nutritional content per 100g for: ${nameEn} ${nameZh}
        Return ONLY JSON with ALL these nutrients:
        {
          "nutrients": [
            {"name": "energy", "value": 150, "unit": "kcal"},
            {"name": "fat", "value": 5, "unit": "g"},
            {"name": "saturated fat", "value": 2, "unit": "g"},
            {"name": "carbohydrates", "value": 20, "unit": "g"},
            {"name": "sugars", "value": 5, "unit": "g"},
            {"name": "fiber", "value": 2, "unit": "g"},
            {"name": "protein", "value": 5, "unit": "g"},
            {"name": "sodium", "value": 100, "unit": "mg"},
            {"name": "calcium", "value": 100, "unit": "mg"},
            {"name": "iron", "value": 1, "unit": "mg"},
            {"name": "vitamin d", "value": 1, "unit": "μg"},
            {"name": "vitamin c", "value": 5, "unit": "mg"},
            {"name": "vitamin a", "value": 50, "unit": "μg"},
            {"name": "vitamin b12", "value": 0.5, "unit": "μg"},
            {"name": "potassium", "value": 200, "unit": "mg"},
            {"name": "zinc", "value": 1, "unit": "mg"}
          ],
          "allergens": ["milk"],
          "nova_score": 2,
          "nutri_grade": "B"
        }
        Use realistic values for this specific food. Always include all 16 nutrients.`,
      }],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const content = res.choices[0]?.message?.content ?? '';
    const json = content.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return null;
    const j = JSON.parse(json);

    const nutrients = (Array.isArray(j.nutrients) ? j.nutrients : [])
      .map((n: Record<string, unknown>) => {
        const name = String(n.name ?? '').toLowerCase();
        const nutrientId = NUTRIENT_ID_MAP[name] ?? 0;
        if (!nutrientId) return null;
        const value = typeof n.value === 'number' ? n.value : 0;
        const unit = String(n.unit ?? '');
        const dvRef = DV_REFS[nutrientId] ?? 100;
        const dailyValue = Math.round((value / dvRef) * 100);
        return { nutrientId, value, unit, dailyValue };
      })
      .filter((n): n is { nutrientId: number; value: number; unit: string; dailyValue: number } => n !== null);

    const allergens = Array.isArray(j.allergens) ? j.allergens.map((a: unknown) => String(a).toLowerCase()) : [];
    const novaScore = typeof j.nova_score === 'number' ? j.nova_score : null;
    const nutriGrade = typeof j.nutri_grade === 'string' ? j.nutri_grade.toUpperCase() : null;

    if (nutrients.length === 0) return null;
    return { nutrients, allergens, novaScore, nutriGrade };
  } catch {
    return null;
  }
}