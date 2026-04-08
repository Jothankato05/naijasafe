const express = require('express');
const router = express.Router();
const { createAlert, getAlertsByLocation, CATEGORIES } = require('../services/alerts');
const { enterArea, leaveArea } = require('../services/tracker');

router.post('/', (req, res) => {
  const { from, text } = req.body;

  console.log(`Incoming SMS from ${from}: ${text}`);

  let response = '';

  // SIMPLE COMMAND PARSER
  // adding safe fallbacks just in case
  const safeText = text || '';
  const message = safeText.toLowerCase();

  // 1. CHECK ALERTS
  if (message.startsWith('check')) {
    const location = message.replace('check', '').trim();

    const alerts = getAlertsByLocation(location);

    if (alerts.length === 0) {
      response = `No current alerts for ${location}. Stay cautious.`;
    } else {
      response = alerts
        .map(a => `${a.category}: ${a.description}`)
        .join('\n');
    }
  }

  // 2. REPORT ALERT
  else if (message.startsWith('report')) {
    const parts = message.split(',');

    if (parts.length < 3) {
      response = `Format: REPORT, location, description`;
    } else {
      const location = parts[1].trim();
      const description = parts[2].trim();

      createAlert({
        location,
        category: CATEGORIES.SCAM,
        description,
        reporterPhone: from
      });

      response = `Alert received for ${location}. You just helped someone stay safe.`;
    }
  }

  // 3. GUIDE MODE (🔥 THIS IS YOUR SECRET WEAPON)
  else if (message.startsWith('guide')) {
    const location = message.replace('guide', '').trim();

    const alerts = getAlertsByLocation(location);

    if (alerts.length === 0) {
      response = `No alerts for ${location}. Stay in busy areas and avoid isolated streets.`;
    } else {
      response = `Safety tips for ${location}:\n` +
        alerts.map(a => `- ${a.description}`).join('\n');
    }
  }

  // ENTER AREA
  else if (message.startsWith('enter')) {
    const location = message.replace('enter', '').trim();

    if (!location) {
      response = `Please specify a location. Example: ENTER Ikeja`;
    } else {
      enterArea(from, location);

      response = `Monitoring started for ${location}.\nNaijaSafe will alert you of any danger nearby. Stay sharp.`;
    }
  }

  // LEAVE AREA
  else if (message.startsWith('leave')) {
    leaveArea(from);

    response = `Monitoring stopped.\nStay safe out there.`;
  }

  else {
    response = `NaijaSafe Commands:
CHECK Ikeja
REPORT Ikeja, fake taxi near airport
GUIDE Lekki`;
  }

  res.set('Content-Type', 'text/plain');
  res.send(response);
});

module.exports = router;
