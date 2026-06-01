const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false },
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to, subject, html, text,
    });
    logger.info(`Email sent to ${to}`, { messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Email failed to ${to}`, { error: error.message });
    return { success: false, error: error.message };
  }
};

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 560px; margin: 0 auto; background: #f5f5f3;
  padding: 20px; border-radius: 12px;
`;
const cardStyle = `background:#fff; padding:28px 32px; border-radius:8px; margin-top:12px;`;
const btnStyle = (bg='#0F6E56') => `
  display:inline-block; background:${bg}; color:#fff; padding:12px 28px;
  border-radius:8px; text-decoration:none; font-weight:600; font-size:14px; margin-top:16px;
`;

// ─── Templates ───────────────────────────────────────────────

const welcomeEmail = (name, role) => ({
  subject: '💊 Welcome to MediCare!',
  html: `<div style="${baseStyle}">
    <div style="background:#0F6E56;padding:24px;border-radius:8px 8px 0 0;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:24px">💊 MediCare</h1>
      <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Pharmacy Medication Reminder</p>
    </div>
    <div style="${cardStyle}">
      <h2 style="color:#1a1a1a;margin:0 0 12px">Welcome, ${name}!</h2>
      <p style="color:#555;line-height:1.6">Your <strong>${role}</strong> account is ready.</p>
      <p style="color:#555;line-height:1.6">${
        role==='patient' ? 'Start by adding your medications and we\'ll send you reminders so you never miss a dose.' :
        role==='caregiver' ? 'You can now link your patients and monitor their medication adherence in real-time.' :
        'You have full admin access. Manage users, medications, and monitor the entire system.'
      }</p>
      <a href="${process.env.CLIENT_URL}" style="${btnStyle()}">Get Started →</a>
    </div>
    <p style="color:#aaa;font-size:12px;text-align:center;margin-top:16px">
      MediCare · Helping you stay on track with your health
    </p>
  </div>`,
});

const reminderEmail = (patientName, medications) => ({
  subject: `💊 Medication Reminder — Time to take your meds!`,
  html: `<div style="${baseStyle}">
    <div style="background:#0F6E56;padding:24px;border-radius:8px 8px 0 0;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">💊 Medication Reminder</h1>
    </div>
    <div style="${cardStyle}">
      <h2 style="color:#1a1a1a;margin:0 0 8px">Hi ${patientName},</h2>
      <p style="color:#555">It's time to take your medication(s):</p>
      ${medications.map(m => `
        <div style="background:#E1F5EE;border-left:4px solid #0F6E56;padding:14px 16px;margin:12px 0;border-radius:0 8px 8px 0">
          <div style="font-weight:700;color:#085041;font-size:15px">${m.name} — ${m.dosage}</div>
          <div style="color:#0F6E56;font-size:13px;margin-top:4px">${m.instructions || 'Take as directed'}</div>
          ${m.type ? `<div style="color:#888;font-size:12px;margin-top:2px;text-transform:capitalize">${m.type}</div>` : ''}
        </div>
      `).join('')}
      <a href="${process.env.CLIENT_URL}/reminders" style="${btnStyle()}">Mark as Taken ✓</a>
      <p style="color:#aaa;font-size:12px;margin-top:20px">
        Open MediCare app to mark your dose and track your adherence.
      </p>
    </div>
  </div>`,
});

const missedDoseAlert = (caregiverName, patientName, medName, time) => ({
  subject: `⚠️ Alert: ${patientName} missed a dose`,
  html: `<div style="${baseStyle}">
    <div style="background:#D85A30;padding:24px;border-radius:8px 8px 0 0;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">⚠️ Missed Dose Alert</h1>
    </div>
    <div style="${cardStyle}">
      <h2 style="color:#1a1a1a;margin:0 0 8px">Hi ${caregiverName},</h2>
      <p style="color:#555;line-height:1.6">
        Your patient <strong>${patientName}</strong> has missed a scheduled dose:
      </p>
      <div style="background:#FCEBEB;border-left:4px solid #E24B4A;padding:14px 16px;margin:12px 0;border-radius:0 8px 8px 0">
        <div style="font-weight:700;color:#A32D2D;font-size:15px">${medName}</div>
        <div style="color:#E24B4A;font-size:13px;margin-top:4px">Scheduled at ${time} — Not taken</div>
      </div>
      <p style="color:#555">Please check in with your patient as soon as possible.</p>
      <a href="${process.env.CLIENT_URL}/caregiver" style="${btnStyle('#D85A30')}">View Patient Status →</a>
    </div>
  </div>`,
});

const passwordResetEmail = (name, resetUrl) => ({
  subject: '🔐 Reset Your MediCare Password',
  html: `<div style="${baseStyle}">
    <div style="background:#185FA5;padding:24px;border-radius:8px 8px 0 0;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">🔐 Password Reset</h1>
    </div>
    <div style="${cardStyle}">
      <h2 style="color:#1a1a1a;margin:0 0 8px">Hi ${name},</h2>
      <p style="color:#555;line-height:1.6">You requested a password reset. Click below to set a new password.</p>
      <p style="color:#888;font-size:13px">This link expires in <strong>1 hour</strong>.</p>
      <a href="${resetUrl}" style="${btnStyle('#185FA5')}">Reset Password →</a>
      <p style="color:#aaa;font-size:12px;margin-top:20px">
        If you didn't request this, please ignore this email. Your account is safe.
      </p>
    </div>
  </div>`,
});

const lowStockAlert = (patientName, medName, daysLeft) => ({
  subject: `🔔 Low Stock Alert — ${medName}`,
  html: `<div style="${baseStyle}">
    <div style="background:#BA7517;padding:24px;border-radius:8px 8px 0 0;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">🔔 Low Stock Alert</h1>
    </div>
    <div style="${cardStyle}">
      <h2 style="color:#1a1a1a;margin:0 0 8px">Hi ${patientName},</h2>
      <div style="background:#FAEEDA;border-left:4px solid #BA7517;padding:14px 16px;margin:12px 0;border-radius:0 8px 8px 0">
        <div style="font-weight:700;color:#633806;font-size:15px">${medName}</div>
        <div style="color:#BA7517;font-size:13px;margin-top:4px">Only ${daysLeft} days of supply remaining</div>
      </div>
      <p style="color:#555">Time to refill your prescription before you run out!</p>
      <a href="${process.env.CLIENT_URL}/medications" style="${btnStyle('#BA7517')}">View Medications →</a>
    </div>
  </div>`,
});

const weeklyReportEmail = (name, stats) => ({
  subject: `📊 Your Weekly MediCare Report`,
  html: `<div style="${baseStyle}">
    <div style="background:#0F6E56;padding:24px;border-radius:8px 8px 0 0;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">📊 Weekly Report</h1>
      <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">Your medication adherence summary</p>
    </div>
    <div style="${cardStyle}">
      <h2 style="color:#1a1a1a;margin:0 0 16px">Hi ${name},</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        ${[
          ['Adherence Rate', `${stats.adherence_pct}%`, stats.adherence_pct>=80?'#639922':'#E24B4A'],
          ['Doses Taken', stats.taken, '#639922'],
          ['Doses Missed', stats.missed, '#E24B4A'],
          ['Total Doses', stats.total, '#185FA5'],
        ].map(([label,val,color]) => `
          <div style="background:#f9f9f9;padding:14px;border-radius:8px;text-align:center">
            <div style="font-size:22px;font-weight:700;color:${color}">${val}</div>
            <div style="font-size:12px;color:#888;margin-top:4px">${label}</div>
          </div>
        `).join('')}
      </div>
      <a href="${process.env.CLIENT_URL}/history" style="${btnStyle()}">View Full Report →</a>
    </div>
  </div>`,
});

const streakEmail = (name, days) => ({
  subject: `🔥 ${days}-Day Streak! Keep it up!`,
  html: `<div style="${baseStyle}">
    <div style="background:#BA7517;padding:24px;border-radius:8px 8px 0 0;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:28px">🔥 ${days} Days!</h1>
      <p style="color:rgba(255,255,255,0.8);margin:4px 0 0">Amazing consistency!</p>
    </div>
    <div style="${cardStyle}">
      <h2 style="color:#1a1a1a;margin:0 0 8px">Incredible, ${name}!</h2>
      <p style="color:#555;line-height:1.6">
        You've taken all your medications on time for <strong>${days} days in a row!</strong>
        This kind of consistency makes a real difference to your health.
      </p>
      <a href="${process.env.CLIENT_URL}" style="${btnStyle('#BA7517')}">Keep the streak going! 🔥</a>
    </div>
  </div>`,
});

module.exports = {
  sendEmail,
  welcomeEmail,
  reminderEmail,
  missedDoseAlert,
  passwordResetEmail,
  lowStockAlert,
  weeklyReportEmail,
  streakEmail,
};
