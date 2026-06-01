const { query } = require('../config/db');
const logger = require('./logger');

let webpush = null;

// Only initialize web-push if valid VAPID keys are provided
const initPush = () => {
  try {
    if (
      process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_PUBLIC_KEY.length > 20 &&
      process.env.VAPID_PRIVATE_KEY.length > 20 &&
      process.env.VAPID_PUBLIC_KEY !== 'your_vapid_public_key_here'
    ) {
      webpush = require('web-push');
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@medicare.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      logger.info('✅ Web push notifications initialized');
    } else {
      logger.warn('⚠️ VAPID keys not configured — push notifications disabled');
    }
  } catch (err) {
    logger.warn('⚠️ Push notifications disabled: ' + err.message);
    webpush = null;
  }
};

initPush();

const sendPush = async (userId, payload) => {
  if (!webpush) return { success: false, reason: 'Push not configured' };
  try {
    const result = await query(
      'SELECT push_subscription FROM users WHERE id=$1 AND push_subscription IS NOT NULL',
      [userId]
    );
    if (!result.rows.length) return { success: false, reason: 'No subscription' };
    const subscription = JSON.parse(result.rows[0].push_subscription);
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    logger.info(`Push sent to user ${userId}`);
    return { success: true };
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await query('UPDATE users SET push_subscription=NULL WHERE id=$1', [userId]);
    }
    return { success: false, error: err.message };
  }
};

const pushTypes = {
  reminder: (med, reminderId) => ({
    title: `💊 Time for ${med.name}`,
    body: `Take your ${med.dosage} of ${med.name}`,
    tag: `reminder-${reminderId}`,
    url: '/reminders',
  }),
  missed: (patientName, medName, time) => ({
    title: `⚠️ Missed Dose Alert`,
    body: `${patientName} missed ${medName} at ${time}`,
    url: '/caregiver',
  }),
  welcome: (name) => ({
    title: `👋 Welcome to MediCare, ${name}!`,
    body: 'Start by adding your medications.',
    url: '/medications',
  }),
};

module.exports = { sendPush, pushTypes };
