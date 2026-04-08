const express = require('express');
const router = express.Router();
const { getAllAlerts } = require('../services/alerts');

router.get('/', (req, res) => {
  res.json(getAllAlerts());
});

module.exports = router;
