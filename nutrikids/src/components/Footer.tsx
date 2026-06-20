import { useTranslation } from 'react-i18next';

const CONTACT_EMAIL = 'info@sense-institute.org';
const WEBSITE_URL = 'https://sense-institute.org';

export default function Footer() {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const isEs = i18n.language === 'es';

  const rightsLabel = isZh
    ? `© ${new Date().getFullYear()} NutriKids. 保留所有权利。`
    : isEs
    ? `© ${new Date().getFullYear()} NutriKids. Todos los derechos reservados.`
    : `© ${new Date().getFullYear()} NutriKids. All rights reserved.`;

  return (
    <footer className="bg-gradient-to-br from-[#5b21b6] via-[#893ce3] to-[#ec4899] mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-5">
          {/* 邮箱 */}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="flex items-center gap-2 text-white/90 hover:text-white text-sm font-semibold transition"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-10 5L2 7" />
            </svg>
            {CONTACT_EMAIL}
          </a>

          {/* 官网链接图标 */}
          <a
            href={WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Website"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </a>
        </div>

        <p className="text-white/70 text-xs font-semibold" style={{ fontFamily: 'Nunito, sans-serif' }}>
          {rightsLabel}
        </p>
      </div>
    </footer>
  );
}
