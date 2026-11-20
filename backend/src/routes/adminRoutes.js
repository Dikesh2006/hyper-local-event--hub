const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getAdminAnalytics,
  approveEvent,
  rejectEvent,
  updateHallStatus,
  getAllBookings,
  getRevenue,
  getAdminReviews,
  getAdminNotifications,
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/analytics', getAdminAnalytics);
router.put('/events/:id/approve', approveEvent);
router.put('/events/:id/reject', rejectEvent);
router.put('/halls/:id/status', updateHallStatus);
router.get('/bookings', getAllBookings);
router.get('/revenue', getRevenue);
router.get('/reviews', getAdminReviews);
router.get('/notifications', getAdminNotifications);

module.exports = router;
