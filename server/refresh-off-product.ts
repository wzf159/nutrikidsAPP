import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BARCODE = process.argv[2];

if (!BARCODE) {
  console.error(
    'Usage: npx tsx scripts/refresh-off-product.ts <barcode>',
  );
  process.exit(1);
}

/**
 * 这里请直接复制你项目中现有的 OFF_NUTRIENT_MAP。
 *
 * 示例结构：
 * {
 *   offKey: 'proteins_100g',
 *   nutrientId: 13,
 *   factor: 1,
 *   unit: 'g',
 *   dvRef: 50,
 * }
 */
const OFF_NUTRIENT_MAP = [
  // 把你原文件里的完整 OFF_NUTRIENT_MAP 复制到这里
] as const;

type OffProduct = {
  product_name?: string;
  product_name_zh?: string;
  image_front_url?: string;
  nova_group?: number;
  nutriscore_grade?: string;
  nutriscore_score?: number;
  categories_tags?: string[];
  quantity?: string;
  serving_size?: string;
  nutriments?: Record<string, number>;
  additives_tags?: string[];
};

function getServingFactor(servingSize?: string): number {
  if (!servingSize) return 1;

  // 例如：
  // "26 g"
  // "1 slice (26 g)"
  // "2 pieces (30g)"
  // "240 ml"
  const metricMatch = servingSize.match(
    /(\d+(?:\.\d+)?)\s*(g|ml)\b/i,
  );

  if (metricMatch) {
    const amount = Number(metricMatch[1]);

    if (Number.isFinite(amount) && amount > 0) {
      return amount / 100;
    }
  }

  // 处理 oz
  const ounceMatch = servingSize.match(
    /(\d+(?:\.\d+)?)\s*(?:oz|ounce|ounces)\b/i,
  );

  if (ounceMatch) {
    const ounces = Number(ounceMatch[1]);

    if (Number.isFinite(ounces) && ounces > 0) {
      const grams = ounces * 28.3495;
      return grams / 100;
    }
  }

  // 无法判断时，按每100g处理
  return 1;
}

async function fetchProductFromOFF(
  barcode: string,
): Promise<OffProduct | null> {
  const url =
    `https://world.openfoodfacts.org/api/v2/product/` +
    `${encodeURIComponent(barcode)}.json` +
    `?fields=product_name,product_name_zh,image_front_url,` +
    `nova_group,nutriscore_grade,nutriscore_score,` +
    `categories_tags,quantity,serving_size,nutriments,additives_tags`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'NutriKids/0.1 (maintenance script)',
    },
  });

  if (!response.ok) {
    throw new Error(
      `OpenFoodFacts request failed: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    status: number;
    product?: OffProduct;
  };

  if (data.status !== 1 || !data.product?.product_name) {
    return null;
  }

  return data.product;
}

async function main() {
  console.log(`Refreshing barcode: ${BARCODE}`);

  const existingProduct = await prisma.product.findUnique({
    where: {
      barcode: BARCODE,
    },
    include: {
      nutrients: true,
    },
  });

  if (!existingProduct) {
    throw new Error(
      `Product not found in database: ${BARCODE}`,
    );
  }

  const offProduct = await fetchProductFromOFF(BARCODE);

  if (!offProduct) {
    throw new Error(
      `Product not found on OpenFoodFacts: ${BARCODE}`,
    );
  }

  const servingFactor = getServingFactor(
    offProduct.serving_size,
  );

  console.log({
    productId: existingProduct.id,
    productName: offProduct.product_name,
    servingSize: offProduct.serving_size,
    servingFactor,
    oldNutrientCount: existingProduct.nutrients.length,
  });

  const nutrients = OFF_NUTRIENT_MAP
    .filter(
      (mapping) =>
        typeof offProduct.nutriments?.[mapping.offKey] ===
        'number',
    )
    .map((mapping) => {
      const rawOffValue100g = Number(
        offProduct.nutriments![mapping.offKey],
      );

      const valuePer100g =
        rawOffValue100g * mapping.factor;

      const valuePerServing =
        valuePer100g * servingFactor;

      const value =
        Math.round(valuePerServing * 100) / 100;

      const dailyValue =
        mapping.dvRef > 0
          ? Math.round(
              (valuePerServing / mapping.dvRef) * 100,
            )
          : 0;

      return {
        nutrientId: mapping.nutrientId,
        value,
        value100g:
          Math.round(rawOffValue100g * 1e8) / 1e8,
        unit: mapping.unit,
        dailyValue,
      };
    });

  console.table(nutrients);

  await prisma.$transaction(async (tx) => {
    await tx.productNutrient.deleteMany({
      where: {
        productId: existingProduct.id,
      },
    });

    await tx.product.update({
      where: {
        id: existingProduct.id,
      },
      data: {
        name: offProduct.product_name!,
        nameZh: offProduct.product_name_zh || null,
        imageUrl: offProduct.image_front_url ?? null,
        quantity: offProduct.quantity ?? null,
        servingSize:
          offProduct.serving_size ?? '100g',
        novaScore: offProduct.nova_group ?? null,
        nutriGrade:
          offProduct.nutriscore_grade?.toUpperCase() ??
          null,
        nutriScore:
          typeof offProduct.nutriscore_score ===
          'number'
            ? offProduct.nutriscore_score
            : null,
        additivesJson:
          offProduct.additives_tags?.length
            ? JSON.stringify(offProduct.additives_tags)
            : null,
        categoriesTagsJson:
          offProduct.categories_tags?.length
            ? JSON.stringify(
                offProduct.categories_tags,
              )
            : null,
        nutrients: {
          create: nutrients,
        },
      },
    });
  });

  const updatedProduct = await prisma.product.findUnique({
    where: {
      barcode: BARCODE,
    },
    include: {
      nutrients: {
        include: {
          nutrient: true,
        },
        orderBy: {
          nutrientId: 'asc',
        },
      },
    },
  });

  console.log('\nUpdated nutrients:');

  console.table(
    updatedProduct?.nutrients.map((item) => ({
      nutrientId: item.nutrientId,
      name: item.nutrient.name,
      value: item.value,
      value100g: item.value100g,
      unit: item.unit,
      dailyValue: item.dailyValue,
    })),
  );

  console.log('\nRefresh completed.');
}

main()
  .catch((error) => {
    console.error('\nRefresh failed:');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });