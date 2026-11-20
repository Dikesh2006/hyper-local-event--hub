const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['movie', 'event', 'hall', 'manager'], required: true },
  target: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetType' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
