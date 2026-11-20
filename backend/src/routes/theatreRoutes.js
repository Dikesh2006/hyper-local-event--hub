const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getMyTheatres,
  getPublicTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
} = require('../controllers/theatreController');

const router = express.Router();

router.get('/public', getPublicTheatres);
router.get('/me', protect, authorize('theatreOwner', 'hallOwner', 'hotelOwner', 'admin'), getMyTheatres);
router.get('/:id', getTheatreById);
router.post('/', protect, authorize('theatreOwner', 'hallOwner', 'hotelOwner', 'admin'), createTheatre);
router.put('/:id', protect, authorize('theatreOwner', 'hallOwner', 'hotelOwner', 'admin'), updateTheatre);
router.delete('/:id', protect, authorize('theatreOwner', 'hallOwner', 'hotelOwner', 'admin'), deleteTheatre);

module.exports = router;
