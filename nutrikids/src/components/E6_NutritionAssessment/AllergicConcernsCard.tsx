import { useTranslation } from 'react-i18next';

interface Allergen { id: string; icon: string; name: string; nameZh: string; present: boolean; }
interface Props { data: { overall: string; overallZh: string; allergens: Allergen[] } | null; }

/** E6 · V3 Allergic Concerns — list of common allergens with Contains / Not Present status. */
export default function AllergicConcernsCard({ data }: Props) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  if (!data) return null;

  return (
    <div className="bg-gradient-to-br from-[rgba(239,68,68,0.06)] to-[rgba(244,63,94,0.04)] rounded-3xl p-5 shadow-sm border border-[rgba(239,68,68,0.12)] flex flex-col animate-fade-in-up delay-200">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center text-white text-base shrink-0">🛡️</span>
        <h4 className="font-bold text-red-500 text-sm tracking-wide uppercase">{t('nutrition.allergenConcerns')}</h4>
      </div>
      <p className="text-xs text-gray-500 mt-1.5 mb-4">{t('nutrition.allergenSubtitle')}</p>

      {/* List */}
      <div className="flex flex-col gap-2">
        {data.allergens.map((a, i) => (
          <div
            key={a.id}
            className="flex items-center gap-3 bg-white rounded-2xl px-3.5 py-2.5 shadow-sm animate-fade-in-up"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 ${a.present ? 'bg-red-50' : 'bg-gray-50'}`}>
              {a.icon}
            </span>
            <span className="text-sm font-semibold text-indigo-900 flex-1 min-w-0">{isZh ? a.nameZh : a.name}</span>
            <span className={`text-xs font-bold shrink-0 ${a.present ? 'text-red-500' : 'text-green-600'}`}>
              {a.present ? t('nutrition.status.Contains') : t('nutrition.status.NotPresent')}
            </span>
            <span className="text-gray-300 text-lg shrink-0">›</span>
          </div>
        ))}
      </div>
    </div>
  );
}
