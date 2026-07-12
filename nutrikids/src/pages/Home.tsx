import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const navigate = useNavigate();

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden px-6 pt-10 pb-20 bg-gradient-to-br from-[#d8ccf5] via-[#e8ccec] to-[#f5cce0]">
      <div className="absolute w-[420px] h-[420px] rounded-full bg-[rgba(137,60,227,0.18)] blur-[80px] -top-20 -left-25 pointer-events-none" />
      <div className="absolute w-[360px] h-[360px] rounded-full bg-[rgba(236,72,153,0.15)] blur-[80px] -bottom-15 -right-20 pointer-events-none" />
      <div className="absolute w-[280px] h-[280px] rounded-full bg-[rgba(6,182,212,0.12)] blur-[80px] top-[40%] left-[60%] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-xl mx-auto">
        <div className="flex flex-col items-center gap-0 mb-4">
        <img src="/images/logoall.png" alt="" className="h-40 w-auto" />
          <h1 className="text-[38px] sm:text-[42px] font-bold text-[#1a1040] leading-[1.25] tracking-tight mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {i18n.language === 'es' ? <>Nutrición inteligente para<br />tu niño en crecimiento.</> : isZh ? <>聪明的营养选择，<br />伴随孩子成长。</> : <>Smart nutrition for<br />your growing child.</>}
          </h1>
          <p className="text-[17px] font-semibold text-gray-500 leading-[1.6] mb-10" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {i18n.language === 'es' ? 'Entiende lo que realmente hay en su comida — y por qué importa.' : isZh ? '看懂食物里真正的成分——以及它为什么重要。' : "Understand what's really in their food — and why it matters."}
          </p>
        </div>

        <button
          onClick={() => navigate('/onboarding')}
          className="flex items-center gap-2.5 px-10 py-4 rounded-full bg-gradient-to-r from-[#893ce3] to-[#ec4899] text-white text-lg font-bold shadow-[0_8px_28px_rgba(137,60,227,0.30)] hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(137,60,227,0.38)] transition-all mb-4"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <span className="text-[22px]">✨</span>
          {t('nav.getStarted')}
        </button>

        <button
          onClick={() => navigate('/food-analyzer')}
          className="text-[13px] font-bold text-[#a78bfa] hover:text-[#893ce3] underline underline-offset-[3px] transition"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          {i18n.language === 'es' ? 'Ya tengo un perfil → ir a la app' : isZh ? '我已有档案 → 直接进入应用' : 'I already have a profile → go to app'}
        </button>
      </div>

      <div className="absolute bottom-8 z-10 flex items-center gap-2.5 text-xs font-bold text-gray-400" style={{ fontFamily: 'Nunito, sans-serif' }}>
        <span>🏥 {i18n.language === 'es' ? 'Datos CDC y OMS' : isZh ? 'CDC 与 WHO 数据' : 'CDC & WHO data'}</span>
        <span className="text-gray-300">·</span>
        <span>🔬 {i18n.language === 'es' ? 'Normas nutricionales IOM' : isZh ? 'IOM 营养标准' : 'IOM nutrition standards'}</span>
        <span className="text-gray-300">·</span>
        <span>🧒 {i18n.language === 'es' ? 'Creado para padres' : isZh ? '为家长而生' : 'Built for parents'}</span>
      </div>
    </div>
  );
}
