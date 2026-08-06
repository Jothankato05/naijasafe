const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  location: { type: String, required: true, lowercase: true, trim: true },
  geo: {
    type: { type: String, enum: ['Point'], default: undefined },
    coordinates: { type: [Number], default: undefined }, // [lng, lat]
  },
  category: { type: String, required: true },
  description: { type: String, required: true },
  reporterPhone: { type: String, default: 'web' },
  // Where the report originated — lets SecureLink app-reported incidents and
  // SMS/USSD-reported incidents live in the same pool while staying traceable.
  source: { type: String, enum: ['sms', 'ussd', 'web', 'securelink'], default: 'web' },
  upvotes: { type: Number, default: 1 },
  trustScore: { type: Number, default: () => Math.floor(Math.random() * 41) + 60 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

AlertSchema.index({ geo: '2dsphere' }, { sparse: true });
AlertSchema.index({ location: 1 });
AlertSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Alert', AlertSchema);
