const crypto = require('crypto');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Movie = require('../models/Movie');
const Hall = require('../models/Hall');
const Manager = require('../models/Manager');
const Payment = require('../models/Payment');
const createQRCode = require('../utils/generateQR');

// Helper to generate unique ticket identifier
const generateTicketIdentifier = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TKT-${timestamp}-${randomSuffix}`;
};

// @desc    Get bookings (User sees only own bookings; admin can filter by user)
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res) => {
  try {
    const filters = { user: req.user._id };
    if (req.user.role === 'admin') {
      if (req.query.user) filters.user = req.query.user;
    }

    const bookings = await Booking.find(filters)
      .populate('event movie hall manager theatre payment')
      .sort('-createdAt');
    res.json(bookings);
  } catch (error) {
    console.error('Fetch bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event movie hall manager theatre payment');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Get booking by id error:', error);
    res.status(500).json({ message: 'Error retrieving booking' });
  }
};

// Helper to process booking creation and ticket generation
const processBookingCreation = async ({
  userId,
  eventId,
  movieId,
  hallId,
  managerId,
  theatreId,
  showtimeId,
  showtime,
  date,
  seats,
  totalPrice: clientTotalPrice,
  paymentMethod,
  paymentId,
  orderId,
  signature,
}) => {
  let computedTotalPrice = 0;
  let formattedSeats = [];
  let savedShowtime = showtime || '';
  let savedScreen = 'Screen 1';
  let itemTitle = 'Booking';
  let itemType = 'movie';

  // 1. Movie Booking Flow
  if (movieId) {
    itemType = 'movie';
    const movie = await Movie.findById(movieId);
    if (!movie) {
      const err = new Error('Selected movie not found');
      err.statusCode = 404;
      throw err;
    }
    itemTitle = movie.title;

    let matchedShowtime = null;
    if (Array.isArray(movie.showtimes) && movie.showtimes.length > 0) {
      if (showtimeId) {
        matchedShowtime = movie.showtimes.id(showtimeId) || movie.showtimes.find((st) => st._id?.toString() === showtimeId.toString());
      }
      if (!matchedShowtime && showtime) {
        matchedShowtime = movie.showtimes.find((st) => st.time === showtime);
      }
      if (!matchedShowtime) {
        matchedShowtime = movie.showtimes[0];
      }
    }

    if (matchedShowtime) {
      savedShowtime = matchedShowtime.time || '07:00 PM';
      savedScreen = matchedShowtime.screen || 'Screen 1';

      if (!matchedShowtime.bookedSeats) {
        matchedShowtime.bookedSeats = [];
      }

      const requestedSeatNumbers = (seats || []).map((s) => (typeof s === 'string' ? s : s.seatNumber)).filter(Boolean);
      if (requestedSeatNumbers.length === 0) {
        const err = new Error('Please select at least one seat to proceed.');
        err.statusCode = 400;
        throw err;
      }

      // Duplicate seat checking
      const alreadyBooked = requestedSeatNumbers.filter((s) => matchedShowtime.bookedSeats.includes(s));
      if (alreadyBooked.length > 0) {
        const err = new Error(`Seat(s) ${alreadyBooked.join(', ')} are already booked. Please choose other seats.`);
        err.statusCode = 400;
        throw err;
      }

      const basePrice = Number(matchedShowtime.price) || 250;
      formattedSeats = requestedSeatNumbers.map((seatNo) => {
        const row = seatNo.charAt(0).toUpperCase();
        const isVip = ['A', 'B'].includes(row);
        const seatPrice = isVip ? basePrice + 100 : basePrice;
        computedTotalPrice += seatPrice;
        return {
          seatNumber: seatNo,
          price: seatPrice,
          tier: isVip ? 'VIP Recliner' : 'Standard',
        };
      });

      matchedShowtime.bookedSeats.push(...requestedSeatNumbers);
      if (matchedShowtime.availableSeats !== undefined) {
        matchedShowtime.availableSeats = Math.max(0, matchedShowtime.availableSeats - requestedSeatNumbers.length);
      }
      await movie.save();
    } else {
      // Fallback pricing if showtime not configured
      const reqSeats = (seats || []).map((s) => (typeof s === 'string' ? { seatNumber: s, price: 250 } : s));
      formattedSeats = reqSeats;
      computedTotalPrice = reqSeats.reduce((sum, s) => sum + (s.price || 250), 0);
    }
  }
  // 2. Event Booking Flow
  else if (eventId) {
    itemType = 'event';
    const event = await Event.findById(eventId);
    if (!event) {
      const err = new Error('Selected event not found');
      err.statusCode = 404;
      throw err;
    }
    itemTitle = event.title;
    savedShowtime = event.time || '07:00 PM';

    const requestedCount = Array.isArray(seats) && seats.length > 0 ? seats.length : 1;

    if (event.seatsAvailable !== undefined && event.seatsAvailable < requestedCount) {
      const err = new Error(`Only ${event.seatsAvailable} seat(s) remaining for this event.`);
      err.statusCode = 400;
      throw err;
    }

    const unitPrice = Number(event.ticketPrice) || 0;
    computedTotalPrice = unitPrice * requestedCount;

    formattedSeats = (Array.isArray(seats) && seats.length > 0 ? seats : [{ seatNumber: 'Pass 1' }]).map((s, idx) => ({
      seatNumber: typeof s === 'string' ? s : s.seatNumber || `General Pass ${idx + 1}`,
      price: unitPrice,
      tier: s.tier || 'General Admission',
    }));

    // Atomically decrement seats available and increment bookings counter
    await Event.findByIdAndUpdate(eventId, {
      $inc: {
        'analytics.bookings': 1,
        seatsAvailable: -requestedCount,
      },
    });
  }
  // 3. Hall Booking Flow
  else if (hallId) {
    itemType = 'hall';
    const hall = await Hall.findById(hallId);
    if (!hall) {
      const err = new Error('Selected hall not found');
      err.statusCode = 404;
      throw err;
    }
    itemTitle = hall.name;
    computedTotalPrice = Number(clientTotalPrice) || Number(hall.hourlyRate) || 1000;
    formattedSeats = [{ seatNumber: 'Full Venue Access', price: computedTotalPrice, tier: 'Venue Hire' }];
  }
  // 4. Event Manager Hiring Flow
  else if (managerId) {
    itemType = 'manager';
    const manager = await Manager.findById(managerId);
    if (!manager) {
      const err = new Error('Selected event manager not found');
      err.statusCode = 404;
      throw err;
    }
    itemTitle = `Event Manager: ${manager.name}`;
    savedShowtime = showtime || 'Full Event Supervision';
    computedTotalPrice = Number(clientTotalPrice) || Number(manager.pricePerEvent) || 5000;
    formattedSeats = [{ seatNumber: 'Lead Event Manager', price: computedTotalPrice, tier: manager.expertise || 'Event Management' }];
  } else {
    const err = new Error('Booking must specify either a movieId, eventId, hallId, or managerId');
    err.statusCode = 400;
    throw err;
  }

  const finalPrice = computedTotalPrice > 0 ? computedTotalPrice : Number(clientTotalPrice) || 0;
  const ticketId = generateTicketIdentifier();

  const booking = new Booking({
    ticketId,
    user: userId,
    itemType,
    event: eventId || null,
    movie: movieId || null,
    theatre: theatreId || null,
    hall: hallId || null,
    manager: managerId || null,
    date: date || new Date(),
    showtime: savedShowtime,
    screen: savedScreen,
    seats: formattedSeats,
    totalPrice: finalPrice,
    status: 'confirmed',
    paymentStatus: 'paid',
  });

  // Generate authentic ticket verification QR code
  const qrPayload = JSON.stringify({
    ticketId,
    bookingId: booking._id,
    user: userId,
    item: itemTitle,
    date: booking.date,
    showtime: savedShowtime,
    seats: formattedSeats.map((s) => s.seatNumber),
    totalPrice: finalPrice,
    status: 'CONFIRMED',
  });

  booking.qrCodeUrl = await createQRCode(qrPayload);
  await booking.save();

  // Create payment transaction record for this confirmed booking
  const payment = await Payment.create({
    user: userId,
    booking: booking._id,
    amount: finalPrice,
    provider: paymentMethod || 'Razorpay',
    status: 'successful',
    paymentId: paymentId || `pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    orderId: orderId || `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    signature: signature || null,
  });

  booking.payment = payment._id;
  await booking.save();

  // Return fully populated booking
  const populated = await Booking.findById(booking._id)
    .populate('event movie hall manager theatre payment');

  return populated;
};

// @desc    Create new booking with seat concurrency checks & ticket generation
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const populated = await processBookingCreation({
      userId: req.user._id,
      ...req.body,
    });
    res.status(201).json(populated);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(error.statusCode || 500).json({ message: error.message || 'Booking creation failed' });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    // Release movie seats if applicable
    if (booking.movie && booking.seats?.length) {
      const movie = await Movie.findById(booking.movie);
      if (movie && movie.showtimes) {
        const releasedSeatNumbers = booking.seats.map((s) => s.seatNumber);
        const st = movie.showtimes.find((s) => s.time === booking.showtime) || movie.showtimes[0];
        if (st && st.bookedSeats) {
          st.bookedSeats = st.bookedSeats.filter((seat) => !releasedSeatNumbers.includes(seat));
          if (st.availableSeats !== undefined) {
            st.availableSeats += releasedSeatNumbers.length;
          }
          await movie.save();
        }
      }
    }

    // Release event seats if applicable
    if (booking.event && booking.seats?.length) {
      await Event.findByIdAndUpdate(booking.event, {
        $inc: { seatsAvailable: booking.seats.length },
      });
    }

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    console.error('Cancellation error:', error);
    res.status(500).json({ message: 'Cancellation failed' });
  }
};

module.exports = {
  getBookings,
  getBookingById,
  createBooking,
  cancelBooking,
  processBookingCreation,
};

