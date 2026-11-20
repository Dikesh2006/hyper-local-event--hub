const Razorpay = require('razorpay');
const crypto = require('crypto');

/**
 * Strips accidental surrounding quotes and whitespace from env keys
 */
const cleanEnvKey = (val) => {
  if (!val) return '';
  return String(val).replace(/^["']|["']$/g, '').trim();
};

/**
 * Checks whether the key is a placeholder or not set
 */
const isPlaceholderKey = (key) => {
  const clean = cleanEnvKey(key);
  if (!clean) return true;
  return (
    clean.includes('your_key') ||
    clean.includes('your_razorpay') ||
    clean === 'rzp_test_your_key_id_here' ||
    clean === 'rzp_test_placeholder'
  );
};

/**
 * Returns a configured Razorpay instance or null if placeholder/unconfigured
 */
const getRazorpayInstance = () => {
  const key_id = cleanEnvKey(process.env.RAZORPAY_KEY_ID);
  const key_secret = cleanEnvKey(process.env.RAZORPAY_KEY_SECRET);

  if (!key_id || !key_secret || isPlaceholderKey(key_id) || isPlaceholderKey(key_secret)) {
    return null;
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

/**
 * Verifies the Razorpay HMAC SHA256 payment signature
 * formula: hmac_sha256(order_id + "|" + payment_id, secret) === signature
 */
const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const secret = cleanEnvKey(process.env.RAZORPAY_KEY_SECRET);
  if (!secret || !orderId || !paymentId || !signature) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${String(orderId).trim()}|${String(paymentId).trim()}`)
    .digest('hex');

  return generatedSignature === String(signature).trim();
};

module.exports = {
  getRazorpayInstance,
  verifyRazorpaySignature,
  isPlaceholderKey,
  cleanEnvKey,
};
