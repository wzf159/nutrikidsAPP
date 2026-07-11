import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const isEs = i18n.language === 'es';
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8787/api/auth/sign-in/social', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google', callbackURL: 'http://localhost:5173/' }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#d8ccf5] via-[#e8ccec] to-[#f5cce0]">
      <div className="bg-white rounded-3xl shadow-xl p-10 flex flex-col items-center gap-6 w-full max-w-sm">
        <div className="text-5xl">🥦</div>
        <h1 className="text-2xl font-extrabold text-[#2d2a4a]">NutriKids</h1>
        <p className="text-sm text-gray-500 text-center">
          {isZh ? '追踪孩子的营养，科学喂养每一天' : isEs ? 'Rastrea la nutrición de tu hijo, alimentación inteligente cada día' : 'Track your childs nutrition, smart feeding every day'}
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-full border border-gray-200 hover:bg-gray-50 transition font-semibold text-gray-700 disabled:opacity-50"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          )}
          {isZh ? '使用 Google 账号登录' : isEs ? 'Iniciar sesión con Google' : 'Sign in with Google'}
        </button>

        <div className="flex gap-4 text-xs text-gray-400">
          <button onClick={() => i18n.changeLanguage('zh')} className={isZh ? 'text-[#893ce3] font-bold' : ''}>中文</button>
          <button onClick={() => i18n.changeLanguage('en')} className={!isZh && !isEs ? 'text-[#893ce3] font-bold' : ''}>EN</button>
          <button onClick={() => i18n.changeLanguage('es')} className={isEs ? 'text-[#893ce3] font-bold' : ''}>ES</button>
        </div>
      </div>
    </div>
  );
}