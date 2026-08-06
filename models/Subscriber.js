const mongoose = require('mongoose');

const SubscriberSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  location: { type: String, required: true, lowercase: true, trim: true },
  geo: {
    type: { type: String, enum: ['Point'], default: undefined },
    coordinates: { type: [Number], default: undefined },
  },
  guideScore: { type: Number, default: 0 },
  reportScore: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: { createdAt: false, updatedAt: 'updatedAt' } });

SubscriberSchema.index({ geo: '2dsphere' }, { sparse: true });

module.exports = mongoose.model('Subscriber', SubscriberSchema);
