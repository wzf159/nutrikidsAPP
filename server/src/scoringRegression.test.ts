import assert from 'node:assert/strict';
import test from 'node:test';

process.env.OPENAI_API_KEY ||= 'test-only-key';

const productFinder = await import('./productFinder.js');


test('OFF mapping keeps total sugar and added sugar as separate nutrients', () => {
  const rows = productFinder.buildOffNutrientRows(
    {
      sugars_100g: 4,
      'added-sugars_100g': 0,
    },
    '100g',
  );

  const totalSugar = rows.find(
    (row) =>
      row.nutrientId ===
      productFinder.TOTAL_SUGAR_NUTRIENT_ID,
  );

  const addedSugar = rows.find(
    (row) =>
      row.nutrientId ===
      productFinder.ADDED_SUGAR_NUTRIENT_ID,
  );

  assert.equal(totalSugar?.value, 4);
  assert.equal(totalSugar?.value100g, 4);

  assert.equal(addedSugar?.value, 0);
  assert.equal(addedSugar?.value100g, 0);

  // productFinder 不再负责计算 daily reference %
  assert.equal(totalSugar?.dailyValue, null);
  assert.equal(addedSugar?.dailyValue, null);
});


test('OFF serving size converts 100g nutrients to per-serving values', () => {
  const rows = productFinder.buildOffNutrientRows(
    {
      sugars_100g: 10,
      'added-sugars_100g': 6,
    },
    '1 slice (25 g)',
  );

  const totalSugar = rows.find(
    (row) =>
      row.nutrientId ===
      productFinder.TOTAL_SUGAR_NUTRIENT_ID,
  );

  const addedSugar = rows.find(
    (row) =>
      row.nutrientId ===
      productFinder.ADDED_SUGAR_NUTRIENT_ID,
  );

  assert.equal(totalSugar?.value100g, 10);
  assert.equal(totalSugar?.value, 2.5);

  assert.equal(addedSugar?.value100g, 6);
  assert.equal(addedSugar?.value, 1.5);
});


test('missing serving size does not treat 100g as one serving', () => {
  const rows = productFinder.buildOffNutrientRows(
    {
      sugars_100g: 10,
      'added-sugars_100g': 6,
    },
    undefined,
  );

  const totalSugar = rows.find(
    (row) =>
      row.nutrientId ===
      productFinder.TOTAL_SUGAR_NUTRIENT_ID,
  );

  const addedSugar = rows.find(
    (row) =>
      row.nutrientId ===
      productFinder.ADDED_SUGAR_NUTRIENT_ID,
  );

  assert.equal(totalSugar?.value100g, 10);
  assert.equal(totalSugar?.value, null);

  assert.equal(addedSugar?.value100g, 6);
  assert.equal(addedSugar?.value, null);
});


test('unparseable serving size does not fall back to 100g', () => {
  const rows = productFinder.buildOffNutrientRows(
    {
      calcium_100g: 0.1,
    },
    '1 slice',
  );

  const calcium = rows.find(
    (row) => row.nutrientId === 5,
  );

  assert.equal(calcium?.value100g, 0.1);
  assert.equal(calcium?.value, null);
});


test('oz serving size is converted to grams', () => {
  const rows = productFinder.buildOffNutrientRows(
    {
      proteins_100g: 10,
    },
    '1 oz',
  );

  const protein = rows.find(
    (row) => row.nutrientId === 13,
  );

  assert.equal(protein?.value100g, 10);
  assert.equal(protein?.value, 2.83);
});


test('canonical OFF NOVA field wins when the nutriment copy disagrees', () => {
  const nova = productFinder.resolveOffNovaGroup({
    nova_group: 4,
    nutriments: {
      'nova-group_100g': 3,
    },
  });

  assert.equal(nova, 4);
});


test('Houpu sample final-score formula remains 32.96 before UI rounding', () => {
  const nutriNorm = (55 - 7) / 72;
  const additiveScore = 1 / 135;

  const finalScore =
    100 *
    (
      0.5 * nutriNorm -
      0.5 * additiveScore
    );

  assert.equal(
    Math.round(finalScore * 100) / 100,
    32.96,
  );

  assert.equal(
    Math.round(finalScore),
    33,
  );
});

test('OFF *_serving value wins over calculated serving value', () => {
  const rows = productFinder.buildOffNutrientRows(
    {
      proteins_100g: 10,

      // 如果自己按 25g 算应该是 2.5g
      // 但 OFF 明确给了 3g
      proteins_serving: 3,
    },
    '25 g',
  );

  const protein = rows.find(
    (row) => row.nutrientId === 13,
  );

  assert.equal(protein?.value100g, 10);

  // 应该使用 OFF 的 3，而不是自己算出来的 2.5
  assert.equal(protein?.value, 3);
});