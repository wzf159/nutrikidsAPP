import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const CONTACT_EMAIL = 'info@sense-institute.org';
const WEBSITE_URL = 'https://sense-institute.org';

export default function Footer() {
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';
  const isEs = i18n.language === 'es';
  const navigate = useNavigate();

  const rightsLabel = isZh
    ? `© ${new Date().getFullYear()} NutriKids. 保留所有权利。`
    : isEs
    ? `© ${new Date().getFullYear()} NutriKids. Todos los derechos reservados.`
    : `© ${new Date().getFullYear()} NutriKids. All rights reserved.`;

  const desc1 = isZh
    ? (<>NutriKids 由 <strong style={{ color: '#7c3aed' }}>SENSE Institute</strong> 开发，这是一家致力于通过研究、教育和创新改善儿童健康的非营利组织。</>)
    : isEs
    ? (<>NutriKids es desarrollado por <strong style={{ color: '#7c3aed' }}>SENSE Institute</strong>, una organización sin fines de lucro dedicada a mejorar el bienestar infantil a través de la investigación, la educación y la innovación.</>)
    : (<>NutriKids is developed by <strong style={{ color: '#7c3aed' }}>SENSE Institute</strong>, a nonprofit organization dedicated to improving children's wellbeing through research, education, and innovation.</>);

  const desc2 = isZh
    ? 'NutriKids 是一个教育平台，不提供医疗建议、诊断或治疗。'
    : isEs
    ? 'NutriKids es una plataforma educativa y no brinda asesoramiento médico, diagnóstico ni tratamiento.'
    : 'NutriKids is an educational platform and does not provide medical advice, diagnosis, or treatment.';

  const links = isZh
    ? [
        { label: '支持我们', to: '/support' },
        { label: '联系我们', to: '/about', tab: 'get-in-touch' },
        { label: '隐私政策', to: '/about', tab: 'privacy-policy' },
        { label: '使用条款', to: '/about', tab: 'terms-of-use' },
      ]
    : isEs
    ? [
        { label: 'Apóyanos', to: '/support' },
        { label: 'Contáctanos', to: '/about', tab: 'get-in-touch' },
        { label: 'Privacidad', to: '/about', tab: 'privacy-policy' },
        { label: 'Términos', to: '/about', tab: 'terms-of-use' },
      ]
    : [
        { label: 'Support Our Work', to: '/support' },
        { label: 'Contact Us', to: '/about', tab: 'get-in-touch' },
        { label: 'Privacy Policy', to: '/about', tab: 'privacy-policy' },
        { label: 'Terms of Use', to: '/about', tab: 'terms-of-use' },
      ];

  return (
    <footer
      style={{
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(137,60,227,0.12)',
        padding: '28px 24px 20px',
        textAlign: 'center',
        marginTop: 'auto',
      }}
    >
      {/* Description */}
      <p style={{ color: '#666', fontSize: '13px', lineHeight: 1.7, maxWidth: '680px', margin: '0 auto 8px' }}>
        {desc1}
      </p>
      <p style={{ color: '#999', fontSize: '12px', lineHeight: 1.6, maxWidth: '620px', margin: '0 auto 16px' }}>
        {desc2}
      </p>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '6px 4px', marginBottom: '14px', fontSize: '13px' }}>
        {links.map((link, i) => (
          <span key={link.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {i > 0 && <span style={{ color: '#ccc', margin: '0 4px' }}>•</span>}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate(link.to, link.tab ? { state: { tab: link.tab } } : undefined);
              }}
              style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none', fontFamily: 'Nunito, sans-serif' }}
            >
              {link.label}
            </a>
          </span>
        ))}
      </div>

      {/* Email + website icon row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '12px' }}>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7c3aed', fontSize: '13px', fontWeight: 600, textDecoration: 'none', fontFamily: 'Nunito, sans-serif' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-10 5L2 7" />
          </svg>
          {CONTACT_EMAIL}
        </a>
        <a
          href={WEBSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Website"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(137,60,227,0.1)', color: '#7c3aed' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </a>
      </div>

      {/* Copyright */}
      <p style={{ color: '#bbb', fontSize: '12px', margin: 0, fontFamily: 'Nunito, sans-serif' }}>
        {rightsLabel}
      </p>
    </footer>
  );
}

