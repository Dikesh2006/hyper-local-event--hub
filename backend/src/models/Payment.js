const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  amount: { type: Number, required: true },
  provider: { type: String, default: 'Razorpay' },
  status: { type: String, enum: ['pending', 'successful', 'failed'], default: 'pending' },
  paymentId: { type: String },
  orderId: { type: String },
  signature: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
