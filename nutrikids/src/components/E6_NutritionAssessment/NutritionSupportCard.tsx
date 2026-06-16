import { useTranslation } from 'react-i18next';

interface Nutrient { id: string; icon: string; name: string; nameZh: string; level: string; levelZh: string; dri: number; }
interface Props { data: { overall: string; overallZh: string; keyNutrients: Nutrient[] } | null; }

const LEVEL_TEXT: Record<string, string> = {
  High:     'text-green-600',
  Good:     'text-blue-600',
  Moderate: 'text-amber-500',
  Low:      'text-red-500',
};
const ICON_BG = ['bg-[rgba(59,130,246,0.08)]', 'bg-[rgba(249,115,22,0.08)]', 'bg-[rgba(245,158,11,0.08)]', 'bg-[rgba(20,184,166,0.08)]'];

export default function NutritionSupportCard({ data }: Props) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  if (!data) return null;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl shrink-0">🛡️</span>
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-800 text-sm">{t('nutrition.nutritionSupport')}</h4>
          <p className="text-sm font-semibold text-green-600 leading-tight">{isZh ? data.overallZh : data.overall}</p>
          <p className="text-xs text-gray-400 leading-tight">
            {t('nutrition.keyNutrientsCount', { n: data.keyNutrients.length })}
          </p>
        </div>
      </div>

      {/* Icon badges */}
      <div className="grid grid-cols-4 gap-2 flex-1">
        {data.keyNutrients.map((n, i) => (
          <div
            key={n.id}
            className="flex flex-col items-center gap-1 text-center animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${ICON_BG[i % ICON_BG.length]}`}>
              {n.icon}
            </span>
            <span className="text-[11px] text-gray-600 leading-tight">{isZh ? n.nameZh : n.name}</span>
            <span className={`text-[11px] font-semibold ${LEVEL_TEXT[n.level] || 'text-gray-500'}`}>
              {isZh ? n.levelZh : n.level}
            </span>
          </div>
        ))}
      </div>

      <button className="mt-4 self-end text-sm text-gray-500 font-medium hover:text-green-600">
        {t('nutrition.details')} →
      </button>
    </div>
  );
}
