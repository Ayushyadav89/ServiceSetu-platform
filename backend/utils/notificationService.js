const Worker = require('../models/Worker');

/**
 * ServiceSetu Notification Service
 * Abstraction layer supporting SMS, IVR, and system notifications.
 * 
 * Currently: Mock implementation that logs notifications.
 * Production: Replace with Twilio / MSG91 / Exotel APIs.
 */

/**
 * Send SMS to a worker
 * @param {string} phone - Worker's phone number
 * @param {string} message - Message content
 * @param {string} type - 'sms' | 'ivr' | 'system'
 * @param {ObjectId} workerId - Worker's MongoDB ID (for logging)
 */
const sendSMSNotification = async (phone, message, type = 'sms', workerId = null) => {
  try {
    // ── PRODUCTION: Replace this block with actual SMS API call ──────────────
    // Example with MSG91:
    // const response = await axios.post('https://api.msg91.com/api/v5/flow/', {
    //   template_id: process.env.MSG91_TEMPLATE_ID,
    //   sender: process.env.SMS_SENDER_ID,
    //   short_url: '0',
    //   mobiles: `91${phone}`,
    //   var1: message,
    // }, { headers: { authkey: process.env.SMS_API_KEY } });
    // ─────────────────────────────────────────────────────────────────────────

    // Mock: Log the notification
    console.log(`\n📱 [SMS MOCK] To: ${phone}`);
    console.log(`   Message: ${message}`);
    console.log(`   Type: ${type}\n`);

    // Log to worker's notification history
    if (workerId) {
      await Worker.findByIdAndUpdate(workerId, {
        $push: {
          notifications: {
            message,
            type,
            sentAt: new Date(),
            status: 'sent', // In mock, always 'sent'
          },
        },
      });
    }

    return { success: true, messageId: `mock_${Date.now()}` };
  } catch (error) {
    console.error('SMS notification error:', error.message);

    // Log failure
    if (workerId) {
      await Worker.findByIdAndUpdate(workerId, {
        $push: {
          notifications: { message, type, sentAt: new Date(), status: 'failed' },
        },
      });
    }

    return { success: false, error: error.message };
  }
};

/**
 * Send bulk SMS to multiple workers
 */
const sendBulkSMS = async (workers, message) => {
  const results = await Promise.allSettled(
    workers.map((w) => sendSMSNotification(w.phone, message, 'sms', w._id))
  );
  return results;
};

/**
 * Simulate IVR call to worker
 * In production: Use Exotel / Twilio Programmable Voice
 */
const sendIVRCall = async (phone, bookingId) => {
  console.log(`\n📞 [IVR MOCK] Calling: ${phone}`);
  console.log(`   Booking: ${bookingId}`);
  console.log(`   Press 1 to Accept, Press 2 to Reject\n`);
  return { success: true, callId: `ivr_mock_${Date.now()}` };
};

module.exports = { sendSMSNotification, sendBulkSMS, sendIVRCall };
