const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getHalls,
  getMyHalls,
  getHallById,
  createHall,
  updateHall,
  deleteHall,
} = require('../controllers/hallController');

const router = express.Router();

router.get('/', getHalls);
router.get('/me', protect, authorize('hotelOwner', 'hallOwner', 'hall_owner', 'theatreOwner', 'admin'), getMyHalls);
router.get('/:id', getHallById);
router.post('/', protect, authorize('hotelOwner', 'hallOwner', 'hall_owner', 'theatreOwner', 'admin'), createHall);
router.put('/:id', protect, authorize('hotelOwner', 'hallOwner', 'hall_owner', 'theatreOwner', 'admin'), updateHall);
router.delete('/:id', protect, authorize('hotelOwner', 'hallOwner', 'hall_owner', 'theatreOwner', 'admin'), deleteHall);

module.exports = router;
