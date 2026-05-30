const cron = require('node-cron');
const pool = require('../config/db');
const { sendMedicationReminder } = require('./emailService');

// ─── Generate Daily Reminders ─────────────────────────────────
// Runs every day at midnight to create reminder rows for the day
const generateDailyReminders = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Generating daily reminders...');
    const today = new Date().toISOString().split('T')[0];
    try {
      const medications = await pool.query(
        `SELECT medication_id, user_id, times
         FROM medications
         WHERE is_active = TRUE
           AND start_date <= $1
           AND (end_date IS NULL OR end_date >= $1)`,
        [today]
      );

      for (const med of medications.rows) {
        for (const time of med.times) {
          // Avoid duplicates
          const exists = await pool.query(
            'SELECT 1 FROM reminders WHERE medication_id=$1 AND reminder_date=$2 AND reminder_time=$3',
            [med.medication_id, today, time]
          );
          if (exists.rows.length === 0) {
            await pool.query(
              `INSERT INTO reminders (medication_id, user_id, reminder_time, reminder_date)
               VALUES ($1,$2,$3,$4)`,
              [med.medication_id, med.user_id, time, today]
            );
          }
        }
      }
      console.log(`[Scheduler] Reminders generated for ${today}`);
    } catch (err) {
      console.error('[Scheduler] Error generating reminders:', err);
    }
  }, { timezone: 'Australia/Sydney' });
};

// ─── Send Email Reminders ─────────────────────────────────────
// Runs every minute and checks if any pending reminders are due
const sendPendingReminders = () => {
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    try {
      const due = await pool.query(
        `SELECT r.reminder_id, r.reminder_time, r.user_id,
                m.medication_name, m.dosage, m.instructions,
                u.email, u.full_name
         FROM reminders r
         JOIN medications m ON r.medication_id = m.medication_id
         JOIN users u ON r.user_id = u.user_id
         WHERE r.reminder_date = $1
           AND r.reminder_time::text LIKE $2
           AND r.status = 'pending'
           AND r.sent_at IS NULL`,
        [today, `${currentTime}%`]
      );

      for (const reminder of due.rows) {
        // Send email notification
        await sendMedicationReminder({
          to: reminder.email,
          name: reminder.full_name,
          medicationName: reminder.medication_name,
          dosage: reminder.dosage,
          time: reminder.reminder_time,
          instructions: reminder.instructions,
        });

        // Mark as sent and log notification
        await pool.query(
          `UPDATE reminders SET status = 'sent', sent_at = NOW()
           WHERE reminder_id = $1`,
          [reminder.reminder_id]
        );

        await pool.query(
          `INSERT INTO notifications (reminder_id, user_id, notification_type, title, message, delivery_status)
           VALUES ($1, $2, 'email', $3, $4, 'sent')`,
          [
            reminder.reminder_id,
            reminder.user_id,
            `Time to take ${reminder.medication_name}`,
            `Your ${reminder.reminder_time} dose of ${reminder.medication_name} ${reminder.dosage} is due now.`,
          ]
        );
      }

      if (due.rows.length > 0)
        console.log(`[Scheduler] ${due.rows.length} reminder(s) sent at ${currentTime}`);
    } catch (err) {
      console.error('[Scheduler] Error sending reminders:', err);
    }
  });
};

// ─── Mark Overdue Reminders as Missed ────────────────────────
// Runs every 30 minutes and marks sent reminders older than 30 mins as missed
const markOverdueAsMissed = () => {
  cron.schedule('*/30 * * * *', async () => {
    try {
      const result = await pool.query(
        `UPDATE reminders SET status = 'missed'
         WHERE status = 'sent'
           AND sent_at < NOW() - INTERVAL '30 minutes'
         RETURNING reminder_id, user_id`
      );
      if (result.rows.length > 0)
        console.log(`[Scheduler] Marked ${result.rows.length} overdue reminder(s) as missed`);
    } catch (err) {
      console.error('[Scheduler] Error marking overdue reminders:', err);
    }
  });
};

// ─── Start All Schedulers ─────────────────────────────────────
const startSchedulers = () => {
  console.log('[Scheduler] Starting all cron jobs...');
  generateDailyReminders();
  sendPendingReminders();
  markOverdueAsMissed();
  console.log('[Scheduler] All cron jobs active');
};

module.exports = { startSchedulers };
