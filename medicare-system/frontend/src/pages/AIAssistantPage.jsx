import { useState } from 'react';
import { aiAPI } from '../services/api';

const C = { primary: '#0F6E56', danger: '#E24B4A', textMuted: '#5F5E5A', border: '#D3D1C7' };

export default function AIAssistantPage() {
  const [question, setQuestion] = useState('How can I remember my evening medicine?');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const askAI = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnswer('');
    try {
      const res = await aiAPI.ask({ question });
      setAnswer(res.data.answer);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to get AI response.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>AI Medication Assistant</h1>
      <p style={{ color: C.textMuted, fontSize: 14, margin: '0 0 24px' }}>Ask for simple reminder and adherence support. This is not medical advice.</p>

      <form onSubmit={askAI} style={{ background: '#fff', padding: 20, borderRadius: 12, border: `1px solid ${C.border}`, maxWidth: 760 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Your question</label>
        <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={4} style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, resize: 'vertical' }} />
        <button type="submit" disabled={loading} style={{ marginTop: 12, padding: '10px 18px', border: 'none', borderRadius: 8, background: C.primary, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Thinking...' : 'Ask AI'}
        </button>
      </form>

      {error && <div style={{ marginTop: 18, color: C.danger }}>{error}</div>}
      {answer && (
        <div style={{ marginTop: 20, background: '#F5FAF7', padding: 18, borderRadius: 12, border: `1px solid ${C.border}`, maxWidth: 760 }}>
          <h3 style={{ marginTop: 0 }}>AI Response</h3>
          <p style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{answer}</p>
          <p style={{ color: C.textMuted, fontSize: 12 }}>Reminder: Always ask a doctor or pharmacist before changing medicines.</p>
        </div>
      )}
    </div>
  );
}
