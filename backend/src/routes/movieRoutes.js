const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getMovies,
  getMyMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} = require('../controllers/movieController');

const router = express.Router();

router.get('/', getMovies);
router.get('/me', protect, authorize('eventManager', 'theatreOwner', 'manager', 'organizer', 'admin'), getMyMovies);
router.get('/:id', getMovieById);
router.post('/', protect, authorize('eventManager', 'theatreOwner', 'manager', 'organizer', 'admin'), createMovie);
router.put('/:id', protect, authorize('eventManager', 'theatreOwner', 'manager', 'organizer', 'admin'), updateMovie);
router.delete('/:id', protect, authorize('eventManager', 'theatreOwner', 'manager', 'organizer', 'admin'), deleteMovie);

module.exports = router;
