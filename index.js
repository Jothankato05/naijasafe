require('dotenv').config();

// Prevent AT SDK or any async errors from crashing the server
process.on('uncaughtException', (err) => {
  console.error('[NaijaSafe] Uncaught exception (server kept alive):', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[NaijaSafe] Unhandled rejection (server kept alive):', reason?.message || reason);
});
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const {
  seedDemoData, getAllAlerts, createAlert, getAlertsNear,
} = require('./services/alerts');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const { router: smsRouter, pushAlertToArea } = require('./routes/sms');
app.use('/sms', smsRouter);
app.use('/ussd', require('./routes/ussd'));
app.use('/dashboard', require('./routes/dashboard'));

app.get('/health', (req, res) => res.json({ status: 'NaijaSafe is live' }));

app.get('/api/alerts', async (req, res) => {
  try {
    res.json(await getAllAlerts());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Geospatial feed for SecureLink's map — GET /api/alerts/nearby?lat=&lng=&radius=
app.get('/api/alerts/nearby', async (req, res) => {
  const { lat, lng, radius } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });
  try {
    const alerts = await getAlertsNear(lat, lng, radius || 5000);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/report', async (req, res) => {
  const { location, category, description, reporterPhone } = req.body;
  if (!location || !description) return res.status(400).json({ error: 'Missing fields' });
  try {
    const alert = await createAlert({ location, category, description, reporterPhone: reporterPhone || 'web', source: 'web' });
    await pushAlertToArea(alert);
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SecureLink app-side incidents/SOS flow into the same alert pool, so
// SMS/USSD (no-network) users benefit from app-reported intelligence too.
// Protected by a shared secret so only the SecureLink backend can post here.
app.post('/api/sync-incident', async (req, res) => {
  const key = req.header('X-Sync-Key');
  if (!process.env.SYNC_SECRET || key !== process.env.SYNC_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { location, category, description, reporterPhone, lat, lng } = req.body;
  if (!location || !description) return res.status(400).json({ error: 'Missing fields' });
  try {
    const alert = await createAlert({ location, category: category || 'SOS Incident', description, reporterPhone: reporterPhone || 'securelink', source: 'securelink' });
    // Prefer exact SecureLink coordinates over the gazetteer guess when supplied.
    if (lat && lng) {
      alert.geo = { type: 'Point', coordinates: [Number(lng), Number(lat)] };
      await alert.save();
    }
    await pushAlertToArea(alert);
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`NaijaSafe running on port ${PORT}`);
    seedDemoData().catch(err => console.error('[NaijaSafe] seed error:', err.message));
  });
});
