const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getPaymentConfig,
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayFailed,
  createPayment,
  getUserPayments,
} = require('../controllers/paymentController');

const router = express.Router();

// Configuration & public status
router.get('/config', getPaymentConfig);

// Razorpay TEST MODE flow routes
router.post('/razorpay/create-order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);
router.post('/razorpay/failed', protect, handleRazorpayFailed);

// Direct / Legacy payment records & user transactions
router.post('/create', protect, createPayment);
router.get('/', protect, getUserPayments);

module.exports = router;
