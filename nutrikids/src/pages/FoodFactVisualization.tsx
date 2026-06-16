import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { fetchFoodFact } from '../services/api';

export default function FoodFactVisualization() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFoodFact().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌿</div>
          <p className="text-gray-500">{isZh ? '加载中...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  const product = data.product;
  const nutrition = product.nutritionFacts;

  const getBarWidth = (value: number, max: number) => {
    return Math.min((value / max) * 100, 100);
  };

  const nutritionItems = [
    { key: 'energy', label: 'Energy', labelZh: '能量', value: nutrition.energy.value, unit: nutrition.energy.unit, max: 200 },
    { key: 'protein', label: 'Protein', labelZh: '蛋白质', value: nutrition.protein.value, unit: nutrition.protein.unit, max: 10 },
    { key: 'fat', label: 'Fat', labelZh: '脂肪', value: nutrition.fat.value, unit: nutrition.fat.unit, max: 20 },
    { key: 'carbs', label: 'Carbs', labelZh: '碳水化合物', value: nutrition.carbohydrates.value, unit: 'g', max: 30 },
    { key: 'sugars', label: 'Sugars', labelZh: '糖分', value: nutrition.sugars.value, unit: 'g', max: 25 },
    { key: 'sodium', label: 'Sodium', labelZh: '钠', value: nutrition.sodium.value, unit: nutrition.sodium.unit, max: 200 },
  ];

  const healthFactors = [
    { key: 'nutrientQuality', label: 'Nutrient Quality', labelZh: '营养质量', value: product.healthRating.factors.nutrientQuality, color: 'bg-green-500' },
    { key: 'processingLevel', label: 'Processing Level', labelZh: '加工程度', value: product.healthRating.factors.processingLevel, color: 'bg-yellow-500' },
    { key: 'ingredientPurity', label: 'Ingredient Purity', labelZh: '成分纯度', value: product.healthRating.factors.ingredientPurity, color: 'bg-blue-500' },
    { key: 'sustainability', label: 'Sustainability', labelZh: '可持续性', value: product.healthRating.factors.sustainability, color: 'bg-teal-500' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 py-3 border-b border-gray-100 bg-white">
        <NavLink to="/" className="text-sm text-gray-500 hover:text-green-600 flex items-center gap-1">
          ← {t('input.backToHome')}
        </NavLink>
      </div>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {isZh ? '食品成分可视化' : 'Food Fact Visualization'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isZh ? '探索食品的营养成分、健康评分和环境影响' : 'Explore nutrition facts, health ratings, and environmental impact'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{product.name}</h2>
                      <p className="text-gray-500 text-sm">{product.brand}</p>
                    </div>
                    <div className="flex gap-2">
                      {product.labels.map((label: string) => (
                        <span 
                          key={label}
                          className="px-2 py-1 text-xs font-medium bg-green-50 text-green-600 rounded-full"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{isZh ? product.categoryZh : product.category}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>📦 {product.quantity}</span>
                    <span>🍽️ {product.servingSize}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                📊 {isZh ? '营养成分' : 'Nutrition Facts'}
              </h3>
              <div className="space-y-4">
                {nutritionItems.map(item => (
                  <div key={item.key} className="flex items-center gap-4">
                    <span className="w-28 text-sm text-gray-600 flex-shrink-0">
                      {isZh ? item.labelZh : item.label}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full ${item.key === 'sugars' ? 'bg-red-400' : item.key === 'fat' ? 'bg-yellow-400' : 'bg-green-500'} rounded-full transition-all duration-500`}
                        style={{ width: `${getBarWidth(item.value, item.max)}%` }}
                      />
                    </div>
                    <span className="w-20 text-sm font-medium text-gray-700 text-right">
                      {item.value} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                * {isZh ? '基于' : 'Based on'} {product.servingSize} {isZh ? '份量' : 'serving'}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                🧪 {isZh ? '维生素与矿物质' : 'Vitamins & Minerals'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {product.vitamins.map((vitamin: { name: string; nameZh: string; value: number; unit: string; dailyValue: number }) => (
                  <div 
                    key={vitamin.name}
                    className="bg-gray-50 rounded-xl p-3 text-center"
                  >
                    <p className="text-xs font-medium text-gray-700 mb-1">
                      {isZh ? vitamin.nameZh : vitamin.name}
                    </p>
                    <p className="text-sm font-bold text-gray-800">
                      {vitamin.value} {vitamin.unit}
                    </p>
                    <p className="text-xs text-gray-400">
                      {vitamin.dailyValue}% {isZh ? '每日值' : 'DV'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                🧬 {isZh ? '成分列表' : 'Ingredients'}
              </h3>
              <div className="space-y-3">
                {product.ingredients.map((ingredient: { name: string; nameZh: string; percentage: number }, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-600">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {isZh ? ingredient.nameZh : ingredient.name}
                      </p>
                      <div className="mt-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${ingredient.percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-600">
                      {ingredient.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <p className="text-green-100 text-sm mb-2">{isZh ? '整体健康评分' : 'Overall Health Rating'}</p>
              <div className="flex items-end gap-4 mb-4">
                <div className="text-6xl font-bold">{product.healthRating.overall}</div>
                <div className="text-3xl mb-1">/100</div>
              </div>
              <div className="space-y-3">
                {healthFactors.map(factor => (
                  <div key={factor.key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{isZh ? factor.labelZh : factor.label}</span>
                      <span>{factor.value}%</span>
                    </div>
                    <div className="bg-white/20 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${factor.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                🏷️ {isZh ? '评分认证' : 'Scores & Certifications'}
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-green-600">{product.nutriScore.grade}</p>
                  <p className="text-xs text-gray-500 mt-1">{isZh ? '营养评分' : 'Nutri-Score'}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-blue-600">{product.ecoScore.grade}</p>
                  <p className="text-xs text-gray-500 mt-1">{isZh ? '环保评分' : 'Eco-Score'}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3">
                  <p className="text-2xl font-bold text-orange-600">{product.novaScore}</p>
                  <p className="text-xs text-gray-500 mt-1">NOVA</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                🌍 {isZh ? '环境影响' : 'Environmental Impact'}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">♻️</span>
                    <span className="text-sm text-gray-700">{isZh ? '碳足迹' : 'Carbon Footprint'}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{product.environmentalImpact.carbonFootprint.value} {product.environmentalImpact.carbonFootprint.unit}</p>
                    <span className="text-xs text-green-600">{product.environmentalImpact.carbonFootprint.label}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💧</span>
                    <span className="text-sm text-gray-700">{isZh ? '水足迹' : 'Water Footprint'}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{product.environmentalImpact.waterFootprint.value} {product.environmentalImpact.waterFootprint.unit}</p>
                    <span className="text-xs text-yellow-600">{product.environmentalImpact.waterFootprint.label}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌱</span>
                    <span className="text-sm text-gray-700">{isZh ? '土地使用' : 'Land Use'}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{product.environmentalImpact.landUse.value} {product.environmentalImpact.landUse.unit}</p>
                    <span className="text-xs text-green-600">{product.environmentalImpact.landUse.label}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                ⭐ {isZh ? '用户评价' : 'User Ratings'}
              </h3>
              <div className="flex items-center gap-2 mb-4">
                <div className="text-3xl font-bold text-gray-800">{product.ratings.average}</div>
                <div className="text-yellow-400">★★★★★</div>
                <span className="text-sm text-gray-500">({product.ratings.total} {isZh ? '评价' : 'reviews'})</span>
              </div>
              <div className="space-y-3">
                {product.ratings.reviews.map((review: { user: string; rating: number; comment: string; date: string }, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-700 text-sm">{review.user}</span>
                      <span className="text-xs text-gray-400">{review.date}</span>
                    </div>
                    <div className="text-yellow-400 text-xs mb-1">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                🏭 {isZh ? '制造商信息' : 'Manufacturer'}
              </h3>
              <p className="text-sm text-gray-700 font-medium mb-1">{product.manufacturer.name}</p>
              <p className="text-xs text-gray-500 mb-3">{product.manufacturer.location}</p>
              <div className="flex flex-wrap gap-2">
                {product.manufacturer.certifications.map((cert: string) => (
                  <span 
                    key={cert}
                    className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            📈 {isZh ? '同类产品对比' : 'Comparison with Similar Products'}
          </h3>
          <div className="h-48">
            <svg viewBox="0 0 600 180" className="w-full h-full">
              <defs>
                <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
              </defs>
              <g transform="translate(60, 20)">
                {data.comparativeData.topProducts.map((item: { name: string; energy: number; protein: number; score: number }, index: number) => {
                  const x = index * 100;
                  const barHeight = (item.score / 100) * 140;
                  const isCurrent = item.name === 'Stonyfield Organic';
                  return (
                    <g key={index}>
                      <rect
                        x={x + 15}
                        y={140 - barHeight}
                        width={70}
                        height={barHeight}
                        rx="8"
                        fill={isCurrent ? 'url(#barGradient)' : '#e5e7eb'}
                        className="transition-all duration-500"
                      />
                      <text
                        x={x + 50}
                        y={165}
                        textAnchor="middle"
                        className="text-xs fill-gray-600"
                        style={{ fontSize: '10px' }}
                      >
                        {item.name}
                      </text>
                      <text
                        x={x + 50}
                        y={140 - barHeight - 10}
                        textAnchor="middle"
                        className="text-sm font-bold fill-gray-800"
                        style={{ fontSize: '12px' }}
                      >
                        {item.score}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-xs text-gray-500">{isZh ? '当前产品' : 'Current Product'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-200" />
              <span className="text-xs text-gray-500">{isZh ? '其他产品' : 'Other Products'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}