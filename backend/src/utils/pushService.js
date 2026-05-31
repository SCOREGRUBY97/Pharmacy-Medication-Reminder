const webpush = require('web-push');
const { query } = require('../config/db');
const logger = require('./logger');

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@medicare.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendPush = async (userId, payload) => {
  try {
    const result = await query(
      'SELECT push_subscription FROM users WHERE id=$1 AND push_subscription IS NOT NULL',
      [userId]
    );
    if (!result.rows.length) return { success: false, reason: 'No subscription' };

    const subscription = JSON.parse(result.rows[0].push_subscription);
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    logger.info(`Push sent to user ${userId}`, { title: payload.title });
    return { success: true };
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await query('UPDATE users SET push_subscription=NULL WHERE id=$1', [userId]);
      logger.info(`Removed expired push subscription for user ${userId}`);
    } else {
      logger.error(`Push failed for user ${userId}`, { error: err.message });
    }
    return { success: false, error: err.message };
  }
};

const pushTypes = {
  reminder: (med, reminderId) => ({
    title: `💊 Time for ${med.name}`,
    body: `Take your ${med.dosage} of ${med.name}. ${med.instructions || ''}`.trim(),
    tag: `reminder-${reminderId}`,
    url: '/reminders',
    reminderId,
    medicationName: med.name,
    actions: [
      { action: 'taken', title: '✅ Mark Taken' },
      { action: 'snooze', title: '⏰ Snooze 10min' },
    ],
  }),
  missed: (patientName, medName, time) => ({
    title: `⚠️ Missed Dose Alert`,
    body: `${patientName} missed ${medName} at ${time}`,
    tag: `missed-${Date.now()}`,
    url: '/caregiver',
  }),
  lowStock: (medName, daysLeft) => ({
    title: `🔔 Low Stock: ${medName}`,
    body: `Only ${daysLeft} days of ${medName} remaining. Time to refill!`,
    tag: `stock-${Date.now()}`,
    url: '/medications',
  }),
  streak: (days) => ({
    title: `🔥 ${days}-Day Streak!`,
    body: `Amazing! You've taken all meds on time for ${days} days!`,
    tag: 'streak',
    url: '/history',
  }),
  welcome: (name) => ({
    title: `👋 Welcome to MediCare, ${name}!`,
    body: 'Your account is set up. Start by adding your medications.',
    tag: 'welcome',
    url: '/medications',
  }),
};

module.exports = { sendPush, pushTypes };
