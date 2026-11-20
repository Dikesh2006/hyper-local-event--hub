const mongoose = require('mongoose');

const managerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  expertise: { type: String, required: true },
  pricePerEvent: { type: Number, required: true },
  rating: { type: Number, default: 4.8 },
  imageUrl: { type: String },
  bio: { type: String },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  contact: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Manager', managerSchema);
