const Event = require('../models/Event');

// Helper to safely escape user input in regular expressions
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get all events with filters
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const { city, category, minPrice, maxPrice, search, date } = req.query;
    const filters = { published: { $ne: false } };

    if (city) filters.city = new RegExp(escapeRegex(city), 'i');
    if (category) filters.category = new RegExp(escapeRegex(category), 'i');
    if (search) {
      const safeSearch = escapeRegex(search);
      filters.$or = [
        { title: new RegExp(safeSearch, 'i') },
        { description: new RegExp(safeSearch, 'i') },
        { venue: new RegExp(safeSearch, 'i') },
      ];
    }
    if (minPrice || maxPrice) {
      filters.ticketPrice = {};
      if (minPrice) filters.ticketPrice.$gte = Number(minPrice);
      if (maxPrice) filters.ticketPrice.$lte = Number(maxPrice);
    }
    if (date) {
      const targetDate = new Date(date);
      if (!isNaN(targetDate.getTime())) {
        filters.startDate = { $gte: targetDate };
      }
    }

    const events = await Event.find(filters).sort('-createdAt').limit(50);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve events' });
  }
};

// @desc    Get user's organized events
// @route   GET /api/events/me
// @access  Private (EventManagers, Managers, Organizers, Admin)
const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id }).sort('-createdAt');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve your events' });
  }
};

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve event details' });
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (EventManagers, Managers, Organizers, Admin)
const createEvent = async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      organizer: req.user._id,
      published: req.body.published ?? true,
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to create event' });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (EventManagers, Managers, Organizers, Admin)
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.organizer && event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to modify this event' });
    }

    Object.assign(event, req.body);
    await event.save();
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to update event' });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (EventManagers, Managers, Organizers, Admin)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.organizer && event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete event' });
  }
};

module.exports = {
  getEvents,
  getMyEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
