import { useTranslation } from 'react-i18next';

interface Goal { id: string; icon: string; label: string; labelZh: string; }

interface Props { goals: Goal[]; }

const GOAL_BG = ['bg-[rgba(139,92,246,0.08)]', 'bg-[rgba(59,130,246,0.08)]', 'bg-[rgba(245,158,11,0.08)]', 'bg-[rgba(16,185,129,0.08)]'];

/** S5.2 · Key Development Goals — left column of the Alex Profile card. */
export default function DevelopmentGoalList({ goals }: Props) {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-3">{t('child.developmentGoals')}</p>
      <div className="space-y-2.5">
        {goals.slice(0, 4).map((g, i) => (
          <div
            key={g.id}
            className="flex items-center gap-3 animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${GOAL_BG[i % GOAL_BG.length]}`}>
              {g.icon}
            </span>
            <span className="text-sm font-medium text-gray-700">{isZh ? g.labelZh : g.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
