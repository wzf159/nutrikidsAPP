import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getChildren, type Child } from '../services/api';
import {
  AGE_GROUPS, CDC_AGE8_HEIGHT, CDC_AGE8_WEIGHT, CDC_BMI, CDC_PCT_LABELS, CDC_PCTS,
  bmiOf, interpolatePercentile, stageIdxForChild,
} from '../data/growth';

interface Metric { name: string; nameZh: string; nameEs: string; unit: string; emoji: string; pcts: number[]; value: number; color: string }

function PercentileChart({ metrics, isZh, isEs }: { metrics: Metric[]; isZh: boolean; isEs: boolean }) {
  const W = 720, H = 320;
  const PAD_L = 52, PAD_R = 20, PAD_T = 20, PAD_B = 40;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;
  const groupW = chartW / metrics.length;
  const barW = Math.min(groupW * 0.55, 80);
  const y = (pct: number) => PAD_T + chartH * (1 - pct / 100);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
      {/* 百分位网格线 —— 贯穿整个图表宽度 */}
      {CDC_PCTS.map((pct, i) => (
        <g key={pct}>
          <line
            x1={PAD_L} x2={W - PAD_R} y1={y(pct)} y2={y(pct)}
            stroke={pct === 50 ? 'rgba(167,139,250,0.5)' : 'rgba(200,185,255,0.2)'}
            strokeWidth={pct === 50 ? 1.5 : 1}
            strokeDasharray={pct === 50 ? '4 3' : undefined}
          />
          <text x={PAD_L - 5} y={y(pct) + 3} textAnchor="end" fontSize={pct === 50 ? 9 : 8}
            fontWeight={pct === 50 ? 700 : 500} fill={pct === 50 ? '#a78bfa' : '#9ca3af'}>
            {CDC_PCT_LABELS[i]}
          </text>
        </g>
      ))}
      <text x={12} y={PAD_T + chartH / 2} fontSize={9} fontWeight={700} fill="#6b7280" textAnchor="middle"
        transform={`rotate(-90 12 ${PAD_T + chartH / 2})`}>
        {isZh ? '百分位' : isEs ? 'Percentil' : 'Percentile'}
      </text>
      <line x1={PAD_L} x2={W - PAD_R} y1={PAD_T + chartH} y2={PAD_T + chartH} stroke="rgba(200,185,255,0.4)" strokeWidth={1.5} />

      {metrics.map((m, mi) => {
        const cx = PAD_L + (mi + 0.5) * groupW;
        const x = cx - barW / 2;
        const pct = interpolatePercentile(m.value, m.pcts);
        const yTop = y(pct);
        const r = 6;
        return (
          <g key={m.name}>
            {/* 同龄区间（5–95）圆角背景 */}
            <path
              d={`M ${x + r} ${y(95)} L ${x + barW - r} ${y(95)} Q ${x + barW} ${y(95)} ${x + barW} ${y(95) + r} L ${x + barW} ${y(5) - r} Q ${x + barW} ${y(5)} ${x + barW - r} ${y(5)} L ${x + r} ${y(5)} Q ${x} ${y(5)} ${x} ${y(5) - r} L ${x} ${y(95) + r} Q ${x} ${y(95)} ${x + r} ${y(95)} Z`}
              fill="rgba(167,139,250,0.12)"
            />
            {/* 四分位带（25–75）深色背景 */}
            <rect x={x} y={y(75)} width={barW} height={y(25) - y(75)} fill="rgba(167,139,250,0.22)" />
            {/* 孩子的柱 —— 顶部圆角 */}
            <rect
              x={x} y={yTop} width={barW} height={PAD_T + chartH - yTop}
              rx={r} fill={m.color} opacity={0.85}
            />
            {/* 圆点 */}
            <circle cx={cx} cy={yTop} r={8} fill="#ec4899" stroke="#fff" strokeWidth={2.5} />
            {/* 百分位数标签 */}
            <text x={cx} y={yTop - 26} textAnchor="middle" fontSize={11} fontWeight={700} fill="#000">
              {Math.round(pct)}{isZh ? '' : 'th'}
            </text>
            {/* 数值标签 */}
            <text x={cx} y={yTop - 14} textAnchor="middle" fontSize={9} fontWeight={700} fill="#000">
              {m.value}{m.unit ? ` ${m.unit}` : ''}
            </text>
            {/* 底部名称 */}
            <text x={cx} y={PAD_T + chartH + 18} textAnchor="middle" fontSize={11} fontWeight={700} fill="#374151">
              {m.emoji} {isZh ? m.nameZh : isEs ? m.nameEs : m.name}
            </text>
            {m.unit && (
              <text x={cx} y={PAD_T + chartH + 30} textAnchor="middle" fontSize={9} fill="#9ca3af">({m.unit})</text>
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

  useEffect(() => {
    getChildren()
      .then(cs => setChild(cs[0] ?? null))
      .catch(() => setChild(null))
      .finally(() => setLoaded(true));
  }, []);

  const metrics = useMemo<Metric[]>(() => {
    if (!child?.heightCm || !child?.weightKg) return [];
    const out: Metric[] = [];
    if (child.age === 8) {
      out.push(
        { name: 'Height', nameZh: '身高', nameEs: 'Altura', unit: 'cm', emoji: '📏', pcts: CDC_AGE8_HEIGHT, value: child.heightCm, color: '#893ce3' },
        { name: 'Weight', nameZh: '体重', nameEs: 'Peso', unit: 'kg', emoji: '⚖️', pcts: CDC_AGE8_WEIGHT, value: child.weightKg, color: '#b441c3' },
      );
    }
    const stage = AGE_GROUPS[stageIdxForChild(child.stageKey, child.age)];
    const table = (child.gender === 'girl' ? CDC_BMI.girls : CDC_BMI.boys)[stage.key];
    out.push({ name: 'BMI', nameZh: 'BMI', nameEs: 'IMC', unit: '', emoji: '📐', pcts: table, value: bmiOf(child.heightCm, child.weightKg), color: '#db46a6' });
    return out;
  }, [child]);

  const group = child ? AGE_GROUPS[stageIdxForChild(child.stageKey, child.age)] : null;

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#d8ccf5] via-[#e8ccec] to-[#ccd8f5]">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <section className="bg-white/70 backdrop-blur-xl saturate-200 brightness-[1.08] rounded-[18px] border border-white/75 shadow-[0_8px_32px_rgba(120,80,200,0.12),0_2px_8px_rgba(120,80,200,0.06),inset_0_1.5px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(200,180,255,0.15),inset_1px_0_0_rgba(255,255,255,0.6),inset_-1px_0_0_rgba(255,255,255,0.6)] p-6 animate-fade-in-up relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/18 to-transparent pointer-events-none" />
          <div className="relative">
            <h2 className="text-[22px] font-bold bg-gradient-to-r from-[#893ce3] to-[#ec4899] bg-clip-text text-transparent mb-4">
              📈 {isZh ? '成长档案' : isEs ? 'Perfil de Crecimiento' : 'Growth Profile'}
            </h2>

            {!loaded ? (
              <p className="text-sm text-gray-400 py-8 text-center animate-pulse">{isZh ? '加载中…' : isEs ? 'Cargando…' : 'Loading…'}</p>
            ) : !child || metrics.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-4xl mb-3">📏⚖️📐</p>
                <p className="font-bold text-gray-700 mb-1">{isZh ? '还没有身体数据' : isEs ? 'No hay mediciones corporales aún' : 'No body measurements yet'}</p>
                <p className="text-sm text-gray-500 mb-5">{isZh ? '填写孩子的身高体重后，即可对比同龄人百分位。' : isEs ? 'Agrega la altura y peso de tu hijo para comparar con otros niños.' : "Add your child's height & weight to compare against peers."}</p>
                <button onClick={() => navigate('/onboarding')} className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#893ce3] to-[#ec4899] text-white text-sm font-bold shadow-[0_4px_16px_rgba(137,60,227,0.3)] hover:scale-[1.04] transition" style={{ fontFamily: 'Poppins, sans-serif'  }}>
                  ✨ {isZh ? '去填写档案' : isEs ? 'Configurar perfil' : 'Set up profile'}
                </button>
              </div>
            ) : (
              <>
                <p className="text-[13px] font-extrabold uppercase tracking-wide text-gray-600 mb-1">
                  📊 {isZh ? `身体数据 vs 同龄人 · CDC & WHO · ${group!.badgeZh}` : isEs ? `Datos Corporales vs Otros · CDC & OMS · ${group!.badgeEs}` : `Body Stats vs Peers · CDC & WHO · ${group!.badge}`}
                </p>
                <p className="text-[13px] font-semibold text-gray-500 mb-4">
                  {isZh ? `${child.name} 与同龄孩子的百分位对比` : isEs ? `Cómo ${child.name} se compara con niños de la misma edad — ranking percentil` : `How ${child.name} compares to children of the same age — percentile ranking`}
                </p>

                <PercentileChart metrics={metrics} isZh={isZh} isEs={isEs} />

                <div className="flex gap-6 mt-3 flex-wrap text-[13px] font-bold text-gray-600">
                  <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-[rgba(137,60,227,0.3)] inline-block" />{isZh ? '同龄区间（5–95 百分位）' : isEs ? 'Rango de pares (percentil 5-95)' : 'Peer range (5th–95th)'}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-[#ec4899] inline-block" />{child.name}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3.5 h-[3px] bg-[rgba(137,60,227,0.5)] inline-block" />{isZh ? '第 50 百分位' : isEs ? 'Percentil 50' : '50th percentile'}</span>
                </div>

                <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">
                  {isZh
                    ? `数据来源：CDC Growth Charts 2000 · ${child.name}：身高 ${child.heightCm}cm · 体重 ${child.weightKg}kg · BMI ${bmiOf(child.heightCm!, child.weightKg!)}${child.age !== 8 ? '（身高/体重百分位需 CDC 全年龄表，当前仅展示 BMI）' : ''}`
                    : isEs
                      ? `Fuente: CDC Growth Charts 2000 · ${child.name}: Altura ${child.heightCm}cm · Peso ${child.weightKg}kg · IMC ${bmiOf(child.heightCm!, child.weightKg!)}`
                      : `Source: CDC Growth Charts 2000 · ${child.name}: Height ${child.heightCm}cm · Weight ${child.weightKg}kg · BMI ${bmiOf(child.heightCm!, child.weightKg!)}`}
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
