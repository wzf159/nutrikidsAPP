import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

type TabId =
  | 'about-nutrikids'
  | 'mission'
  | 'how-it-works'
  | 'team'
  | 'sources'
  | 'ai-disclaimer'
  | 'medical-disclaimer'
  | 'privacy-policy'
  | 'terms-of-use'
  | 'get-in-touch';

const TABS: { id: TabId; label: string }[] = [
  { id: 'about-nutrikids',    label: 'About NutriKids' },
  { id: 'mission',            label: 'Mission' },
  { id: 'how-it-works',       label: 'How It Works' },
  { id: 'team',               label: 'Team' },
  { id: 'sources',            label: 'Scientific Sources' },
  { id: 'ai-disclaimer',      label: 'AI Disclaimer' },
  { id: 'medical-disclaimer', label: 'Medical Disclaimer' },
  { id: 'privacy-policy',     label: 'Privacy Policy' },
  { id: 'terms-of-use',       label: 'Terms of Use' },
  { id: 'get-in-touch',       label: 'Get in Touch' },
];

const gradientText: React.CSSProperties = {
  fontFamily: "'Fredoka One', cursive",
  fontSize: '24px',
  background: 'linear-gradient(135deg, #893ce3 0%, #c026d3 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  margin: 0,
};

const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '20px',
  padding: '28px 32px',
  boxShadow: '0 2px 16px rgba(137,60,227,0.07)',
};

const sectionGap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '22px',
};

const subheading: React.CSSProperties = {
  color: '#7c3aed',
  fontSize: '16px',
  marginBottom: '8px',
  fontFamily: "'Nunito', sans-serif", 
};

const bodyText: React.CSSProperties = {
  color: '#555',
  lineHeight: 1.8,
  margin: 0,
  fontFamily: "'Nunito', sans-serif", 
};

const pillBox = (bg: string, border: string): React.CSSProperties => ({
  background: bg,
  borderLeft: `4px solid ${border}`,
  borderRadius: '8px',
  padding: '14px 18px',
  fontFamily: "'Nunito', sans-serif", 
});

const highlightBox: React.CSSProperties = {
  background: '#f5f3ff',
  borderRadius: '12px',
  padding: '16px 20px',
};

function PanelAbout() {
  return (
    <div style={cardStyle}>
      <h2 style={{ ...gradientText, marginBottom: '16px' }}>About NutriKids</h2>
      {[
        'NutriKids is an evidence-informed nutrition education platform designed to help families understand how food choices may support their children\'s unique growth and developmental needs.',
        'By combining nutrition science, publicly available food and nutrition data, and artificial intelligence technology, NutriKids translates complex food information into practical, child-centered insights that are easier for families to understand and apply.',
        'Unlike general food analysis tools, NutriKids is being developed to help parents evaluate foods in the context of a child\'s age, growth stage, and nutritional needs.',
      ].map((t, i) => (
        <p key={i} style={{ ...bodyText, marginBottom: '14px' }}>{t}</p>
      ))}
      <p style={{ ...bodyText, marginBottom: '14px' }}>
        Our first release focuses on the <strong>Food Analyzer</strong>, which helps families better understand packaged foods and how their nutritional characteristics may support different aspects of child development. Future releases will introduce Daily Nutrition Tracking and Personalized Nutrition Plans to provide a more comprehensive and individualized nutrition experience.
      </p>
      <p style={bodyText}>Our long-term vision is to create a trusted nutrition companion that helps families make informed decisions and build healthier habits throughout childhood.</p>
    </div>
  );
}

function PanelMission() {
  return (
    <div style={cardStyle}>
      <h2 style={{ ...gradientText, marginBottom: '16px' }}>Mission</h2>
      <p style={{ ...bodyText, marginBottom: '14px' }}>At NutriKids, we believe that every child deserves access to nutrition guidance that reflects their unique developmental needs.</p>
      <p style={{ ...bodyText, marginBottom: '14px' }}>Our mission is to <strong>empower parents and caregivers</strong> with accessible, trustworthy, and science-informed nutrition insights that support healthier food choices and lifelong wellbeing.</p>
      <p style={bodyText}>By making nutrition information easier to understand and apply, we aim to help families build healthy habits and make confident decisions about the foods their children consume.</p>
    </div>
  );
}

function PanelHowItWorks() {
  const badge = (label: string, color: string, bg: string) => (
    <span style={{ background: bg, color, fontSize: '12px', padding: '2px 10px', borderRadius: '999px', marginLeft: '8px' }}>
      {label}
    </span>
  );
  return (
    <div style={cardStyle}>
      <h2 style={{ ...gradientText, marginBottom: '20px' }}>How It Works</h2>
      <div style={{ marginBottom: '22px' }}>
        <h3 style={{ color: '#7c3aed', fontSize: '17px', marginBottom: '8px', fontFamily: "'Nunito', sans-serif" }}>
          🔍 Food Analyzer {badge('Available Now', '#7c3aed', '#e9d5ff')}
        </h3>
        <p style={bodyText}>The Food Analyzer evaluates packaged foods based on ingredients, nutrient content, and food characteristics. Rather than simply displaying nutrition facts, NutriKids helps parents understand how nutrients and ingredients may contribute to different aspects of child growth and development while highlighting nutritional strengths and potential areas of concern.</p>
      </div>
      <div style={{ marginBottom: '22px' }}>
        <h3 style={{ color: '#7c3aed', fontSize: '17px', marginBottom: '8px',fontFamily: "'Nunito', sans-serif" }}>
          📊 Daily Nutrition Tracking {badge('Coming Soon', '#92400e', '#fde68a')}
        </h3>
        <p style={bodyText}>Daily Nutrition Tracking will help families evaluate a child's overall nutrient intake throughout the day and better understand dietary patterns over time.</p>
      </div>
      <div style={{ marginBottom: '22px' }}>
        <h3 style={{ color: '#7c3aed', fontSize: '17px', marginBottom: '8px',fontFamily: "'Nunito', sans-serif",  }}>
          🧬 Personalized Nutrition Plans {badge('Coming Soon', '#92400e', '#fde68a')}
        </h3>
        <p style={bodyText}>Personalized Nutrition Plans will provide tailored nutrition guidance based on factors such as age, growth stage, dietary habits, and individual nutritional needs.</p>
      </div>
      <div style={{ background: '#f5f3ff', borderRadius: '14px', padding: '16px 20px',fontFamily: "'Nunito', sans-serif",  }}>
        <h3 style={{ color: '#7c3aed', fontSize: '16px', marginBottom: '8px' }}>💡 Our Approach</h3>
        <p style={bodyText}>NutriKids is designed to <strong>support—not replace</strong>—parental judgment and professional healthcare guidance. Our goal is to make nutrition information easier to understand so families can make informed decisions with greater confidence.</p>
      </div>
    </div>
  );
}

function PanelTeam() {
  const members = [
    { emoji: '👩‍💼', name: 'Houpu Li',    role: 'Founder & CEO, Research Lead' },
    { emoji: '📋',   name: 'Yanyao Cui',  role: 'Product Manager & Researcher' },
    { emoji: '💻',   name: 'Shiyun Wen',  role: 'Data Engineer & Developer' },
    { emoji: '💻',   name: 'Zefan Wang',  role: 'Data Engineer & Developer' },
    { emoji: '🔬',   name: 'Zhiyan Chen', role: 'Project Coordinator & Researcher' },
  ];
  return (
    <div style={cardStyle}>
      <h2 style={{ ...gradientText, marginBottom: '8px' }}>Team</h2>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>
        NutriKids is developed by a multidisciplinary team with backgrounds in research, product design, data science, and software development. The project is led by <strong>SENSE Institute</strong>, a nonprofit organization dedicated to advancing community wellbeing through research, education, and innovation.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '16px' }}>
        {members.map((m) => (
          <div key={m.name} style={{ background: '#f5f3ff', borderRadius: '14px', padding: '18px 20px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{m.emoji}</div>
            <div style={{ fontWeight: 700, color: '#3b0764', fontSize: '15px' }}>{m.name}</div>
            <div style={{ color: '#7c3aed', fontSize: '13px', marginTop: '4px' }}>{m.role}</div>
          </div>
        ))}
      </div>
      <p style={{ color: '#888', fontSize: '13px', marginTop: '20px' }}>We welcome collaboration with healthcare professionals, nutrition experts, educators, researchers, technologists, and community partners who share our mission.</p>
    </div>
  );
}

function PanelSources() {
  const sources = [
    { emoji: '🏛️', label: 'United States Department of Agriculture (USDA)' },
    { emoji: '🏥', label: 'Centers for Disease Control and Prevention (CDC)' },
    { emoji: '🔬', label: 'National Institutes of Health (NIH)' },
    { emoji: '👶', label: 'American Academy of Pediatrics (AAP)' },
    { emoji: '🌍', label: 'World Health Organization (WHO)' },
    { emoji: '📚', label: 'Peer-reviewed scientific literature and publicly available nutrition databases' },
  ];
  return (
    <div style={cardStyle}>
      <h2 style={{ ...gradientText, marginBottom: '16px' }}>Scientific Sources</h2>
      <p style={{ ...bodyText, marginBottom: '20px' }}>NutriKids is informed by publicly available scientific evidence, nutrition research, and guidance from recognized health and nutrition organizations, including:</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sources.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#f5f3ff', borderRadius: '12px', padding: '14px 18px' }}>
            <span style={{ fontSize: '24px' }}>{s.emoji}</span>
            <span style={{ color: '#3b0764', fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>
      <p style={{ color: '#888', fontSize: '13px', marginTop: '18px' }}>We regularly review available resources and update our educational content to reflect current evidence and best practices whenever possible.</p>
    </div>
  );
}

function PanelAIDisclaimer() {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '32px' }}>🤖</span>
        <h2 style={gradientText}>AI Disclaimer</h2>
      </div>
      <p style={{ ...bodyText, marginBottom: '14px' }}>NutriKids uses artificial intelligence (AI) technology to help analyze food and nutrition information and generate educational insights.</p>
      <div style={{ ...pillBox('#fef3c7', '#f59e0b'), marginBottom: '14px' }}>
        <p style={{ color: '#78350f', lineHeight: 1.8, margin: 0 }}>While we strive to provide accurate and useful information, <strong>AI-generated content may occasionally contain inaccuracies, omissions, or interpretations</strong> that do not fully reflect an individual's unique circumstances.</p>
      </div>
      <p style={bodyText}>Information provided by NutriKids is intended for <strong>educational purposes only</strong> and should not be considered medical, nutritional, or professional advice.</p>
    </div>
  );
}

function PanelMedicalDisclaimer() {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '32px' }}>⚕️</span>
        <h2 style={gradientText}>Medical Disclaimer</h2>
      </div>
      <p style={{ ...bodyText, marginBottom: '14px' }}>NutriKids is an <strong>educational platform</strong> and does not provide medical advice, diagnosis, treatment, or healthcare services.</p>
      <div style={{ ...pillBox('#fee2e2', '#ef4444'), marginBottom: '14px' }}>
        <p style={{ color: '#7f1d1d', lineHeight: 1.8, margin: 0 }}>Information provided through NutriKids is intended for <strong>educational and informational purposes only</strong> and should not replace professional medical or nutritional guidance.</p>
      </div>
      <p style={bodyText}>Parents and caregivers should consult <strong>qualified healthcare professionals</strong> regarding questions about a child's health, nutrition, growth, or development.</p>
    </div>
  );
}

function PanelPrivacyPolicy() {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
        <span style={{ fontSize: '32px' }}>🔒</span>
        <h2 style={gradientText}>Privacy Policy</h2>
      </div>
      <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '24px' }}>Last Updated: July 2026</p>
      <div style={sectionGap}>
        <div>
          <h3 style={subheading}>Overview</h3>
          <p style={bodyText}>NutriKids is committed to protecting your privacy and handling your information responsibly. This Privacy Policy explains what information we collect, how we use it, and the choices available to you when using NutriKids.</p>
        </div>
        <div>
          <h3 style={subheading}>Information We May Collect</h3>
          <p style={{ ...bodyText, marginBottom: '10px' }}>Depending on how you use NutriKids, we may collect:</p>
          <ul style={{ color: '#555', lineHeight: 1.9, paddingLeft: '20px', margin: 0 }}>
            <li>Information you voluntarily provide, such as age group preferences, nutrition-related inputs, or feedback submissions</li>
            <li>Food and nutrition information submitted for analysis</li>
            <li>Usage and technical information, including browser type, device information, and website analytics</li>
            <li>Contact information provided through support requests or donations</li>
          </ul>
        </div>
        <div>
          <h3 style={subheading}>How We Use Information</h3>
          <p style={{ ...bodyText, marginBottom: '10px' }}>We may use collected information to:</p>
          <ul style={{ color: '#555', lineHeight: 1.9, paddingLeft: '20px', margin: 0 }}>
            <li>Provide and improve NutriKids services</li>
            <li>Generate nutrition analyses and educational insights</li>
            <li>Understand how users interact with the platform</li>
            <li>Improve functionality, accuracy, and user experience</li>
            <li>Respond to inquiries and support requests</li>
            <li>Support research, evaluation, and product development</li>
          </ul>
        </div>
        <div style={highlightBox}>
          <h3 style={subheading}>Data Sharing</h3>
          <p style={bodyText}><strong>NutriKids does not sell personal information.</strong> We may share information with trusted service providers that help operate the platform, such as hosting, analytics, payment processing, or AI service providers, when necessary to deliver services.</p>
        </div>
        <div>
          <h3 style={subheading}>Children's Privacy</h3>
          <p style={bodyText}>NutriKids is designed to support families and caregivers. Parents and caregivers should provide information on behalf of children. We do not knowingly collect personal information directly from children without appropriate parental involvement.</p>
        </div>
        <div>
          <h3 style={subheading}>Data Security</h3>
          <p style={bodyText}>We take reasonable measures to protect information from unauthorized access, loss, misuse, or disclosure. However, no online service can guarantee absolute security.</p>
        </div>
        <div>
          <h3 style={subheading}>Updates to This Policy</h3>
          <p style={bodyText}>We may update this Privacy Policy periodically. Updated versions will be posted on this page with a revised effective date.</p>
        </div>
        <div style={highlightBox}>
          <h3 style={subheading}>Contact Us</h3>
          <p style={bodyText}>If you have questions regarding this Privacy Policy, please contact us through the contact information provided on the website.</p>
        </div>
      </div>
    </div>
  );
}

function PanelTermsOfUse() {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
        <span style={{ fontSize: '32px' }}>📜</span>
        <h2 style={gradientText}>Terms of Use</h2>
      </div>
      <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '24px' }}>Last Updated: July 2026</p>
      <div style={sectionGap}>
        <div style={pillBox('#fef3c7', '#f59e0b')}>
          <h3 style={{ color: '#92400e', fontSize: '15px', marginBottom: '6px' }}>Acceptance of Terms</h3>
          <p style={{ color: '#78350f', lineHeight: 1.8, margin: 0 }}>By accessing or using NutriKids, you agree to these Terms of Use. If you do not agree with these terms, please discontinue use of the platform.</p>
        </div>
        <div>
          <h3 style={subheading}>Educational Purpose</h3>
          <p style={bodyText}>NutriKids is an educational platform designed to help families better understand food, nutrition, and healthy development. The platform is intended for <strong>informational and educational purposes only</strong>.</p>
        </div>
        <div style={pillBox('#fee2e2', '#ef4444')}>
          <h3 style={{ color: '#991b1b', fontSize: '15px', marginBottom: '6px' }}>No Medical Advice</h3>
          <p style={{ color: '#7f1d1d', lineHeight: 1.8, margin: 0 }}>NutriKids does not provide medical advice, diagnosis, treatment, or healthcare services. Information provided through the platform should not be considered a substitute for professional medical, nutritional, or healthcare guidance.</p>
        </div>
        <div>
          <h3 style={subheading}>User Responsibility</h3>
          <p style={bodyText}>Users are responsible for evaluating information provided by NutriKids and determining its suitability for their individual circumstances. Parents and caregivers should consult qualified healthcare professionals regarding questions about a child's health, nutrition, growth, or development.</p>
        </div>
        <div>
          <h3 style={subheading}>Accuracy of Information</h3>
          <p style={bodyText}>We strive to provide accurate and evidence-informed information. However, NutriKids does not guarantee the accuracy, completeness, reliability, or suitability of any content, analysis, or recommendation. Information may change as scientific knowledge evolves.</p>
        </div>
        <div style={highlightBox}>
          <h3 style={subheading}>Intellectual Property</h3>
          <p style={bodyText}>Unless otherwise stated, content, design, logos, text, and materials available through NutriKids are the property of NutriKids, SENSE Institute, or their respective owners and may not be reproduced without permission.</p>
        </div>
        <div>
          <h3 style={subheading}>Limitation of Liability</h3>
          <p style={bodyText}>To the fullest extent permitted by law, NutriKids, SENSE Institute, and project contributors shall not be liable for any direct, indirect, incidental, consequential, or special damages arising from the use of, or inability to use, the platform.</p>
        </div>
        <div>
          <h3 style={subheading}>Modifications</h3>
          <p style={bodyText}>We may modify, suspend, or discontinue any portion of NutriKids at any time without prior notice.</p>
        </div>
        <div>
          <h3 style={subheading}>Updates to These Terms</h3>
          <p style={bodyText}>We may update these Terms of Use periodically. Continued use of NutriKids after changes are posted constitutes acceptance of the revised terms.</p>
        </div>
        <div style={highlightBox}>
          <h3 style={subheading}>Contact Us</h3>
          <p style={bodyText}>If you have questions regarding these Terms of Use, please contact us through the contact information provided on the website.</p>
        </div>
      </div>
    </div>
  );
}

function PanelGetInTouch() {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <span style={{ fontSize: '32px' }}>✉️</span>
        <h2 style={gradientText}>Get in Touch</h2>
      </div>
      <div style={{ background: '#f5f3ff', borderRadius: '14px', padding: '24px 28px', textAlign: 'center' }}>
        <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: 1.8, marginBottom: '16px' }}>Questions, feedback, or collaboration opportunities?</p>
        <a
          href="mailto:info@sense-institute.org"
          style={{
            display: 'inline-block',
            fontFamily: "'Nunito', sans-serif",
            fontSize: '16px',
            fontWeight: 800,
            color: '#893ce3',
            textDecoration: 'none',
            background: 'rgba(137,60,227,0.08)',
            padding: '10px 24px',
            borderRadius: '999px',
            border: '1.5px solid rgba(137,60,227,0.2)',
          }}
        >
          info@sense-institute.org
        </a>
      </div>
    </div>
  );
}

const PANELS: Record<TabId, React.ReactNode> = {
  'about-nutrikids':    <PanelAbout />,
  'mission':            <PanelMission />,
  'how-it-works':       <PanelHowItWorks />,
  'team':               <PanelTeam />,
  'sources':            <PanelSources />,
  'ai-disclaimer':      <PanelAIDisclaimer />,
  'medical-disclaimer': <PanelMedicalDisclaimer />,
  'privacy-policy':     <PanelPrivacyPolicy />,
  'terms-of-use':       <PanelTermsOfUse />,
  'get-in-touch':       <PanelGetInTouch />,
};

export default function About() {
  const location = useLocation();
  const { i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>(
    (location.state as any)?.tab ?? 'about-nutrikids'
  );

  useEffect(() => {
    const tab = (location.state as any)?.tab;
    if (tab) setActiveTab(tab as TabId);
  }, [location.state]);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#d8ccf5] via-[#e8ccec] to-[#ccd8f5]">
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px 60px' }}>

        {/* Tab bar — 5-column grid matching original */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px',
            marginBottom: '28px',
          }}
        >
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '13px',
                  fontWeight: 700,
                  padding: '8px 12px',
                  borderRadius: '999px',
                  border: isActive ? 'none' : '1.5px solid rgba(137,60,227,0.22)',
                  background: isActive
                    ? 'linear-gradient(135deg, #893ce3 0%, #b06ae4 100%)'
                    : 'rgba(255,255,255,0.65)',
                  color: isActive ? '#fff' : '#893ce3',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(137,60,227,0.25)' : 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content panel */}
        {PANELS[activeTab]}
      </div>
    </div>
  );
}