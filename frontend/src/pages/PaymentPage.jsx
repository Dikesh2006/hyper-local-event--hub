import { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import api from '../api/api';
import TicketModal from '../components/TicketModal';
import AnimatedReveal from '../components/AnimatedReveal';

const PaymentPage = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [bookingDetails, setBookingDetails] = useState(location.state?.bookingDetails || null);
  const [gatewayConfig, setGatewayConfig] = useState({
    razorpayConfigured: false,
    keyId: null,
    isPlaceholder: true,
  });
  const [selectedMethod, setSelectedMethod] = useState(
    location.state?.bookingDetails?.selectedMethod || 'razorpay'
  );
  const [cardForm, setCardForm] = useState({
    name: user?.name || '',
    cardNumber: '4111 2222 3333 4444',
    expiry: '12/28',
    cvv: '123',
  });
  const [upiId, setUpiId] = useState(user?.email ? `${user.email.split('@')[0]}@okaxis` : 'user@upi');
  const [bank, setBank] = useState('HDFC Bank');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [demoOrderNotice, setDemoOrderNotice] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  useEffect(() => {
    // 1. Fetch payment gateway configuration from backend
    api.get('/payments/config')
      .then((res) => setGatewayConfig(res.data))
      .catch(() => setGatewayConfig({ razorpayConfigured: false, keyId: null, isPlaceholder: true }));

    // 2. If user navigated to /payment directly without state, load a default movie session
    if (!bookingDetails) {
      api.get('/movies')
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            const m = res.data[0];
            const st = m.showtimes?.[0];
            const booked = st?.bookedSeats || [];
            const allSeats = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'D1', 'D2', 'D3', 'D4', 'D5'];
            const freeSeat = allSeats.find((s) => !booked.includes(s)) || `S${Math.floor(Math.random() * 80) + 1}`;
            setBookingDetails({
              type: 'movie',
              movieId: m._id,
              title: m.title,
              venue: m.theatreName || 'CineMax Multiplex',
              city: m.city || 'Bhopal',
              showtimeId: st?._id,
              showtime: st?.time || '07:00 PM',
              date: new Date(),
              seats: [{ seatNumber: freeSeat, price: st?.price || 250, tier: 'Standard' }],
              totalPrice: st?.price || 250,
            });
          }
        })
        .catch(() => {});
    }
  }, []);

  const totalAmount = bookingDetails?.totalPrice || 250;
  const convenienceFee = Math.round(totalAmount * 0.05);
  const grandTotal = totalAmount + convenienceFee;

  // Razorpay Checkout handler
  const handleRazorpayCheckout = async () => {
    setPaymentError('');
    setDemoOrderNotice(null);
    setProcessing(true);

    try {
      // If user toggled failure simulation, record failed payment safely
      if (simulateFailure) {
        await api.post('/payments/razorpay/failed', {
          error_code: 'SIMULATED_FAILURE',
          error_description: 'Payment was simulated as declined/cancelled by user toggle.',
          bookingDetails: {
            ...bookingDetails,
            totalPrice: grandTotal,
          },
        });
        throw new Error('Transaction was simulated as declined. No booking or ticket was issued.');
      }

      // 1. Create Razorpay order on backend
      const orderRes = await api.post('/payments/razorpay/create-order', {
        amount: grandTotal,
        currency: 'INR',
        bookingDetails: {
          ...bookingDetails,
          totalPrice: grandTotal,
        },
      });

      const orderData = orderRes.data;
      if (!orderData?.orderId) {
        throw new Error('Failed to generate Razorpay order from backend.');
      }

      // 2. If backend credentials are placeholders, offer verified demo test completion
      if (orderData.isDemoOrder) {
        setProcessing(false);
        setDemoOrderNotice({
          orderId: orderData.orderId,
          amount: orderData.amount,
          demoPayload: orderData.demoPaymentPayload,
          message:
            'Notice: Backend .env has placeholder keys (rzp_test_your_key_id_here). Razorpay official modal requires active dashboard keys. To verify the cryptographic signature and complete ticket generation right now, click the button below.',
        });
        return;
      }

      const activeKey =
        orderData.keyId ||
        gatewayConfig?.keyId ||
        import.meta.env.VITE_RAZORPAY_KEY_ID;

      // 3. Open official Razorpay Checkout modal
      if (typeof window.Razorpay === 'function') {
        const options = {
          key: activeKey,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Hyper Local Event Hub',
          description: `Booking for ${bookingDetails?.title || 'Event / Movie'}`,
          image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
          order_id: orderData.orderId,
          prefill: {
            name: user?.name || 'Demo Customer',
            email: user?.email || 'customer@example.com',
            contact: user?.phone || '9999999999',
          },
          notes: {
            bookingType: bookingDetails?.type || 'movie',
            itemTitle: bookingDetails?.title || '',
          },
          theme: {
            color: '#4f46e5',
          },
          handler: async function (response) {
            setProcessing(true);
            try {
              // 4. Cryptographically verify payment signature on backend
              const verifyRes = await api.post('/payments/razorpay/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingDetails: {
                  ...bookingDetails,
                  totalPrice: grandTotal,
                },
              });

              if (verifyRes.data?.success && verifyRes.data?.booking) {
                setConfirmedBooking(verifyRes.data.booking);
                setShowTicketModal(true);
              } else {
                throw new Error(verifyRes.data?.message || 'Payment signature verification failed.');
              }
            } catch (verifyErr) {
              setPaymentError(
                verifyErr.response?.data?.message || verifyErr.message || 'Payment verification failed.'
              );
            } finally {
              setProcessing(false);
            }
          },
          modal: {
            ondismiss: async function () {
              setProcessing(false);
              try {
                await api.post('/payments/razorpay/failed', {
                  razorpay_order_id: orderData.orderId,
                  error_description: 'Checkout window closed by user without completing transaction.',
                  bookingDetails: {
                    ...bookingDetails,
                    totalPrice: grandTotal,
                  },
                });
              } catch (_) {}
              setPaymentError('Payment window closed. The booking was not confirmed.');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async function (failedResponse) {
          setProcessing(false);
          try {
            await api.post('/payments/razorpay/failed', {
              razorpay_order_id: failedResponse.error?.metadata?.order_id || orderData.orderId,
              razorpay_payment_id: failedResponse.error?.metadata?.payment_id,
              error_code: failedResponse.error?.code,
              error_description: failedResponse.error?.description,
              bookingDetails: {
                ...bookingDetails,
                totalPrice: grandTotal,
              },
            });
          } catch (_) {}
          setPaymentError(`Payment failed: ${failedResponse.error?.description || 'Transaction declined.'}`);
        });

        rzp.open();
      } else {
        throw new Error('Razorpay Checkout SDK not loaded. Please verify your connection.');
      }
    } catch (err) {
      setPaymentError(
        err.response?.data?.message || err.message || 'Razorpay checkout initialization failed.'
      );
      setProcessing(false);
    }
  };

  // Simulated Test Payment verification using valid HMAC-SHA256 signature
  const handleSimulateTestPayment = async () => {
    if (!demoOrderNotice?.demoPayload) return;
    setProcessing(true);
    setPaymentError('');

    try {
      // Sends order_id, payment_id, and signature to backend verification
      const verifyRes = await api.post('/payments/razorpay/verify', {
        ...demoOrderNotice.demoPayload,
        bookingDetails: {
          ...bookingDetails,
          totalPrice: grandTotal,
        },
      });

      if (verifyRes.data?.success && verifyRes.data?.booking) {
        setConfirmedBooking(verifyRes.data.booking);
        setShowTicketModal(true);
        setDemoOrderNotice(null);
      } else {
        throw new Error(verifyRes.data?.message || 'Verification failed');
      }
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Payment verification failed.');
    } finally {
      setProcessing(false);
    }
  };

  // Direct checkout handler (cards / upi / netbanking fallback)
  const handleDirectPay = async () => {
    setPaymentError('');
    setProcessing(true);

    try {
      if (simulateFailure) {
        throw new Error('Transaction was declined by card issuing bank. No booking was created.');
      }

      const bookingPayload = {
        movieId: bookingDetails?.movieId,
        eventId: bookingDetails?.eventId,
        hallId: bookingDetails?.hallId,
        managerId: bookingDetails?.managerId,
        date: bookingDetails?.date || new Date(),
        showtime: bookingDetails?.showtime || '07:00 PM',
        showtimeId: bookingDetails?.showtimeId,
        seats: bookingDetails?.seats || [{ seatNumber: 'Pass 1', price: totalAmount }],
        totalPrice: grandTotal,
        paymentMethod: selectedMethod === 'card' ? 'Credit/Debit Card' : selectedMethod === 'upi' ? 'UPI' : 'Net Banking',
        paymentId: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      };

      const bookingRes = await api.post('/bookings', bookingPayload);
      const createdBooking = bookingRes.data;

      setConfirmedBooking(createdBooking);
      setShowTicketModal(true);
    } catch (err) {
      setPaymentError(
        err.response?.data?.message || err.message || 'Payment processing failed. Please verify payment details.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (selectedMethod === 'razorpay') {
      handleRazorpayCheckout();
    } else {
      handleDirectPay();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <AnimatedReveal delay={0.05} duration={0.6} y={16} className="rounded-[2.5rem] border border-white/10 bg-slate-900/90 p-8 shadow-glass backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-300">
                Razorpay TEST MODE
              </span>
              <span className="rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-300">
                256-Bit SSL Encrypted
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-bold text-white tracking-tight">Checkout & Instant Ticket Issuance</h1>
            <p className="mt-2 text-sm text-slate-300">
              Confirm booking details, complete payment via Razorpay test gateway, and instantly receive your ticket with digital verification QR code.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-slate-950/60 p-3 border border-white/10">
            <span className="text-xl">⚡</span>
            <span className="text-xs font-bold text-slate-300">Razorpay Test Gateway</span>
          </div>
        </div>
      </AnimatedReveal>

      {/* Main Grid: Details + Payment Form */}
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1.7fr]">
        {/* Left Column: Order / Booking Summary */}
        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/90 p-6 shadow-glass space-y-5">
            <h2 className="text-lg font-bold text-white border-b border-white/10 pb-3">Booking Summary</h2>

            {bookingDetails ? (
              <div className="space-y-4">
                <div>
                  <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-indigo-300">
                    {bookingDetails.type === 'movie'
                      ? '🎬 Movie Screening'
                      : bookingDetails.type === 'event'
                      ? '🎟️ Live Event'
                      : bookingDetails.type === 'hall'
                      ? '🏛️ Banquet Venue'
                      : '👔 Event Manager Hire'}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1.5">{bookingDetails.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    📍 {bookingDetails.venue} {bookingDetails.city ? `• ${bookingDetails.city}` : ''}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950/70 p-4 border border-white/5 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date:</span>
                    <span className="font-semibold text-white">
                      {new Date(bookingDetails.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Time:</span>
                    <span className="font-semibold text-indigo-300">{bookingDetails.showtime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Seats / Passes:</span>
                    <span className="font-semibold text-white">
                      {bookingDetails.seats?.map((s) => (typeof s === 'string' ? s : s.seatNumber)).join(', ')}
                    </span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 pt-2 border-t border-white/10 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Base Ticket Fare:</span>
                    <span className="text-white font-medium">₹{totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Convenience Fee (5%):</span>
                    <span className="text-white font-medium">₹{convenienceFee}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
                    <span>Total Amount:</span>
                    <span className="text-emerald-400 text-lg">₹{grandTotal}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <p className="text-xs text-slate-400">Loading booking details...</p>
                <div className="flex justify-center gap-2">
                  <Link to="/movies" className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white">
                    Explore Movies
                  </Link>
                  <Link to="/events" className="rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-white">
                    Browse Events
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Razorpay Gateway Status */}
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 text-xs space-y-2.5 text-slate-400">
            <div className="flex items-center gap-2 text-white font-bold">
              <span>💳</span>
              <span>Razorpay Integration Status</span>
            </div>
            {gatewayConfig.razorpayConfigured && !gatewayConfig.isPlaceholder ? (
              <p className="text-emerald-300 leading-relaxed">
                Active Key ID: <code className="bg-emerald-950/60 px-1 py-0.5 rounded text-emerald-200">{gatewayConfig.keyId}</code> (Test Mode). Real-time test orders & checkout active.
              </p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-amber-300/90 leading-relaxed">
                  Key ID configured: <code className="text-amber-200 bg-amber-950/60 px-1 py-0.5 rounded">{gatewayConfig.keyId || 'Not configured'}</code>.
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  To use your personal Razorpay dashboard test keys, put them in <code className="text-indigo-300">backend/.env</code> (<code className="text-indigo-200">RAZORPAY_KEY_ID</code> and <code className="text-indigo-200">RAZORPAY_KEY_SECRET</code>) and save the file.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Payment Form */}
        <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/90 p-6 md:p-8 shadow-glass space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Select Payment Method</h2>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Demo Test Mode
            </span>
          </div>

          {/* Payment Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'razorpay', label: '⚡ Razorpay', desc: 'Test Gateway' },
              { id: 'card', label: '💳 Cards', desc: 'Credit / Debit' },
              { id: 'upi', label: '📱 UPI', desc: 'GPay / PhonePe' },
              { id: 'netbanking', label: '🏦 NetBanking', desc: 'All Banks' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedMethod(tab.id)}
                className={`rounded-2xl p-3 text-left transition border ${
                  selectedMethod === tab.id
                    ? 'border-indigo-500 bg-indigo-600/30 text-white ring-1 ring-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : 'border-white/10 bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-950'
                }`}
              >
                <p className="text-xs font-bold">{tab.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{tab.desc}</p>
              </button>
            ))}
          </div>

          {/* Form based on selected method */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedMethod === 'razorpay' && (
              <div className="rounded-2xl bg-indigo-950/30 border border-indigo-500/30 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <div>
                      <p className="text-sm font-bold text-white">Razorpay Standard Test Checkout</p>
                      <p className="text-[11px] text-indigo-300">Official Checkout with automatic HMAC verification</p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300">
                    TEST ONLY
                  </span>
                </div>

                <div className="rounded-xl bg-slate-950/80 p-3.5 border border-white/5 space-y-1.5 text-xs">
                  <p className="font-semibold text-slate-200">Razorpay Test Card Details:</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div>
                      Card: <code className="text-emerald-300 font-mono">4111 2222 3333 4444</code>
                    </div>
                    <div>
                      CVV: <code className="text-emerald-300 font-mono">123</code>
                    </div>
                    <div>
                      Expiry: <code className="text-emerald-300 font-mono">12/28</code>
                    </div>
                    <div>
                      OTP: <code className="text-emerald-300 font-mono">Any 4 or 6 digits</code>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'card' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Cardholder Name
                  <input
                    type="text"
                    required
                    value={cardForm.name}
                    onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-xs text-white outline-none focus:border-indigo-500"
                    placeholder="Jane Doe"
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-300">
                  Card Number
                  <input
                    type="text"
                    required
                    value={cardForm.cardNumber}
                    onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-xs text-white font-mono outline-none focus:border-indigo-500"
                    placeholder="4111 2222 3333 4444"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Expiry Date
                    <input
                      type="text"
                      required
                      value={cardForm.expiry}
                      onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                      className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-xs text-white font-mono outline-none focus:border-indigo-500"
                      placeholder="MM/YY"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-slate-300">
                    CVV
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={cardForm.cvv}
                      onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                      className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-xs text-white font-mono outline-none focus:border-indigo-500"
                      placeholder="•••"
                    />
                  </label>
                </div>
              </div>
            )}

            {selectedMethod === 'upi' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Virtual Payment Address (UPI ID)
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-xs text-white outline-none focus:border-indigo-500"
                    placeholder="name@upi / phone@okhdfcbank"
                  />
                </label>
                <div className="flex gap-2">
                  {['@okaxis', '@okhdfcbank', '@paytm', '@ybl'].map((suf) => (
                    <button
                      key={suf}
                      type="button"
                      onClick={() => setUpiId((id) => (id.includes('@') ? id.split('@')[0] + suf : id + suf))}
                      className="rounded-lg bg-slate-950 px-2 py-1 text-[10px] text-slate-400 hover:text-white"
                    >
                      {suf}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedMethod === 'netbanking' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Select Bank
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-xs text-white outline-none focus:border-indigo-500"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India">State Bank of India (SBI)</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  </select>
                </label>
              </div>
            )}

            {/* Error Message */}
            {paymentError && (
              <div className="rounded-xl bg-rose-500/20 border border-rose-500/40 p-3 text-xs text-rose-200">
                {paymentError}
              </div>
            )}

            {/* Demo Notice Banner with Simulated Test Payment button */}
            {demoOrderNotice && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs space-y-3">
                <p className="text-amber-200 leading-relaxed">{demoOrderNotice.message}</p>
                <button
                  type="button"
                  onClick={handleSimulateTestPayment}
                  className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-500 transition shadow"
                >
                  ⚡ Complete Test Payment (Simulate & Issue Ticket)
                </button>
              </div>
            )}

            {/* Simulation Toggle for testing failed payment requirement */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  onChange={(e) => setSimulateFailure(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Simulate payment failure (Test decline & rejection handling)</span>
              </label>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={processing}
              className={`w-full rounded-2xl py-4 text-sm font-bold transition shadow-lg ${
                processing
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : selectedMethod === 'razorpay'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-95 shadow-indigo-600/30'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-95 shadow-emerald-600/30'
              }`}
            >
              {processing
                ? 'Processing & Generating Ticket...'
                : selectedMethod === 'razorpay'
                ? `⚡ Pay ₹${grandTotal} with Razorpay Checkout`
                : `Pay ₹${grandTotal} & Issue Ticket`}
            </button>
          </form>

          {/* Success summary if completed */}
          {confirmedBooking && (
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-center">
                <span className="text-xs font-bold uppercase text-emerald-300">Ticket Issued Successfully!</span>
                <p className="text-lg font-mono font-bold text-white mt-1">
                  {confirmedBooking.ticketId || `ID: ${confirmedBooking._id?.slice(-8).toUpperCase()}`}
                </p>
              </div>
              <button
                onClick={() => setShowTicketModal(true)}
                className="w-full rounded-2xl bg-indigo-600 py-3.5 text-xs font-bold text-white hover:bg-indigo-500"
              >
                View Digital Ticket With QR Code
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && confirmedBooking && (
        <TicketModal
          booking={confirmedBooking}
          onClose={() => setShowTicketModal(false)}
        />
      )}
    </div>
  );
};

export default PaymentPage;
