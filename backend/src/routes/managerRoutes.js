const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getManagers,
  getManagerById,
  createManager,
  updateManager,
  deleteManager,
} = require('../controllers/managerController');

const router = express.Router();

router.get('/', getManagers);
router.get('/:id', getManagerById);
router.post('/', protect, authorize('organizer', 'admin'), createManager);
router.put('/:id', protect, authorize('organizer', 'admin'), updateManager);
router.delete('/:id', protect, authorize('admin'), deleteManager);

module.exports = router;
