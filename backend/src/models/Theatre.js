const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    screens: [
      {
        name: { type: String, required: true },
        capacity: { type: Number, default: 80 },
        rows: { type: Number, default: 8 },
        cols: { type: Number, default: 10 },
        seatTiers: [
          {
            name: { type: String, default: 'Standard' },
            price: { type: Number, default: 250 },
            rows: [{ type: String }],
          },
        ],
      },
    ],
    amenities: [{ type: String }],
    description: { type: String },
    rating: { type: Number, default: 4.5 },
    status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Theatre', theatreSchema);
