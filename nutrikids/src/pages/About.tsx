import { useTranslation } from 'react-i18next';

const SECTIONS = [
  { id: 'about-us', icon: '🏢', en: 'About Us', zh: '关于我们', es: 'Sobre Nosotros' },
  { id: 'privacy-policy', icon: '🔒', en: 'Privacy Policy', zh: '隐私政策', es: 'Política de Privacidad' },
  { id: 'terms-of-service', icon: '📄', en: 'Terms of Service', zh: '服务条款', es: 'Términos de Servicio' },
];

export default function About() {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const isEs = i18n.language === 'es';

  const pageTitle = isZh ? '关于我们' : isEs ? 'Acerca de' : 'About';

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#d8ccf5] via-[#e8ccec] to-[#ccd8f5]">
      <div className="max-w-[680px] mx-auto px-4 py-8">
        <h1
          className="mb-6"
          style={{ fontFamily: 'Poppins, sans-serif', fontSize: '28px', fontWeight: 700, color: '#2d2a4a' }}
        >
          {pageTitle}
        </h1>

        {/* 区块导航 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition bg-white/70 border-[1.5px] border-[rgba(137,60,227,0.18)] text-[#893ce3] hover:bg-white"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {s.icon} {isZh ? s.zh : isEs ? s.es : s.en}
            </a>
          ))}
        </div>

        {/* 关于我们 */}
        <section
          id="about-us"
          className="mb-6 scroll-mt-20"
          style={{
            padding: '28px 32px',
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.6)',
            border: '1.5px solid rgba(137,60,227,0.18)',
          }}
        >
          <h2
            style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px', fontWeight: 700, color: '#2d2a4a', marginBottom: '4px' }}
          >
            SENSE Institute
          </h2>
          <p
            style={{ fontFamily: 'Poppins, sans-serif', fontSize: '13px', fontWeight: 700, color: '#893ce3', marginBottom: '10px', letterSpacing: '0.02em' }}
          >
            Our Mission
          </p>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '14px', color: '#6b7280', lineHeight: '1.7' }}>
            SENSE Institute is a registered nonprofit research organization led by an international network of young scholars, researchers, and practitioners. We advance problem-driven innovation for public impact through evidence-based research, public engagement programs, and open-source technology development.
          </p>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '14px', color: '#6b7280', lineHeight: '1.7', marginTop: '10px' }}>
            Grounded in four interconnected pillars—Justice, Sustainability, Resilience, and Well-being—our mission is to bridge research, technology, and public needs by integrating theoretical insight with data-driven methodologies to address real-world social and environmental challenges.
          </p>
        </section>

        {/* 隐私政策 */}
        <section
          id="privacy-policy"
          className="mb-6 scroll-mt-20"
          style={{
            padding: '28px 32px',
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.6)',
            border: '1.5px solid rgba(137,60,227,0.18)',
          }}
        >
          <h2
            style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px', fontWeight: 700, color: '#2d2a4a', marginBottom: '14px' }}
          >
            🔒 {isZh ? '隐私政策' : isEs ? 'Política de Privacidad' : 'Privacy Policy'}
          </h2>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '14px', color: '#9ca3af', lineHeight: '1.7' }}>
            {isZh
              ? '隐私政策内容待补充。'
              : isEs
              ? 'Contenido de la política de privacidad pendiente.'
              : 'Privacy policy content coming soon.'}
          </p>
        </section>

        {/* 服务条款 */}
        <section
          id="terms-of-service"
          className="scroll-mt-20"
          style={{
            padding: '28px 32px',
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.6)',
            border: '1.5px solid rgba(137,60,227,0.18)',
          }}
        >
          <h2
            style={{ fontFamily: 'Poppins, sans-serif', fontSize: '20px', fontWeight: 700, color: '#2d2a4a', marginBottom: '14px' }}
          >
            📄 {isZh ? '服务条款' : isEs ? 'Términos de Servicio' : 'Terms of Service'}
          </h2>
          <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '14px', color: '#9ca3af', lineHeight: '1.7' }}>
            {isZh
              ? '服务条款内容待补充。'
              : isEs
              ? 'Contenido de términos de servicio pendiente.'
              : 'Terms of service content coming soon.'}
          </p>
        </section>
      </div>
    </div>
  );
}
