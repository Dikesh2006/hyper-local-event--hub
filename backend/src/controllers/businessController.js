const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const Event = require('../models/Event');
const Movie = require('../models/Movie');
const Hall = require('../models/Hall');

// Business role mapping helper
const BUSINESS_ROLES = ['eventManager', 'manager', 'organizer', 'hotelOwner', 'hallOwner', 'theatreOwner', 'admin'];

const getOwnedItemIds = async (userId, role) => {
  const owned = {
    events: [],
    movies: [],
    halls: [],
  };

  if (['eventManager', 'manager', 'organizer'].includes(role) || role === 'admin') {
    const events = await Event.find({ organizer: userId }, '_id').lean();
    owned.events = events.map((e) => e._id);
  }

  if (['theatreOwner'].includes(role) || ['manager', 'organizer', 'eventManager'].includes(role) || role === 'admin') {
    const movies = await Movie.find({ owner: userId }, '_id').lean();
    owned.movies = movies.map((m) => m._id);
  }

  if (['hotelOwner', 'hallOwner', 'theatreOwner'].includes(role) || role === 'admin') {
    const halls = await Hall.find({ owner: userId }, '_id').lean();
    owned.halls = halls.map((h) => h._id);
  }

  return owned;
};

// @desc    Get business dashboard analytics
// @route   GET /api/business/analytics
// @access  Private (Business Roles)
const getBusinessAnalytics = async (req, res) => {
  try {
    const owned = await getOwnedItemIds(req.user._id, req.user.role);

    const [bookingsCount, successfulPaymentsCount] = await Promise.all([
      Booking.countDocuments({
        $or: [
          { event: { $in: owned.events } },
          { movie: { $in: owned.movies } },
          { hall: { $in: owned.halls } },
        ],
      }),
      Payment.countDocuments({
        status: 'successful',
        booking: { $exists: true },
      }),
    ]);

    res.json({
      bookings: bookingsCount,
      paymentsSuccessful: successfulPaymentsCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve business analytics' });
  }
};

// @desc    Get bookings for business-owned items
// @route   GET /api/business/bookings
// @access  Private (Business Roles)
const getBusinessBookings = async (req, res) => {
  try {
    const owned = await getOwnedItemIds(req.user._id, req.user.role);

    const bookings = await Booking.find({
      $or: [
        { event: { $in: owned.events } },
        { movie: { $in: owned.movies } },
        { hall: { $in: owned.halls } },
      ],
    }).populate('event movie hall manager user');

    res.json(bookings.sort((a, b) => b.createdAt - a.createdAt));
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve business bookings' });
  }
};

// @desc    Get unique customers who booked business-owned items
// @route   GET /api/business/customers
// @access  Private (Business Roles)
const getBusinessCustomers = async (req, res) => {
  try {
    const owned = await getOwnedItemIds(req.user._id, req.user.role);

    const users = await Booking.distinct('user', {
      $or: [
        { event: { $in: owned.events } },
        { movie: { $in: owned.movies } },
        { hall: { $in: owned.halls } },
      ],
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve business customers' });
  }
};

// @desc    Get reviews for business-owned items
// @route   GET /api/business/reviews
// @access  Private (Business Roles)
const getBusinessReviews = async (req, res) => {
  try {
    const owned = await getOwnedItemIds(req.user._id, req.user.role);

    const [reviewsByMovies, reviewsByEvents, reviewsByHalls] = await Promise.all([
      Review.find({ targetType: 'movie', target: { $in: owned.movies } }).populate('author', 'name email'),
      Review.find({ targetType: 'event', target: { $in: owned.events } }).populate('author', 'name email'),
      Review.find({ targetType: 'hall', target: { $in: owned.halls } }).populate('author', 'name email'),
    ]);

    res.json([...reviewsByEvents, ...reviewsByMovies, ...reviewsByHalls]);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve business reviews' });
  }
};

// @desc    Get revenue for business-owned items
// @route   GET /api/business/revenue
// @access  Private (Business Roles)
const getBusinessRevenue = async (req, res) => {
  try {
    const owned = await getOwnedItemIds(req.user._id, req.user.role);

    const businessBookingIds = await Booking.find({
      $or: [
        { event: { $in: owned.events } },
        { movie: { $in: owned.movies } },
        { hall: { $in: owned.halls } },
      ],
    }).distinct('_id');

    const payments = await Payment.find({ booking: { $in: businessBookingIds }, status: 'successful' });

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      totalRevenue,
      payments,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve business revenue' });
  }
};

// @desc    Get business notifications (pending approval items)
// @route   GET /api/business/notifications
// @access  Private (Business Roles)
const getBusinessNotifications = async (req, res) => {
  try {
    const owned = await getOwnedItemIds(req.user._id, req.user.role);

    const [pendingEvents, pendingHalls] = await Promise.all([
      Event.find({ _id: { $in: owned.events }, approved: false }).select('title city approved'),
      Hall.find({ _id: { $in: owned.halls }, approved: false }).select('name city type approved'),
    ]);

    res.json({
      pendingEvents,
      pendingHalls,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve business notifications' });
  }
};

module.exports = {
  BUSINESS_ROLES,
  getBusinessAnalytics,
  getBusinessBookings,
  getBusinessCustomers,
  getBusinessReviews,
  getBusinessRevenue,
  getBusinessNotifications,
};
