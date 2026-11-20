const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  ticketId: { type: String, unique: true, sparse: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemType: { type: String, enum: ['movie', 'event', 'hall', 'manager'], default: 'movie' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
  theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre' },
  hall: { type: mongoose.Schema.Types.ObjectId, ref: 'Hall' },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' },
  date: { type: Date, required: true },
  showtime: { type: String },
  screen: { type: String },
  seats: [{
    seatNumber: String,
    price: Number,
    tier: String,
  }],
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'confirmed' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'paid' },
  qrCodeUrl: { type: String },
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
