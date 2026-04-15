const express = require('express');
const router = express.Router();
const { getAlertsByLocation, createAlert, CATEGORIES } = require('../services/alerts');

router.post('/', (req, res) => {
  const { sessionId, phoneNumber, networkCode, serviceCode, text } = req.body;
  const input = text ? text.split('*') : [];
  const level = input.length;
  let response = '';

  if (text === '') {
    response = `CON Welcome to NaijaSafe Travel OS
1. Find Safe Hotel
2. Check Area Safety
3. Report an Incident
4. SOS & Emergency Help
0. Exit`;

  } else if (input[0] === '1' && level === 1) {
    response = `CON Enter city/area to find a safe hotel
(e.g. Ikeja, Lekki, Wuse)`;

  } else if (input[0] === '1' && level === 2) {
    const location = input[1];
    response = `CON Top Safe Options in ${location}:
1. Hotel Alpha (Low Risk Zone)
2. Continental Suites (Medium Risk)
3. Horizon Inn (Low Risk Zone)
Select hotel to book (1-3):`;

  } else if (input[0] === '1' && level === 3) {
    response = `END Booking confirmed!
You'll receive a safety-check SMS shortly.
NaijaSafe Travel OS`;

  } else if (input[0] === '2' && level === 1) {
    response = `CON Enter area name
(e.g. Oshodi, Wuse Market)`;

  } else if (input[0] === '2' && level === 2) {
    const location = input[1];
    const found = getAlertsByLocation(location);
    if (found.length === 0) {
      response = `END No active alerts for "${location}".
Stay alert and trust your instincts.`;
    } else {
      const lines = found.map((a, i) => `${i + 1}. ${a.category}: ${a.description.slice(0, 60)}...`).join('\n');
      response = `END Alerts near ${location}:\n${lines}\n`;
    }

  } else if (input[0] === '3' && level === 1) {
    response = `CON Select danger type:
1. Fake transport
2. Scam / fraud
3. Theft
4. Unsafe road`;

  } else if (input[0] === '3' && level === 2) {
    response = `CON Enter the area or location:`;

  } else if (input[0] === '3' && level === 3) {
    const categoryMap = {
      '1': CATEGORIES.FAKE_TAXI,
      '2': CATEGORIES.SCAM,
      '3': CATEGORIES.THEFT,
      '4': CATEGORIES.UNSAFE_ROAD,
    };
    const category = categoryMap[input[1]] || CATEGORIES.SCAM;
    const location = input[2];
    createAlert({ location, category, description: `Reported via USSD by ${phoneNumber}`, reporterPhone: phoneNumber });
    response = `END Report received! Thank you.
Alert for "${location}" is now live.
NaijaSafe Travel OS`;

  } else if (input[0] === '4') {
    response = `END 🚨 EMERGENCY ACTIVATED.
Network broadcast triggered. Stay safe!`;

  } else if (text === '0') {
    response = `END Stay safe out there!
NaijaSafe Travel OS.`;

  } else {
    response = `END Invalid option. Dial again.`;
  }

  res.set('Content-Type', 'text/plain');
  res.send(response);
});

module.exports = router;
