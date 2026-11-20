const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['concert', 'sports', 'comedy', 'college', 'festival', 'movie', 'hotel', 'theatre'], default: 'concert' },
  city: { type: String, required: true },
  venue: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  ticketPrice: { type: Number, required: true },
  imageUrl: { type: String },
  bannerUrl: { type: String },
  galleryImages: [{ type: String }],
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  seatsAvailable: { type: Number, default: 200 },
  capacity: { type: Number, default: 200 },
  time: { type: String },
  published: { type: Boolean, default: true },
  approved: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  analytics: {
    views: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
  },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
