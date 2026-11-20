const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve profile' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const { name, city, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (city) user.city = city;
    if (phone) user.phone = phone;

    await user.save();
    res.json({ message: 'Profile updated', user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(400).json({ message: 'Failed to update profile' });
  }
};

// @desc    Get user wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', 'title city startDate ticketPrice imageUrl');
    res.json(user?.wishlist || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve wishlist' });
  }
};

// @desc    Add item to user wishlist
// @route   POST /api/users/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
  try {
    const { itemId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.wishlist.includes(itemId)) user.wishlist.push(itemId);

    await user.save();
    res.json({ message: 'Added to wishlist', wishlist: user.wishlist });
  } catch (error) {
    res.status(400).json({ message: 'Failed to add item to wishlist' });
  }
};

// @desc    Remove item from user wishlist
// @route   DELETE /api/users/wishlist/:id
// @access  Private
const removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.wishlist = user.wishlist.filter((item) => item.toString() !== req.params.id);
    await user.save();
    res.json({ message: 'Removed from wishlist', wishlist: user.wishlist });
  } catch (error) {
    res.status(400).json({ message: 'Failed to remove item from wishlist' });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve users' });
  }
};

// @desc    Update user status
// @route   PUT /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.status = req.body.status || user.status;
    await user.save();
    res.json({ message: 'User status updated', user });
  } catch (error) {
    res.status(400).json({ message: 'Failed to update user status' });
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.role = req.body.role || user.role;
    user.status = req.body.status || user.status;
    await user.save();
    res.json({ message: 'User role updated', user });
  } catch (error) {
    res.status(400).json({ message: 'Failed to update user role' });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      await user.deleteOne();
      return res.json({ message: 'User removed' });
    }
    res.status(404).json({ message: 'User not found' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
};
