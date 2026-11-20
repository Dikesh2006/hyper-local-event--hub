const Event = require('../models/Event');
const Hall = require('../models/Hall');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Review = require('../models/Review');

// @desc    Get admin platform analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAdminAnalytics = async (req, res) => {
  try {
    const [users, events, halls, bookings, pendingHosts, pendingEvents, pendingHalls] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Hall.countDocuments(),
      Booking.countDocuments(),
      User.countDocuments({ role: { $in: ['eventManager', 'hotelOwner', 'theatreOwner'] }, status: 'pending' }),
      Event.countDocuments({ approved: false }),
      Hall.countDocuments({ approved: false }),
    ]);

    res.json({
      users,
      events,
      halls,
      bookings,
      pendingHosts,
      pendingListings: pendingEvents + pendingHalls,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve admin analytics' });
  }
};

// @desc    Approve an event listing
// @route   PUT /api/admin/events/:id/approve
// @access  Private/Admin
const approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    event.approved = true;
    await event.save();
    res.json({ message: 'Event approved' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve event' });
  }
};

// @desc    Reject an event listing
// @route   PUT /api/admin/events/:id/reject
// @access  Private/Admin
const rejectEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    event.approved = false;
    await event.save();
    res.json({ message: 'Event rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject event' });
  }
};

// @desc    Update hall approval status
// @route   PUT /api/admin/halls/:id/status
// @access  Private/Admin
const updateHallStatus = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) return res.status(404).json({ message: 'Hall not found' });
    hall.approved = Boolean(req.body.approved);
    await hall.save();
    res.json({ message: `Hall ${hall.approved ? 'approved' : 'rejected'}` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update hall status' });
  }
};

// @desc    Get all bookings (admin view)
// @route   GET /api/admin/bookings
// @access  Private/Admin
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('event movie hall manager user')
      .sort('-createdAt');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve bookings' });
  }
};

// @desc    Get total platform revenue
// @route   GET /api/admin/revenue
// @access  Private/Admin
const getRevenue = async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'successful' }).populate({ path: 'booking', select: '_id' });
    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    res.json({ totalRevenue, payments });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve platform revenue' });
  }
};

// @desc    Get all reviews (admin view)
// @route   GET /api/admin/reviews
// @access  Private/Admin
const getAdminReviews = async (req, res) => {
  try {
    const reviews = await Review.find({}).populate('author', 'name email');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve reviews' });
  }
};

// @desc    Get admin notifications summary
// @route   GET /api/admin/notifications
// @access  Private/Admin
const getAdminNotifications = async (req, res) => {
  try {
    const [pendingHosts, pendingEvents, pendingHalls, bookings, paymentsSuccessful] = await Promise.all([
      User.countDocuments({
        role: { $in: ['eventManager', 'hotelOwner', 'theatreOwner'] },
        status: 'pending',
      }),
      Event.countDocuments({ approved: false }),
      Hall.countDocuments({ approved: false }),
      Booking.countDocuments({}),
      Payment.countDocuments({ status: 'successful' }),
    ]);

    res.json({
      pendingHosts,
      pendingListings: pendingEvents + pendingHalls,
      bookings,
      paymentsSuccessful,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve admin notifications' });
  }
};

module.exports = {
  getAdminAnalytics,
  approveEvent,
  rejectEvent,
  updateHallStatus,
  getAllBookings,
  getRevenue,
  getAdminReviews,
  getAdminNotifications,
};
