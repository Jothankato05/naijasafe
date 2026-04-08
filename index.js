require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { seedDemoData } = require('./services/alerts');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use('/sms', require('./routes/sms'));
app.use('/ussd', require('./routes/ussd'));
app.use('/dashboard', require('./routes/dashboard'));

app.get('/health', (req, res) => res.json({ status: 'NaijaSafe is live' }));

app.listen(process.env.PORT, () => {
  console.log(`NaijaSafe running on port ${process.env.PORT}`);
  seedDemoData();
});
