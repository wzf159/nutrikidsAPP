import { useTranslation } from 'react-i18next';

interface ScoreData {
  score: number;
  grade: string;
  verdict: string;
  verdictZh: string;
  shortDesc: string;
  shortDescZh: string;
  color: string;
}
interface FoodData { name: string; imageUrl: string; }
interface Goal { id: string; icon: string; label: string; labelZh: string; }
interface Child { id: string; name: string; developmentGoals: Goal[]; }

interface Props {
  score: ScoreData | null;
  food: FoodData | null;
  child: Child | null;
  childList: Child[];
  onSwitch: (id: string) => void;
}

const GOAL_BG = [
  'bg-[rgba(139,92,246,0.08)]', 'bg-[rgba(56,189,248,0.08)]', 'bg-[rgba(245,158,11,0.08)]', 'bg-[rgba(16,185,129,0.08)]', 'bg-[rgba(249,115,22,0.08)]',
];
const GOAL_TEXT = [
  'text-[#893ce3]', 'text-[#0ea5e9]', 'text-[#f59e0b]', 'text-[#10b981]', 'text-[#f97316]',
];

/** E4 · V3 left hero card — RECOMMENDED verdict + score + supported goals + sources. */
export default function RecommendationCard({ score, food, child, childList, onSwitch }: Props) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  if (!score || !child) return null;

  const verdict = isZh ? score.verdictZh : score.verdict;
  const desc = isZh ? score.shortDescZh : score.shortDesc;
  const goals = child.developmentGoals || [];

  return (
    <div className="bg-gradient-to-br from-[rgba(34,197,94,0.06)] to-[rgba(16,185,129,0.04)] rounded-3xl p-6 shadow-sm border border-[rgba(34,197,94,0.12)] flex flex-col h-full animate-fade-in-up">
      {/* Badge + child switch */}
      <div className="flex items-start justify-between gap-2">
        <div className="inline-flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center text-white text-sm shadow-sm">🛡️</span>
          <span className="text-xs font-bold tracking-wider text-green-600">{t('recommendation.badge')}</span>
        </div>
        {childList.length > 1 && (
          <select
            value={child.id}
            onChange={e => onSwitch(e.target.value)}
            className="text-xs text-green-600 border border-green-200 rounded-full px-2 py-1 bg-white/70 cursor-pointer focus:outline-none focus:ring-1 focus:ring-green-300"
          >
            {childList.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Title + score (left) | product image (right) */}
      <div className="flex items-start justify-between gap-4 mt-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-extrabold text-green-600 leading-tight">
            {t('recommendation.verdictLine', { verdict, name: child.name })}
          </h2>
          <p className="text-xs font-medium text-gray-500 mt-4">{t('score.title')}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-extrabold text-green-600">{score.score}</span>
            <span className="text-sm text-gray-400 font-medium">/100</span>
          </div>
        </div>

        <div className="w-28 h-28 shrink-0 rounded-2xl overflow-hidden bg-white/70 border border-green-100 flex items-center justify-center">
          {food?.imageUrl ? (
            <img
              src={food.imageUrl}
              alt={food?.name || ''}
              className="w-full h-full object-contain p-1"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <span className="text-4xl">🥛</span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="flex items-start gap-2 text-sm text-gray-600 leading-snug mt-4 bg-white/60 rounded-2xl px-3 py-2.5">
        <span className="text-base shrink-0">🌿</span>
        <span>{desc}</span>
      </p>

      {/* Development goals */}
      <div className="mt-5">
        <p className="text-sm font-bold text-green-700 mb-3">{t('recommendation.supportsGoals')}</p>
        <div className="flex justify-between gap-1">
          {goals.map((g, i) => (
            <div
              key={g.id}
              className="flex flex-col items-center gap-1.5 text-center flex-1 animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${GOAL_BG[i % GOAL_BG.length]}`}>
                {g.icon}
              </span>
              <span className={`text-[10px] font-medium leading-tight ${GOAL_TEXT[i % GOAL_TEXT.length]}`}>
                {isZh ? g.labelZh : g.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Information sources */}
      <div className="mt-auto pt-5">
        <div className="flex items-start gap-2.5 border-t border-green-100 pt-4">
          <span className="text-lg shrink-0">📄</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-700">{t('recommendation.infoSources')}</p>
            <p className="text-xs text-gray-400 leading-snug mt-0.5">{t('recommendation.sourcesText')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
