import { useTranslation } from 'react-i18next';

type LangCode = 'zh' | 'en' | 'es';

const LANGUAGES: { code: LangCode; label: string }[] = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as LangCode;

  const changeLang = (code: LangCode) => {
    i18n.changeLanguage(code);
    localStorage.setItem('nutrikids-lang', code);
  };

  return (
    <div className="flex items-center bg-white/70 border-[1.5px] border-[rgba(137,60,227,0.18)] rounded-full p-[3px] gap-[2px] [backdrop-filter:blur(8px)] [-webkit-backdrop-filter:blur(8px)]">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => changeLang(code)}
          className={`font-[Nunito,sans-serif] text-[13px] font-bold border-none rounded-full px-[13px] py-[5px] cursor-pointer transition-all whitespace-nowrap ${
            currentLang === code
              ? 'bg-gradient-to-r from-[#893ce3] to-[#ec4899] text-white shadow-[0_2px_8px_rgba(137,60,227,0.25)]'
              : 'bg-transparent text-[#5a5a7a] hover:bg-[rgba(137,60,227,0.07)] hover:text-[#893ce3]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
