const Theatre = require('../models/Theatre');

// Helper to safely escape user input in regular expressions
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get logged-in theater owner's theaters
// @route   GET /api/theatres/me
// @access  Private (TheatreOwner, Admin)
const getMyTheatres = async (req, res) => {
  try {
    let theatres = await Theatre.find({ owner: req.user._id }).sort('-createdAt');
    if (!theatres.length && ['theatreOwner', 'admin'].includes(req.user.role)) {
      // Create an initial default theater profile for new theatre owner
      const defaultTheatre = await Theatre.create({
        name: `${req.user.name}'s Cineplex`,
        city: req.user.city || 'Mumbai',
        address: 'Main Street Cinema Hub',
        owner: req.user._id,
        screens: [
          {
            name: 'Screen 1 (Dolby Atmos)',
            capacity: 80,
            rows: 8,
            cols: 10,
            seatTiers: [
              { name: 'VIP Recliner', price: 350, rows: ['A', 'B'] },
              { name: 'Premium', price: 250, rows: ['C', 'D', 'E'] },
              { name: 'Standard', price: 180, rows: ['F', 'G', 'H'] },
            ],
          },
          {
            name: 'Screen 2 (IMAX 3D)',
            capacity: 100,
            rows: 10,
            cols: 10,
            seatTiers: [
              { name: 'VIP Recliner', price: 450, rows: ['A', 'B', 'C'] },
              { name: 'Standard', price: 280, rows: ['D', 'E', 'F', 'G', 'H', 'I', 'J'] },
            ],
          },
        ],
        amenities: ['Dolby Atmos', '4K Projection', 'Recliner Seats', 'Gourmet Food Court', 'Parking'],
        description: 'Premier cinema destination with state-of-the-art projection and sound technology.',
      });
      theatres = [defaultTheatre];
    }
    res.json(theatres);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching theater details' });
  }
};

// @desc    Get public theaters (by city/search)
// @route   GET /api/theatres/public
// @access  Public
const getPublicTheatres = async (req, res) => {
  try {
    const { city, search } = req.query;
    const filter = {};
    if (city) filter.city = new RegExp(escapeRegex(city), 'i');
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: new RegExp(safeSearch, 'i') },
        { address: new RegExp(safeSearch, 'i') },
        { city: new RegExp(safeSearch, 'i') },
      ];
    }
    const theatres = await Theatre.find(filter).sort('name');
    res.json(theatres);
  } catch (error) {
    res.status(500).json({ message: 'Error loading theaters' });
  }
};

// @desc    Get theater by ID
// @route   GET /api/theatres/:id
// @access  Public
const getTheatreById = async (req, res) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) return res.status(404).json({ message: 'Theater not found' });
    res.json(theatre);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching theater' });
  }
};

// @desc    Create new theater
// @route   POST /api/theatres
// @access  Private (TheatreOwner, Admin)
const createTheatre = async (req, res) => {
  try {
    const theatre = await Theatre.create({
      ...req.body,
      owner: req.user._id,
    });
    res.status(201).json(theatre);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create theater' });
  }
};

// @desc    Update theater details/screens
// @route   PUT /api/theatres/:id
// @access  Private (TheatreOwner, Admin)
const updateTheatre = async (req, res) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) return res.status(404).json({ message: 'Theater not found' });

    if (theatre.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You do not own this theater' });
    }

    Object.assign(theatre, req.body);
    await theatre.save();
    res.json(theatre);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update theater' });
  }
};

// @desc    Delete theater
// @route   DELETE /api/theatres/:id
// @access  Private (TheatreOwner, Admin)
const deleteTheatre = async (req, res) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) return res.status(404).json({ message: 'Theater not found' });

    if (theatre.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You do not own this theater' });
    }

    await theatre.deleteOne();
    res.json({ message: 'Theater deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete theater' });
  }
};

module.exports = {
  getMyTheatres,
  getPublicTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
};
