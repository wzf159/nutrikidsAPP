const ADDED_SUGAR_TERMS = [
  /\bcane sugar\b/,
  /\bbrown sugar\b/,
  /\braw sugar\b/,
  /\binvert sugar\b/,
  /\badded sugar\b/,
  /\bsucrose\b/,
  /\bdextrose\b/,
  /\bglucose(?:[- ]fructose)? syrup\b/,
  /\bfructose(?:[- ]glucose)? syrup\b/,
  /\bcorn syrup\b/,
  /\btapioca syrup\b/,
  /\brice syrup\b/,
  /\bmaple syrup\b/,
  /\bmolasses\b/,
  /\bhoney\b/,
  /添加糖/,
  /蔗糖/,
  /白砂糖/,
  /红糖/,
  /葡萄糖浆/,
  /果葡糖浆/,
  /玉米糖浆/,
  /麦芽糖浆/,
  /蜂蜜/,
  /糖蜜/,
];

const FLAVOR_TERMS = [
  /\bnatural flavou?rs?\b/,
  /\bartificial flavou?rs?\b/,
  /\bflavou?rings?\b/,
  /食用香精/,
  /香料/,
];

function normalizeIngredientSource(
  ingredientsText?: string | null,
  ingredientTags: string[] = [],
): string {
  return [ingredientsText ?? '', ...ingredientTags]
    .join(' ')
    .replace(/[_:,-]+/g, ' ')
    .toLowerCase();
}

export function containsAddedSugarIngredient(
  ingredientsText?: string | null,
  ingredientTags: string[] = [],
): boolean {
  const source = normalizeIngredientSource(ingredientsText, ingredientTags);
  return ADDED_SUGAR_TERMS.some((term) => term.test(source));
}

export function containsFlavorIngredient(
  ingredientsText?: string | null,
  ingredientTags: string[] = [],
): boolean {
  const source = normalizeIngredientSource(ingredientsText, ingredientTags);
  return FLAVOR_TERMS.some((term) => term.test(source));
}
