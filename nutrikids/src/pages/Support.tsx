import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const ff = "'Nunito', sans-serif";
const ctaGradient = 'linear-gradient(135deg, #893ce3 0%, #ec4899 100%)';

const AREAS = [
  'Software Development',
  'Data Science & Analytics',
  'Nutrition Research',
  'Healthcare & Nutrition Expertise',
  'Educational Content Development',
  'Product Design / UI & UX',
  'Translation & Localization',
  'Community Outreach',
  'Fundraising & Partnerships',
  'Student Volunteer Opportunities',
  'Other',
];

const TIME_OPTIONS = [
  'Less than 2 hours per week',
  '2–5 hours per week',
  '5–10 hours per week',
  '10+ hours per week',
  'Project-based / Flexible',
];

const RESUME_OPTIONS = [
  'Yes',
  'No',
  'Not yet, but I plan to',
];

type View = 'landing' | 'form' | 'success';

export default function Support() {
  const [view, setView] = useState<View>('landing');

  // form state
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [skills, setSkills] = useState('');
  const [time, setTime] = useState('');
  const [resume, setResume] = useState('');
  const [motivation, setMotivation] = useState('');
  const [extra, setExtra] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleArea = (val: string) =>
    setAreas((prev) => prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val]);

  const handleSubmit = async () => {
    if (!name.trim() || !contact.trim()) return;
    setSubmitting(true);
    // Replace with your actual submission endpoint if needed
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setView('success');
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

  const qLabel = (text: React.ReactNode): React.CSSProperties => ({
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
                💛 Support Us
              </span>
            </div>
            <p style={{ fontFamily: ff, fontSize: '15px', fontWeight: 700, color: '#2d2a4a', lineHeight: 1.7, marginBottom: '8px' }}>
              Help us build a healthier future for children.
            </p>
            <p style={{ fontFamily: ff, fontSize: '13px', fontWeight: 600, color: '#6b7280', lineHeight: 1.8, marginBottom: '32px' }}>
              NutriKids is a nonprofit, community-driven initiative. Whether through financial support, technical contributions, research collaboration, or sharing our mission, you can help us make nutrition guidance more accessible for families.
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
                💛 Donate
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
                🚀 Become a Contributor
              </button>
            </div>
          </div>
        )}

        {/* ── Contributor Form ── */}
        {view === 'form' && (
          <div style={cardStyle}>
            {/* Header */}
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
                🚀 Become a Contributor
              </span>
            </div>
            <p style={{ fontFamily: ff, fontSize: '14px', fontWeight: 700, color: '#2d2a4a', marginBottom: '6px', lineHeight: 1.6 }}>
              Help us improve children's nutrition education and wellbeing.
            </p>
            <p style={{ fontFamily: ff, fontSize: '13px', fontWeight: 600, color: '#6b7280', lineHeight: 1.8, marginBottom: '14px' }}>
              NutriKids welcomes individuals and organizations who would like to contribute their time, expertise, or resources to support healthier childhood development.
            </p>
            <p style={{ fontFamily: ff, fontSize: '13px', fontWeight: 600, color: '#6b7280', lineHeight: 1.8, marginBottom: '8px' }}>
              We are particularly interested in collaborating with:
            </p>
            <ul style={{ fontFamily: ff, fontSize: '13px', fontWeight: 600, color: '#6b7280', lineHeight: 2, margin: '0 0 14px 20px', padding: 0 }}>
              {['Software Developers', 'Data Scientists', 'Nutrition Researchers',
                'Healthcare and Nutrition Professionals', 'Educators', 'Translators',
                'Community Partners', 'Student Volunteers'].map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p style={{ fontFamily: ff, fontSize: '13px', fontWeight: 600, color: '#6b7280', lineHeight: 1.8, marginBottom: '14px' }}>
              Whether you can contribute technical expertise, research support, educational content, design skills, or community outreach, we would love to hear from you.
            </p>
            <div style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: '8px', padding: '12px 16px', marginBottom: '14px' }}>
              <p style={{ fontFamily: ff, fontSize: '12px', fontWeight: 600, color: '#78350f', lineHeight: 1.7, margin: 0 }}>
                Please note: Most contributor opportunities are currently volunteer-based. As NutriKids continues to grow, some roles may become eligible for paid support depending on available funding, project needs, work authorization requirements, and role availability. Compensation is not guaranteed, and participation should be considered voluntary unless otherwise agreed upon in writing.
              </p>
            </div>
            <p style={{ fontFamily: ff, fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
              📧 Questions? Contact us at:{' '}
              <a href="mailto:info@sense-institute.org" style={{ color: '#893ce3', fontWeight: 700 }}>info@sense-institute.org</a>
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg,rgba(137,60,227,0.10),rgba(236,72,153,0.10))', border: '1.5px solid rgba(137,60,227,0.25)', borderRadius: '999px', padding: '3px 14px', fontFamily: ff, fontWeight: 800, fontSize: '12px', color: '#893ce3', marginBottom: '28px' }}>
              ⏱ Takes less than 2 minutes
            </div>

            {/* Questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>

              {/* Q1 */}
              <div>
                <p style={qLabel('')}>1. What is your name?</p>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#893ce3')}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                />
              </div>

              {/* Q2 */}
              <div>
                <p style={qLabel('')}>2. What is the best way to contact you?</p>
                <p style={hint}>Examples: Email, LinkedIn, phone number, personal website, or other preferred contact method.</p>
                <input
                  type="text"
                  placeholder="Your contact info"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#893ce3')}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                />
              </div>

              {/* Q3 */}
              <div>
                <p style={qLabel('')}>
                  3. Which area(s) would you like to contribute to?{' '}
                  <span style={{ fontWeight: 600, color: '#9ca3af', fontSize: '12px' }}>Select all that apply</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {AREAS.map((a) => (
                    <label key={a} style={labelStyle}>
                      <input
                        type="checkbox"
                        checked={areas.includes(a)}
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
                <p style={qLabel('')}>4. What skills, experience, or expertise would you like to contribute?</p>
                <p style={hint}>Examples: Programming, nutrition research, public health, education, design, data analysis, community engagement, fundraising, communications, etc.</p>
                <textarea
                  rows={4}
                  placeholder="Describe your skills and experience..."
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={(e) => (e.target.style.borderColor = '#893ce3')}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                />
              </div>

              {/* Q5 */}
              <div>
                <p style={qLabel('')}>5. Approximately how much time could you contribute?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {TIME_OPTIONS.map((o) => (
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
                <p style={qLabel('')}>
                  6. Have you already sent your resume and/or cover letter to{' '}
                  <a href="mailto:info@sense-institute.org" style={{ color: '#893ce3', fontWeight: 700 }}>info@sense-institute.org</a>?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {RESUME_OPTIONS.map((o) => (
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
                <p style={qLabel('')}>
                  7. Why are you interested in contributing to NutriKids?{' '}
                  <span style={{ fontWeight: 600, color: '#9ca3af', fontSize: '12px' }}>Optional</span>
                </p>
                <p style={hint}>We would love to learn more about your interests, goals, or motivation for getting involved.</p>
                <textarea
                  rows={3}
                  placeholder="Share your motivation..."
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  onFocus={(e) => (e.target.style.borderColor = '#893ce3')}
                  onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
                />
              </div>

              {/* Q8 */}
              <div>
                <p style={qLabel('')}>
                  8. Is there anything else you would like us to know?{' '}
                  <span style={{ fontWeight: 600, color: '#9ca3af', fontSize: '12px' }}>Optional</span>
                </p>
                <textarea
                  rows={3}
                  placeholder="Any additional information..."
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
                {submitting ? 'Submitting…' : 'Submit →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {view === 'success' && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 36px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '20px', fontWeight: 700, color: '#2d2a4a', marginBottom: '12px' }}>
              Thank You!
            </p>
            {[
              'Thank you for your interest in supporting NutriKids.',
              'Our team reviews submissions periodically and may contact contributors when opportunities align with project needs and available resources.',
              "We appreciate your willingness to help improve children's nutrition education and wellbeing.",
            ].map((t, i) => (
              <p key={i} style={{ fontFamily: ff, fontSize: '14px', fontWeight: 600, color: '#6b7280', lineHeight: 1.8, marginBottom: '8px' }}>
                {t}
              </p>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
