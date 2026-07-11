import { useState } from 'react';
import { useTranslation } from 'react-i18next';


interface FeedbackAnswers {
  q1: string | null;
  q2: string | null;
  q3: string | null;
  q4: string | null;
  q5: string | null;
  comment: string;
}

export default function Feedback() {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<FeedbackAnswers>({
    q1: null,
    q2: null,
    q3: null,
    q4: null,
    q5: null,
    comment: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelectRating = (question: keyof FeedbackAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [question]: value }));
  };

  const handleSelectRadio = (question: keyof FeedbackAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [question]: value }));
  };

  const handleSelectChoice = (question: keyof FeedbackAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [question]: value }));
  };

  const handleSelectNPS = (value: string) => {
    setAnswers(prev => ({ ...prev, q5: value }));
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAnswers(prev => ({ ...prev, comment: e.target.value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://formspree.io/f/mrewnpqg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          helpfulness: answers.q1,
          clarity: answers.q2,
          mostUseful: answers.q3,
          featureRequest: answers.q4,
          nps: answers.q5,
          comment: answers.comment,
          _subject: `NutriKids Feedback - NPS: ${answers.q5}`,
        }),
      });
  
      if (res.ok) {
        setSubmitted(true);
      } else {
        alert('Submission failed. Please try again.');
      }
    } catch (e) {
      alert('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setAnswers({
      q1: null,
      q2: null,
      q3: null,
      q4: null,
      q5: null,
      comment: '',
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#d8ccf5] via-[#e8ccec] to-[#ccd8f5]">
      <div className="max-w-[680px] mx-auto px-4 py-8">
        <div className="card" style={{ padding: '32px', maxWidth: '680px', margin: '0 auto' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '22px', fontWeight: '700', color: '#2d2a4a', marginBottom: '8px' }}>
                {t('feedback.successTitle')}
              </div>
              <div style={{ fontFamily: 'Nunito, sans-serif', fontSize: '15px', color: '#6b7280', lineHeight: '1.6' }}>
                <span dangerouslySetInnerHTML={{ __html: t('feedback.successMsg') }} />
              </div>
              <button
                onClick={handleReset}
                style={{
                  background: 'linear-gradient(135deg,#893ce3,#ec4899)',
                  color: '#fff',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '15px',
                  fontWeight: '700',
                  padding: '16px 32px',
                  border: 'none',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(137,60,227,0.3)',
                  transition: 'transform .15s, box-shadow .15s',
                  marginTop: '24px',
                }}
                onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {t('feedback.submitAnother')} ✨
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '24px', fontWeight: '700', background: 'linear-gradient(135deg,#893ce3,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  💬 {t('feedback.title')}
                </span>
              </div>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: '14px', color: '#6b7280', marginBottom: '32px', lineHeight: '1.6' }}>
                {t('feedback.subtitle')} 
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg,rgba(137,60,227,0.10),rgba(236,72,153,0.10))', border: '1.5px solid rgba(137,60,227,0.25)', borderRadius: '999px', padding: '2px 12px', fontWeight: '800', fontSize: '13px', color: '#893ce3', whiteSpace: 'nowrap' }}>
                  ⏱️ {t('feedback.timer')}
                </span>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {/* Q1: Helpfulness */}
                <div className="fb-q">
                  <div className="fb-q-label">{t('feedback.q1.label')}</div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {[
                      { emoji: '😞', label: t('feedback.q1.1') },
                      { emoji: '😕', label: t('feedback.q1.2') },
                      { emoji: '😐', label: t('feedback.q1.3') },
                      { emoji: '😊', label: t('feedback.q1.4') },
                      { emoji: '😍', label: t('feedback.q1.5') },
                    ].map((item, index) => (
                      <button
                        key={index}
                        className={`fb-rating-btn ${answers.q1 === item.emoji ? 'selected' : ''}`}
                        onClick={() => handleSelectRating('q1', item.emoji)}
                      >
                        {item.emoji}
                        <span dangerouslySetInnerHTML={{ __html: item.label }} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q2: Information clarity */}
                <div className="fb-q">
                  <div className="fb-q-label">{t('feedback.q2.label')}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    {[
                      { key: 'q2_1', text: t('feedback.q2.1') },
                      { key: 'q2_2', text: t('feedback.q2.2') },
                      { key: 'q2_3', text: t('feedback.q2.3') },
                      { key: 'q2_4', text: t('feedback.q2.4') },
                      { key: 'q2_5', text: t('feedback.q2.5') },
                    ].map((item) => (
                      <button
                        key={item.key}
                        className={`fb-radio-btn ${answers.q2 === item.text ? 'selected' : ''}`}
                        onClick={() => handleSelectRadio('q2', item.text)}
                      >
                        {item.text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q3: Most useful feature */}
                <div className="fb-q">
                  <div className="fb-q-label">{t('feedback.q3.label')}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                    {[
                      { key: 'q3_1', text: t('feedback.q3.1') },
                      { key: 'q3_2', text: t('feedback.q3.2') },
                      { key: 'q3_3', text: t('feedback.q3.3') },
                      { key: 'q3_4', text: t('feedback.q3.4') },
                    ].map((item) => (
                      <button
                        key={item.key}
                        className={`fb-choice-btn ${answers.q3 === item.text ? 'selected' : ''}`}
                        onClick={() => handleSelectChoice('q3', item.text)}
                      >
                        {item.text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q4: Feature request */}
                <div className="fb-q">
                  <div className="fb-q-label">{t('feedback.q4.label')}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    {[
                      { key: 'q4_1', text: t('feedback.q4.1') },
                      { key: 'q4_2', text: t('feedback.q4.2') },
                      { key: 'q4_3', text: t('feedback.q4.3') },
                      { key: 'q4_4', text: t('feedback.q4.4') },
                      { key: 'q4_5', text: t('feedback.q4.5') },
                    ].map((item) => (
                      <button
                        key={item.key}
                        className={`fb-radio-btn ${answers.q4 === item.text ? 'selected' : ''}`}
                        onClick={() => handleSelectRadio('q4', item.text)}
                      >
                        {item.text}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q5: NPS */}
                <div className="fb-q">
                  <div className="fb-q-label">{t('feedback.q5.label')}</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        className={`fb-nps-btn ${answers.q5 === num.toString() ? 'selected' : ''}`}
                        onClick={() => handleSelectNPS(num.toString())}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{t('feedback.q5.low')}</span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>{t('feedback.q5.high')}</span>
                  </div>
                </div>

                {/* Q6: Comment */}
                <div className="fb-q">
                  <div className="fb-q-label">{t('feedback.q6.label')}</div>
                  <textarea
                    value={answers.comment}
                    onChange={handleCommentChange}
                    placeholder={t('feedback.q6.placeholder')}
                    style={{
                      width: '100%',
                      marginTop: '12px',
                      padding: '14px 16px',
                      border: '1.5px solid rgba(124,58,237,0.2)',
                      borderRadius: '14px',
                      fontFamily: 'Nunito, sans-serif',
                      fontSize: '14px',
                      color: '#1a1a3a',
                      background: 'rgba(255,255,255,0.8)',
                      resize: 'vertical',
                      minHeight: '100px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      lineHeight: '1.6',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#893ce3')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)')}
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg,#893ce3,#ec4899)',
                    color: '#fff',
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '15px',
                    fontWeight: '700',
                    padding: '16px 32px',
                    border: 'none',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(137,60,227,0.3)',
                    transition: 'transform .15s, box-shadow .15s',
                    alignSelf: 'flex-start',
                    opacity: loading ? 0.7 : 1,
                  }}
                  onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {loading ? (
                    <span>{t('feedback.submitting')}</span>
                  ) : (
                    <span>{t('feedback.submit')} ✨</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
