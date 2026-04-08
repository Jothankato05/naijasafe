const alerts = [];
let idCounter = 1;

const { getUsersInLocation } = require('./tracker');

const africastalking = require('africastalking')({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME
});

const sms = africastalking.SMS;

const CATEGORIES = {
  FAKE_TAXI: 'Fake taxi',
  SCAM: 'Scam / fraud',
  THEFT: 'Theft reported',
  UNSAFE_ROAD: 'Unsafe road',
  FAKE_OFFICIAL: 'Fake official',
  AREA_GUIDE: 'Area guide tip',
};

function createAlert({ location, category, description, reporterPhone }) {
  const alert = {
    id: idCounter++,
    location: location.trim().toLowerCase(),
    category,
    description,
    reporterPhone,
    upvotes: 1,
    timestamp: new Date().toISOString(),
    active: true,
  };
  alerts.push(alert);
  
  try {
    const users = getUsersInLocation(location);

    users.forEach(user => {
      sms.send({
        to: [user.phone],
        message: `⚠️ NaijaSafe Alert in ${location}:\n${category} - ${description}`
      })
      .then(() => console.log(`Alert sent to ${user.phone}`))
      .catch(err => console.error('SMS error:', err));
    });

  } catch (err) {
    console.error('Broadcast failed:', err);
  }

  console.log(`New alert created: [${category}] at ${location}`);
  return alert;
}

function getAlertsByLocation(location) {
  const query = location.trim().toLowerCase();
  return alerts
    .filter(a => a.active && a.location.includes(query))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 3);
}

function getAllAlerts() {
  return alerts.filter(a => a.active);
}

function seedDemoData() {
  createAlert({ location: 'Murtala Mohammed Airport Lagos', category: CATEGORIES.FAKE_TAXI, description: 'Men in yellow vests at Gate 2 charging 10x fares. Use official taxi desk inside.', reporterPhone: '+2348012345678' });
  createAlert({ location: 'Oshodi Lagos', category: CATEGORIES.THEFT, description: 'Pickpockets operating near the bus park. Keep your bag in front.', reporterPhone: '+2348098765432' });
  createAlert({ location: 'Wuse Market Abuja', category: CATEGORIES.SCAM, description: 'Bureau de change by the east entrance giving fake notes. Use GTB ATM instead.', reporterPhone: '+2348055544433' });
  createAlert({ location: 'Lekki Lagos', category: CATEGORIES.AREA_GUIDE, description: 'Safe area. Best okada routes are Admiralty Way. Avoid Third Mainland after midnight.', reporterPhone: '+2348011122233' });
  createAlert({ location: 'Ikeja Lagos', category: CATEGORIES.FAKE_OFFICIAL, description: 'Men claiming to be LASTMA officers collecting illegal tolls near Allen Avenue.', reporterPhone: '+2348077788899' });
  createAlert({ location: 'Kubwa Abuja', category: CATEGORIES.AREA_GUIDE, description: 'Relatively safe suburb. Main market is busy but secure during the day. Avoid unlit streets at night.', reporterPhone: '+2348033344455' });
  console.log('Demo data seeded — 6 alerts loaded');
}

module.exports = { createAlert, getAlertsByLocation, getAllAlerts, CATEGORIES, seedDemoData };
