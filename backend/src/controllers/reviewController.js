const Review = require('../models/Review');

// @desc    Get reviews
// @route   GET /api/reviews
// @access  Public
const getReviews = async (req, res) => {
  try {
    const { targetType, target } = req.query;
    const filters = {};
    if (targetType) filters.targetType = targetType;
    if (target) filters.target = target;
    const reviews = await Review.find(filters).populate('author', 'name email');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve reviews' });
  }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { targetType, target, rating, comment } = req.body;
    if (!targetType || !target || !rating || !comment) {
      return res.status(400).json({ message: 'Target type, target id, rating, and comment are required' });
    }

    const review = await Review.create({
      author: req.user._id,
      targetType,
      target,
      rating: Number(rating),
      comment: String(comment).trim(),
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to submit review' });
  }
};

module.exports = {
  getReviews,
  createReview,
};
