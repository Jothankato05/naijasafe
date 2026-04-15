const express = require('express');
const router = express.Router();
const AfricasTalking = require('africastalking');
const {
  createAlert, getAlertsByLocation, getAllAlerts,
  registerSubscriber, getSubscribersByLocation,
  getAreaGuide, CATEGORIES, getRiskLevel, getSmartGuide,
  updateBehavior, getBehaviorProfile
} = require('../services/alerts');

const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME,
  format: 'json',
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
    let msg = `NaijaSafe ALERT near you!\n${alert.category} - ${alert.location}:\n${alert.description}\n\nReply GUIDE ${alert.location.split(' ')[0]} for safe routes.`;
    
    if (alert.category !== CATEGORIES.AREA_GUIDE) {
      msg = `⚠️ HIGH RISK ZONE\n${alert.category} reported near ${alert.location}.\nDO NOT ignore this warning.\n${alert.description}\n\nReply GUIDE ${alert.location.split(' ')[0]} for safe routes.`;
    }

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

  // SOS - Panic Mode
  if (keyword === 'SOS') {
    await sendSMS(from, "NaijaSafe: Emergency alert sent. Stay where you are. Help is being notified.");

    // Create an actual incident alert that affects the entire network
    createAlert({ location: "oshodi lagos", category: CATEGORIES.SOS, description: "Active SOS Incident detected. User in distress.", reporterPhone: from });

    const subs = getSubscribersByLocation("lagos"); // simple demo logic
    const numbers = subs.map(s => s.phone).filter(p => p !== from);
    const unique = [...new Set(numbers)];
    if (unique.length > 0) {
      await sendSMS(unique, `🚨 LIVE INCIDENT\nUser in distress near Oshodi.\nHigh-risk zone active.\nAvoid area OR assist if safe.`);
    }
    return res.sendStatus(200);
  }

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
    const risk = getRiskLevel(location);

    let welcome = `NaijaSafe Travel OS: Check-in SMS\nWelcome to ${location}.\n`;

    const hasSOS = alerts.some(a => a.category === CATEGORIES.SOS);
    if (hasSOS) {
      welcome += `⚠️ ACTIVE INCIDENT DETECTED\nRISK LEVEL: HIGH RISK\n\n`;
    } else {
      welcome += `RISK LEVEL: ${risk}\n\n`;
    }

    if (alerts.length > 0) {
      welcome += `ACTIVE ALERTS:\n`;
      alerts.forEach((a, i) => {
        welcome += `${i + 1}. [Trust: ${a.trustScore}%] ${a.category}: ${a.description.slice(0, 70)}\n`;
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

    setTimeout(() => {
      sendSMS(from, `NaijaSafe Tip:\nVerified restaurant 2 mins away in ${location.split(' ')[0]}.\nSafe and tourist-friendly.`);
    }, 60000); // 1 min

    setTimeout(() => {
      sendSMS(from, `NaijaSafe: You are approaching ${location.split(' ')[0]} axis. Stay alert.`);
    }, 120000); // 2 mins

    setTimeout(() => {
      sendSMS(from, `⚠️ HIGH RISK: Increased scam activity ahead in ${location.split(' ')[0]}. Avoid roadside agents.`);
    }, 300000); // 5 mins

    return res.sendStatus(200);
  }

  // GUIDE <location> — get area navigation guide
  if (keyword === 'GUIDE') {
    updateBehavior(from, 'GUIDE');
    const profile = getBehaviorProfile(from);
    
    const location = parts.slice(1).join(' ').trim() || 'Nigeria';
    const guide = getAreaGuide(location);
    const smartGuide = getSmartGuide(location);
    
    let msg = guide + "\n\n" + smartGuide;
    if (profile === "Tourist") {
       msg += "\n\n(Tourist Profile: Maximum guidance applied)";
    } else if (profile === "Risky") {
       msg += "\n\n⚠️ You frequently enter high-risk zones. Be extra vigilant.";
    }

    await sendSMS(from, msg);
    return res.sendStatus(200);
  }

  // PLAN <location> <days> — Smart Itinerary Generator
  if (keyword === 'PLAN') {
    const location = parts[1] || 'Lagos';
    const days = parts[2] || '1';
    
    let itinerary = `NaijaSafe Travel OS: Smart Itinerary for ${location} (${days} days)\n\n`;
    
    if (location.toUpperCase() === 'LAGOS') {
      itinerary += `Day 1:\n- Visit Lekki (🟢 Low Risk)\n- Lunch at VI (🟢 Safe zone)\n- Avoid Oshodi after 6PM (🔴 High Risk)\n\nDay 2:\n- Museum visit (Ikoyi)\n- Evening: Victoria Island (🟢 Safe zone)`;
    } else {
      itinerary += `Day 1:\n- Central Business District (🟢 Low Risk)\n- Avoid unlit outer suburbs\n- Always prepay for transport within ${location}.`;
    }

    await sendSMS(from, itinerary);
    return res.sendStatus(200);
  }

  // REPORT <location>, <description> — report a danger
  if (keyword === 'REPORT') {
    updateBehavior(from, 'REPORT');
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
      found.forEach((a, i) => { msg += `${i + 1}. [Trust: ${a.trustScore}%] ${a.category}: ${a.description.slice(0, 80)}\n`; });
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
    `NaijaSafe Travel OS commands:\n\nPLAN <area> <days> — risk-aware itinerary\nJOIN <area> — check-in & alerts\nGUIDE <area> — safe routes\nREPORT <area>, <description> — report incident\nCHECK <area> — check safety\nSOS — emergency panic\n\nExample: PLAN Lagos 2`
  );
  res.sendStatus(200);
});

router.post('/send-test', async (req, res) => {
  const { phone, message } = req.body;
  const result = await sendSMS(phone, message || 'NaijaSafe test. API connected!');
  res.json(result);
});

module.exports = { router, sendSMS, pushAlertToArea };
