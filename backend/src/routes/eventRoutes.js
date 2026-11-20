const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getEvents,
  getMyEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');

const router = express.Router();

router.get('/', getEvents);
router.get('/me', protect, authorize('eventManager', 'manager', 'organizer', 'admin'), getMyEvents);
router.get('/:id', getEventById);
router.post('/', protect, authorize('eventManager', 'manager', 'organizer', 'admin'), createEvent);
router.put('/:id', protect, authorize('eventManager', 'manager', 'organizer', 'admin'), updateEvent);
router.delete('/:id', protect, authorize('eventManager', 'manager', 'organizer', 'admin'), deleteEvent);

module.exports = router;
