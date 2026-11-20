const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getBookings,
  getBookingById,
  createBooking,
  cancelBooking,
} = require('../controllers/bookingController');

const router = express.Router();

router.get('/', protect, getBookings);
router.get('/:id', protect, getBookingById);
router.post('/', protect, createBooking);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
