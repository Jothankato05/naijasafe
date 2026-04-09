const express = require('express');
const router = express.Router();
const AfricasTalking = require('africastalking');
const {
  createAlert, getAlertsByLocation, getAllAlerts,
  registerSubscriber, getSubscribersByLocation,
  getAreaGuide, CATEGORIES,
} = require('../services/alerts');

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
    });
    console.log('SMS sent to', to);
    return result;
  } catch (err) {
    console.error('SMS error:', err.message);
  }
}

async function pushAlertToArea(alert) {
  const nearby = getSubscribersByLocation(alert.location);
  const numbers = nearby
    .map(s => s.phone)
    .filter(p => p !== alert.reporterPhone);
  const unique = [...new Set(numbers)];
  if (unique.length > 0) {
    const msg = `NaijaSafe ALERT near you!\n${alert.category} - ${alert.location}:\n${alert.description}\n\nReply GUIDE ${alert.location.split(' ')[0]} for safe routes.`;
    await sendSMS(unique, msg);
    console.log(`Pushed alert to ${unique.length} subscribers near ${alert.location}`);
  }
}

router.post('/incoming', async (req, res) => {
  const { from, text } = req.body;
  if (!from || !text) return res.sendStatus(200);

  const raw = text.trim();
  const upper = raw.toUpperCase();
  const parts = raw.split(/[\s,]+/);
  const keyword = parts[0].toUpperCase();

  // JOIN <location> — subscribe and get instant area briefing
  if (keyword === 'JOIN') {
    const location = parts.slice(1).join(' ').trim();
    if (!location) {
      await sendSMS(from, `NaijaSafe: Reply JOIN followed by your area.\nExamples:\nJOIN Ikeja Lagos\nJOIN Oshodi\nJOIN Wuse Abuja`);
      return res.sendStatus(200);
    }

    registerSubscriber(from, location);
    const alerts = getAlertsByLocation(location);
    const guide = getAreaGuide(location);

    let welcome = `NaijaSafe: Welcome to ${location}!\nYou will now receive automatic safety alerts for this area.\n\n`;

    if (alerts.length > 0) {
      welcome += `ACTIVE ALERTS:\n`;
      alerts.forEach((a, i) => {
        welcome += `${i + 1}. ${a.category}: ${a.description.slice(0, 70)}\n`;
      });
    } else {
      welcome += `No active alerts for this area right now. Stay alert!\n`;
    }

    welcome += `\nReply GUIDE ${parts[1] || location} for navigation tips.`;
    await sendSMS(from, welcome);

    // Send guide as second SMS
    setTimeout(async () => {
      await sendSMS(from, guide);
    }, 2000);

    return res.sendStatus(200);
  }

  // GUIDE <location> — get area navigation guide
  if (keyword === 'GUIDE') {
    const location = parts.slice(1).join(' ').trim() || 'Nigeria';
    const guide = getAreaGuide(location);
    await sendSMS(from, guide);
    return res.sendStatus(200);
  }

  // REPORT <location>, <description> — report a danger
  if (keyword === 'REPORT') {
    const rest = raw.slice(7).trim();
    const commaIdx = rest.indexOf(',');
    if (commaIdx === -1) {
      await sendSMS(from, `NaijaSafe: Format is:\nREPORT Location, Description\n\nExample:\nREPORT Oshodi, Fake police collecting money at bus park`);
      return res.sendStatus(200);
    }
    const location = rest.slice(0, commaIdx).trim();
    const description = rest.slice(commaIdx + 1).trim();
    const alert = createAlert({ location, category: CATEGORIES.SCAM, description, reporterPhone: from });
    await sendSMS(from, `NaijaSafe: Report received! Alert #${alert.id} for "${location}" is now live.\nWe are notifying everyone registered in that area. Thank you for keeping Nigeria safe.`);
    await pushAlertToArea(alert);
    return res.sendStatus(200);
  }

  // CHECK <location> — manually check alerts
  if (keyword === 'CHECK') {
    const location = parts.slice(1).join(' ').trim();
    if (!location) {
      await sendSMS(from, `NaijaSafe: Reply CHECK followed by area name.\nExample: CHECK Ikeja`);
      return res.sendStatus(200);
    }
    const found = getAlertsByLocation(location);
    if (found.length === 0) {
      await sendSMS(from, `NaijaSafe: No active alerts for "${location}" right now.\nStay alert and trust your instincts.\nReply GUIDE ${location} for navigation tips.`);
    } else {
      let msg = `NaijaSafe alerts in ${location}:\n`;
      found.forEach((a, i) => { msg += `${i + 1}. ${a.category}: ${a.description.slice(0, 80)}\n`; });
      msg += `\nReply GUIDE ${location} for safe routes.`;
      await sendSMS(from, msg);
    }
    return res.sendStatus(200);
  }

  // LEAVE — unsubscribe
  if (keyword === 'LEAVE') {
    await sendSMS(from, `NaijaSafe: You have been unsubscribed. Stay safe!\nText JOIN <area> anytime to reactivate alerts.`);
    return res.sendStatus(200);
  }

  // Default help message
  await sendSMS(from,
    `NaijaSafe commands:\n\nJOIN <area> — get alerts for your area\nGUIDE <area> — navigation + safety tips\nREPORT <area>, <description> — report danger\nCHECK <area> — check active alerts\nLEAVE — stop alerts\n\nExample: JOIN Ikeja Lagos`
  );
  res.sendStatus(200);
});

router.post('/send-test', async (req, res) => {
  const { phone, message } = req.body;
  const result = await sendSMS(phone, message || 'NaijaSafe test. API connected!');
  res.json(result);
});

module.exports = { router, sendSMS, pushAlertToArea };
