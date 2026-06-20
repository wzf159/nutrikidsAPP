import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { createChild, getChildren, updateChild, getAllergens, type Child, type Allergen } from '../services/api';
import {
  AGE_GROUPS, bmiCategory, bmiOf, bmiPercentile, ordinal, type AgeGroup,
} from '../data/growth';

type Gender = 'boy' | 'girl' | 'other';

const GENDER_OPTIONS: { key: Gender; icon: string; en: string; zh: string; es: string }[] = [
  { key: 'boy',   icon: '👦', en: 'Boy',  zh: '男孩',  es: 'Niño' },
  { key: 'girl',  icon: '👧', en: 'Girl', zh: '女孩',  es: 'Niña' },
  { key: 'other', icon: '🧒', en: 'Prefer not to say', zh: '暂不填写', es: 'Prefiero no decir' },
];

const inputCls =
  'w-full px-3.5 py-3 rounded-xl border-[1.5px] border-[rgba(124,58,237,0.2)] bg-[#fafafa] text-[#1a1a3a] text-[15px] ' +
  'outline-none focus:border-[#893ce3] focus:ring-[3px] focus:ring-[rgba(137,60,227,0.1)] transition font-[Nunito,sans-serif]';

function UnitToggle({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex bg-black/5 rounded-lg p-0.5 gap-0.5">
      {options.map(o => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`text-[11px] font-bold rounded-md px-2.5 py-0.5 transition whitespace-nowrap font-[Nunito,sans-serif] ${
            value === o ? 'bg-white text-[#5b21b6] shadow-[0_1px_4px_rgba(0,0,0,0.10)]' : 'text-gray-500'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export default function Onboarding() {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const isEs = i18n.language === 'es';
  const navigate = useNavigate();

  const [existing, setExisting] = useState<Child | null>(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [group, setGroup] = useState<AgeGroup | null>(null);
  const [exactAge, setExactAge] = useState('');
  const [hUnit, setHUnit] = useState<'cm' | 'ft / in'>('cm');
  const [wUnit, setWUnit] = useState<'kg' | 'lb'>('kg');
  const [hCm, setHCm] = useState('');
  const [hFt, setHFt] = useState('');
  const [hIn, setHIn] = useState('');
  const [wKg, setWKg] = useState('');
  const [wLb, setWLb] = useState('');

  // 过敏原
  const [allergenOptions, setAllergenOptions] = useState<Allergen[]>([]);
  const [allergenIds, setAllergenIds] = useState<number[]>([]);

  // 关闭确认
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  useEffect(() => {
    getAllergens().then(setAllergenOptions).catch(() => {});
  }, []);

  useEffect(() => {
    getChildren().then(cs => {
      const c = cs[0];
      if (!c) return;
      setExisting(c);
      setName(c.name);
      if (c.gender) setGender(c.gender);
      const g = AGE_GROUPS.find(a => a.key === c.stageKey);
      if (g) {
        setGroup(g);
        setExactAge(String(g.unit === 'm' ? c.ageMonths ?? '' : c.age ?? ''));
      }
      if (c.heightCm) setHCm(String(c.heightCm));
      if (c.weightKg) setWKg(String(c.weightKg));
      if (c.allergens) setAllergenIds(c.allergens.map(a => a.allergenId));
    }).catch(() => {});
  }, []);

  const heightCm = useMemo(() => {
    if (hUnit === 'cm') return parseFloat(hCm) || 0;
    return (parseFloat(hFt) || 0) * 30.48 + (parseFloat(hIn) || 0) * 2.54;
  }, [hUnit, hCm, hFt, hIn]);

  const weightKg = useMemo(() => {
    if (wUnit === 'kg') return parseFloat(wKg) || 0;
    return (parseFloat(wLb) || 0) / 2.2046;
  }, [wUnit, wKg, wLb]);

  const bmi = heightCm > 0 && weightKg > 0 ? bmiOf(heightCm, weightKg) : null;
  const bmiPct = bmi != null && group ? bmiPercentile(bmi, group.key, gender) : null;
  const bmiCat = bmiPct != null ? bmiCategory(bmiPct) : null;

  const exactAgeNum = parseInt(exactAge, 10);
  const exactAgeValid = group != null && !Number.isNaN(exactAgeNum) && exactAgeNum >= group.min && exactAgeNum <= group.max;

  const switchHeightUnit = (u: string) => {
    if (u === hUnit) return;
    if (u === 'ft / in') {
      const cm = parseFloat(hCm);
      if (cm > 0) {
        const totalIn = cm / 2.54;
        setHFt(String(Math.floor(totalIn / 12)));
        setHIn(String(Math.round(totalIn % 12)));
      }
    } else {
      const cm = (parseFloat(hFt) || 0) * 30.48 + (parseFloat(hIn) || 0) * 2.54;
      if (cm > 0) setHCm(String(Math.round(cm)));
    }
    setHUnit(u as 'cm' | 'ft / in');
  };

  const switchWeightUnit = (u: string) => {
    if (u === wUnit) return;
    if (u === 'lb') {
      const kg = parseFloat(wKg);
      if (kg > 0) setWLb(String(Math.round(kg * 2.2046)));
    } else {
      const lb = parseFloat(wLb);
      if (lb > 0) setWKg((lb / 2.2046).toFixed(1));
    }
    setWUnit(u as 'kg' | 'lb');
  };

  function toggleAllergen(id: number) {
    setAllergenIds(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  }

  function handleCloseClick() {
    const hasData = name.trim() || gender || group || hCm || hFt || wKg || wLb || allergenIds.length > 0;
    if (!hasData) {
      navigate(-1);
    } else {
      setShowCloseConfirm(true);
    }
  }

  function confirmClose() {
    navigate(-1);
  }

  async function finish() {
    if (!group || heightCm <= 0 || weightKg <= 0) return;
    setSaving(true);
    setError(null);
    const input = {
      name: name.trim(),
      gender: gender ?? undefined,
      stageKey: group.key,
      age: group.unit === 'm' ? 0 : exactAgeNum,
      ageMonths: group.unit === 'm' ? exactAgeNum : undefined,
      heightCm: Math.round(heightCm * 10) / 10,
      weightKg: Math.round(weightKg * 10) / 10,
      allergenIds,
      avatarEmoji: gender === 'girl' ? '👧' : gender === 'boy' ? '👦' : '🧒',
    };
    try {
      if (existing) await updateChild(existing.id, input);
      else await createChild(input);
      window.dispatchEvent(new Event('nutrikids:child-updated'));
      navigate('/food-analyzer');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const stepMeta = [
    { emoji: '👶', title: isZh ? '我们在为谁记录？' : isEs ? '¿A quién seguimos?' : 'Who are we tracking?', desc: isZh ? '给孩子起一个档案昵称。' : isEs ? 'Dale un apodo a tu hijo para su perfil.' : 'Give your child a nickname for their profile.' },
    { emoji: '🎂', title: isZh ? '孩子多大了？' : isEs ? '¿Cuántos años tiene?' : 'How old are they?', desc: isZh ? '先选年龄段，再填写精确年龄。' : isEs ? 'Selecciona un grupo de edad, luego ingresa la edad exacta.' : 'Select an age group, then enter the exact age.' },
    { emoji: '📏', title: isZh ? '身体数据' : isEs ? 'Medidas corporales' : 'Body measurements', desc: isZh ? '用于个性化的成长百分位追踪。' : isEs ? 'Utilizado para el seguimiento personalizado de percentiles de crecimiento.' : 'Used to personalise growth percentile tracking.' },
    { emoji: '🚫', title: isZh ? '有过敏需要注意吗？' : isEs ? '¿Alguna alergia?' : 'Any allergies to watch?', desc: isZh ? '选择孩子已知的过敏原（可跳过）。' : isEs ? 'Selecciona alérgenos conocidos (opcional).' : 'Select known allergens (optional).' },
  ][step - 1];

  const genderLabel = isZh ? '性别' : isEs ? 'Género' : 'Gender';
  const nicknameLabel = isZh ? '昵称' : isEs ? 'Apodo' : 'Nickname';
  const nicknamePlaceholder = isZh ? '例如：诺诺、小宝…' : isEs ? 'ej. Alex, Lily, Sam…' : 'e.g. Alex, Lily, Sam…';
  const exactAgeLabel = isZh ? '精确年龄' : isEs ? 'Edad exacta' : 'Exact age';
  const enterInLabel = isZh ? '按' : isEs ? 'Ingresa en' : 'Enter in';
  const monthLabel = isZh ? '月' : isEs ? 'meses' : 'months';
  const yearLabel = isZh ? '岁' : isEs ? 'años' : 'years';
  const betweenLabel = isZh ? '之间的数值' : isEs ? 'entre' : 'between';
  const heightLabel = isZh ? '身高' : isEs ? 'Altura' : 'Height';
  const weightLabel = isZh ? '体重' : isEs ? 'Peso' : 'Weight';
  const backLabel = isZh ? '上一步' : isEs ? 'Atrás' : 'Back';
  const continueLabel = isZh ? '继续 →' : isEs ? 'Continuar →' : 'Continue →';
  const savingLabel = isZh ? '保存中…' : isEs ? 'Guardando…' : 'Saving…';
  const goLabel = isZh ? '🎉 出发！' : isEs ? '🎉 ¡Vamos!' : "🎉 Let's go!";
  const goodLabel = isZh ? '✓ 好的！' : isEs ? '✓ ¡Genial!' : '✓ Got it!';
  const enterValueLabel = isZh ? `⚠️ 请输入` : isEs ? `⚠️ Ingresa` : `⚠️ Please enter`;
  const stepLabel = isZh ? `第 ${step} / 4 步` : isEs ? `Paso ${step} / 4` : `Step ${step} / 4`;

  const closeConfirmTitle = isZh ? '确定要退出吗？' : isEs ? '¿Salir sin guardar?' : 'Exit without saving?';
  const closeConfirmDesc = isZh ? '已填写的信息将不会被保存。' : isEs ? 'La información ingresada no se guardará.' : 'Your entered information will not be saved.';
  const closeConfirmYes = isZh ? '确定退出' : isEs ? 'Sí, salir' : 'Yes, exit';
  const closeConfirmNo = isZh ? '继续填写' : isEs ? 'Seguir' : 'Keep editing';

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10 bg-gradient-to-br from-[#d8ccf5] via-[#e8ccec] to-[#ccd8f5]">
      <div className="relative w-full max-w-md bg-white/96 rounded-[24px] shadow-[0_24px_64px_rgba(80,40,160,0.18),0_4px_16px_rgba(0,0,0,0.08)] p-9 animate-[ob-pop_0.22s_cubic-bezier(0.34,1.56,0.64,1)]">

        {/* 关闭按钮 */}
        <button
          type="button"
          onClick={handleCloseClick}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-black/5 transition text-lg font-bold"
        >
          ✕
        </button>

        {/* 关闭确认弹层 */}
        {showCloseConfirm && (
          <div className="absolute inset-0 z-10 rounded-[24px] bg-white/98 flex flex-col items-center justify-center px-8 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-bold text-[#1a1040] mb-1.5" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {closeConfirmTitle}
            </h3>
            <p className="text-sm text-gray-500 font-semibold mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {closeConfirmDesc}
            </p>
            <div className="flex gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-black/5 text-gray-600 text-sm font-bold hover:bg-black/9 transition"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                {closeConfirmNo}
              </button>
              <button
                type="button"
                onClick={confirmClose}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold hover:opacity-90 transition"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {closeConfirmYes}
              </button>
            </div>
          </div>
        )}

        <div className="relative flex items-center justify-center gap-3 mb-7">
          <span className="absolute left-0 text-xs font-extrabold text-[#a78bfa] whitespace-nowrap font-[Nunito,sans-serif]">
            {stepLabel}
          </span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map(i => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === step ? 'w-11 bg-gradient-to-r from-[#893ce3] to-[#ec4899]' : 'w-7 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="text-center text-[44px] mb-3">{stepMeta.emoji}</div>
        <h2 className="text-center text-[22px] font-bold text-[#1a1040] mb-1.5" style={{ fontFamily: 'Poppins, sans-serif' }}>{stepMeta.title}</h2>
        <p className="text-center text-sm font-semibold text-gray-500 mb-6 leading-relaxed" style={{ fontFamily: 'Nunito, sans-serif' }}>{stepMeta.desc}</p>

        {step === 1 && (
          <>
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block text-xs font-extrabold text-[#5b21b6] tracking-wide uppercase mb-1.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {nicknameLabel}
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={20}
                  placeholder={nicknamePlaceholder}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-[#5b21b6] tracking-wide uppercase mb-1.5" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {genderLabel}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {GENDER_OPTIONS.map(g => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setGender(g.key)}
                      className={`flex-1 px-1.5 py-2.5 rounded-xl border-[1.5px] text-[13px] font-bold transition whitespace-nowrap font-[Nunito,sans-serif] ${
                        gender === g.key
                          ? 'border-[#893ce3] bg-[rgba(137,60,227,0.08)] text-[#5b21b6]'
                          : 'border-[rgba(124,58,237,0.18)] bg-white/80 text-gray-600 hover:border-[#893ce3]'
                      }`}
                    >
                      {g.icon} {isZh ? g.zh : isEs ? g.es : g.en}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={!name.trim() || !gender}
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#893ce3] to-[#ec4899] text-white font-bold disabled:opacity-40 hover:opacity-90 transition hover:-translate-y-0.5"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {continueLabel}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {AGE_GROUPS.map(g => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => { setGroup(g); setExactAge(''); }}
                  className={`flex flex-col items-center gap-1.5 px-2 py-3.5 rounded-2xl border-[1.5px] text-2xl transition ${
                    group?.key === g.key
                      ? 'border-[#893ce3] bg-[rgba(137,60,227,0.08)] -translate-y-0.5 shadow-[0_4px_12px_rgba(137,60,227,0.15)]'
                      : 'border-[rgba(124,58,237,0.15)] bg-white/80 hover:border-[#893ce3] hover:-translate-y-0.5'
                  }`}
                >
                  {g.icon}
                  <span className={`text-xs font-bold ${group?.key === g.key ? 'text-[#5b21b6]' : 'text-gray-500'}`} style={{ fontFamily: 'Nunito, sans-serif' }}>{g.label}</span>
                </button>
              ))}
            </div>

            {group && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold text-[#5b21b6] tracking-wide uppercase" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {exactAgeLabel}
                  </label>
                  <span className="text-xs font-bold text-[#a78bfa]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {enterInLabel}{group.unit === 'm' ? monthLabel : yearLabel}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={exactAge}
                    min={group.min}
                    max={group.max}
                    onChange={e => setExactAge(e.target.value)}
                    placeholder={`e.g. ${group.min}`}
                    className={`${inputCls} pr-11`}
                  />
                  <span className="absolute right-3.5 text-[13px] font-bold text-gray-400 pointer-events-none" style={{ fontFamily: 'Nunito, sans-serif' }}>{group.unit}</span>
                </div>
                <p className={`text-[11px] mt-1.5 font-semibold ${exactAge === '' ? 'text-gray-400' : exactAgeValid ? 'text-green-600' : 'text-orange-500'}`} style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {exactAge === ''
                    ? `${group.min}–${group.max} ${group.unit === 'm' ? monthLabel : yearLabel}`
                    : exactAgeValid
                      ? goodLabel
                      : `${enterValueLabel} ${group.min}–${group.max} ${betweenLabel}`}
                </p>
              </div>
            )}

            <div className="flex gap-2.5">
              <button type="button" onClick={() => setStep(1)} className="px-5 py-3.5 rounded-xl bg-black/5 text-gray-500 text-sm font-bold hover:bg-black/9 transition" style={{ fontFamily: 'Nunito, sans-serif' }}>
                ← {backLabel}
              </button>
              <button
                type="button"
                disabled={!exactAgeValid}
                onClick={() => setStep(3)}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#893ce3] to-[#ec4899] text-white font-bold disabled:opacity-40 hover:opacity-90 transition hover:-translate-y-0.5"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {continueLabel}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex flex-col gap-4 mb-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold text-[#5b21b6] tracking-wide uppercase" style={{ fontFamily: 'Nunito, sans-serif' }}>{heightLabel}</label>
                  <UnitToggle options={['cm', 'ft / in']} value={hUnit} onChange={switchHeightUnit} />
                </div>
                {hUnit === 'cm' ? (
                  <div className="relative flex items-center">
                    <input type="number" value={hCm} onChange={e => setHCm(e.target.value)} placeholder="e.g. 120" min={40} max={220} className={`${inputCls} pr-11`} />
                    <span className="absolute right-3.5 text-[13px] font-bold text-gray-400 pointer-events-none" style={{ fontFamily: 'Nunito, sans-serif' }}>cm</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex items-center flex-1">
                      <input type="number" value={hFt} onChange={e => setHFt(e.target.value)} placeholder="4" min={1} max={7} className={`${inputCls} pr-9`} />
                      <span className="absolute right-3.5 text-[13px] font-bold text-gray-400 pointer-events-none" style={{ fontFamily: 'Nunito, sans-serif' }}>ft</span>
                    </div>
                    <div className="relative flex items-center flex-1">
                      <input type="number" value={hIn} onChange={e => setHIn(e.target.value)} placeholder="0" min={0} max={11} className={`${inputCls} pr-9`} />
                      <span className="absolute right-3.5 text-[13px] font-bold text-gray-400 pointer-events-none" style={{ fontFamily: 'Nunito, sans-serif' }}>in</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold text-[#5b21b6] tracking-wide uppercase" style={{ fontFamily: 'Nunito, sans-serif' }}>{weightLabel}</label>
                  <UnitToggle options={['kg', 'lb']} value={wUnit} onChange={switchWeightUnit} />
                </div>
                {wUnit === 'kg' ? (
                  <div className="relative flex items-center">
                    <input type="number" value={wKg} onChange={e => setWKg(e.target.value)} placeholder="e.g. 28" min={2} max={150} className={`${inputCls} pr-11`} />
                    <span className="absolute right-3.5 text-[13px] font-bold text-gray-400 pointer-events-none" style={{ fontFamily: 'Nunito, sans-serif' }}>kg</span>
                  </div>
                ) : (
                  <div className="relative flex items-center">
                    <input type="number" value={wLb} onChange={e => setWLb(e.target.value)} placeholder="e.g. 62" min={4} max={330} className={`${inputCls} pr-11`} />
                    <span className="absolute right-3.5 text-[13px] font-bold text-gray-400 pointer-events-none" style={{ fontFamily: 'Nunito, sans-serif' }}>lb</span>
                  </div>
                )}
              </div>
            </div>

            {bmi != null && (
              <div className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-[rgba(137,60,227,0.2)] bg-gradient-to-r from-[rgba(137,60,227,0.08)] to-[rgba(236,72,153,0.06)] px-4 py-3 mb-5 min-h-[52px]">
                <span className="text-[13px] font-bold text-[#5b21b6]" style={{ fontFamily: 'Poppins, sans-serif' }}>BMI</span>
                <span className="text-2xl font-extrabold text-[#893ce3]" style={{ fontFamily: 'Poppins, sans-serif'  }}>{bmi}</span>
                {bmiPct != null && bmiCat ? (
                  <span className="ml-auto text-right">
                    <span className="block text-sm font-extrabold text-[#893ce3]">
                      {isZh ? `第 ${bmiPct} 百分位` : isEs ? `Percentil ${bmiPct}` : `${ordinal(bmiPct)} percentile`}
                    </span>
                    <span className="block text-xs font-bold" style={{ color: bmiCat.color, fontFamily: 'Nunito, sans-serif' }}>
                      {isZh ? bmiCat.labelZh : isEs ? bmiCat.labelEs : bmiCat.label}
                    </span>
                  </span>
                ) : null}
              </div>
            )}

            <div className="flex gap-2.5">
              <button type="button" onClick={() => setStep(2)} className="px-5 py-3.5 rounded-xl bg-black/5 text-gray-500 text-sm font-bold hover:bg-black/9 transition" style={{ fontFamily: 'Nunito, sans-serif' }}>
                ← {backLabel}
              </button>
              <button
                type="button"
                disabled={heightCm <= 0 || weightKg <= 0}
                onClick={() => setStep(4)}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#893ce3] to-[#ec4899] text-white font-bold disabled:opacity-40 hover:opacity-90 transition hover:-translate-y-0.5"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {continueLabel}
              </button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {allergenOptions.map(a => {
                const active = allergenIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAllergen(a.id)}
                    className={`flex flex-col items-center gap-1 px-2 py-3 rounded-2xl border-[1.5px] text-2xl transition ${
                      active
                        ? 'border-[#ec4899] bg-[rgba(236,72,153,0.08)] -translate-y-0.5 shadow-[0_4px_12px_rgba(236,72,153,0.15)]'
                        : 'border-[rgba(124,58,237,0.15)] bg-white/80 hover:border-[#893ce3] hover:-translate-y-0.5'
                    }`}
                  >
                    {a.icon}
                    <span className={`text-[11px] font-bold ${active ? 'text-[#be185d]' : 'text-gray-500'}`} style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {isZh ? (a.nameZh ?? a.name) : a.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {error && <p className="text-sm text-red-600 font-semibold mb-3">⚠️ {error}</p>}

            <div className="flex gap-2.5">
              <button type="button" onClick={() => setStep(3)} className="px-5 py-3.5 rounded-xl bg-black/5 text-gray-500 text-sm font-bold hover:bg-black/9 transition" style={{ fontFamily: 'Nunito, sans-serif' }}>
                ← {backLabel}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={finish}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#893ce3] to-[#ec4899] text-white font-bold disabled:opacity-40 hover:opacity-90 transition hover:-translate-y-0.5"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {saving ? savingLabel : goLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
