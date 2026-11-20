const Movie = require('../models/Movie');

// Helper to safely escape user input in regular expressions
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get all movies with filters
// @route   GET /api/movies
// @access  Public
const getMovies = async (req, res) => {
  try {
    const { city, genre, search, minPrice, maxPrice } = req.query;
    const filters = { published: { $ne: false } };

    if (city) filters.city = new RegExp(escapeRegex(city), 'i');
    if (genre) filters.genre = new RegExp(escapeRegex(genre), 'i');
    if (search) {
      const safeSearch = escapeRegex(search);
      filters.$or = [
        { title: new RegExp(safeSearch, 'i') },
        { description: new RegExp(safeSearch, 'i') },
        { theatreName: new RegExp(safeSearch, 'i') },
      ];
    }
    if (minPrice || maxPrice) {
      filters['showtimes.price'] = {};
      if (minPrice) filters['showtimes.price'].$gte = Number(minPrice);
      if (maxPrice) filters['showtimes.price'].$lte = Number(maxPrice);
    }

    const movies = await Movie.find(filters).sort('-createdAt').limit(50);
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve movies' });
  }
};

// @desc    Get user's movies
// @route   GET /api/movies/me
// @access  Private (Managers, TheatreOwners, Admin)
const getMyMovies = async (req, res) => {
  try {
    const movies = await Movie.find({ owner: req.user._id }).sort('-createdAt');
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve your movie listings' });
  }
};

// @desc    Get movie by ID
// @route   GET /api/movies/:id
// @access  Public
const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve movie details' });
  }
};

// @desc    Create new movie listing
// @route   POST /api/movies
// @access  Private (Managers, TheatreOwners, Admin)
const createMovie = async (req, res) => {
  try {
    const movie = await Movie.create({
      ...req.body,
      owner: req.user._id,
      published: req.body.published ?? true,
    });
    res.status(201).json(movie);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to create movie listing' });
  }
};

// @desc    Update movie listing
// @route   PUT /api/movies/:id
// @access  Private (Managers, TheatreOwners, Admin)
const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    if (movie.owner && movie.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You do not own this movie listing' });
    }

    if (req.body.owner) delete req.body.owner;

    Object.assign(movie, req.body);
    await movie.save();
    res.json(movie);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to update movie listing' });
  }
};

// @desc    Delete movie listing
// @route   DELETE /api/movies/:id
// @access  Private (Managers, TheatreOwners, Admin)
const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    if (movie.owner && movie.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: You do not own this movie listing' });
    }

    await movie.deleteOne();
    res.json({ message: 'Movie deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete movie listing' });
  }
};

module.exports = {
  getMovies,
  getMyMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
};
