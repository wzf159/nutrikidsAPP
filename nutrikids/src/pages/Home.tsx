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
        <div className="flex flex-col items-center gap-0 mb-2">
          <img src="/images/logoall.png" alt="" className="h-60 w-auto" />
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

      
    </div>
  );
}
