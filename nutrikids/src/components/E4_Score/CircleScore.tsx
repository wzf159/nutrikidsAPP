import { useEffect, useRef } from 'react';

interface Props {
  score: number;
  grade: string;
  color: string;
}

const RADIUS = 62;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const GRADE_COLORS: Record<string, string> = {
  Excellent: '#22c55e',
  Good:      '#22c55e',
  Fair:      '#f59e0b',
  Poor:      '#ef4444',
};

export default function CircleScore({ score, grade, color }: Props) {
  const circleRef = useRef<SVGCircleElement>(null);
  const resolvedColor = GRADE_COLORS[grade] || color;
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  useEffect(() => {
    if (!circleRef.current) return;
    const el = circleRef.current;
    el.style.strokeDashoffset = String(CIRCUMFERENCE);
    el.style.transition = 'none';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
        el.style.strokeDashoffset = String(offset);
      });
    });
  }, [score, offset]);

  return (
    <svg width="150" height="150" viewBox="0 0 150 150" className="drop-shadow-sm">
      {/* Background track */}
      <circle cx="75" cy="75" r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth="11" />
      {/* Score arc */}
      <circle
        ref={circleRef}
        cx="75" cy="75" r={RADIUS}
        fill="none"
        stroke={resolvedColor}
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE}
        transform="rotate(-90 75 75)"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {/* Grade label inside ring */}
      <text x="75" y="58" textAnchor="middle" fill={resolvedColor} fontSize="13" fontWeight="700" letterSpacing="1">
        {grade.toUpperCase()}
      </text>
      {/* Score number */}
      <text x="75" y="90" textAnchor="middle" fill={resolvedColor} fontSize="36" fontWeight="800">
        {score}
      </text>
      {/* /100 */}
      <text x="75" y="108" textAnchor="middle" fill="#94a3b8" fontSize="13">
        /100
      </text>
    </svg>
  );
}
