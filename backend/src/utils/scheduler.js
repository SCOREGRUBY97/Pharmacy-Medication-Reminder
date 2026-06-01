const cron = require('node-cron');
const { query } = require('../config/db');
const { sendEmail, reminderEmail, missedDoseAlert, lowStockAlert, weeklyReportEmail, streakEmail } = require('./emailService');
const { sendPush, pushTypes } = require('./pushService');
const logger = require('./logger');

const startScheduler = () => {
  logger.info('⏰ Scheduler started');

  // ─── Every Minute: Send Due Reminders ──────────────────────
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const today = now.toISOString().split('T')[0];
    try {
      const due = await query(`
        SELECT r.id, r.user_id, r.medication_id,
               u.full_name, u.email, u.notify_email, u.notify_push,
               m.name, m.dosage, m.medication_type, m.instructions
        FROM reminders r
        JOIN users u ON r.user_id = u.id
        JOIN medications m ON r.medication_id = m.id
        WHERE r.scheduled_date=$1 AND r.status='pending'
          AND r.notified_at IS NULL
          AND TO_CHAR(r.scheduled_time,'HH24:MI')=$2
          AND u.is_active=true
      `, [today, time]);

      for (const r of due.rows) {
        if (r.notify_email) sendEmail({ to: r.email, ...reminderEmail(r.full_name, [r]) }).catch(() => {});
        if (r.notify_push) sendPush(r.user_id, pushTypes.reminder(r, r.id)).catch(() => {});
        await query('UPDATE reminders SET notified_at=NOW() WHERE id=$1', [r.id]);
        await query(`INSERT INTO notifications(user_id,reminder_id,type,channel,title,message)
          VALUES($1,$2,'reminder','push',$3,$4)`,
          [r.user_id, r.id, `Time for ${r.name}`, `Take ${r.dosage} of ${r.name}`]);
        logger.info(`Reminder sent: ${r.full_name} → ${r.name}`);
      }
    } catch (err) { logger.error('Reminder scheduler error', { error: err.message }); }
  });

  // ─── Every 5 Minutes: Mark Missed & Alert Caregivers ───────
  cron.schedule('*/5 * * * *', async () => {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);
    const cutoffTime = `${String(cutoff.getHours()).padStart(2,'0')}:${String(cutoff.getMinutes()).padStart(2,'0')}`;
    const today = cutoff.toISOString().split('T')[0];
    try {
      const missed = await query(`
        SELECT r.id, r.user_id, r.medication_id,
               TO_CHAR(r.scheduled_time,'HH12:MI AM') AS time_str,
               u.full_name, u.email, m.name, m.dosage
        FROM reminders r
        JOIN users u ON r.user_id = u.id
        JOIN medications m ON r.medication_id = m.id
        WHERE r.scheduled_date=$1 AND r.status='pending'
          AND r.notified_at IS NOT NULL
          AND TO_CHAR(r.scheduled_time,'HH24:MI')<=$2
      `, [today, cutoffTime]);

      for (const r of missed.rows) {
        await query('UPDATE reminders SET status=$1 WHERE id=$2', ['missed', r.id]);
        await query(`INSERT INTO adherence_records(reminder_id,user_id,medication_id,action)
          VALUES($1,$2,$3,'missed')`, [r.id, r.user_id, r.medication_id]);

        // Alert caregivers
        const cgs = await query(`
          SELECT u.id, u.full_name, u.email, u.notify_email, u.notify_push
          FROM caregiver_patients cp JOIN users u ON cp.caregiver_id=u.id
          WHERE cp.patient_id=$1 AND cp.is_active=true AND u.is_active=true
        `, [r.user_id]);

        for (const cg of cgs.rows) {
          if (cg.notify_email) sendEmail({ to: cg.email, ...missedDoseAlert(cg.full_name, r.full_name, `${r.name} ${r.dosage}`, r.time_str) }).catch(() => {});
          if (cg.notify_push) sendPush(cg.id, pushTypes.missed(r.full_name, r.name, r.time_str)).catch(() => {});
          await query(`INSERT INTO notifications(user_id,reminder_id,type,channel,title,message)
            VALUES($1,$2,'caregiver_alert','push',$3,$4)`,
            [cg.id, r.id, `Missed: ${r.full_name}`, `${r.full_name} missed ${r.name} at ${r.time_str}`]);
        }
        logger.info(`Missed dose: ${r.full_name} → ${r.name}`);
      }
    } catch (err) { logger.error('Missed dose checker error', { error: err.message }); }
  });

  // ─── Midnight: Generate Tomorrow's Reminders ───────────────
  cron.schedule('0 0 * * *', async () => {
    const tom = new Date(); tom.setDate(tom.getDate() + 1);
    const tomStr = tom.toISOString().split('T')[0];
    try {
      const meds = await query(`
        SELECT m.id, m.user_id, unnest(m.times) AS t
        FROM medications m
        WHERE m.is_active=true AND m.start_date<=$1
          AND (m.end_date IS NULL OR m.end_date>=$1)
      `, [tomStr]);
      let count = 0;
      for (const m of meds.rows) {
        const r = await query(`INSERT INTO reminders(medication_id,user_id,scheduled_time,scheduled_date)
          VALUES($1,$2,$3::TIME,$4) ON CONFLICT DO NOTHING`, [m.id, m.user_id, m.t, tomStr]);
        if (r.rowCount) count++;
      }
      logger.info(`Generated ${count} reminders for ${tomStr}`);
    } catch (err) { logger.error('Daily generation error', { error: err.message }); }
  });

  // ─── 9AM Daily: Low Stock Check ────────────────────────────
  cron.schedule('0 9 * * *', async () => {
    try {
      const meds = await query(`
        SELECT m.*, u.full_name, u.email, u.notify_email
        FROM medications m JOIN users u ON m.user_id=u.id
        WHERE m.is_active=true AND m.refill_reminder=true
          AND m.current_stock IS NOT NULL
          AND m.current_stock <= m.refill_days_before
          AND u.is_active=true
      `);
      for (const m of meds.rows) {
        if (m.notify_email) sendEmail({ to: m.email, ...lowStockAlert(m.full_name, m.name, m.current_stock) }).catch(() => {});
        sendPush(m.user_id, pushTypes.lowStock(m.name, m.current_stock)).catch(() => {});
        logger.info(`Low stock alert: ${m.full_name} → ${m.name} (${m.current_stock} left)`);
      }
    } catch (err) { logger.error('Stock check error', { error: err.message }); }
  });

  // ─── Sunday 8AM: Weekly Reports ────────────────────────────
  cron.schedule('0 8 * * 0', async () => {
    try {
      const users = await query(`
        SELECT u.id, u.full_name, u.email, u.notify_email,
               COUNT(r.id) AS total,
               COUNT(r.id) FILTER(WHERE r.status='taken') AS taken,
               COUNT(r.id) FILTER(WHERE r.status='missed') AS missed,
               ROUND(COUNT(r.id) FILTER(WHERE r.status='taken')*100.0/NULLIF(COUNT(r.id),0)) AS adherence_pct
        FROM users u LEFT JOIN reminders r ON r.user_id=u.id
          AND r.scheduled_date >= CURRENT_DATE-7
        WHERE u.role='patient' AND u.is_active=true
        GROUP BY u.id
      `);
      for (const u of users.rows) {
        if (u.notify_email && u.total > 0) {
          sendEmail({ to: u.email, ...weeklyReportEmail(u.full_name, u) }).catch(() => {});
          logger.info(`Weekly report sent to ${u.full_name}`);
        }
      }
    } catch (err) { logger.error('Weekly report error', { error: err.message }); }
  });

  // ─── Daily: Streak Check & Celebration ─────────────────────
  cron.schedule('0 20 * * *', async () => {
    try {
      const streaks = await query(`
        SELECT user_id, COUNT(DISTINCT scheduled_date) AS streak
        FROM reminders
        WHERE scheduled_date >= CURRENT_DATE - 30
          AND status = 'taken'
        GROUP BY user_id
        HAVING COUNT(DISTINCT scheduled_date) IN (7,14,30,60,100)
      `);
      for (const s of streaks.rows) {
        sendPush(s.user_id, pushTypes.streak(s.streak)).catch(() => {});
        const u = await query('SELECT full_name, email, notify_email FROM users WHERE id=$1', [s.user_id]);
        if (u.rows[0]?.notify_email) {
          sendEmail({ to: u.rows[0].email, ...streakEmail(u.rows[0].full_name, s.streak) }).catch(() => {});
        }
        await query(`INSERT INTO notifications(user_id,type,channel,title,message)
          VALUES($1,'streak','push',$2,$3)`,
          [s.user_id, `🔥 ${s.streak}-Day Streak!`, `You've taken all meds for ${s.streak} days straight!`]);
      }
    } catch (err) { logger.error('Streak check error', { error: err.message }); }
  });
};

module.exports = { startScheduler };
