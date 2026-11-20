const Hall = require('../models/Hall');

// Helper to safely escape user input in regular expressions
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get all halls with filters
// @route   GET /api/halls
// @access  Public
const getHalls = async (req, res) => {
  try {
    const { city, type, minCapacity, maxPrice, search } = req.query;
    const filters = { published: { $ne: false } };

    if (city) filters.city = new RegExp(escapeRegex(city), 'i');
    if (type) filters.type = type;
    if (minCapacity) filters.capacity = { $gte: Number(minCapacity) };
    if (maxPrice) {
      filters.$or = [
        { hourlyRate: { $lte: Number(maxPrice) } },
        { pricePerNight: { $lte: Number(maxPrice) } },
      ];
    }
    if (search) {
      const safeSearch = escapeRegex(search);
      filters.$or = [
        { name: new RegExp(safeSearch, 'i') },
        { address: new RegExp(safeSearch, 'i') },
        { description: new RegExp(safeSearch, 'i') },
      ];
    }

    const halls = await Hall.find(filters).sort('hourlyRate');
    res.json(halls);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve halls' });
  }
};

// @desc    Get user's owned halls
// @route   GET /api/halls/me
// @access  Private (HotelOwners, HallOwners, TheatreOwners, Admin)
const getMyHalls = async (req, res) => {
  try {
    const halls = await Hall.find({ owner: req.user._id }).sort('-createdAt');
    res.json(halls);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve your halls' });
  }
};

// @desc    Get hall by ID
// @route   GET /api/halls/:id
// @access  Public
const getHallById = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) return res.status(404).json({ message: 'Hall not found' });
    res.json(hall);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve hall details' });
  }
};

// @desc    Create new hall listing
// @route   POST /api/halls
// @access  Private (HotelOwners, HallOwners, TheatreOwners, Admin)
const createHall = async (req, res) => {
  try {
    const hall = await Hall.create({
      ...req.body,
      owner: req.user._id,
      published: req.body.published ?? true,
    });
    res.status(201).json(hall);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to create hall listing' });
  }
};

// @desc    Update hall listing
// @route   PUT /api/halls/:id
// @access  Private (HotelOwners, HallOwners, TheatreOwners, Admin)
const updateHall = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) return res.status(404).json({ message: 'Hall not found' });

    if (hall.owner && hall.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You do not own this hall listing' });
    }

    Object.assign(hall, req.body);
    await hall.save();
    res.json(hall);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to update hall listing' });
  }
};

// @desc    Delete hall listing
// @route   DELETE /api/halls/:id
// @access  Private (HotelOwners, HallOwners, TheatreOwners, Admin)
const deleteHall = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);
    if (!hall) return res.status(404).json({ message: 'Hall not found' });

    if (hall.owner && hall.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You do not own this hall listing' });
    }

    await hall.deleteOne();
    res.json({ message: 'Hall deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete hall listing' });
  }
};

module.exports = {
  getHalls,
  getMyHalls,
  getHallById,
  createHall,
  updateHall,
  deleteHall,
};
