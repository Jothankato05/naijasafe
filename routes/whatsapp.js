const express = require('express');
const router = express.Router();

// WhatsApp webhook placeholder
router.post('/incoming', (req, res) => {
  console.log('WhatsApp message received:', req.body);
  res.status(200).json({ message: 'WhatsApp received' });
});

module.exports = router;
