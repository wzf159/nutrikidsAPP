import { useTranslation } from 'react-i18next';

interface ProcessingData {
  nova: number;
  label: string;
  labelZh: string;
  position: string;
  description: string;
  descriptionZh: string;
}
interface Props { data: ProcessingData | null; }

const SEGMENTS = ['minimal', 'moderate', 'high'];
const POSITION_TEXT: Record<string, string> = {
  minimal:  'text-green-600',
  moderate: 'text-red-500',
  high:     'text-red-500',
};

/** E6 · V3 Processing Level — NOVA badge + gradient slider + description. */
export default function ProcessingLevelCard({ data }: Props) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  if (!data) return null;

  const activeIdx = SEGMENTS.indexOf(data.position);
  const dotPct = activeIdx >= 0 ? (activeIdx / (SEGMENTS.length - 1)) * 100 : 0;
  const label = isZh ? data.labelZh : data.label;
  const desc = isZh ? data.descriptionZh : data.description;

  return (
    <div className="relative bg-gradient-to-br from-[rgba(236,72,153,0.06)] to-[rgba(244,63,94,0.04)] rounded-3xl p-5 shadow-sm border border-[rgba(236,72,153,0.12)] flex flex-col animate-fade-in-up delay-300">
      {/* NOVA badge */}
      <div className="absolute top-4 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex flex-col items-center justify-center text-white shadow-md">
        <span className="text-[9px] font-semibold leading-none tracking-wide">{t('nutrition.nova')}</span>
        <span className="text-xl font-extrabold leading-none">{data.nova}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2.5 pr-16">
        <span className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center text-lg shrink-0">⚙️</span>
        <h4 className="font-bold text-pink-500 text-sm tracking-wide uppercase">{t('nutrition.processingLevel')}</h4>
      </div>
      <p className="text-xs text-gray-500 mt-1.5">{t('nutrition.processingSubtitle')}</p>

      {/* Current level */}
      <p className={`text-center text-base font-bold mt-4 ${POSITION_TEXT[data.position] || 'text-gray-700'}`}>
        {label}
      </p>

      {/* Gradient slider */}
      <div className="relative mt-3 mb-2">
        <div className="h-2.5 rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400" />
        {activeIdx >= 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-[3px] border-pink-400 rounded-full shadow-md transition-all duration-700"
            style={{ left: `${dotPct}%` }}
          />
        )}
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[11px] font-medium text-green-600 flex items-center gap-1">
          🌿 {t('nutrition.processing.minimal')}
        </span>
        <span className="text-[11px] font-medium text-red-500">{t('nutrition.processing.high')}</span>
      </div>

      {/* Description */}
      <div className="flex items-center gap-2 bg-red-50 rounded-2xl px-3.5 py-3 mt-4">
        <p className="text-xs text-red-500 leading-snug flex-1">{desc}</p>
        <span className="text-red-300 text-lg shrink-0">›</span>
      </div>
    </div>
  );
}
