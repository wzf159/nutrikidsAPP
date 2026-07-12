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
  const { t } = useTranslation();
  const paragraphs = t('about.panelAbout.paragraphs', { returnObjects: true }) as string[];
  return (
    <div style={cardStyle}>
      <h2 style={{ ...gradientText, marginBottom: '16px' }}>{t('about.panelAbout.title')}</h2>
      {paragraphs.slice(0, 3).map((text, i) => (
        <p key={i} style={{ ...bodyText, marginBottom: '14px' }}>{text}</p>
      ))}
      <p style={{ ...bodyText, marginBottom: '14px' }} dangerouslySetInnerHTML={{ __html: paragraphs[3] }} />
      <p style={bodyText} dangerouslySetInnerHTML={{ __html: paragraphs[4] }} />
    </div>
  );
}

function PanelMission() {
  const { t } = useTranslation();
  const paragraphs = t('about.panelMission.paragraphs', { returnObjects: true }) as string[];
  return (
    <div style={cardStyle}>
      <h2 style={{ ...gradientText, marginBottom: '16px' }}>{t('about.panelMission.title')}</h2>
      {paragraphs.map((text, i) => (
        <p
          key={i}
          style={i < paragraphs.length - 1 ? { ...bodyText, marginBottom: '14px' } : bodyText}
          dangerouslySetInnerHTML={{ __html: text }}
        />
      ))}
    </div>
  );
}

function PanelHowItWorks() {
  const { t } = useTranslation();
  const badge = (label: string, color: string, bg: string) => (
    <span style={{ background: bg, color, fontSize: '12px', padding: '2px 10px', borderRadius: '999px', marginLeft: '8px' }}>
      {label}
    </span>
  );
  return (
    <div style={cardStyle}>
      <h2 style={{ ...gradientText, marginBottom: '20px' }}>{t('about.panelHowItWorks.title')}</h2>
      <div style={{ marginBottom: '22px' }}>
        <h3 style={{ color: '#7c3aed', fontSize: '17px', marginBottom: '8px', fontFamily: "'Nunito', sans-serif" }}>
          🔍 {t('about.panelHowItWorks.foodAnalyzer.title')}{badge(t('about.panelHowItWorks.foodAnalyzer.badge'), '#7c3aed', '#e9d5ff')}
        </h3>
        <p style={bodyText}>{t('about.panelHowItWorks.foodAnalyzer.desc')}</p>
      </div>
      <div style={{ marginBottom: '22px' }}>
        <h3 style={{ color: '#7c3aed', fontSize: '17px', marginBottom: '8px', fontFamily: "'Nunito', sans-serif" }}>
          📊 {t('about.panelHowItWorks.dailyTracking.title')}{badge(t('about.panelHowItWorks.dailyTracking.badge'), '#92400e', '#fde68a')}
        </h3>
        <p style={bodyText}>{t('about.panelHowItWorks.dailyTracking.desc')}</p>
      </div>
      <div style={{ marginBottom: '22px' }}>
        <h3 style={{ color: '#7c3aed', fontSize: '17px', marginBottom: '8px', fontFamily: "'Nunito', sans-serif" }}>
          🧬 {t('about.panelHowItWorks.personalizedPlans.title')}{badge(t('about.panelHowItWorks.personalizedPlans.badge'), '#92400e', '#fde68a')}
        </h3>
        <p style={bodyText}>{t('about.panelHowItWorks.personalizedPlans.desc')}</p>
      </div>
      <div style={{ background: '#f5f3ff', borderRadius: '14px', padding: '16px 20px', fontFamily: "'Nunito', sans-serif" }}>
        <h3 style={{ color: '#7c3aed', fontSize: '16px', marginBottom: '8px' }}>💡 {t('about.panelHowItWorks.approach.title')}</h3>
        <p style={bodyText} dangerouslySetInnerHTML={{ __html: t('about.panelHowItWorks.approach.desc') }} />
      </div>
    </div>
  );
}

function PanelTeam() {
  const { t } = useTranslation();
  const members = t('about.panelTeam.members', { returnObjects: true }) as { emoji: string; name: string; role: string }[];
  return (
    <div style={cardStyle}>
      <h2 style={{ ...gradientText, marginBottom: '8px' }}>{t('about.panelTeam.title')}</h2>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }} dangerouslySetInnerHTML={{ __html: t('about.panelTeam.desc') }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '16px' }}>
        {members.map((m) => (
          <div key={m.name} style={{ background: '#f5f3ff', borderRadius: '14px', padding: '18px 20px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{m.emoji}</div>
            <div style={{ fontWeight: 700, color: '#3b0764', fontSize: '15px' }}>{m.name}</div>
            <div style={{ color: '#7c3aed', fontSize: '13px', marginTop: '4px' }}>{m.role}</div>
          </div>
        ))}
      </div>
      <p style={{ color: '#888', fontSize: '13px', marginTop: '20px' }}>{t('about.panelTeam.footer')}</p>
    </div>
  );
}

function PanelSources() {
  const { t } = useTranslation();
  const items = t('about.panelSources.items', { returnObjects: true }) as { emoji: string; label: string }[];
  const scoreDims = t('about.panelSources.scoreCalc.dims', { returnObjects: true }) as { label: string; weight: string; desc: string }[]; 
  return (
    <div style={cardStyle}>
      <h2 style={{ ...gradientText, marginBottom: '16px' }}>{t('about.panelSources.title')}</h2>
      <p style={{ ...bodyText, marginBottom: '20px' }}>{t('about.panelSources.desc')}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#f5f3ff', borderRadius: '12px', padding: '14px 18px' }}>
            <span style={{ fontSize: '24px' }}>{s.emoji}</span>
            <span style={{ color: '#3b0764', fontWeight: 600 }}>{s.label}</span>
          </div>
        ))}
      </div>
      {/* 综合评分计算逻辑 */}
    <div style={{ marginTop: '24px', background: '#faf5ff', border: '1.5px solid rgba(137,60,227,0.15)', borderRadius: '14px', padding: '20px 22px' }}>
        <h3 style={{ color: '#7c3aed', fontSize: '16px', fontWeight: 800, marginBottom: '6px', fontFamily: "'Nunito', sans-serif" }}>
          📐 {t('about.panelSources.scoreCalc.title')}
        </h3>
        <p style={{ ...bodyText, fontSize: '13px', marginBottom: '16px' }}>
          {t('about.panelSources.scoreCalc.desc')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {scoreDims.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: '#fff', borderRadius: '10px', padding: '10px 14px' }}>
              <span style={{
                flexShrink: 0, minWidth: '46px', textAlign: 'center',
                fontWeight: 800, fontSize: '13px', color: '#893ce3',
                background: 'rgba(137,60,227,0.1)', borderRadius: '999px', padding: '3px 8px',
              }}>
                {d.weight}
              </span>
              <div>
                <p style={{ color: '#3b0764', fontWeight: 700, fontSize: '13.5px', margin: 0 }}>{d.label}</p>
                <p style={{ color: '#777', fontSize: '12.5px', margin: '2px 0 0' }}>{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p style={{ color: '#999', fontSize: '11.5px', marginTop: '14px', lineHeight: 1.7 }}>
          {t('about.panelSources.scoreCalc.note')}
        </p>
      </div>
   
      <p style={{ color: '#888', fontSize: '13px', marginTop: '18px' }}>{t('about.panelSources.footer')}</p>
    </div>
    
  );
}

function PanelAIDisclaimer() {
  const { t } = useTranslation();
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '32px' }}>🤖</span>
        <h2 style={gradientText}>{t('about.panelAIDisclaimer.title')}</h2>
      </div>
      <p style={{ ...bodyText, marginBottom: '14px' }}>{t('about.panelAIDisclaimer.p1')}</p>
      <div style={{ ...pillBox('#fef3c7', '#f59e0b'), marginBottom: '14px' }}>
        <p style={{ color: '#78350f', lineHeight: 1.8, margin: 0 }} dangerouslySetInnerHTML={{ __html: t('about.panelAIDisclaimer.pillText') }} />
      </div>
      <p style={bodyText} dangerouslySetInnerHTML={{ __html: t('about.panelAIDisclaimer.p2') }} />
    </div>
  );
}

function PanelMedicalDisclaimer() {
  const { t } = useTranslation();
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{ fontSize: '32px' }}>⚕️</span>
        <h2 style={gradientText}>{t('about.panelMedicalDisclaimer.title')}</h2>
      </div>
      <p style={{ ...bodyText, marginBottom: '14px' }} dangerouslySetInnerHTML={{ __html: t('about.panelMedicalDisclaimer.p1') }} />
      <div style={{ ...pillBox('#fee2e2', '#ef4444'), marginBottom: '14px' }}>
        <p style={{ color: '#7f1d1d', lineHeight: 1.8, margin: 0 }} dangerouslySetInnerHTML={{ __html: t('about.panelMedicalDisclaimer.pillText') }} />
      </div>
      <p style={bodyText} dangerouslySetInnerHTML={{ __html: t('about.panelMedicalDisclaimer.p2') }} />
    </div>
  );
}

function PanelPrivacyPolicy() {
  const { t } = useTranslation();
  const sections = t('about.panelPrivacyPolicy.sections', { returnObjects: true }) as Array<{
    title: string;
    content: string;
    items?: string[];
    type?: 'highlight';
  }>;
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
        <span style={{ fontSize: '32px' }}>🔒</span>
        <h2 style={gradientText}>{t('about.panelPrivacyPolicy.title')}</h2>
      </div>
      <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '24px' }}>{t('about.panelPrivacyPolicy.lastUpdated')}</p>
      <div style={sectionGap}>
        {sections.map((section, i) => {
          const Wrapper = section.type === 'highlight'
            ? ({ children }: { children: React.ReactNode }) => <div style={highlightBox}>{children}</div>
            : ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
          return (
            <Wrapper key={i}>
              <h3 style={subheading}>{section.title}</h3>
              {section.items ? (
                <>
                  <p style={{ ...bodyText, marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: section.content }} />
                  <ul style={{ color: '#555', lineHeight: 1.9, paddingLeft: '20px', margin: 0 }}>
                    {section.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p style={bodyText} dangerouslySetInnerHTML={{ __html: section.content }} />
              )}
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}

function PanelTermsOfUse() {
  const { t } = useTranslation();
  const sections = t('about.panelTermsOfUse.sections', { returnObjects: true }) as Array<{
    title: string;
    content: string;
    type?: 'warning' | 'alert' | 'highlight';
  }>;
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
        <span style={{ fontSize: '32px' }}>📜</span>
        <h2 style={gradientText}>{t('about.panelTermsOfUse.title')}</h2>
      </div>
      <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '24px' }}>{t('about.panelTermsOfUse.lastUpdated')}</p>
      <div style={sectionGap}>
        {sections.map((section, i) => {
          if (section.type === 'warning') {
            return (
              <div key={i} style={pillBox('#fef3c7', '#f59e0b')}>
                <h3 style={{ color: '#92400e', fontSize: '15px', marginBottom: '6px' }}>{section.title}</h3>
                <p style={{ color: '#78350f', lineHeight: 1.8, margin: 0 }} dangerouslySetInnerHTML={{ __html: section.content }} />
              </div>
            );
          }
          if (section.type === 'alert') {
            return (
              <div key={i} style={pillBox('#fee2e2', '#ef4444')}>
                <h3 style={{ color: '#991b1b', fontSize: '15px', marginBottom: '6px' }}>{section.title}</h3>
                <p style={{ color: '#7f1d1d', lineHeight: 1.8, margin: 0 }} dangerouslySetInnerHTML={{ __html: section.content }} />
              </div>
            );
          }
          if (section.type === 'highlight') {
            return (
              <div key={i} style={highlightBox}>
                <h3 style={subheading}>{section.title}</h3>
                <p style={bodyText} dangerouslySetInnerHTML={{ __html: section.content }} />
              </div>
            );
          }
          return (
            <div key={i}>
              <h3 style={subheading}>{section.title}</h3>
              <p style={bodyText} dangerouslySetInnerHTML={{ __html: section.content }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PanelGetInTouch() {
  const { t } = useTranslation();
  const email = t('about.panelGetInTouch.email');
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <span style={{ fontSize: '32px' }}>✉️</span>
        <h2 style={gradientText}>{t('about.panelGetInTouch.title')}</h2>
      </div>
      <div style={{ background: '#f5f3ff', borderRadius: '14px', padding: '24px 28px', textAlign: 'center' }}>
        <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: 1.8, marginBottom: '16px' }}>{t('about.panelGetInTouch.text')}</p>
        <a
          href={`mailto:${email}`}
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
          {email}
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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>(
    (location.state as any)?.tab ?? 'about-nutrikids'
  );

  useEffect(() => {
    const tab = (location.state as any)?.tab;
    if (tab) setActiveTab(tab as TabId);
  }, [location.state]);

  const TABS: { id: TabId; label: string }[] = [
    { id: 'about-nutrikids',    label: t('about.tabs.aboutNutrikids') },
    { id: 'mission',            label: t('about.tabs.mission') },
    { id: 'how-it-works',       label: t('about.tabs.howItWorks') },
    { id: 'team',               label: t('about.tabs.team') },
    { id: 'sources',            label: t('about.tabs.sources') },
    { id: 'ai-disclaimer',      label: t('about.tabs.aiDisclaimer') },
    { id: 'medical-disclaimer', label: t('about.tabs.medicalDisclaimer') },
    { id: 'privacy-policy',     label: t('about.tabs.privacyPolicy') },
    { id: 'terms-of-use',       label: t('about.tabs.termsOfUse') },
    { id: 'get-in-touch',       label: t('about.tabs.getInTouch') },
  ];

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
