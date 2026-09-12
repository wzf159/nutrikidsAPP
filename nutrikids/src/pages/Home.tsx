import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getChildren } from '../services/api';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [showNoProfile, setShowNoProfile] = useState(false);

  // 「已有档案？直接开始使用」：
  // 检测到已有档案直接进入功能页；没有档案则弹窗提示先去填写注册信息
  const handleStartToUse = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const children = await getChildren();
      if (children.length > 0) navigate('/label-profiler');
      else setShowNoProfile(true);
    } catch {
      setShowNoProfile(true);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden px-6 pt-10 pb-20 bg-gradient-to-br from-[#d8ccf5] via-[#e8ccec] to-[#f5cce0]">
      <div className="absolute w-[420px] h-[420px] rounded-full bg-[rgba(137,60,227,0.18)] blur-[80px] -top-20 -left-25 pointer-events-none" />
      <div className="absolute w-[360px] h-[360px] rounded-full bg-[rgba(236,72,153,0.15)] blur-[80px] -bottom-15 -right-20 pointer-events-none" />
      <div className="absolute w-[280px] h-[280px] rounded-full bg-[rgba(6,182,212,0.12)] blur-[80px] top-[40%] left-[60%] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-xl mx-auto">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5 min-w-0">
          <img src="/images/logo-half-highresolution.png" alt="" className="h-14 sm:h-24 w-auto shrink-0" />
          <span
            style={{
              fontFamily: "'Fredoka One', cursive",
              fontWeight: 800,
              background: 'linear-gradient(135deg, #893ce3 0%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.1,
            }}
            className="text-2xl sm:text-[40px] leading-tight whitespace-nowrap"
          >
            Growtrition
          </span>
        </div>

        <p
          className="text-[17px] sm:text-[21px] font-extrabold text-[#2d2a4a] leading-snug max-w-lg"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          {t('home.tagline')}
        </p>
        <p
          className="mt-2 mb-7 text-[13px] sm:text-[15px] font-semibold text-[#6b7280] leading-relaxed max-w-md"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          {t('home.subtitle')}
        </p>

        <button
          onClick={() => navigate('/onboarding')}
          className="flex items-center gap-2.5 px-10 py-4 rounded-full bg-gradient-to-r from-[#893ce3] to-[#ec4899] text-white text-lg font-bold shadow-[0_8px_28px_rgba(137,60,227,0.30)] hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(137,60,227,0.38)] transition-all"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <span className="text-[22px]">✨</span>
          {t('nav.getStarted')}
        </button>

        <div className="mt-3 flex flex-col items-center gap-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
          <span className="text-[12px] sm:text-[13px] font-bold text-[#7c6aa8]">{t('home.setupNote')}</span>
          <span className="text-[12px] sm:text-[13px] font-semibold text-[#9a8fbb]">{t('home.noAccountNote')}</span>
        </div>

        <button
          onClick={handleStartToUse}
          disabled={checking}
          className="mt-7 text-[13px] font-bold text-[#a78bfa] hover:text-[#893ce3] underline underline-offset-[3px] transition disabled:opacity-60"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          {checking ? t('home.checkingProfile') : t('home.haveProfile')}
        </button>
      </div>

      {showNoProfile && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 px-6"
          onClick={() => setShowNoProfile(false)}
        >
          <div
            className="w-full max-w-[340px] bg-white rounded-[22px] shadow-[0_20px_60px_rgba(80,40,160,0.25)] px-6 pt-7 pb-4 flex flex-col items-center text-center"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-[34px] leading-none mb-3">🧒</span>
            <h2
              className="text-[19px] font-extrabold text-[#2d2a4a] mb-2"
              style={{ fontFamily: "'Fredoka One', cursive" }}
            >
              {t('home.noProfileTitle')}
            </h2>
            <p
              className="text-[13px] font-semibold text-gray-500 leading-relaxed mb-5"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {t('home.noProfileBody')}
            </p>
            <button
              onClick={() => { setShowNoProfile(false); navigate('/onboarding'); }}
              className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-[#893ce3] to-[#ec4899] text-white font-bold shadow-[0_8px_24px_rgba(137,60,227,0.28)] hover:-translate-y-0.5 transition-all"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              ✨ {t('home.createProfile')}
            </button>
            <button
              onClick={() => setShowNoProfile(false)}
              className="mt-1 py-2 text-[13px] font-semibold text-gray-400 hover:text-gray-600 transition"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {t('home.notNow')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
