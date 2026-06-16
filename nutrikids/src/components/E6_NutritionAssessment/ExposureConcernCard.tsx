import { useTranslation } from 'react-i18next';

interface Concern { id: string; icon: string; name: string; nameZh: string; level: string; }
interface Props { data: { overall: string; overallZh: string; concerns: Concern[] } | null; }

const LEVEL_TEXT: Record<string, string> = {
  High:     'text-red-500',
  Moderate: 'text-orange-500',
  Present:  'text-orange-500',
  Low:      'text-green-600',
  None:     'text-green-600',
  Trace:    'text-amber-500',
};
const ICON_BG = ['bg-[rgba(245,158,11,0.08)]', 'bg-[rgba(56,189,248,0.08)]', 'bg-[rgba(139,92,246,0.08)]', 'bg-[rgba(16,185,129,0.08)]', 'bg-[rgba(249,115,22,0.08)]'];

/** E6 · V3 Exposure Concerns — vertical list of ingredients to be aware of. */
export default function ExposureConcernCard({ data }: Props) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  if (!data) return null;

  return (
    <div className="bg-gradient-to-br from-[rgba(249,115,22,0.06)] to-[rgba(251,146,60,0.04)] rounded-3xl p-5 shadow-sm border border-[rgba(249,115,22,0.12)] flex flex-col h-full animate-fade-in-up delay-100">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-lg shrink-0">⚠️</span>
        <h4 className="font-bold text-orange-500 text-sm tracking-wide uppercase">{t('nutrition.exposureConcern')}</h4>
      </div>
      <p className="text-xs text-gray-500 mt-1.5 mb-4">{t('nutrition.exposureSubtitle')}</p>

      {/* List */}
      <div className="flex flex-col gap-2.5 flex-1">
        {data.concerns.map((c, i) => (
          <div
            key={c.id}
            className="flex items-center gap-3 bg-white rounded-2xl px-3.5 py-3 shadow-sm animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${ICON_BG[i % ICON_BG.length]}`}>
              {c.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-indigo-900 leading-tight">{isZh ? c.nameZh : c.name}</p>
              <p className={`text-xs font-semibold leading-tight mt-0.5 ${LEVEL_TEXT[c.level] || 'text-gray-500'}`}>
                {t(`nutrition.levels.${c.level}`, c.level)}
              </p>
            </div>
            <span className="text-gray-300 text-lg shrink-0">›</span>
          </div>
        ))}
      </div>
    </div>
  );
}
