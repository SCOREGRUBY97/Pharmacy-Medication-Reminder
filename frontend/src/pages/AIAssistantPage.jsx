import { useState } from 'react';

const COLORS = { primary: '#0F6E56', border: '#D3D1C7', muted: '#5F5E5A' };
const SUGGESTIONS = ['What are the side effects of Metformin?', 'Can I take Vitamin D3 with Amlodipine?', 'What should I do if I miss a dose?', 'How should I store my medications?'];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([{ role: 'assistant', text: "Hello! I'm your AI medication assistant. I can help you with medication questions, interactions, and general health advice. How can I help you today?" }]);
  const [input, setInput] = useState('');

  const send = (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: msg }, { role: 'assistant', text: `Thank you for your question about "${msg}". For accurate medical advice about your specific medications, please consult your healthcare provider or pharmacist. I can provide general information to help you understand your medications better.` }]);
    setInput('');
  };

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>AI Assistant</h1>
      <p style={{ color: COLORS.muted, fontSize: 13, margin: '0 0 18px' }}>Ask questions about your medications</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => send(s)} style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${COLORS.border}`, cursor: 'pointer', background: '#fff', fontSize: 12, color: COLORS.primary }}>{s}</button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${COLORS.border}`, padding: '18px 22px', marginBottom: 12, minHeight: 300, maxHeight: 400, overflowY: 'auto' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
            <div style={{ maxWidth: '75%', padding: '10px 14px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: m.role === 'user' ? COLORS.primary : '#f5f5f5', color: m.role === 'user' ? '#fff' : '#333', fontSize: 13, lineHeight: 1.5 }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about your medications..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 13, outline: 'none' }}
        />
        <button onClick={() => send()} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: COLORS.primary, color: '#fff', fontSize: 13, fontWeight: 600 }}>Send</button>
      </div>
    </div>
  );
}
