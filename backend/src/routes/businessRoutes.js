const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  BUSINESS_ROLES,
  getBusinessAnalytics,
  getBusinessBookings,
  getBusinessCustomers,
  getBusinessReviews,
  getBusinessRevenue,
  getBusinessNotifications,
} = require('../controllers/businessController');

const router = express.Router();

router.use(protect, authorize(...BUSINESS_ROLES));

router.get('/analytics', getBusinessAnalytics);
router.get('/bookings', getBusinessBookings);
router.get('/customers', getBusinessCustomers);
router.get('/reviews', getBusinessReviews);
router.get('/revenue', getBusinessRevenue);
router.get('/notifications', getBusinessNotifications);

module.exports = router;
