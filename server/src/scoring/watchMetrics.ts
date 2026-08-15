export interface Per100gWatchMetric {
  value100g: number | null;
  dailyPercent: number | null;
  present: boolean;
}

export type P3ThresholdNutrient = 'added_sugar' | 'sodium' | 'satfat';

export interface P3WatchReference {
  dailyLimit: number | null;
  lowMax: number | null;
  highMin: number | null;
  unit: 'g' | 'mg';
}

export interface ResolvedAddedSugar100g {
  value100g: number | null;
  inferredFromZeroTotalSugar: boolean;
}

/**
 * Added sugar may be safely inferred only when total sugar is explicitly zero:
 * added sugar is a subset of total sugar, so it cannot be greater than zero in
 * that case. A positive total-sugar value does not reveal the added-sugar
 * amount and must not be used as a substitute.
 */
export function resolveAddedSugar100g(
  rawAddedSugar100g: number | null | undefined,
  rawTotalSugar100g: number | null | undefined,
): ResolvedAddedSugar100g {
  if (rawAddedSugar100g != null) {
    const addedSugar = Number(rawAddedSugar100g);
    if (Number.isFinite(addedSugar)) {
      return { value100g: addedSugar, inferredFromZeroTotalSugar: false };
    }
  }

  if (rawTotalSugar100g != null) {
    const totalSugar = Number(rawTotalSugar100g);
    if (Number.isFinite(totalSugar) && totalSugar === 0) {
      return { value100g: 0, inferredFromZeroTotalSugar: true };
    }
  }

  return { value100g: null, inferredFromZeroTotalSugar: false };
}

/**
 * P3 reference values transcribed from:
 * todo/数据/data source.xlsx -> 1-Added Sugar_Saturated_Fat_Sal
 *
 * ageIdx 0-1: 0-12 months (the sheet marks these values N/A)
 * ageIdx 2:   1-3 years
 * ageIdx 3-5: 4 years and older
 *
 * Sodium is stored/displayed in mg, so the sheet's gram values are converted
 * to mg here. Low is <= 5% DV and High is >= 20% DV.
 */
export function p3WatchReference(
  ageIdx: number,
  nutrient: P3ThresholdNutrient,
): P3WatchReference {
  if (ageIdx <= 1) {
    return {
      dailyLimit: null,
      lowMax: null,
      highMin: null,
      unit: nutrient === 'sodium' ? 'mg' : 'g',
    };
  }

  const isOneToThree = ageIdx === 2;

  if (nutrient === 'added_sugar') {
    return isOneToThree
      ? { dailyLimit: 25, lowMax: 1.25, highMin: 5, unit: 'g' }
      : { dailyLimit: 50, lowMax: 2.5, highMin: 10, unit: 'g' };
  }

  if (nutrient === 'satfat') {
    return isOneToThree
      ? { dailyLimit: 10, lowMax: 0.5, highMin: 2, unit: 'g' }
      : { dailyLimit: 20, lowMax: 1, highMin: 4, unit: 'g' };
  }

  return isOneToThree
    ? { dailyLimit: 1500, lowMax: 75, highMin: 300, unit: 'mg' }
    : { dailyLimit: 2300, lowMax: 115, highMin: 460, unit: 'mg' };
}

/**
 * Build a Things-to-watch nutrient metric from a standardized 100 g / 100 mL
 * amount. `rawValue100g` is kept in the unit supplied by OFF; `factor`
 * converts it to the UI unit (for example sodium g -> mg).
 */
export function per100gWatchMetric(
  rawValue100g: number | null | undefined,
  factor: number,
  dailyLimit: number | null,
  attentionThreshold: number | null,
): Per100gWatchMetric {
  if (rawValue100g == null) {
    return { value100g: null, dailyPercent: null, present: false };
  }

  const raw = Number(rawValue100g);
  if (!Number.isFinite(raw)) {
    return { value100g: null, dailyPercent: null, present: false };
  }

  const value100g = raw * factor;
  const dailyPercent = dailyLimit != null && dailyLimit > 0
    ? (value100g / dailyLimit) * 100
    : null;

  return {
    value100g,
    dailyPercent,
    present: attentionThreshold != null && value100g >= attentionThreshold,
  };
}
