import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import { C, S, statusColor } from '../../constants/styles';
import {
  getMyPatients,
  getPatientOverview,
  getCaregiverAlerts,
  linkPatient,
  unlinkPatient,
  sendPatientAlert,
} from '../../services/api';

const NAV = [
  { id: 'patients', icon: 'ti-users', label: 'My Patients' },
  { id: 'alerts', icon: 'ti-bell', label: 'Alerts' },
  { id: 'reports', icon: 'ti-chart-bar', label: 'Reports' },
  { id: 'link', icon: 'ti-user-plus', label: 'Link Patient' },
  { id: 'profile', icon: 'ti-settings', label: 'Settings' },
];

export default function CaregiverApp() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  const initials = user?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'CG';
  const urgentCount = patients.filter((p) => parseFloat(p.adherence_pct || 0) < 60).length;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(''), 3000);
  };

  const load = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const [p, a] = await Promise.all([
        getMyPatients(),
        getCaregiverAlerts().catch(() => ({ data: [] })),
      ]);
      setPatients(p.data || []);
      setAlerts(a.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load caregiver data', 'error');
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 10000);
    return () => clearInterval(interval);
  }, []);

  const navWithBadge = NAV.map((n) => ({
    ...n,
    badge:
      n.id === 'patients'
        ? urgentCount
        : n.id === 'alerts'
          ? alerts.filter((a) => !a.is_read).length
          : 0,
  }));

  return (
    <>
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 9999,
            padding: '12px 18px',
            borderRadius: 12,
            background: toast.type === 'error' ? C.dan : toast.type === 'warning' ? C.wrn : C.suc,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            maxWidth: 420,
          }}
        >
          {toast.msg}
        </div>
      )}

      <Layout
        navItems={navWithBadge}
        sbColor={C.cgDk}
        role="caregiver"
        userName={user?.full_name}
        userEmail={user?.email}
        userInitials={initials}
      >
        {(page) => {
          if (page === 'patients') {
            return (
              <CaregiverPatients
                patients={patients}
                refresh={() => load(false)}
                showToast={showToast}
              />
            );
          }
          if (page === 'alerts') return <CaregiverAlerts alerts={alerts} />;
          if (page === 'reports') return <CaregiverReports patients={patients} showToast={showToast} />;
          if (page === 'link') {
            return <CaregiverLink setPatients={setPatients} showToast={showToast} />;
          }
          if (page === 'profile') return <CaregiverProfile user={user} showToast={showToast} />;
          return null;
        }}
      </Layout>
    </>
  );
}

function CaregiverPatients({ patients, refresh, showToast }) {
  const [selected, setSelected] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const selectPatient = async (pat) => {
    setSelected(pat);
    setLoading(true);
    try {
      const r = await getPatientOverview(pat.id);
      setOverview(r.data);
    } catch {
      setOverview({ profile: pat, medications: [], reminders: [], history: [] });
    } finally {
      setLoading(false);
    }
  };

  const reloadSelected = async () => {
    if (!selected) return;
    try {
      const r = await getPatientOverview(selected.id);
      setOverview(r.data);
    } catch {}
  };

  const sendMessage = async (customMessage, reminderId = null) => {
    if (!selected) return;
    const finalMessage = (customMessage || messageText || '').trim();
    if (!finalMessage) {
      showToast('Please type a message first', 'error');
      return;
    }

    setSending(true);
    try {
      await sendPatientAlert({
        patient_id: selected.id,
        reminder_id: reminderId,
        message: finalMessage,
      });
      showToast(`Message sent to ${selected.full_name}`);
      setMessageText('');
      setMessageOpen(false);
      await refresh();
    } catch (err) {
      showToast(err.message || 'Message failed', 'error');
    } finally {
      setSending(false);
    }
  };

  const sendMissedDoseAlert = async (reminder) => {
    const medicationName = reminder.med_name || reminder.medication_name || reminder.name || 'medication';
    await sendMessage(
      `Reminder from your caregiver: You missed ${medicationName} at ${String(reminder.scheduled_time).substring(0, 5)}. Please check your medication schedule.`,
      reminder.id
    );
  };

  const statusBg = (adh) => (adh >= 70 ? C.sucLt : adh >= 50 ? C.accLt : C.danLt);
  const statusCol = (adh) => (adh >= 70 ? C.suc : adh >= 50 ? C.wrn : C.dan);
  const statusLabel = (adh) => (adh >= 70 ? 'On track' : adh >= 50 ? 'At risk' : 'Critical');

  return (
    <div>
      <p style={{ color: C.mut, fontSize: 14, marginBottom: 18 }}>
        Monitoring {patients.length} patients · {patients.filter((p) => parseFloat(p.adherence_pct || 0) < 60).length} need attention
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total patients', val: patients.length, color: C.cgPri, bg: C.infLt, icon: 'ti-users' },
          { label: 'On track', val: patients.filter((p) => parseFloat(p.adherence_pct || 0) >= 70).length, color: C.suc, bg: C.sucLt, icon: 'ti-circle-check' },
          { label: 'At risk', val: patients.filter((p) => parseFloat(p.adherence_pct || 0) >= 50 && parseFloat(p.adherence_pct || 0) < 70).length, color: C.wrn, bg: C.accLt, icon: 'ti-alert-triangle' },
          { label: 'Critical', val: patients.filter((p) => parseFloat(p.adherence_pct || 0) < 50).length, color: C.dan, bg: C.danLt, icon: 'ti-alert-circle' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: `1px solid ${C.brd}`, borderTop: `4px solid ${s.color}` }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <i className={`ti ${s.icon}`} style={{ color: s.color, fontSize: 16 }} aria-hidden="true" />
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: C.mut }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        <div style={{ width: 270, flexShrink: 0 }}>
          <div style={{ ...S.card }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Patient list</div>
            {patients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.mut }}>
                <i className="ti ti-users" style={{ fontSize: 32, display: 'block', marginBottom: 8, color: C.brd }} aria-hidden="true" />
                <div style={{ fontSize: 13 }}>No patients linked yet</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Go to Link Patient tab</div>
              </div>
            ) : patients.map((p) => {
              const adh = parseFloat(p.adherence_pct || 0);
              const initials = p.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'P';
              return (
                <div
                  key={p.id}
                  onClick={() => selectPatient(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '11px 12px',
                    borderRadius: 12,
                    marginBottom: 7,
                    cursor: 'pointer',
                    border: `1.5px solid ${selected?.id === p.id ? C.cgPri : C.brd}`,
                    background: selected?.id === p.id ? C.infLt : '#fff',
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: statusBg(adh), display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusCol(adh), fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.full_name}</div>
                    <div style={{ fontSize: 11, color: C.mut }}>{p.relationship || p.email}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <div style={{ flex: 1, height: 4, background: C.brd, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(adh, 100)}%`, background: statusCol(adh), borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: statusCol(adh), flexShrink: 0 }}>{adh}%</span>
                    </div>
                  </div>
                  {Number(p.today_missed || 0) > 0 && (
                    <span style={{ background: C.dan, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, flexShrink: 0 }}>
                      {p.today_missed}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {!selected ? (
            <div style={{ ...S.card, textAlign: 'center', padding: '60px 20px' }}>
              <i className="ti ti-user-search" style={{ fontSize: 48, color: C.brd, display: 'block', marginBottom: 14 }} aria-hidden="true" />
              <div style={{ fontSize: 16, fontWeight: 600, color: C.mut }}>Select a patient to view details</div>
            </div>
          ) : loading ? (
            <div style={{ ...S.card, textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: 14, color: C.mut }}>Loading patient details...</div>
            </div>
          ) : overview && (
            <div>
              <div style={{ ...S.card, marginBottom: 12, borderLeft: `4px solid ${statusCol(parseFloat(selected.adherence_pct || 0))}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: statusBg(parseFloat(selected.adherence_pct || 0)), display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusCol(parseFloat(selected.adherence_pct || 0)), fontWeight: 700, fontSize: 16 }}>
                      {selected.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 17 }}>{selected.full_name}</div>
                      <div style={{ color: C.mut, fontSize: 13 }}>{selected.email} · {selected.phone || 'No phone'}</div>
                      {overview.profile?.medical_conditions?.length > 0 && (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 5 }}>
                          {overview.profile.medical_conditions.map((c) => (
                            <span key={c} style={{ background: C.infLt, color: C.inf, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{c}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <span style={{ background: statusBg(parseFloat(selected.adherence_pct || 0)), color: statusCol(parseFloat(selected.adherence_pct || 0)), padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {statusLabel(parseFloat(selected.adherence_pct || 0))}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                  {[
                    ['Adherence', `${Math.round(parseFloat(selected.adherence_pct || 0))}%`, statusCol(parseFloat(selected.adherence_pct || 0))],
                    ['Missed today', selected.today_missed || 0, C.dan],
                    ['Medications', selected.med_count || 0, C.cgPri],
                    ['Last seen', selected.last_seen ? new Date(selected.last_seen).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }) : 'Unknown', C.mut],
                  ].map(([k, v, col]) => (
                    <div key={k} style={{ textAlign: 'center', padding: '10px', background: '#f8f8f8', borderRadius: 10 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: col }}>{v}</div>
                      <div style={{ fontSize: 11, color: C.mut, marginTop: 2 }}>{k}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...S.card, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Today's medication schedule</div>
                  <button onClick={reloadSelected} style={{ ...S.btnGhost, fontSize: 12 }}>Refresh</button>
                </div>
                {(overview.reminders || []).length === 0 ? (
                  <div style={{ color: C.mut, fontSize: 13, fontStyle: 'italic' }}>No reminders for today</div>
                ) : (overview.reminders || []).map((r) => {
                  const sc = statusColor(r.status);
                  const medName = r.med_name || r.medication_name || r.name || 'Medication';
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, marginBottom: 7, background: sc.bg, borderLeft: `4px solid ${sc.border}` }}>
                      <i className="ti ti-pill" style={{ color: sc.border, fontSize: 16 }} aria-hidden="true" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{medName} {r.dosage}</div>
                        <div style={{ fontSize: 11, color: C.mut }}>{String(r.scheduled_time).substring(0, 5)} · {r.instructions || ''}</div>
                      </div>
                      <span style={{ background: sc.border, color: '#fff', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{r.status}</span>
                      {r.status === 'missed' && (
                        <button onClick={() => sendMissedDoseAlert(r)} disabled={sending} style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${C.dan}`, background: C.danLt, color: C.danDk, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Alert patient
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ ...S.card, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>All medications ({(overview.medications || []).length})</div>
                {(overview.medications || []).length === 0 ? (
                  <div style={{ color: C.mut, fontSize: 13 }}>No medication records available.</div>
                ) : (overview.medications || []).map((m) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: `1px solid #f5f5f5` }}>
                    <i className="ti ti-pill" style={{ color: C.cgPri, fontSize: 16, marginTop: 2, flexShrink: 0 }} aria-hidden="true" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name} {m.dosage}</div>
                      <div style={{ fontSize: 12, color: C.mut }}>{m.frequency} · {(m.times || []).join(', ')}</div>
                      {m.instructions && <div style={{ fontSize: 11, color: C.mut }}>{m.instructions}</div>}
                    </div>
                    <span style={{ fontSize: 11, color: C.mut, flexShrink: 0 }}>{m.category}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setMessageOpen(true)} style={{ ...S.btnPrimary(C.cgPri), flex: 1, justifyContent: 'center' }}>
                  <i className="ti ti-message" aria-hidden="true" /> Message patient
                </button>
                <button onClick={() => setReportOpen(true)} style={{ ...S.btnGhost, flex: 1, justifyContent: 'center' }}>
                  <i className="ti ti-file-report" aria-hidden="true" /> Generate report
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm(`Unlink ${selected.full_name}?`)) return;
                    await unlinkPatient(selected.id);
                    showToast('Patient unlinked');
                    setSelected(null);
                    setOverview(null);
                    await refresh();
                  }}
                  style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${C.dan}`, background: C.danLt, color: C.danDk, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
                >
                  <i className="ti ti-user-minus" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {messageOpen && selected && (
        <SimpleModal title={`Message ${selected.full_name}`} onClose={() => setMessageOpen(false)}>
          <p style={{ color: C.mut, fontSize: 13, marginBottom: 10 }}>
            This message will appear in the patient's My Caregiver notifications.
          </p>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message to the patient..."
            rows={5}
            style={{ ...S.input, resize: 'vertical', minHeight: 110, marginBottom: 12 }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => sendMessage()} disabled={sending} style={{ ...S.btnPrimary(C.cgPri), flex: 1, justifyContent: 'center' }}>
              {sending ? 'Sending...' : 'Send message'}
            </button>
            <button onClick={() => setMessageOpen(false)} style={{ ...S.btnGhost, flex: 1, justifyContent: 'center' }}>Cancel</button>
          </div>
        </SimpleModal>
      )}

      {reportOpen && selected && overview && (
        <SimpleModal title={`${selected.full_name} medication report`} onClose={() => setReportOpen(false)} wide>
          <PatientReport patient={selected} overview={overview} />
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={() => window.print()} style={{ ...S.btnPrimary(C.cgPri) }}>Print / Save PDF</button>
            <button onClick={() => setReportOpen(false)} style={{ ...S.btnGhost }}>Close</button>
          </div>
        </SimpleModal>
      )}
    </div>
  );
}

function CaregiverAlerts({ alerts }) {
  return (
    <div>
      <p style={{ color: C.mut, fontSize: 14, marginBottom: 18 }}>
        {alerts.length} alerts received · {alerts.filter((a) => !a.is_read).length} unread
      </p>
      {alerts.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', padding: '48px' }}>
          <i className="ti ti-bell-off" style={{ fontSize: 48, color: C.brd, display: 'block', marginBottom: 12 }} aria-hidden="true" />
          <div style={{ fontSize: 16, fontWeight: 600, color: C.mut }}>No alerts yet</div>
          <div style={{ fontSize: 13, color: C.mut, marginTop: 6 }}>You'll receive alerts here when patients miss doses.</div>
        </div>
      ) : alerts.map((a) => (
        <div key={a.id} style={{ ...S.card, marginBottom: 10, background: a.is_read ? '#fff' : '#FFF8EE', borderLeft: `4px solid ${a.type === 'missed' ? C.dan : a.type === 'caregiver_alert' ? C.wrn : C.cgPri}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: a.type === 'missed' ? C.danLt : C.accLt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`ti ${a.type === 'missed' ? 'ti-alert-triangle' : 'ti-bell'}`} style={{ color: a.type === 'missed' ? C.dan : C.wrn, fontSize: 16 }} aria-hidden="true" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: !a.is_read ? 700 : 600, fontSize: 14 }}>{a.title}</div>
              {(a.patient_name || a.full_name) && <div style={{ fontSize: 12, color: C.cgPri, fontWeight: 600, marginTop: 2 }}>Patient: {a.patient_name || a.full_name}</div>}
              <div style={{ fontSize: 13, color: C.mut, marginTop: 2 }}>{a.message}</div>
              <div style={{ fontSize: 11, color: C.brd, marginTop: 4 }}>{new Date(a.sent_at).toLocaleString('en-AU')}</div>
            </div>
            {!a.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.acc, flexShrink: 0, marginTop: 4 }} />}
          </div>
        </div>
      ))}
    </div>
  );
}

function CaregiverReports({ patients }) {
  const total = patients.length;
  const critical = patients.filter((p) => parseFloat(p.adherence_pct || 0) < 50).length;
  const missed = patients.reduce((sum, p) => sum + Number(p.today_missed || 0), 0);
  const avg = total ? Math.round(patients.reduce((sum, p) => sum + parseFloat(p.adherence_pct || 0), 0) / total) : 0;

  return (
    <div>
      <p style={{ color: C.mut, fontSize: 14, marginBottom: 18 }}>One-page adherence report for all linked patients</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          ['Patients', total, C.cgPri],
          ['Average adherence', `${avg}%`, avg >= 70 ? C.suc : avg >= 50 ? C.wrn : C.dan],
          ['Missed today', missed, C.dan],
          ['Critical patients', critical, C.dan],
        ].map(([label, value, color]) => (
          <div key={label} style={{ ...S.card, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, color: C.mut }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ ...S.card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>All patient report</div>
          <button onClick={() => window.print()} style={{ ...S.btnGhost, fontSize: 12 }}>Print / Save PDF</button>
        </div>

        {patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: C.mut }}>No patients linked yet</div>
        ) : patients.map((p) => {
          const adh = parseFloat(p.adherence_pct || 0);
          const col = adh >= 70 ? C.suc : adh >= 50 ? C.wrn : C.dan;
          return (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr .8fr .8fr .8fr .9fr', gap: 12, alignItems: 'center', padding: '14px 0', borderBottom: `1px solid #f5f5f5` }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.full_name}</div>
                <div style={{ fontSize: 12, color: C.mut }}>{p.email}</div>
              </div>
              <div style={{ fontSize: 13 }}>{p.med_count || 0} meds</div>
              <div style={{ fontSize: 13, color: C.dan }}>{p.today_missed || 0} missed</div>
              <div>
                <div style={{ height: 8, background: C.brd, borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(adh, 100)}%`, background: col }} />
                </div>
                <div style={{ fontSize: 11, color: col, fontWeight: 700, marginTop: 3 }}>{adh}%</div>
              </div>
              <span style={{ textAlign: 'center', padding: '5px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: adh >= 70 ? C.sucLt : adh >= 50 ? C.accLt : C.danLt, color: col }}>
                {adh >= 70 ? 'Good' : adh >= 50 ? 'At risk' : 'Critical'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CaregiverLink({ setPatients, showToast }) {
  const [form, setForm] = useState({ patient_email: '', relationship: '' });
  const [loading, setLoading] = useState(false);

  const link = async () => {
    if (!form.patient_email) {
      showToast('Patient email is required', 'error');
      return;
    }
    setLoading(true);
    try {
      await linkPatient(form);
      showToast('Successfully linked to patient!');
      setForm({ patient_email: '', relationship: '' });
      const r = await getMyPatients();
      setPatients(r.data || []);
    } catch (err) {
      showToast(err.message || 'Failed to link patient', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p style={{ color: C.mut, fontSize: 14, marginBottom: 18 }}>Link a patient by entering their registered email address</p>
      <div style={{ ...S.card, maxWidth: 480 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Link new patient</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 5 }}>Patient email address *</label>
          <input style={{ ...S.input }} type="email" placeholder="patient@example.com" value={form.patient_email} onChange={(e) => setForm((p) => ({ ...p, patient_email: e.target.value }))} />
          <div style={{ fontSize: 11, color: C.mut, marginTop: 4 }}>The patient must have a registered MediCare patient account.</div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 5 }}>Your relationship to the patient</label>
          <select style={{ ...S.input }} value={form.relationship} onChange={(e) => setForm((p) => ({ ...p, relationship: e.target.value }))}>
            <option value="">Select relationship...</option>
            {['Daughter', 'Son', 'Spouse/Partner', 'Parent', 'Sibling', 'Friend', 'Nurse', 'Doctor', 'Carer'].map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <button onClick={link} disabled={loading} style={{ ...S.btnPrimary(C.cgPri), width: '100%', justifyContent: 'center' }}>
          {loading ? 'Linking...' : <><i className="ti ti-user-plus" aria-hidden="true" /> Link patient</>}
        </button>
      </div>
    </div>
  );
}

function CaregiverProfile({ user, showToast }) {
  const { setUser } = useAuth();
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    notify_email: user?.notify_email ?? true,
    notify_push: user?.notify_push ?? true,
    notify_sms: user?.notify_sms ?? false,
  });
  const { updateProfile } = require('../../services/api');

  const save = async () => {
    try {
      const r = await updateProfile(form);
      setUser(r.data.user);
      showToast('Settings saved!');
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <p style={{ color: C.mut, fontSize: 14, marginBottom: 18 }}>Manage your caregiver account and notification preferences</p>
      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Account details</div>
        {[
          ['Full name', 'full_name', 'text'],
          ['Phone', 'phone', 'tel'],
        ].map(([l, k, t]) => (
          <div key={k} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.mut, display: 'block', marginBottom: 4 }}>{l}</label>
            <input style={{ ...S.input }} type={t} value={form[k]} onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))} />
          </div>
        ))}
        <div style={{ padding: '12px 14px', background: '#f8f8f8', borderRadius: 10, fontSize: 13, color: C.mut, marginBottom: 14 }}>
          <strong>Email:</strong> {user?.email} <span style={{ fontSize: 11 }}>(cannot be changed)</span>
        </div>
      </div>

      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Alert preferences</div>
        {[
          ['Email alerts when patient misses dose', 'notify_email', 'ti-mail'],
          ['Push notifications', 'notify_push', 'ti-device-laptop'],
          ['SMS alerts', 'notify_sms', 'ti-device-mobile'],
        ].map(([l, k, ic]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: `1px solid #f5f5f5` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13 }}>
              <i className={`ti ${ic}`} style={{ color: C.cgPri, fontSize: 16 }} aria-hidden="true" />{l}
            </div>
            <div onClick={() => setForm((p) => ({ ...p, [k]: !p[k] }))} style={{ width: 40, height: 22, borderRadius: 11, background: form[k] ? C.cgPri : C.brd, position: 'relative', cursor: 'pointer' }}>
              <div style={{ position: 'absolute', top: 3, left: form[k] ? 21 : 3, width: 16, height: 16, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }} />
            </div>
          </div>
        ))}
      </div>
      <button onClick={save} style={{ ...S.btnPrimary(C.cgPri) }}>Save settings</button>
    </div>
  );
}

function SimpleModal({ title, children, onClose, wide = false }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: wide ? 760 : 460, maxWidth: '96vw', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.brd}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>
  );
}

function PatientReport({ patient, overview }) {
  const adherence = Math.round(parseFloat(patient.adherence_pct || 0));
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{patient.full_name}</div>
        <div style={{ fontSize: 13, color: C.mut }}>{patient.email} · {patient.phone || 'No phone'}</div>
        <div style={{ fontSize: 12, color: C.mut }}>Generated: {new Date().toLocaleString('en-AU')}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
        {[
          ['Adherence', `${adherence}%`],
          ['Medications', overview.medications?.length || 0],
          ['Today reminders', overview.reminders?.length || 0],
          ['Missed today', patient.today_missed || 0],
        ].map(([k, v]) => (
          <div key={k} style={{ background: '#f8f8f8', borderRadius: 10, padding: 12, textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{v}</div>
            <div style={{ fontSize: 11, color: C.mut }}>{k}</div>
          </div>
        ))}
      </div>

      <div style={{ fontWeight: 700, marginBottom: 8 }}>Medication list</div>
      {(overview.medications || []).length === 0 ? (
        <div style={{ color: C.mut, fontSize: 13 }}>No medications found.</div>
      ) : (overview.medications || []).map((m) => (
        <div key={m.id} style={{ padding: '8px 0', borderBottom: `1px solid ${C.brd}` }}>
          <div style={{ fontWeight: 700 }}>{m.name} {m.dosage}</div>
          <div style={{ fontSize: 12, color: C.mut }}>{m.frequency} · {(m.times || []).join(', ')} · {m.category}</div>
          {m.instructions && <div style={{ fontSize: 12, color: C.mut }}>{m.instructions}</div>}
        </div>
      ))}

      <div style={{ fontWeight: 700, margin: '14px 0 8px' }}>Today reminders</div>
      {(overview.reminders || []).length === 0 ? (
        <div style={{ color: C.mut, fontSize: 13 }}>No reminders for today.</div>
      ) : (overview.reminders || []).map((r) => (
        <div key={r.id} style={{ padding: '8px 0', borderBottom: `1px solid ${C.brd}`, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700 }}>{r.med_name || r.medication_name || 'Medication'} {r.dosage}</div>
            <div style={{ fontSize: 12, color: C.mut }}>{String(r.scheduled_time).substring(0, 5)}</div>
          </div>
          <span style={{ fontWeight: 700 }}>{r.status}</span>
        </div>
      ))}
    </div>
  );
}
