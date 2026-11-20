const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getUserProfile,
  updateUserProfile,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
} = require('../controllers/userController');

const router = express.Router();

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist', protect, addToWishlist);
router.delete('/wishlist/:id', protect, removeFromWishlist);

router.get('/', protect, authorize('admin'), getAllUsers);
router.put('/:id/status', protect, authorize('admin'), updateUserStatus);
router.put('/:id/role', protect, authorize('admin'), updateUserRole);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
