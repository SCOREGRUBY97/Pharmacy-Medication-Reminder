const nodemailer = require('nodemailer');
require('dotenv').config();

// ─── Create Transporter ────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Verify email connection on startup ───────────────────────
transporter.verify((err) => {
  if (err) console.error('[Email] Connection failed:', err.message);
  else console.log('[Email] Service ready');
});

// ─── Send Medication Reminder ─────────────────────────────────
const sendMedicationReminder = async ({ to, name, medicationName, dosage, time, instructions }) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#f7faf8;border-radius:12px;">
      <h2 style="color:#0F6E56;">💊 Medication Reminder</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>It's time to take your medication:</p>
      <div style="background:#fff;padding:16px;border-radius:8px;border-left:4px solid #0F6E56;margin:16px 0;">
        <p style="margin:0;font-size:18px;font-weight:bold;color:#0F6E56;">${medicationName}</p>
        <p style="margin:4px 0;color:#555;">Dosage: <strong>${dosage}</strong></p>
        <p style="margin:4px 0;color:#555;">Scheduled: <strong>${time}</strong></p>
        ${instructions ? `<p style="margin:4px 0;color:#555;">Instructions: ${instructions}</p>` : ''}
      </div>
      <p style="color:#888;font-size:13px;">Log in to MediCare to mark this dose as taken.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
      <p style="color:#aaa;font-size:12px;">MediCare Pharmacy Reminder System</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `💊 Time to take ${medicationName}`,
    html,
  });
  console.log(`[Email] Reminder sent to ${to} for ${medicationName}`);
};

// ─── Send Caregiver Missed Dose Alert ─────────────────────────
const sendCaregiverAlert = async (caregiver, reminder) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#fff5f5;border-radius:12px;">
      <h2 style="color:#E24B4A;">⚠️ Missed Dose Alert</h2>
      <p>Hi <strong>${caregiver.caregiver_name}</strong>,</p>
      <p>Your patient missed their scheduled medication dose:</p>
      <div style="background:#fff;padding:16px;border-radius:8px;border-left:4px solid #E24B4A;margin:16px 0;">
        <p style="margin:0;color:#555;">Scheduled time: <strong>${reminder.reminder_time}</strong></p>
        <p style="margin:4px 0;color:#555;">Date: <strong>${reminder.reminder_date}</strong></p>
      </div>
      <p>Please check in with your patient.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
      <p style="color:#aaa;font-size:12px;">MediCare Pharmacy Reminder System</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: caregiver.caregiver_email,
    subject: '⚠️ Your patient missed a medication dose',
    html,
  });
  console.log(`[Email] Caregiver alert sent to ${caregiver.caregiver_email}`);
};

// ─── Send Welcome Email ───────────────────────────────────────
const sendWelcomeEmail = async ({ to, name }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: '👋 Welcome to MediCare Reminder!',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">
        <h2 style="color:#0F6E56;">Welcome to MediCare, ${name}! 💊</h2>
        <p>Your account is ready. Start adding your medications and never miss a dose again.</p>
        <p style="color:#aaa;font-size:12px;">MediCare Pharmacy Reminder System</p>
      </div>
    `,
  });
};

module.exports = { sendMedicationReminder, sendCaregiverAlert, sendWelcomeEmail };
