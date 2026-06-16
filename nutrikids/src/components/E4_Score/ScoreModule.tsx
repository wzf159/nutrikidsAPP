import CircleScore from './CircleScore';

interface ScoreData {
  score: number;
  grade: string;
  gradeLabel: string;
  color: string;
}

interface Props { data: ScoreData | null; }

const LABEL_COLORS: Record<string, string> = {
  Excellent: 'text-green-600',
  Good:      'text-green-600',
  Fair:      'text-amber-500',
  Poor:      'text-red-500',
};

/** S4.1 · Score display — circular ring + grade label. Rendered inside the Food Information card. */
export default function ScoreModule({ data }: Props) {
  if (!data) return null;
  const labelColor = LABEL_COLORS[data.grade] || 'text-green-600';

  return (
    <div className="flex flex-col items-center shrink-0">
      <CircleScore score={data.score} grade={data.grade} color={data.color} />
      <div className={`mt-2 flex items-center gap-1.5 font-bold ${labelColor}`}>
        <span>{data.gradeLabel}</span>
        <span className="text-xl">🐛</span>
      </div>
    </div>
  );
}
