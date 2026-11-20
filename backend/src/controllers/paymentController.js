const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { processBookingCreation } = require('./bookingController');
const {
  getRazorpayInstance,
  verifyRazorpaySignature,
  isPlaceholderKey,
  cleanEnvKey,
} = require('../utils/razorpay');

// @desc    Get payment gateway status & public credentials
// @route   GET /api/payments/config
// @access  Public
const getPaymentConfig = async (req, res) => {
  const rawKeyId = process.env.RAZORPAY_KEY_ID;
  const rawKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const keyId = cleanEnvKey(rawKeyId);
  const isPlaceholder = isPlaceholderKey(keyId) || isPlaceholderKey(rawKeySecret);
  const hasRazorpayKeys = Boolean(keyId && cleanEnvKey(rawKeySecret));

  res.json({
    razorpayConfigured: hasRazorpayKeys,
    keyId: keyId || null,
    isTestMode: true,
    isPlaceholder: isPlaceholder,
    supportedMethods: ['card', 'upi', 'netbanking', 'wallet', 'razorpay'],
  });
};

// @desc    Create Razorpay Order in TEST MODE
// @route   POST /api/payments/razorpay/create-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', bookingDetails } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'A valid payment amount is required' });
    }

    // Convert amount in INR to paise (e.g. 500 INR -> 50000 paise)
    const amountInPaise = Math.round(numAmount * 100);
    const razorpay = getRazorpayInstance();

    if (razorpay) {
      // Create real order using Razorpay API in Test Mode
      const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const options = {
        amount: amountInPaise,
        currency: currency || 'INR',
        receipt,
        notes: {
          userId: req.user._id.toString(),
          userEmail: req.user.email || '',
          itemType: bookingDetails?.type || 'movie',
          itemTitle: bookingDetails?.title || 'Hyper Local Event Hub Booking',
        },
      };

      const order = await razorpay.orders.create(options);
      return res.status(201).json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: cleanEnvKey(process.env.RAZORPAY_KEY_ID),
        receipt: order.receipt,
        isDemoOrder: false,
      });
    } else {
      // Fallback for placeholder demo credentials so UI and unit tests work gracefully
      const mockOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const mockPaymentId = `pay_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const secret = cleanEnvKey(process.env.RAZORPAY_KEY_SECRET) || 'your_razorpay_secret_key_here';
      const mockSignature = crypto
        .createHmac('sha256', secret)
        .update(`${mockOrderId}|${mockPaymentId}`)
        .digest('hex');

      return res.status(201).json({
        success: true,
        orderId: mockOrderId,
        amount: amountInPaise,
        currency: currency || 'INR',
        keyId: cleanEnvKey(process.env.RAZORPAY_KEY_ID) || 'rzp_test_placeholder',
        receipt: `rcpt_test_${Date.now()}`,
        isDemoOrder: true,
        demoPaymentPayload: {
          razorpay_order_id: mockOrderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: mockSignature,
        },
        message: 'Order created in test mode using placeholder keys',
      });
    }
  } catch (error) {
    const errorDesc =
      error?.error?.description ||
      error?.description ||
      error?.message ||
      'Failed to create Razorpay order';

    console.error('Create Razorpay order error:', errorDesc);
    res.status(500).json({
      success: false,
      message: errorDesc.includes('Authentication')
        ? 'Razorpay authentication failed. Please verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.'
        : errorDesc,
    });
  }
};

// @desc    Verify Razorpay payment signature & confirm booking with ticket
// @route   POST /api/payments/razorpay/verify
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingDetails,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay payment verification parameters',
      });
    }

    if (!bookingDetails) {
      return res.status(400).json({
        success: false,
        message: 'Booking details are required to finalize ticket creation',
      });
    }

    // Cryptographic signature verification using HMAC-SHA256
    const isSignatureValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isSignatureValid) {
      console.warn(`[Razorpay Security] Signature mismatch for order: ${razorpay_order_id}`);

      // Record failed transaction attempt
      await Payment.create({
        user: req.user._id,
        amount: bookingDetails.totalPrice || 0,
        provider: 'Razorpay',
        status: 'failed',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature,
      });

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid cryptographic signature.',
      });
    }

    // Signature verified! Process booking and generate verified digital ticket
    const booking = await processBookingCreation({
      userId: req.user._id,
      ...bookingDetails,
      paymentMethod: 'Razorpay',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature,
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully and ticket issued.',
      booking,
    });
  } catch (error) {
    console.error('Verify Razorpay payment error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Payment verification processing failed',
    });
  }
};

// @desc    Handle failed or cancelled Razorpay payments
// @route   POST /api/payments/razorpay/failed
// @access  Private
const handleRazorpayFailed = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      error_code,
      error_description,
      bookingDetails,
    } = req.body;

    const payment = await Payment.create({
      user: req.user._id,
      amount: bookingDetails?.totalPrice || 0,
      provider: 'Razorpay',
      status: 'failed',
      paymentId: razorpay_payment_id || `failed_${Date.now()}`,
      orderId: razorpay_order_id || 'unknown',
    });

    res.status(200).json({
      success: false,
      message: error_description || 'Payment was declined or cancelled.',
      payment,
    });
  } catch (error) {
    console.error('Handle failed payment error:', error);
    res.status(500).json({ message: 'Failed to record payment cancellation' });
  }
};

// @desc    Create/Confirm payment record (legacy / direct mock)
// @route   POST /api/payments/create
// @access  Private
const createPayment = async (req, res) => {
  try {
    const { bookingId, amount, paymentId, orderId, provider, status } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Ensure users cannot modify or confirm other users' payments
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to submit payment for this booking' });
    }

    // Prevent duplicate payment confirmations
    if (booking.payment) {
      const existingPay = await Payment.findById(booking.payment);
      if (existingPay && existingPay.status === 'successful') {
        return res.status(400).json({ message: 'Payment has already been confirmed for this booking.' });
      }
    }

    const existingSuccessful = await Payment.findOne({ booking: bookingId, status: 'successful' });
    if (existingSuccessful) {
      return res.status(400).json({ message: 'A successful payment already exists for this booking.' });
    }

    const isFailure = status === 'failed';
    const payment = await Payment.create({
      user: req.user._id,
      booking: bookingId,
      amount: amount || booking.totalPrice,
      provider: provider || 'Razorpay',
      status: isFailure ? 'failed' : 'successful',
      paymentId: paymentId || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderId: orderId || `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    });

    if (isFailure) {
      booking.paymentStatus = 'failed';
      booking.status = 'pending';
      await booking.save();
      return res.status(400).json({
        message: 'Payment was declined or failed. The booking has not been confirmed.',
        payment,
      });
    }

    booking.payment = payment._id;
    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';
    await booking.save();

    res.status(201).json(payment);
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ message: 'Failed to process payment' });
  }
};

// @desc    Get user's payment transactions (Admin sees all transactions)
// @route   GET /api/payments
// @access  Private
const getUserPayments = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    const payments = await Payment.find(filter)
      .populate('user', 'name email role')
      .populate('booking')
      .sort('-createdAt');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
};

module.exports = {
  getPaymentConfig,
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayFailed,
  createPayment,
  getUserPayments,
};
