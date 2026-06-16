import { useTranslation } from 'react-i18next';

interface Nutrient { id: string; icon: string; name: string; nameZh: string; }

interface Props { nutrients: Nutrient[]; }

const NUTRIENT_BG = [
  'bg-[rgba(239,68,68,0.08)]', 'bg-[rgba(56,189,248,0.08)]', 'bg-[rgba(245,158,11,0.08)]', 'bg-[rgba(16,185,129,0.08)]',
  'bg-[rgba(59,130,246,0.08)]', 'bg-[rgba(234,179,8,0.08)]', 'bg-[rgba(99,102,241,0.08)]', 'bg-[rgba(249,115,22,0.08)]',
];

/** S5.3 · Key Nutrition Needs — right column of the Alex Profile card. */
export default function KeyNutrientGrid({ nutrients }: Props) {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-3">{t('child.keyNutrients')}</p>
      <div className="grid grid-cols-4 gap-x-2 gap-y-3">
        {nutrients.map((n, i) => (
          <div
            key={n.id + i}
            className="flex flex-col items-center gap-1 animate-fade-in-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className={`w-11 h-11 rounded-full flex items-center justify-center text-lg ${NUTRIENT_BG[i % NUTRIENT_BG.length]}`}>
              {n.icon}
            </span>
            <span className="text-[11px] text-gray-500 text-center leading-tight">{isZh ? n.nameZh : n.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
