import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ff = "'Nunito', sans-serif";
const ctaGradient = 'linear-gradient(135deg, #893ce3 0%, #ec4899 100%)';

type View = 'landing' | 'form' | 'success';

export default function Support() {
  const { t } = useTranslation();

  const areas = [
    t('support.areas.softwareDev'),
    t('support.areas.dataScience'),
    t('support.areas.nutritionResearch'),
    t('support.areas.healthcare'),
    t('support.areas.contentDev'),
    t('support.areas.design'),
    t('support.areas.translation'),
    t('support.areas.community'),
    t('support.areas.fundraising'),
    t('support.areas.volunteer'),
    t('support.areas.other'),
  ];

  const timeOptions = [
    t('support.timeOptions.lt2'),
    t('support.timeOptions.2to5'),
    t('support.timeOptions.5to10'),
    t('support.timeOptions.gt10'),
    t('support.timeOptions.flexible'),
  ];

  const resumeOptions = [
    t('support.resumeOptions.yes'),
    t('support.resumeOptions.no'),
    t('support.resumeOptions.planned'),
  ];

  const [view, setView] = useState<View>('landing');

  // form state
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [skills, setSkills] = useState('');
  const [time, setTime] = useState('');
  const [resume, setResume] = useState('');
  const [motivation, setMotivation] = useState('');
  const [extra, setExtra] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleArea = (val: string) =>
    setSelectedAreas((prev) => prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('https://formspree.io/f/mrewnpqg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name,
          contact,
          areas: selectedAreas.join(', '),
          skills,
          time,
          sentResume: resume,
          motivation,
          extra,
          _subject: `NutriKids 贡献者申请 - ${name}`,
        }),
      });
  
      if (res.ok) {
        setView('success');
      } else {
        const body = [
          `Name: ${name}`,
          `Contact: ${contact}`,
          `Areas of Interest: ${selectedAreas.join(', ')}`,
          `Skills & Experience: ${skills}`,
          `Time Available: ${time}`,
          `Resume Sent: ${resume}`,
          `Motivation: ${motivation}`,
          `Additional Info: ${extra}`,
        ].join('\n\n');
        
        window.location.href = `mailto:info@sense-institute.org?subject=${encodeURIComponent('NutriKids Contributor Application - ' + name)}&body=${encodeURIComponent(body)}`;
        window.location.href = `mailto:info@sense-institute.org?subject=${encodeURIComponent('NutriKids 贡献者申请 - ' + name)}&body=${encodeURIComponent(body)}`;
        setTimeout(() => setView('success'), 500);
      }
    } catch (e) {
      const body = `姓名: ${name}\n\n联系方式: ${contact}`;
      window.location.href = `mailto:info@sense-institute.org?subject=${encodeURIComponent('NutriKids 贡献者申请')}&body=${encodeURIComponent(body)}`;
      setTimeout(() => setView('success'), 500);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid #e5e7eb',
    borderRadius: '10px',
    padding: '11px 14px',
    fontFamily: ff,
    fontSize: '14px',
    color: '#374151',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontFamily: ff,
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    cursor: 'pointer',
  };

  const qLabel = (): React.CSSProperties => ({
    fontFamily: ff,
    fontSize: '14px',
    fontWeight: 800,
    color: '#2d2a4a',
    marginBottom: '8px',
  });

  const hint: React.CSSProperties = {
    fontFamily: ff,
    fontSize: '12px',
    fontWeight: 600,
    color: '#9ca3af',
    marginBottom: '8px',
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '20px',
    padding: '32px 36px',
    boxShadow: '0 2px 16px rgba(137,60,227,0.07)',
  };
  const { i18n } = useTranslation();
  const isZh = i18n.language === 'zh';

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#d8ccf5] via-[#e8ccec] to-[#ccd8f5]">
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '24px 16px 60px' }}>

        {/* ── Landing ── */}
        {view === 'landing' && (
          <div style={cardStyle}>
            <div style={{ marginBottom: '20px' }}>
              <span style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '18px',
                fontWeight: 700,
                background: ctaGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                💛 {t('support.title')}
              </span>
            </div>
            <p style={{ fontFamily: ff, fontSize: '15px', fontWeight: 700, color: '#2d2a4a', lineHeight: 1.7, marginBottom: '8px' }}>
              {t('support.landing.subtitle')}
            </p>
            <p style={{ fontFamily: ff, fontSize: '13px', fontWeight: 600, color: '#6b7280', lineHeight: 1.8, marginBottom: '32px' }}>
              {t('support.landing.description')}
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <a
                href="https://www.zeffy.com/en-US/donation-form/nutrikids"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: ctaGradient,
                  color: '#fff',
                  borderRadius: '999px',
                  padding: '13px 30px',
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: ff,
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(137,60,227,0.25)',
                }}
              >
                💛 {t('support.landing.donate')}
              </a>
              <button
                onClick={() => setView('form')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#fff',
                  color: '#893ce3',
                  border: '2px solid #893ce3',
                  borderRadius: '999px',
                  padding: '13px 30px',
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: ff,
                  cursor: 'pointer',
                }}
              >
                🚀 {t('support.landing.becomeContributor')}
              </button>
            </div>
          </div>
        )}

        {/* ── Contributor Form ── */}
        {view === 'form' && (
          <div style={cardStyle}>
            {/* Header */}
            <button
              onClick={() => setView('landing')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: ff,
                fontSize: '13px',
                fontWeight: 700,
                color: '#893ce3',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                marginBottom: '16px',
              }}
            >
              ← {t('support.form.backBtn')}
            </button>
            <div style={{ marginBottom: '6px' }}>
              <span style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '18px',
                fontWeight: 700,
                background: ctaGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                🚀 {t('support.form.title')}
              </span>
            </div>
            <p style={{ fontFamily: ff, fontSize: '14px', fontWeight: 700, color: '#2d2a4a', marginBottom: '6px', lineHeight: 1.6 }}>
              {t('support.form.subtitle')}
            </p>
            <p style={{ fontFamily: ff, fontSize: '13px', fontWeight: 600, color: '#6b7280', lineHeight: 1.8, marginBottom: '14px' }}>
              {t('support.form.desc1')}
            </p>
            <p style={{ fontFamily: ff, fontSize: '13px', fontWeight: 600, color: '#6b7280', lineHeight: 1.8, marginBottom: '8px' }}>
              {t('support.form.desc2')}
            </p>
            <ul style={{ fontFamily: ff, fontSize: '13px', fontWeight: 600, color: '#6b7280', lineHeight: 2, margin: '0 0 14px 20px', padding: 0, listStyleType: 'disc' }}>
              {t('support.form.roles', { returnObjects: true } as object).map((r: string, i: number) => (
                 <li key={i} style={{ listStyleType: 'disc' }}>{r}</li>
              ))}
            </ul>
            <p style={{ fontFamily: ff, fontSize: '13px', fontWeight: 600, color: '#6b7280', lineHeight: 1.8, marginBottom: '14px' }}>
              {t('support.form.desc3')}
            </p>
            <div style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: '8px', padding: '12px 16px', marginBottom: '14px' }}>
              <p style={{ fontFamily: ff, fontSize: '12px', fontWeight: 600, color: '#78350f', lineHeight: 1.7, margin: 0 }}>
                {t('support.form.note')}
              </p>
            </div>
            <p style={{ fontFamily: ff, fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
              {t('support.form.contact')} <a href="mailto:info@sense-institute.org" style={{ color: '#893ce3', fontWeight: 700 }}>info@sense-institute.org</a>
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg,rgba(137,60,227,0.10),rgba(236,72,153,0.10))', border: '1.5px solid rgba(137,60,227,0.25)', borderRadius: '999px', padding: '3px 14px', fontFamily: ff, fontWeight: 800, fontSize: '12px', color: '#893ce3', marginBottom: '28px' }}>
              ⏱ {t('support.form.timer')}
            </div>

            {/* Questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>

              {/* Q1 */}
              <div>
                <p style={qLabel()}>{t('support.form.questions.q1')}</p>
                <input
                  type="text"
                  placeholder={t('support.form.questions.q1Placeholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#893ce3')}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                />
              </div>

              {/* Q2 */}
              <div>
                <p style={qLabel()}>{t('support.form.questions.q2')}</p>
                <p style={hint}>{t('support.form.questions.q2Hint')}</p>
                <input
                  type="text"
                  placeholder={t('support.form.questions.q2Placeholder')}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#893ce3')}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                />
              </div>

              {/* Q3 */}
              <div>
                <p style={qLabel()}>
                  {t('support.form.questions.q3')}{' '}
                  <span style={{ fontWeight: 600, color: '#9ca3af', fontSize: '12px' }}>{t('support.form.questions.q3Hint')}</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {areas.map((a) => (
                    <label key={a} style={labelStyle}>
                      <input
                        type="checkbox"
                        checked={selectedAreas.includes(a)}
                        onChange={() => toggleArea(a)}
                        style={{ width: '16px', height: '16px', accentColor: '#893ce3' }}
                      />
                      {a}
                    </label>
                  ))}
                </div>
              </div>

              {/* Q4 */}
              <div>
                <p style={qLabel()}>{t('support.form.questions.q4')}</p>
                <p style={hint}>{t('support.form.questions.q4Hint')}</p>
                <textarea
                  rows={4}
                  placeholder={t('support.form.questions.q4Placeholder')}
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={(e) => (e.target.style.borderColor = '#893ce3')}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                />
              </div>

              {/* Q5 */}
              <div>
                <p style={qLabel()}>{t('support.form.questions.q5')}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {timeOptions.map((o) => (
                    <label key={o} style={labelStyle}>
                      <input
                        type="radio"
                        name="cq5"
                        value={o}
                        checked={time === o}
                        onChange={() => setTime(o)}
                        style={{ width: '16px', height: '16px', accentColor: '#893ce3' }}
                      />
                      {o}
                    </label>
                  ))}
                </div>
              </div>

              {/* Q6 */}
              <div>
                <p style={qLabel()}>
                  {t('support.form.questions.q6')}{' '}
                  <a href="mailto:info@sense-institute.org" style={{ color: '#893ce3', fontWeight: 700 }}>info@sense-institute.org</a>{' '}
                  {t('support.form.questions.q6Suffix')}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {resumeOptions.map((o) => (
                    <label key={o} style={labelStyle}>
                      <input
                        type="radio"
                        name="cq6"
                        value={o}
                        checked={resume === o}
                        onChange={() => setResume(o)}
                        style={{ width: '16px', height: '16px', accentColor: '#893ce3' }}
                      />
                      {o}
                    </label>
                  ))}
                </div>
              </div>

              {/* Q7 */}
              <div>
                <p style={qLabel()}>
                  {t('support.form.questions.q7')}{' '}
                  <span style={{ fontWeight: 600, color: '#9ca3af', fontSize: '12px' }}>{t('support.form.questions.q7Optional')}</span>
                </p>
                <p style={hint}>{t('support.form.questions.q7Hint')}</p>
                <textarea
                  rows={3}
                  placeholder={t('support.form.questions.q7Placeholder')}
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={(e) => (e.target.style.borderColor = '#893ce3')}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                />
              </div>

              {/* Q8 */}
              <div>
                <p style={qLabel()}>
                  {t('support.form.questions.q8')}{' '}
                  <span style={{ fontWeight: 600, color: '#9ca3af', fontSize: '12px' }}>{t('support.form.questions.q8Optional')}</span>
                </p>
                <textarea
                  rows={3}
                  placeholder={t('support.form.questions.q8Placeholder')}
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={(e) => (e.target.style.borderColor = '#893ce3')}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                />
              </div>
            </div>

            {/* Submit */}
            <div style={{ marginTop: '32px' }}>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  background: ctaGradient,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '14px 36px',
                  fontFamily: ff,
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(137,60,227,0.25)',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? t('support.form.submitting') : t('support.form.submitBtn')}
              </button>
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {view === 'success' && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 36px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '20px', fontWeight: 700, color: '#2d2a4a', marginBottom: '12px' }}>
              {t('support.success.title')}
            </p>
            {(t('support.success.messages', { returnObjects: true }) as string[]).map((msg, i) => (
              <p key={i} style={{ fontFamily: ff, fontSize: '14px', fontWeight: 600, color: '#6b7280', lineHeight: 1.8, marginBottom: '8px' }}>
                {msg}
              </p>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
