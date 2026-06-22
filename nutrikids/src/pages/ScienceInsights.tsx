import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getChildren, type Child } from '../services/api';
import {
  AGE_GROUPS, DRI_CATEGORIES, DRI_NUTRIENTS,
  DEV_GOALS, TIER_CONFIG,
  stageIdxForChild, higherTier, mergeNeutral,
  type Tier, type DevGoal,
} from '../data/growth';

/* ---------------- 每日营养指南柱状图（SVG） ---------------- */

function DriChart({ ageIdx, isZh, isEs }: { ageIdx: number; isZh: boolean; isEs: boolean }) {
  const W = 920, H = 340;
  const PAD_L = 4, PAD_R = 4, PAD_T = 32, PAD_B = 36;
  const chartH = H - PAD_T - PAD_B;
  const gap = W / DRI_NUTRIENTS.length;
  const barW = gap * 0.62;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
      {/* 分类背景带 */}
      {DRI_CATEGORIES.map((cat, ci) => {
        const [from, to] = cat.range!;
        const x1 = PAD_L + from * gap;
        const x2 = PAD_L + (to + 1) * gap;
        return <rect key={ci} x={x1} y={PAD_T} width={x2 - x1} height={chartH} fill={cat.bg} rx={4} />;
      })}

      {/* 网格线 */}
      {[0, 25, 50, 75, 100].map(pct => {
        const y = PAD_T + chartH * (1 - pct / 100);
        return <line key={pct} x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="rgba(200,185,255,0.25)" strokeWidth={1} />;
      })}

      {/* X轴线条 */}
      <line x1={PAD_L} y1={PAD_T + chartH} x2={W - PAD_R} y2={PAD_T + chartH} stroke="rgba(200,185,255,0.4)" strokeWidth={1.5} />

      {/* 分类标题 */}
      {DRI_CATEGORIES.map((cat, ci) => {
        const [from, to] = cat.range!;
        const cx = PAD_L + (from + to + 1) / 2 * gap;
        return (
          <text key={ci} x={cx} y={PAD_T - 8} textAnchor="middle" fontSize={18} fontWeight={700} fill={cat.colorDark}>
            {isZh ? cat.labelZh : isEs ? cat.labelEs : cat.label}
          </text>
        );
      })}

      {/* 柱状图 */}
      {DRI_NUTRIENTS.map((n, i) => {
        const v = n.values[ageIdx];
        const cx = PAD_L + i * gap + gap / 2;
        const x = PAD_L + i * gap + (gap - barW) / 2;
        const h = Math.max((v / n.max) * chartH, v > 0 ? 3 : 0);
        const yTop = PAD_T + chartH - h;
        const cat = DRI_CATEGORIES[n.category];
        const r = Math.min(4, h / 2);

        // 计算柱子内最多能放几个 emoji
        const eSize = Math.min(18, Math.max(11, barW * 0.6));
        const eRowH = eSize + 4;
        const maxEmoji = Math.floor(h / eRowH);
        const visibleGoals = n.goals.slice(0, maxEmoji);

        return (
          <g key={n.name}>
            {v > 0 && (
              <path
                d={`M ${x + r} ${yTop} L ${x + barW - r} ${yTop} Q ${x + barW} ${yTop} ${x + barW} ${yTop + r} L ${x + barW} ${yTop + h} L ${x} ${yTop + h} L ${x} ${yTop + r} Q ${x} ${yTop} ${x + r} ${yTop} Z`}
                fill={cat.color}
                className="transition-all duration-300"
              />
            )}

            {/* 数值 + 单位 */}
            {v > 0 && (
              <text x={cx} y={yTop - 4} textAnchor="middle" fontSize={8} fontWeight={700} fill={cat.colorDark}>
                {v >= 10 ? Math.round(v) : v} {n.unit}
              </text>
            )}

            {/* 柱内 emoji：只显示能放下的数量 */}
            {v > 0 && visibleGoals.length > 0 && (
              <g>
                {visibleGoals.map((goalEmoji, gi) => {
                  const eY = yTop + h - eRowH * (gi + 1) + eSize / 2;
                  return (
                    <text key={gi} x={cx} y={eY} textAnchor="middle" dominantBaseline="middle" fontSize={eSize}>
                      {goalEmoji}
                    </text>
                  );
                })}
              </g>
            )}

            {/* X轴标签 */}
            <text x={cx} y={PAD_T + chartH + 13} textAnchor="middle" fontSize={9} fontWeight={700} fill="#374151">
              {isZh ? n.nameZh : isEs ? n.nameEs : n.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------------- 页面 ---------------- */

export default function ScienceInsights() {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const isEs = i18n.language === 'es';

  const [child, setChild] = useState<Child | null>(null);
  const [ageIdx, setAgeIdx] = useState(3);

  const genderKey: 'male' | 'female' | 'neutral' =
    child?.gender === 'boy'  ? 'male'   :
    child?.gender === 'girl' ? 'female' : 'neutral';

  useEffect(() => {
    getChildren()
      .then(cs => {
        const c = cs[0] ?? null;
        setChild(c);
        if (c) setAgeIdx(stageIdxForChild(c.stageKey, c.age, c.ageMonths));
      })
      .catch(() => setChild(null));
  }, []);

  const childIdx = child ? stageIdxForChild(child.stageKey, child.age, child.ageMonths) : null;

  const tiers = useMemo(() => {
    const out: Record<Tier, DevGoal[]> = { core: [], important: [], supporting: [] };
    DEV_GOALS.forEach(g => {
      const tierData = g.tiersByAge[ageIdx];
      const tier: Tier =
        genderKey === 'male'   ? tierData.male   :
        genderKey === 'female' ? tierData.female :
        higherTier(tierData.male, tierData.female);
      out[tier].push(g);
    });
    return out;
  }, [ageIdx, genderKey]);

  const group = AGE_GROUPS[ageIdx];
  const gridCols = { gridTemplateColumns: '0.7fr 0.7fr 1fr 1.2fr 1.2fr 1.6fr' };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#d8ccf5] via-[#e8ccec] to-[#ccd8f5]">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-4">

        {/* ① 发育目标 */}
        <section className="backdrop-blur-xl brightness-[1.08] rounded-[18px] border border-white/75 shadow-[0_8px_32px_rgba(120,80,200,0.12),0_2px_8px_rgba(120,80,200,0.06),inset_0_1.5px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(200,180,255,0.15),inset_1px_0_0_rgba(255,255,255,0.6),inset_-1px_0_0_rgba(255,255,255,0.6)] p-6 animate-fade-in-up relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.70)' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/18 to-transparent pointer-events-none" />
          <div className="relative">

            {/* 标题行 */}
            <div className="flex items-center gap-2.5 mb-3 flex-wrap">
              <h2 className="text-lg font-bold text-[#2d2a4a]">
                🎯 {isZh ? '各年龄段发育目标' : isEs ? 'Objetivos de Desarrollo por Etapa' : 'Development Goals by Age Stage'}
              </h2>
              <span className="text-[10px] font-semibold text-gray-400">
                {isZh ? '基于 CDC / IOM DRI' : isEs ? 'Basado en CDC / IOM DRI' : 'Based on CDC / IOM DRI'}
              </span>
              <span className="ml-auto text-[11px] font-bold text-[#893ce3] bg-[rgba(137,60,227,0.12)] px-2.5 py-0.5 rounded-full">
                {isZh ? group.badgeZh : isEs ? group.badgeEs : group.badge}
              </span>
              {/* 性别标识 */}
              {child?.gender && child.gender !== 'other' && (
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{
                    background: child.gender === 'girl' ? 'rgba(236,72,153,0.12)' : 'rgba(59,130,246,0.12)',
                    color: child.gender === 'girl' ? '#be185d' : '#1d4ed8',
                  }}
                >
                  {child.gender === 'girl' ? '♀ ' : '♂ '}
                  {isZh
                    ? (child.gender === 'girl' ? '女孩数据' : '男孩数据')
                    : isEs
                    ? (child.gender === 'girl' ? 'Datos femeninos' : 'Datos masculinos')
                    : (child.gender === 'girl' ? 'Female data' : 'Male data')}
                </span>
              )}
            </div>

            {/* 性别未填提示 */}
            {(!child?.gender || child.gender === 'other') && (
              <p className="text-[11px] text-gray-400 font-semibold mb-3 px-1">
                {isZh
                  ? '💡 填写孩子性别后，可查看性别专属的发育优先级和营养建议'
                  : isEs
                  ? '💡 Completa el género para ver recomendaciones personalizadas'
                  : "💡 Add your child's gender for gender-specific development priorities"}
              </p>
            )}

            {/* 年龄段刻度条 */}
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500 mb-2.5">
              {isZh ? '成长阶段' : isEs ? 'Etapa de Crecimiento' : 'Growth Stage'}
              <span className="ml-2 normal-case font-semibold text-gray-400 tracking-normal">
                · {isZh ? '点击阶段切换' : isEs ? 'Toca una etapa para explorar' : 'Tap a stage to explore'}
              </span>
            </p>
            <div className="grid gap-1 items-end mb-1.5" style={gridCols}>
              {AGE_GROUPS.map((g, i) => (
                <button key={g.key} onClick={() => setAgeIdx(i)}
                  className={`text-center transition-all ${i === ageIdx ? 'opacity-100 scale-110' : 'opacity-45 hover:opacity-80'}`}>
                  <span className="text-2xl">{g.icon}</span>
                </button>
              ))}
            </div>
            <div className="grid gap-1 mb-1.5" style={gridCols}>
              {AGE_GROUPS.map((g, i) => (
                <button key={g.key} onClick={() => setAgeIdx(i)}
                  className={`h-2 rounded ${i === ageIdx ? 'bg-gradient-to-r from-purple-600 to-fuchsia-500 shadow-[0_2px_6px_rgba(137,60,227,0.35)]' : 'bg-[#c4b5d4] opacity-35'}`} />
              ))}
            </div>
            <div className="grid gap-1 mb-4" style={gridCols}>
              {AGE_GROUPS.map((g, i) => (
                <button key={g.key} onClick={() => setAgeIdx(i)} className={`text-center ${i === ageIdx ? '' : 'opacity-60'}`}>
                  <p className={`text-[10px] font-extrabold ${i === ageIdx ? 'text-purple-600' : 'text-gray-500'}`}>{g.label}</p>
                  <p className={`text-[10px] font-bold ${i === ageIdx ? 'text-fuchsia-600' : 'text-gray-500'}`}>
                    {isZh ? g.nameZh : isEs ? g.nameEs : g.name}
                  </p>
                  {childIdx === i && child && (
                    <p className="text-[9px] font-extrabold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                      {child.avatarEmoji ?? '🧒'} {child.name}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* 三层目标网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
              {(['core', 'important', 'supporting'] as Tier[]).map(tier => {
                const tc = TIER_CONFIG[tier];
                const goals = tiers[tier];
                return (
                  <div key={tier}>
                    <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide pb-1.5 mb-2 border-b-2"
                      style={{ color: tc.color, borderColor: `${tc.color}33` }}>
                      <span className="w-[7px] h-[7px] rounded-full inline-block flex-shrink-0" style={{ background: tc.color }} />
                      {isZh ? `${tc.labelZh}发育` : isEs ? `${tc.labelEs} Desarrollo` : `${tc.label} Development`}
                    </p>
                    <div className="flex flex-col gap-2">
                      {goals.length === 0 && <p className="text-[11px] text-gray-300 text-center py-2">—</p>}
                      {goals.map(g => {
                        const isBrain = g.id === 'brain';
                        const cardBg     = isBrain ? 'rgba(219,70,166,0.07)' : tc.bg;
                        const cardBorder = isBrain ? '#db46a655' : `${tc.color}55`;
                        const cardTextColor = isBrain ? '#7a1850' : tc.textColor;
                        const tagColor  = isBrain ? '#db46a6' : tc.color;
                        const tagBorder = isBrain ? '#db46a644' : `${tc.color}44`;

                        // 性别感知营养素
                        const nutrByAge   = g.nutrientsByAge[ageIdx];
                        const nutrZhByAge = g.nutrientsZhByAge[ageIdx];
                        const nutrients =
                          genderKey === 'male'   ? (isZh ? nutrZhByAge.male   : nutrByAge.male)   :
                          genderKey === 'female' ? (isZh ? nutrZhByAge.female : nutrByAge.female) :
                          (isZh
                            ? mergeNeutral(nutrZhByAge.male, nutrZhByAge.female)
                            : mergeNeutral(nutrByAge.male,   nutrByAge.female));

                        return (
                          <div key={g.id} className="rounded-xl px-3 py-2.5 border-[1.5px]" style={{ background: cardBg, borderColor: cardBorder }}>
                            <p className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-[20px]">{g.emoji}</span>
                              <span className="text-[13px] font-bold" style={{ color: cardTextColor }}>
                                {isZh ? g.nameZh : isEs ? g.nameEs : g.name}
                              </span>
                            </p>
                            <p className="flex flex-wrap gap-1">
                              {nutrients.map(n => (
                                <span key={n} className="text-[10px] font-bold rounded-full px-2 py-0.5 bg-white/70 border"
                                  style={{ color: tagColor, borderColor: tagBorder }}>
                                  {n}
                                </span>
                              ))}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ② 每日营养指南 */}
        <section className="backdrop-blur-xl brightness-[1.08] rounded-[18px] border border-white/75 shadow-[0_8px_32px_rgba(120,80,200,0.12),0_2px_8px_rgba(120,80,200,0.06),inset_0_1.5px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(200,180,255,0.15),inset_1px_0_0_rgba(255,255,255,0.6),inset_-1px_0_0_rgba(255,255,255,0.6)] p-6 animate-fade-in-up delay-100 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.70)' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/18 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-1">
              <h2 className="text-lg font-bold text-[#2d2a4a]">
                🥗 {isZh ? '每日营养指南' : isEs ? 'Guía Nutricional Diaria' : 'Daily Nutrition Guide'}
              </h2>
              <span className="ml-auto text-[11px] font-bold text-[#893ce3] bg-[rgba(137,60,227,0.12)] px-2.5 py-0.5 rounded-full">
                {isZh ? `${group.badgeZh} · DRI` : isEs ? `${group.badgeEs} · DRI` : `${group.badge} · DRI`}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-gray-400 mb-3">
              {isZh
                ? '按年龄推荐的每日摄入量 · 与上方成长阶段联动'
                : isEs
                ? 'Ingesta diaria recomendada por edad · sincronizada con la etapa de crecimiento anterior'
                : 'Recommended daily intake by age · synced with Growth Stage above'}
            </p>

            <DriChart ageIdx={ageIdx} isZh={isZh} isEs={isEs} />

            <div className="flex gap-4 mt-2 flex-wrap">
              {DRI_CATEGORIES.map(c => (
                <span key={c.label} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700">
                  <span className="w-3 h-3 rounded inline-block" style={{ background: c.color }} />
                  {isZh ? c.labelZh : isEs ? c.labelEs : c.label}
                </span>
              ))}
            </div>

            <p className="mt-3 text-[10px] text-gray-400 leading-relaxed">
              {isZh
                ? '数据来源：Dietary Reference Intakes (DRI)，美国医学研究所（IOM）· 图示为各年龄段每日推荐量'
                : isEs
                ? 'Fuente: Dietary Reference Intakes (DRI), Instituto de Medicina · Los valores mostrados son cantidades diarias recomendadas por grupo de edad'
                : 'Source: Dietary Reference Intakes (DRI), Institute of Medicine · Values shown are recommended daily amounts per age group'}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}