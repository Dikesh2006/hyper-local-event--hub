const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}/api`;

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const postData = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (postData) headers['Content-Length'] = Buffer.byteLength(postData);

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

async function runTests() {
  console.log('=== STARTING RAZORPAY TEST MODE INTEGRATION TESTS ===\n');

  // Test 1: Config endpoint
  console.log('1. Testing GET /api/payments/config ...');
  const configRes = await request('/payments/config');
  console.log('Status:', configRes.status);
  console.log('Config response:', JSON.stringify(configRes.data, null, 2));
  if (configRes.status !== 200 || !configRes.data.razorpayConfigured) {
    throw new Error('Config endpoint failed');
  }
  console.log('✓ Config endpoint verified!\n');

  // Test 2: Register/Authenticate customer
  console.log('2. Authenticating demo customer ...');
  const testEmail = `razorpay_tester_${Date.now()}@hub.com`;
  const regRes = await request('/auth/register', 'POST', {
    name: 'Razorpay Tester',
    email: testEmail,
    password: 'TestPassword@123',
    role: 'user',
  });
  if (regRes.status !== 201 || !regRes.data.token) {
    throw new Error('Failed to register/authenticate user: ' + JSON.stringify(regRes.data));
  }
  const token = regRes.data.token;
  console.log('✓ Registered and authenticated as:', regRes.data.name, `(${testEmail})`, '\n');

  // Fetch available movies to get a valid showtime
  console.log('3. Fetching movies to create real booking payload ...');
  const moviesRes = await request('/movies');
  const movie = moviesRes.data[0];
  if (!movie || !movie.showtimes?.length) {
    throw new Error('No movies or showtimes found for test');
  }
  const showtime = movie.showtimes[0];
  const testSeat = `H${Math.floor(Math.random() * 8) + 1}`;
  console.log(`Using Movie: "${movie.title}", Showtime: "${showtime.time}", Seat: "${testSeat}"\n`);

  const bookingDetails = {
    type: 'movie',
    movieId: movie._id,
    title: movie.title,
    venue: movie.theatreName || 'Cineplex',
    city: movie.city || 'Bhopal',
    showtimeId: showtime._id,
    showtime: showtime.time,
    date: new Date(),
    seats: [{ seatNumber: testSeat, price: 250, tier: 'Standard' }],
    totalPrice: 250,
  };

  // Test 2: Create Razorpay Order
  console.log('4. Testing POST /api/payments/razorpay/create-order ...');
  const orderRes = await request(
    '/payments/razorpay/create-order',
    'POST',
    {
      amount: 250,
      currency: 'INR',
      bookingDetails,
    },
    token
  );
  console.log('Status:', orderRes.status);
  console.log('Order response:', JSON.stringify(orderRes.data, null, 2));
  if (orderRes.status !== 201 || !orderRes.data.orderId) {
    throw new Error('Create order failed: ' + JSON.stringify(orderRes.data));
  }
  const orderId = orderRes.data.orderId;
  console.log('✓ Razorpay Order Created:', orderId, '\n');

  // Test 3: Verify with INVALID signature (Must fail)
  console.log('5. Testing POST /api/payments/razorpay/verify with TAMPERED / INVALID signature ...');
  const invalidVerifyRes = await request(
    '/payments/razorpay/verify',
    'POST',
    {
      razorpay_order_id: orderId,
      razorpay_payment_id: 'pay_tampered_123',
      razorpay_signature: 'fake_tampered_invalid_signature_hex',
      bookingDetails,
    },
    token
  );
  console.log('Status:', invalidVerifyRes.status);
  console.log('Expected failure response:', invalidVerifyRes.data);
  if (invalidVerifyRes.status !== 400 || invalidVerifyRes.data.success !== false) {
    throw new Error('Invalid signature test did not fail as expected!');
  }
  console.log('✓ Tampered signature correctly rejected with HTTP 400!\n');

  // Test 4: Verify with VALID HMAC SHA256 signature
  console.log('6. Generating valid HMAC-SHA256 signature and testing POST /api/payments/razorpay/verify ...');
  const validPaymentId = `pay_test_${Date.now()}`;
  // Read key secret used by backend (fallback to default placeholder if not set)
  const secretKey = process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_secret_key_here';
  const validSignature = crypto
    .createHmac('sha256', secretKey)
    .update(`${orderId}|${validPaymentId}`)
    .digest('hex');

  const verifyRes = await request(
    '/payments/razorpay/verify',
    'POST',
    {
      razorpay_order_id: orderId,
      razorpay_payment_id: validPaymentId,
      razorpay_signature: validSignature,
      bookingDetails,
    },
    token
  );

  console.log('Status:', verifyRes.status);
  console.log('Verify response message:', verifyRes.data.message);
  console.log('Booking Ticket ID:', verifyRes.data.booking?.ticketId);
  console.log('Payment Status:', verifyRes.data.booking?.paymentStatus);
  console.log('QR Code generated length:', verifyRes.data.booking?.qrCodeUrl?.length);

  if (
    verifyRes.status !== 200 ||
    !verifyRes.data.success ||
    !verifyRes.data.booking?.ticketId ||
    verifyRes.data.booking.paymentStatus !== 'paid' ||
    !verifyRes.data.booking.qrCodeUrl
  ) {
    throw new Error('Valid signature verification or ticket generation failed: ' + JSON.stringify(verifyRes.data));
  }
  console.log('✓ Valid signature accepted, booking confirmed, ticket & QR code generated!\n');

  // Test 5: Failed / Cancelled payment handling
  console.log('7. Testing POST /api/payments/razorpay/failed ...');
  const failedRes = await request(
    '/payments/razorpay/failed',
    'POST',
    {
      razorpay_order_id: 'order_cancelled_test',
      razorpay_payment_id: 'pay_failed_test',
      error_code: 'BAD_REQUEST_ERROR',
      error_description: 'Payment was cancelled by user',
      bookingDetails,
    },
    token
  );
  console.log('Status:', failedRes.status);
  console.log('Failed payment recorded in DB:', failedRes.data.payment?._id, 'Status:', failedRes.data.payment?.status);
  if (failedRes.status !== 200 || failedRes.data.payment?.status !== 'failed') {
    throw new Error('Failed payment handler did not record status');
  }
  console.log('✓ Payment cancellation safely recorded without creating unauthorized booking!\n');

  console.log('=== ALL RAZORPAY TEST MODE TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
