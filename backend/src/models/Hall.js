const mongoose = require('mongoose');

const hallSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  capacity: { type: Number, required: true },
  hourlyRate: { type: Number, required: true },
  pricePerNight: { type: Number },
  images: [{ type: String }],
  availability: [{ date: Date, slots: [String], booked: { type: Boolean, default: false } }],
  amenities: [{ type: String }],
  rooms: [{ type: String }],
  type: { type: String, enum: ['hotel', 'theatre', 'venue'], default: 'hotel' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  rating: { type: Number, default: 4.6 },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Hall', hallSchema);
