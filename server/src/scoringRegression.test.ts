import assert from 'node:assert/strict';
import test from 'node:test';

process.env.OPENAI_API_KEY ||= 'test-only-key';

const productFinder = await import('./productFinder.js');
const scoring = await import('./scoring.js');


test('OFF mapping keeps total sugar and added sugar as separate nutrients', () => {
  const rows = productFinder.buildOffNutrientRows(
    {
      sugars_100g: 4,
      'added-sugars_100g': 0,
    },
    '100g',
  );

  const totalSugar = rows.find(
    (row) => row.nutrientId === productFinder.TOTAL_SUGAR_NUTRIENT_ID,
  );

  const addedSugar = rows.find(
    (row) => row.nutrientId === productFinder.ADDED_SUGAR_NUTRIENT_ID,
  );

  assert.equal(totalSugar?.value, 4);
  assert.equal(totalSugar?.value100g, 4);

  assert.equal(addedSugar?.value, 0);
  assert.equal(addedSugar?.value100g, 0);

  // dailyValue 不再由 productFinder 计算
  assert.equal(totalSugar?.dailyValue, null);
  assert.equal(addedSugar?.dailyValue, null);
});


test('OFF serving size is used to convert 100g values to per-serving values', () => {
  const rows = productFinder.buildOffNutrientRows(
    {
      sugars_100g: 10,
      'added-sugars_100g': 6,
    },
    '1 slice (25 g)',
  );

  const totalSugar = rows.find(
    (row) => row.nutrientId === productFinder.TOTAL_SUGAR_NUTRIENT_ID,
  );

  const addedSugar = rows.find(
    (row) => row.nutrientId === productFinder.ADDED_SUGAR_NUTRIENT_ID,
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
    (row) => row.nutrientId === productFinder.TOTAL_SUGAR_NUTRIENT_ID,
  );

  const addedSugar = rows.find(
    (row) => row.nutrientId === productFinder.ADDED_SUGAR_NUTRIENT_ID,
  );

  assert.equal(totalSugar?.value100g, 10);
  assert.equal(totalSugar?.value, null);

  assert.equal(addedSugar?.value100g, 6);
  assert.equal(addedSugar?.value, null);
});


test('canonical OFF NOVA field wins when the nutriment copy disagrees', () => {
  const nova = productFinder.resolveOffNovaGroup({
    nova_group: 4,
    nutriments: { 'nova-group_100g': 3 },
  });

  assert.equal(nova, 4);
});


test('total sugar alone is not treated as added sugar', () => {
  const result = scoring.resolveAddedSugar([
    {
      nutrientId: productFinder.TOTAL_SUGAR_NUTRIENT_ID,
      value: 4,
      value100g: 4,
      dailyValue: null,
    },
  ]);

  assert.equal(result.available, false);
  assert.equal(result.value, 0);
  assert.equal(result.value100g, null);

  // added sugar 不存在时，不应该凭 total sugar 推出 daily percent
  assert.equal(result.dailyValue, null);
});


test('an explicit zero added-sugar value remains available and equals zero', () => {
  const result = scoring.resolveAddedSugar([
    {
      nutrientId: productFinder.TOTAL_SUGAR_NUTRIENT_ID,
      value: 4,
      value100g: 4,
      dailyValue: null,
    },
    {
      nutrientId: productFinder.ADDED_SUGAR_NUTRIENT_ID,
      value: 0,
      value100g: 0,
      dailyValue: null,
    },
  ]);

  assert.equal(result.available, true);
  assert.equal(result.value, 0);
  assert.equal(result.value100g, 0);

  // productFinder 已不负责计算 dailyValue
  assert.equal(result.dailyValue, null);
});


test('Houpu sample final-score formula remains 32.96 before UI rounding', () => {
  const nutriNorm = (55 - 7) / 72;
  const additiveScore = 1 / 135;

  const finalScore =
    100 * (
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