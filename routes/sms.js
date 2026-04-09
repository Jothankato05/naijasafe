const express = require('express');
const router = express.Router();
const AfricasTalking = require('africastalking');
const { createAlert, getAlertsByLocation, getAllAlerts, CATEGORIES } = require('../services/alerts');

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME,
});
const sms = at.SMS;

async function sendSMS(to, message) {
  try {
    const result = await sms.send({
      to: Array.isArray(to) ? to : [to],
      message,
      // from: 'NaijaSafe', // Commented out to prevent InvalidSenderId errors in sandbox
    });
    console.log('SMS sent:', JSON.stringify(result));
    return result;
  } catch (err) {
    console.error('SMS error:', err);
  }
}

async function broadcastAlert(alert) {
  const allAlerts = getAllAlerts();
  const nearbyNumbers = allAlerts
    .filter(a => a.location.includes(alert.location.split(' ')[0]))
    .map(a => a.reporterPhone)
    .filter(p => p !== alert.reporterPhone);

  const uniqueNumbers = [...new Set(nearbyNumbers)];

  if (uniqueNumbers.length > 0) {
    const msg = `NaijaSafe ALERT - ${alert.location}:\n${alert.category}: ${alert.description.slice(0, 100)}\nStay safe!`;
    await sendSMS(uniqueNumbers, msg);
    console.log(`Broadcast sent to ${uniqueNumbers.length} numbers near ${alert.location}`);
  }
}

router.post('/incoming', async (req, res) => {
  const { from, text } = req.body;
  const parts = text.trim().split(',');

  if (parts.length < 2) {
    await sendSMS(from,
      `NaijaSafe: Format is REPORT,Location,Description\nExample: REPORT,Oshodi,Fake police collecting money near bus park\nOr dial *384# to use the menu.`
    );
    return res.sendStatus(200);
  }

  const keyword = parts[0].trim().toUpperCase();

  if (keyword === 'REPORT') {
    const location = parts[1]?.trim();
    const description = parts[2]?.trim() || 'Danger reported';

    if (!location) {
      await sendSMS(from, `NaijaSafe: Please include a location.\nFormat: REPORT,Location,Description`);
      return res.sendStatus(200);
    }

    const alert = createAlert({
      location,
      category: CATEGORIES.SCAM,
      description,
      reporterPhone: from,
    });

    await sendSMS(from, `NaijaSafe: Report received! Alert #${alert.id} for "${location}" is now live. Thank you for keeping Nigeria safe.`);
    await broadcastAlert(alert);

  } else if (keyword === 'CHECK') {
    const location = parts[1]?.trim();
    if (!location) {
      await sendSMS(from, `NaijaSafe: Format is CHECK,Location\nExample: CHECK,Ikeja`);
      return res.sendStatus(200);
    }
    const found = getAlertsByLocation(location);
    if (found.length === 0) {
      await sendSMS(from, `NaijaSafe: No active alerts for "${location}". Stay alert and trust your instincts.`);
    } else {
      const msg = `NaijaSafe alerts near ${location}:\n` +
        found.map((a, i) => `${i + 1}. ${a.category}: ${a.description.slice(0, 80)}`).join('\n');
      await sendSMS(from, msg);
    }

  } else if (keyword === 'GUIDE') {
    const location = parts[1]?.trim();
    const found = getAlertsByLocation(location).filter(a => a.category === CATEGORIES.AREA_GUIDE);
    if (found.length === 0) {
      await sendSMS(from, `NaijaSafe: No guide yet for "${location}".\nGeneral tip: Stay in busy areas, avoid displaying valuables, trust your gut.`);
    } else {
      await sendSMS(from, `NaijaSafe guide for ${location}:\n${found[0].description}`);
    }

  } else {
    await sendSMS(from,
      `NaijaSafe commands:\nREPORT,Location,Description\nCHECK,Location\nGUIDE,Location\nOr dial *384# for menu.`
    );
  }

  res.sendStatus(200);
});

router.post('/send-test', async (req, res) => {
  const { phone, message } = req.body;
  const result = await sendSMS(phone, message || 'NaijaSafe test message. Your API is connected!');
  res.json(result);
});

module.exports = { router, sendSMS, broadcastAlert };
