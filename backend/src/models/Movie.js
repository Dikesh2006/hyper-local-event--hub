const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  genre: { type: String },
  duration: { type: Number },
  language: { type: String },
  posterUrl: { type: String },
  images: [{ type: String }],
  releaseDate: { type: Date },
  showtimes: [{
    time: String,
    price: Number,
    availableSeats: Number,
    screen: String,
    date: Date,
    theatreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre' },
    theatreName: String,
    bookedSeats: [{ type: String }],
  }],
  city: { type: String, default: 'Bhopal' },
  theatreName: { type: String },
  theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre' },
  rating: { type: Number, default: 4.2 },
  category: { type: String, default: 'movie' },
  published: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);
