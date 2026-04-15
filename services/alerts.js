const alerts = [];
const subscribers = [];
let idCounter = 1;

const CATEGORIES = {
  FAKE_TAXI: 'Fake taxi',
  SCAM: 'Scam / fraud',
  THEFT: 'Theft reported',
  UNSAFE_ROAD: 'Unsafe road',
  FAKE_OFFICIAL: 'Fake official',
  AREA_GUIDE: 'Area guide tip',
  SOS: 'SOS Incident',
};

const AREA_GUIDES = {
  'airport': `NaijaSafe GUIDE - Lagos Airport:
- Use ONLY the official taxi desk inside arrivals hall
- Ignore ALL men outside offering rides
- Main road out is Airport Road heading to Ikeja
- Nearest safe area: Ikeja (15 mins)
- Emergency: dial 199`,

  'oshodi': `NaijaSafe GUIDE - Oshodi:
- Busy transport hub, keep bag in front
- Board buses at the official park only
- Avoid the underbridge area after dark
- To Ikeja: take BRT bus from main stop
- To Lagos Island: board danfo at overhead`,

  'ikeja': `NaijaSafe GUIDE - Ikeja:
- Generally safe commercial area
- Allen Avenue is the main strip, well lit
- Avoid side streets off Obafemi Awolowo after 9pm
- ATMs: GTB and Access on Allen Avenue are reliable
- To airport: 15 mins via Obafemi Awolowo Road`,

  'wuse': `NaijaSafe GUIDE - Wuse Market Abuja:
- Use GTB or Zenith ATMs only, avoid roadside BDCs
- Main market is safe during the day
- Keep valuables hidden in the market
- To Maitama: 10 mins via Ahmadu Bello Way
- To Garki: 15 mins via Independence Avenue`,

  'lekki': `NaijaSafe GUIDE - Lekki Lagos:
- Safe residential and commercial area
- Admiralty Way is the main safe route
- Avoid Third Mainland Bridge after midnight
- To Victoria Island: 20 mins via Lekki-Epe Expressway
- Toll gate area can have traffic go-slows`,

  'abuja': `NaijaSafe GUIDE - Abuja Central:
- One of Nigeria's safest cities
- Wuse 2 and Maitama are the safest zones
- Garki Area 11 market is busy but secure
- Avoid Nyanya and Karu areas at night
- Emergency: dial 112`,

  'lagos': `NaijaSafe GUIDE - Lagos General:
- Stay on major roads, avoid unknown shortcuts
- Victoria Island and Lekki are safest for tourists
- Always negotiate taxi fare BEFORE entering
- Keep your phone hidden in public transport
- Emergency: dial 199 or 112`,
};

function registerSubscriber(phone, location) {
  const existing = subscribers.find(s => s.phone === phone);
  if (existing) {
    existing.location = location.trim().toLowerCase();
    existing.updatedAt = new Date().toISOString();
    console.log(`Subscriber ${phone} moved to ${location}`);
  } else {
    subscribers.push({
      phone,
      location: location.trim().toLowerCase(),
      joinedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      guideScore: 0,
      reportScore: 0,
    });
    console.log(`New subscriber ${phone} registered at ${location}`);
  }
}

function updateBehavior(phone, action) {
  const existing = subscribers.find(s => s.phone === phone);
  if (!existing) return;
  if (action === 'GUIDE') existing.guideScore = (existing.guideScore || 0) + 1;
  if (action === 'REPORT') existing.reportScore = (existing.reportScore || 0) + 1;
}

function getBehaviorProfile(phone) {
  const existing = subscribers.find(s => s.phone === phone);
  if (!existing) return "Tourist";
  const g = existing.guideScore || 0;
  const r = existing.reportScore || 0;
  
  if (r >= 2) return "Risky";
  if (g > 2 && r === 0) return "Tourist";
  return "Local";
}

function getSubscribersByLocation(location) {
  const query = location.trim().toLowerCase();
  return subscribers.filter(s =>
    s.location.includes(query) || query.includes(s.location.split(' ')[0])
  );
}

function getAreaGuide(location) {
  const loc = location.trim().toLowerCase();
  for (const key in AREA_GUIDES) {
    if (loc.includes(key)) return AREA_GUIDES[key];
  }
  return `NaijaSafe GUIDE - ${location}:
- Stay in busy, well-lit areas
- Negotiate all transport fares upfront
- Keep valuables hidden and bag in front
- Trust your instincts — if unsure, don't go
- Emergency Nigeria: dial 199 or 112`;
}

function createAlert({ location, category, description, reporterPhone }) {
  const alert = {
    id: idCounter++,
    location: location.trim().toLowerCase(),
    category,
    description,
    reporterPhone,
    upvotes: 1,
    trustScore: Math.floor(Math.random() * 41) + 60, // 60-100%
    timestamp: new Date().toISOString(),
    active: true,
  };
  alerts.push(alert);
  console.log(`New alert: [${category}] at ${location}`);
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

function getAllSubscribers() {
  return subscribers;
}

function getRiskLevel(location) {
  const query = location.trim().toLowerCase();
  const recent = alerts.filter(a =>
    a.active &&
    a.location.includes(query) &&
    (Date.now() - new Date(a.timestamp)) < 3600000 // last 1 hour
  );

  if (recent.length >= 3) return "HIGH RISK";
  if (recent.length === 2) return "MEDIUM RISK";
  return "LOW RISK";
}

function getSmartGuide(location) {
  const loc = location.toLowerCase();
  let path = "Recommended Safe Path:\n→ Stick to main roads\n→ Stay in populated areas\n→ Avoid unlit shortcuts";
  
  if (loc.includes('airport')) {
    path = "Recommended Safe Path:\n→ Use main terminal entrance\n→ Board ONLY official taxis at the desk\n→ Exit via Airport Road strictly";
  } else if (loc.includes('oshodi')) {
    path = "Recommended Safe Path:\n→ Use main terminal entrance\n→ Stay on BRT lane corridor\n→ Avoid underbridge zone completely";
  } else if (loc.includes('ikeja')) {
    path = "Recommended Safe Path:\n→ Use Allen Avenue corridor\n→ Avoid side streets after 9PM\n→ Stick to well-lit ATM points";
  }
  return path;
}

function seedDemoData() {
  createAlert({ location: 'murtala mohammed airport lagos', category: CATEGORIES.FAKE_TAXI, description: 'Men in yellow vests at Gate 2 charging 10x fares. Use official taxi desk inside.', reporterPhone: '+2348012345678' });
  createAlert({ location: 'oshodi lagos', category: CATEGORIES.THEFT, description: 'Pickpockets operating near the bus park. Keep your bag in front.', reporterPhone: '+2348098765432' });
  createAlert({ location: 'wuse market abuja', category: CATEGORIES.SCAM, description: 'Bureau de change by east entrance giving fake notes. Use GTB ATM instead.', reporterPhone: '+2348055544433' });
  createAlert({ location: 'lekki lagos', category: CATEGORIES.AREA_GUIDE, description: 'Safe area. Best routes via Admiralty Way. Avoid Third Mainland after midnight.', reporterPhone: '+2348011122233' });
  createAlert({ location: 'ikeja lagos', category: CATEGORIES.FAKE_OFFICIAL, description: 'Men claiming to be LASTMA officers collecting illegal tolls near Allen Avenue.', reporterPhone: '+2348077788899' });
  createAlert({ location: 'kubwa abuja', category: CATEGORIES.AREA_GUIDE, description: 'Relatively safe suburb. Main market secure during the day. Avoid unlit streets at night.', reporterPhone: '+2348033344455' });

  registerSubscriber('+2348011111111', 'ikeja lagos');
  registerSubscriber('+2348022222222', 'oshodi lagos');
  registerSubscriber('+2348033333333', 'lekki lagos');
  console.log('Demo data seeded — 6 alerts, 3 subscribers loaded');
}

module.exports = {
  createAlert, getAlertsByLocation, getAllAlerts,
  registerSubscriber, getSubscribersByLocation, getAreaGuide,
  getAllSubscribers, CATEGORIES, seedDemoData,
  getRiskLevel, getSmartGuide, updateBehavior, getBehaviorProfile
};
