const express = require('express');
const router = express.Router();
const { getAlertsByLocation, createAlert, CATEGORIES } = require('../services/alerts');

router.post('/', (req, res) => {
  const { sessionId, phoneNumber, networkCode, serviceCode, text } = req.body;
  const input = text ? text.split('*') : [];
  const level = input.length;
  let response = '';

  if (text === '') {
    response = `CON Welcome to NaijaSafe
1. Check alerts for an area
2. Report a danger
3. Get area safety guide
0. Exit`;

  } else if (input[0] === '1' && level === 1) {
    response = `CON Enter area name
(e.g. Oshodi, Wuse Market, Airport)`;

  } else if (input[0] === '1' && level === 2) {
    const location = input[1];
    const found = getAlertsByLocation(location);
    if (found.length === 0) {
      response = `END No active alerts for "${location}".
Stay alert and trust your instincts.
Report dangers via SMS to 1234.`;
    } else {
      const lines = found.map((a, i) => `${i + 1}. ${a.category}: ${a.description.slice(0, 60)}...`).join('\n');
      response = `END Alerts near ${location}:\n${lines}\n\nStay safe!`;
    }

  } else if (input[0] === '2' && level === 1) {
    response = `CON Select danger type:
1. Fake taxi / transport
2. Scam or fraud
3. Theft
4. Fake official
5. Unsafe road`;

  } else if (input[0] === '2' && level === 2) {
    response = `CON Enter the area or location:`;

  } else if (input[0] === '2' && level === 3) {
    const categoryMap = {
      '1': CATEGORIES.FAKE_TAXI,
      '2': CATEGORIES.SCAM,
      '3': CATEGORIES.THEFT,
      '4': CATEGORIES.FAKE_OFFICIAL,
      '5': CATEGORIES.UNSAFE_ROAD,
    };
    const category = categoryMap[input[1]] || CATEGORIES.SCAM;
    const location = input[2];
    createAlert({ location, category, description: `Reported via USSD by ${phoneNumber}`, reporterPhone: phoneNumber });
    response = `END Report received! Thank you.
Alert for "${location}" is now live.
Others in that area will be warned.
Stay safe — NaijaSafe`;

  } else if (input[0] === '3' && level === 1) {
    response = `CON Enter area for safety guide:`;

  } else if (input[0] === '3' && level === 2) {
    const location = input[1];
    const guides = getAlertsByLocation(location).filter(a => a.category === CATEGORIES.AREA_GUIDE);
    if (guides.length === 0) {
      response = `END No guide yet for "${location}".
General tip: Stay in busy areas,
avoid displaying valuables,
trust locals over strangers.`;
    } else {
      response = `END Guide for ${location}:\n${guides[0].description}\n\nNaijaSafe`;
    }

  } else if (text === '0') {
    response = `END Stay safe out there!
NaijaSafe — by the people, for the people.`;

  } else {
    response = `END Invalid option. Dial again.`;
  }

  res.set('Content-Type', 'text/plain');
  res.send(response);
});

module.exports = router;
