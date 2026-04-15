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
const { seedDemoData } = require('./services/alerts');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const { router: smsRouter } = require('./routes/sms');
app.use('/sms', smsRouter);
app.use('/ussd', require('./routes/ussd'));
app.use('/dashboard', require('./routes/dashboard'));

app.get('/health', (req, res) => res.json({ status: 'NaijaSafe is live' }));

const { getAllAlerts, createAlert } = require('./services/alerts');

app.get('/api/alerts', (req, res) => {
  res.json(getAllAlerts());
});


const { pushAlertToArea } = require('./routes/sms');

app.post('/api/report', async (req, res) => {
  const { location, category, description, reporterPhone } = req.body;
  if (!location || !description) return res.status(400).json({ error: 'Missing fields' });
  const alert = createAlert({ location, category, description, reporterPhone: reporterPhone || 'web' });
  await pushAlertToArea(alert);
  res.json(alert);
});

app.listen(process.env.PORT, () => {
  console.log(`NaijaSafe running on port ${process.env.PORT}`);
  seedDemoData();
});
