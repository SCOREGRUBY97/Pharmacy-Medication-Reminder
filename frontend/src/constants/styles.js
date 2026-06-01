export const C = {
  // Brand
  pri: '#0F6E56', priDk: '#085041', priLt: '#1D9E75', priXl: '#E1F5EE',
  // Accent
  acc: '#EF9F27', accLt: '#FAEEDA',
  // Semantic
  dan: '#E24B4A', danLt: '#FCEBEB', danDk: '#A32D2D',
  suc: '#3B6D11', sucLt: '#EAF3DE', sucMd: '#639922',
  wrn: '#BA7517', wrnLt: '#FAEEDA', wrnDk: '#633806',
  inf: '#185FA5', infLt: '#E6F1FB', infMd: '#378ADD',
  // Neutral
  bg: '#F0F4F2', card: '#FFFFFF', txt: '#1a1a1a', mut: '#5F5E5A', brd: '#D3D1C7',
  // Caregiver & Admin
  cgDk: '#042C53', cgPri: '#185FA5',
  admDk: '#4A1B0C', admPri: '#993C1D',
};

export const statusColor = s => ({
  taken:   { bg: '#F0FDF4', border: '#16A34A', text: '#166534' },
  missed:  { bg: '#FEF2F2', border: '#DC2626', text: '#991B1B' },
  pending: { bg: '#FFF3CD', border: '#D97706', text: '#92400E' },
  snoozed: { bg: '#F0F4FF', border: C.infMd, text: C.inf },
}[s] || { bg: '#f5f5f5', border: C.brd, text: C.mut });

export const catStyle = c => ({
  'Morning':         { bg: '#FFF8EE', color: '#8B5000', border: '#F5C775' },
  'Afternoon':       { bg: '#EEFFF4', color: '#1A6B35', border: '#7DD9A0' },
  'Evening':         { bg: '#EEF4FF', color: '#1A3F8B', border: '#7DA8F5' },
  'Morning & Evening':{ bg: '#F5EEFF', color: '#5B1A8B', border: '#C07DF5' },
  'General':         { bg: C.priXl,   color: C.priDk,   border: '#5DCAA5' },
}[c] || { bg: C.priXl, color: C.priDk, border: '#5DCAA5' });

// Shared component styles
export const S = {
  app: {
    fontFamily: "-apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    background: C.bg, minHeight: '100vh', color: C.txt,
  },
  shell: {
    display: 'flex', minHeight: '100vh',
  },
  sidebar: (col) => ({
    width: 220, background: col, display: 'flex', flexDirection: 'column',
    position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100, flexShrink: 0,
  }),
  main: {
    marginLeft: 220, flex: 1, padding: '24px 28px', minWidth: 0,
  },
  card: {
    background: C.card, borderRadius: 16, border: `1px solid ${C.brd}`,
    padding: '18px 20px', marginBottom: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  cardHover: {
    transition: 'all 0.15s', cursor: 'default',
  },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: `1px solid ${C.brd}`, fontSize: 14, fontFamily: 'inherit',
    outline: 'none', background: '#fff', color: C.txt, boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  label: {
    fontSize: 12, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 5, marginTop: 12,
  },
  btnPrimary: (bg = C.pri) => ({
    padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
    background: bg, color: '#fff', fontSize: 13, fontWeight: 600,
    fontFamily: 'inherit', transition: 'all 0.15s', display: 'inline-flex',
    alignItems: 'center', gap: 6,
  }),
  btnGhost: {
    padding: '9px 16px', borderRadius: 10, border: `1px solid ${C.brd}`,
    cursor: 'pointer', background: '#fff', color: C.mut, fontSize: 13,
    fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6,
  },
  btnSm: (bg, color = '#fff') => ({
    padding: '4px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
    background: bg, color, fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
  }),
  tag: (bg, color) => ({
    display: 'inline-block', padding: '3px 9px', borderRadius: 20,
    fontSize: 11, fontWeight: 600, background: bg, color,
  }),
  statCard: (borderColor, bg) => ({
    background: bg || '#fff', borderRadius: 14, padding: '14px 16px',
    border: `1px solid ${C.brd}`, borderTop: `4px solid ${borderColor}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  }),
  row: { display: 'flex', gap: 14 },
  pbar: {
    height: 8, borderRadius: 4, background: C.brd,
    overflow: 'hidden', position: 'relative',
  },
};
