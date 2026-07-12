import { useState } from 'react';
import { useTranslation } from 'react-i18next';
interface FeedbackAnswers {
  q1: string | null;        // Role
  q2: string | null;        // Gender
  q3: string | null;        // Helpfulness (5-scale)
  q4: string | null;        // Clarity (radio)
  q5: string | null;        // Trust (radio)
  q6: string | null;        // Design (radio)
  q7: string[];             // Most useful features (multi)
  q8: string[];             // Feature requests (multi)
  q9: string | null;        // NPS (0-10)
  comment: string;          // Open comment
}

const ff = "'Nunito', 'Inter', sans-serif";
const grad = 'linear-gradient(135deg,#893ce3,#ec4899)';

function RadioOption({ value: _value, label, selected, onSelect }: { value: string; label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', borderRadius: 12, width: '100%', textAlign: 'left',
        border: `1.5px solid ${selected ? '#893ce3' : '#e5e7eb'}`,
        background: selected ? 'rgba(137,60,227,0.06)' : '#fff',
        fontFamily: ff, fontSize: 14, fontWeight: 600,
        color: selected ? '#893ce3' : '#374151', cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <span style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? '#893ce3' : '#d1d5db'}`,
        background: selected ? '#893ce3' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'block' }} />}
      </span>
      {label}
    </button>
  );
}



function CheckOption({ value: _value, label, selected, onToggle }: { value: string; label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${selected ? '#893ce3' : '#e5e7eb'}`,
      background: selected ? 'rgba(137,60,227,0.06)' : '#fff',
      fontFamily: ff, fontSize: 14, fontWeight: 600,
      color: selected ? '#893ce3' : '#374151', cursor: 'pointer',
      transition: 'all 0.15s', textAlign: 'left',
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: 4, border: `2px solid ${selected ? '#893ce3' : '#d1d5db'}`,
        background: selected ? '#893ce3' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {selected && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900, lineHeight: 1 }}>✓</span>}
      </span>
      {label}
    </button>
  );
}

function QLabel({ n, text, sub }: { n: number; text: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontFamily: ff, fontSize: 16, fontWeight: 800, color: '#1f2937', margin: 0 }}>
        {n}. {text}
        {sub && <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginLeft: 8 }}>{sub}</span>}
      </p>
    </div>
  );
}

export default function Feedback() {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<FeedbackAnswers>({
    q1: null, q2: null, q3: null, q4: null, q5: null, q6: null,
    q7: [], q8: [], q9: null, comment: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const setQ = (key: keyof FeedbackAnswers, val: string) =>
    setAnswers(prev => ({ ...prev, [key]: val }));

  const toggleMulti = (key: 'q7' | 'q8', val: string) =>
    setAnswers(prev => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://formspree.io/f/mrewnpqg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          role: answers.q1,
          gender: answers.q2,
          helpfulness: answers.q3,
          clarity: answers.q4,
          trust: answers.q5,
          design: answers.q6,
          mostUseful: answers.q7.join(', '),
          featureRequest: answers.q8.join(', '),
          nps: answers.q9,
          comment: answers.comment,
          _subject: `NutriKids Feedback - NPS: ${answers.q8}`,
        }),
      });
      if (res.ok) setSubmitted(true);
      else alert('Submission failed. Please try again.');
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const card = {
    background: '#fff', borderRadius: 20, padding: '24px 24px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 16,
    border: '1px solid rgba(137,60,227,0.08)',
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f5f0ff,#fdf2f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ ...card, textAlign: 'center', maxWidth: 480, width: '100%' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 22, fontWeight: 800, color: '#1f2937', marginBottom: 10 }}>Thank you!</p>
          <p style={{ fontFamily: ff, fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 6 }}>
            Your feedback means a lot to us. We'll use it to make NutriKids even better for families like yours.
          </p>
          <p style={{ fontFamily: ff, fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 24 }}>
            If you have more thoughts, feel free to reach out anytime at{' '}
            <a href="mailto:info@sense-institute.org" style={{ color: '#893ce3', fontWeight: 700 }}>info@sense-institute.org</a>.
          </p>
          <button onClick={() => setSubmitted(false)} style={{
            background: grad, color: '#fff', border: 'none', borderRadius: 999,
            padding: '12px 28px', fontFamily: ff, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Submit Another Response
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f5f0ff,#fdf2f8)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{ fontSize: 36 }}>💬</span>
          <h1 style={{ fontFamily: "'Poppins',sans-serif", fontSize: 24, fontWeight: 800, color: '#1f2937', margin: '8px 0 6px' }}>
            {t('feedback.title')}
          </h1>
          <p style={{ fontFamily: ff, fontSize: 13, color: '#6b7280', margin: 0 }}>
            {t('feedback.subtitle')} <span style={{ fontWeight: 700 }}>{t('feedback.timer')}</span>
          </p>
          <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(137,60,227,0.07)', borderRadius: 999, padding: '5px 14px' }}>
            <span>🔒</span>
            <span style={{ fontFamily: ff, fontSize: 11, fontWeight: 600, color: '#893ce3' }}>
              Your responses are anonymous and used only to improve NutriKids.
            </span>
          </div>
        </div>

        {/* Q1 - Role */}
        <div style={card}>
          <QLabel n={1} text={t('feedback.q1.label')} />
          {['1', '2', '3'].map(k => {
            const opt = t(`feedback.q1.${k}`);
            return <RadioOption key={k} value={opt} label={opt} selected={answers.q1 === opt} onSelect={() => setQ('q1', opt)} />;
          })}
        </div>
      
      {/* Q2 - Role */}
      <div style={card}>
        <QLabel n={2} text={t('feedback.q2.label')} />
        {['1', '2', '3', '4'].map(k => {
          const opt = t(`feedback.q2.${k}`);
          return <RadioOption key={k} value={opt} label={opt} selected={answers.q2 === opt} onSelect={() => setQ('q2', opt)} />;
        })}
      </div>

      {/* Q3 - Helpfulness */}
      <div style={card}>
        <QLabel n={3} text={t('feedback.q3.label')} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[{ v: '1', e: '😞' }, { v: '2', e: '😕' }, { v: '3', e: '😐' }, { v: '4', e: '😊' }, { v: '5', e: '😍' }].map(o => (
            <button key={o.v} onClick={() => setQ('q3', o.v)} style={{
              flex: 1, minWidth: 60, padding: '12px 8px', borderRadius: 12,
              border: `1.5px solid ${answers.q3 === o.v ? '#893ce3' : '#e5e7eb'}`,
              background: answers.q3 === o.v ? 'rgba(137,60,227,0.08)' : '#fff', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              fontFamily: ff, fontSize: 11, fontWeight: 600, color: answers.q3 === o.v ? '#893ce3' : '#6b7280',
            }}>
              <span style={{ fontSize: 28 }}>{o.e}</span>
              <span style={{ whiteSpace: 'pre-line', textAlign: 'center' }}>{t(`feedback.q3.${o.v}`)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Q4 - Clarity */}
      <div style={card}>
        <QLabel n={4} text={t('feedback.q4.label')} />
        {['1', '2', '3', '4', '5'].map(k => {
          const opt = t(`feedback.q4.${k}`);
          return <RadioOption key={k} value={opt} label={opt} selected={answers.q4 === opt} onSelect={() => setQ('q4', opt)} />;
        })}
      </div>

      {/* Q5 - Trust */}
      <div style={card}>
        <QLabel n={5} text={t('feedback.q5.label')} />
        {['1', '2', '3', '4', '5'].map(k => {
          const opt = t(`feedback.q5.${k}`);
          return <RadioOption key={k} value={opt} label={opt} selected={answers.q5 === opt} onSelect={() => setQ('q5', opt)} />;
        })}
      </div>

      {/* Q6 - Design */}
      <div style={card}>
        <QLabel n={4} text={t('feedback.q6.label')} />
        {['1', '2', '3', '4', '5'].map(k => {
          const opt = t(`feedback.q6.${k}`);
          return <RadioOption key={k} value={opt} label={opt} selected={answers.q6 === opt} onSelect={() => setQ('q6', opt)} />;
        })}
      </div>

      {/* Q7 - Most useful (multi) */}
      <div style={card}>
        <QLabel n={7} text={t('feedback.q7.label')} sub={t('feedback.q7.sub')} />
        {['1', '2'].map(k => {
          const opt = t(`feedback.q7.${k}`);
          return <CheckOption key={k} value={opt} label={opt} selected={answers.q7.includes(opt)} onToggle={() => toggleMulti('q7', opt)} />;
        })}
      </div>

      {/* Q8 - Feature request (multi) */}
      <div style={card}>
        <QLabel n={8} text={t('feedback.q8.label')} sub={t('feedback.q8.sub')} />
        {['1', '2', '3', '4', '5'].map(k => {
          const opt = t(`feedback.q8.${k}`);
          return <CheckOption key={k} value={opt} label={opt} selected={answers.q8.includes(opt)} onToggle={() => toggleMulti('q8', opt)} />;
        })}
      </div>

      {/* Q9 - NPS */}
      <div style={card}>
        <QLabel n={9} text={t('feedback.q9.label')} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {Array.from({ length: 11 }, (_, i) => String(i)).map(v => (
            <button key={v} onClick={() => setQ('q9', v)} style={{
              width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${answers.q9 === v ? '#893ce3' : '#e5e7eb'}`,
              background: answers.q9 === v ? '#893ce3' : '#fff',
              color: answers.q9 === v ? '#fff' : '#374151',
              fontFamily: ff, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
            }}>{v}</button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: ff, fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>
          <span>{t('feedback.q9.low')}</span>
          <span>{t('feedback.q9.high')}</span>
        </div>
      </div>

      {/* Q10 - Comment */}
      <div style={card}>
        <QLabel n={10} text={t('feedback.q10.label')} />
        <textarea
          value={answers.comment}
          onChange={e => setAnswers(prev => ({ ...prev, comment: e.target.value }))}
          placeholder={t('feedback.q10.placeholder')}
          rows={4}
          style={{
            width: '100%', borderRadius: 12, border: '1.5px solid #e5e7eb', padding: '12px 14px',
            fontFamily: ff, fontSize: 14, color: '#374151', resize: 'vertical', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Submit */}
      <div style={{ textAlign: 'center', paddingBottom: 32 }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            background: loading ? '#d1d5db' : grad,
            color: '#fff', border: 'none', borderRadius: 999,
            padding: '14px 40px', fontFamily: ff, fontSize: 15, fontWeight: 800,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(137,60,227,0.3)',
          }}
        >
          {loading ? t('feedback.submitting') : t('feedback.submit')}
        </button>
      </div>

      </div>
    </div>
  );
}
