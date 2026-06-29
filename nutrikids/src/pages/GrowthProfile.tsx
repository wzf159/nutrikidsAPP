import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getChildren, type Child } from '../services/api';
import {
  AGE_GROUPS, CDC_AGE8_HEIGHT, CDC_AGE8_WEIGHT, CDC_BMI, CDC_PCT_LABELS, CDC_PCTS,
  bmiOf, interpolatePercentile, stageIdxForChild,
} from '../data/growth';

interface Metric {
  name: string;
  nameZh: string;
  nameEs: string;
  unit: string;
  emoji: string;
  pcts: number[];
  value: number;
}

function PercentileChart({ metrics, isZh, isEs, childName }: {
  metrics: Metric[];
  isZh: boolean;
  isEs: boolean;
  childName: string;
}) {
  const W = 720, H = 340;
  const PAD_L = 52, PAD_R = 20, PAD_T = 28, PAD_B = 48;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const groupW = chartW / metrics.length;
  const barW = Math.min(groupW * 0.52, 90);
  const y = (pct: number) => PAD_T + chartH * (1 - pct / 100);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
      <defs>
        {metrics.map((_, mi) => (
          <linearGradient key={mi} id={`barGrad${mi}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#893ce3" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.85" />
          </linearGradient>
        ))}
        <linearGradient id="peerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(167,139,250,0.18)" />
          <stop offset="100%" stopColor="rgba(167,139,250,0.06)" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {CDC_PCTS.map((pct, i) => (
        <g key={pct}>
          <line
            x1={PAD_L} x2={W - PAD_R}
            y1={y(pct)} y2={y(pct)}
            stroke={pct === 50 ? 'rgba(167,139,250,0.55)' : 'rgba(200,185,255,0.22)'}
            strokeWidth={pct === 50 ? 1.5 : 1}
            strokeDasharray={pct === 50 ? '5 4' : undefined}
          />
          <text
            x={PAD_L - 6} y={y(pct) + 3.5}
            textAnchor="end"
            fontSize={pct === 50 ? 9.5 : 8.5}
            fontWeight={pct === 50 ? 700 : 500}
            fill={pct === 50 ? '#a78bfa' : '#9ca3af'}
          >
            {CDC_PCT_LABELS[i]}
          </text>
        </g>
      ))}

      {/* Y-axis label */}
      <text
        x={12} y={PAD_T + chartH / 2}
        fontSize={9} fontWeight={700} fill="#6b7280"
        textAnchor="middle"
        transform={`rotate(-90 12 ${PAD_T + chartH / 2})`}
      >
        {isZh ? '百分位' : isEs ? 'Percentil' : 'Percentile'}
      </text>

      {/* Bottom axis line */}
      <line
        x1={PAD_L} x2={W - PAD_R}
        y1={PAD_T + chartH} y2={PAD_T + chartH}
        stroke="rgba(200,185,255,0.4)" strokeWidth={1.5}
      />

      {metrics.map((m, mi) => {
        const cx = PAD_L + (mi + 0.5) * groupW;
        const x = cx - barW / 2;
        const pct = interpolatePercentile(m.value, m.pcts);
        const yTop = y(pct);
        const yBottom = PAD_T + chartH;
        const r = 7;

        // Peer range background (5–95) with rounded top
        const peerTop = y(95);
        const peerBottom = y(5);
        const pr = 6;

        return (
          <g key={m.name}>
            {/* Peer range (5–95) rounded rect */}
            <path
              d={`
                M ${x + pr} ${peerTop}
                L ${x + barW - pr} ${peerTop}
                Q ${x + barW} ${peerTop} ${x + barW} ${peerTop + pr}
                L ${x + barW} ${peerBottom}
                L ${x} ${peerBottom}
                L ${x} ${peerTop + pr}
                Q ${x} ${peerTop} ${x + pr} ${peerTop}
                Z
              `}
              fill="url(#peerGrad)"
            />

            {/* Bar with rounded top */}
            <path
              d={`
                M ${x + r} ${yTop}
                L ${x + barW - r} ${yTop}
                Q ${x + barW} ${yTop} ${x + barW} ${yTop + r}
                L ${x + barW} ${yBottom}
                L ${x} ${yBottom}
                L ${x} ${yTop + r}
                Q ${x} ${yTop} ${x + r} ${yTop}
                Z
              `}
              fill={`url(#barGrad${mi})`}
            />

            {/* Dot at top of bar */}
            <circle cx={cx} cy={yTop} r={8} fill="#ec4899" stroke="#fff" strokeWidth={2.5} />

            {/* Percentile label */}
            <text x={cx} y={yTop - 28} textAnchor="middle" fontSize={12} fontWeight={800} fill="#1f2937">
              {Math.round(pct)}{isZh ? '' : 'th'}
            </text>

            {/* Value label */}
            <text x={cx} y={yTop - 15} textAnchor="middle" fontSize={9.5} fontWeight={600} fill="#374151">
              {m.value}{m.unit ? ` ${m.unit}` : ''}
            </text>

            {/* Bottom metric name */}
            <text x={cx} y={PAD_T + chartH + 18} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#374151">
              {isZh ? m.nameZh : isEs ? m.nameEs : m.name}
            </text>
            {m.unit && (
              <text x={cx} y={PAD_T + chartH + 32} textAnchor="middle" fontSize={9} fill="#9ca3af">
                ({m.unit})
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function GrowthProfile() {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const isEs = i18n.language === 'es';
  const navigate = useNavigate();

  const [child, setChild] = useState<Child | null>(null);
  const [loaded, setLoaded] = useState(false);
  const ACTIVE_KEY = 'nutrikids_active_child_id';

  const loadChild = () => {
    getChildren()
      .then(cs => {
        const activeId = localStorage.getItem(ACTIVE_KEY);
        const c = cs.find(c => c.id === activeId) ?? cs[0] ?? null;
        setChild(c);
      })
      .catch(() => setChild(null))
      .finally(() => setLoaded(true));
  };

  useEffect(() => {
    loadChild();
    window.addEventListener('nutrikids:child-updated', loadChild);
    return () => window.removeEventListener('nutrikids:child-updated', loadChild);
  }, []);

  const metrics = useMemo<Metric[]>(() => {
    if (!child?.heightCm || !child?.weightKg) return [];

    const stage = AGE_GROUPS[stageIdxForChild(child.stageKey, child.age)];
    const bmiTable = (child.gender === 'girl' ? CDC_BMI.girls : CDC_BMI.boys)[stage.key];

    const bmi: Metric = {
      name: 'BMI', nameZh: 'BMI', nameEs: 'IMC',
      unit: '', emoji: '📐',
      pcts: bmiTable,
      value: bmiOf(child.heightCm, child.weightKg),
    };

    if (child.age === 8) {
      return [
        { name: 'Height', nameZh: '身高', nameEs: 'Altura', unit: 'cm', emoji: '📏', pcts: CDC_AGE8_HEIGHT, value: child.heightCm },
        { name: 'Weight', nameZh: '体重', nameEs: 'Peso',   unit: 'kg', emoji: '⚖️', pcts: CDC_AGE8_WEIGHT, value: child.weightKg },
        bmi,
      ];
    }
    return [bmi];
  }, [child]);

  const group = child ? AGE_GROUPS[stageIdxForChild(child.stageKey, child.age)] : null;

  const subtitle = !child ? '' : isZh
    ? `${child.name} 与同龄孩子的百分位对比 · CDC & WHO · ${group!.badgeZh}`
    : isEs
    ? `Cómo ${child.name} se compara con niños de la misma edad — ranking percentil · CDC & OMS · ${group!.badgeEs}`
    : `How ${child.name} compares to children of the same age — percentile ranking · CDC & WHO · ${group!.badge}`;

  const sourceNote = !child ? '' : isZh
    ? `数据来源：CDC Growth Charts 2000 · ${child.name}：身高 ${child.heightCm}cm · 体重 ${child.weightKg}kg · BMI ${bmiOf(child.heightCm!, child.weightKg!)}${child.age !== 8 ? '（身高/体重百分位仅支持 8 岁）' : ''}`
    : isEs
    ? `Fuente: CDC Growth Charts 2000 · ${child.name}: Altura ${child.heightCm}cm · Peso ${child.weightKg}kg · IMC ${bmiOf(child.heightCm!, child.weightKg!)}`
    : `Source: CDC Growth Charts 2000 · ${child.name}: Height ${child.heightCm}cm · Weight ${child.weightKg}kg · BMI ${bmiOf(child.heightCm!, child.weightKg!)}${child.age !== 8 ? ' · Height & Weight percentiles available for Age 8 only' : ''}`;

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#d8ccf5] via-[#e8ccec] to-[#ccd8f5]">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <section className="bg-white/70 backdrop-blur-xl saturate-200 brightness-[1.08] rounded-[18px] border border-white/75 shadow-[0_8px_32px_rgba(120,80,200,0.12),0_2px_8px_rgba(120,80,200,0.06),inset_0_1.5px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(200,180,255,0.15),inset_1px_0_0_rgba(255,255,255,0.6),inset_-1px_0_0_rgba(255,255,255,0.6)] p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/18 to-transparent pointer-events-none" />

          <div className="relative">
            {/* Title */}
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-sm bg-[#893ce3] inline-block flex-shrink-0" />
              <h2 className="text-[20px] font-bold text-[#893ce3]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {isZh ? '成长档案' : isEs ? 'Perfil de Crecimiento' : 'Growth Profile'}
              </h2>
            </div>

            {/* Loading */}
            {!loaded ? (
              <p className="text-sm text-gray-400 py-8 text-center animate-pulse">
                {isZh ? '加载中…' : isEs ? 'Cargando…' : 'Loading…'}
              </p>

            /* Empty state */
            ) : !child || metrics.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-4xl mb-3">📏⚖️📐</p>
                <p className="font-bold text-gray-700 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {isZh ? '还没有身体数据' : isEs ? 'No hay mediciones corporales aún' : 'No body measurements yet'}
                </p>
                <p className="text-sm text-gray-500 mb-5" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {isZh
                    ? '填写孩子的身高体重后，即可对比同龄人百分位。'
                    : isEs
                    ? 'Agrega la altura y peso de tu hijo para comparar con otros niños.'
                    : "Add your child's height & weight to compare against peers."}
                </p>
                <button
                  onClick={() => navigate('/onboarding')}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#893ce3] to-[#ec4899] text-white text-sm font-bold shadow-[0_4px_16px_rgba(137,60,227,0.3)] hover:scale-[1.04] transition"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  ✨ {isZh ? '去填写档案' : isEs ? 'Configurar perfil' : 'Set up profile'}
                </button>
              </div>

            /* Chart */
            ) : (
              <>
                {/* Subtitle */}
                <p className="text-[13px] text-gray-500 mb-5" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {subtitle}
                </p>

                <PercentileChart metrics={metrics} isZh={isZh} isEs={isEs} childName={child.name} />

                {/* Legend */}
                <div className="flex gap-6 mt-3 flex-wrap" style={{ fontFamily: 'Nunito, sans-serif', fontSize: '13px', fontWeight: 700, color: '#4b5563' }}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-[rgba(167,139,250,0.25)] inline-block" />
                    {isZh ? '同龄区间（5–95 百分位）' : isEs ? 'Rango de pares (percentil 5–95)' : 'Peer range (5th–95th)'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#ec4899] inline-block" />
                    {child.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-[3px] bg-[rgba(167,139,250,0.6)] inline-block" />
                    {isZh ? '第 50 百分位' : isEs ? 'Percentil 50' : '50th percentile'}
                  </span>
                </div>

                {/* Source note */}
                <p className="mt-3 text-[11px] text-gray-400 leading-relaxed" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {sourceNote}
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

