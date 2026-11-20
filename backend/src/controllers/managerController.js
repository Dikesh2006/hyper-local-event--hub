const Manager = require('../models/Manager');

// Helper to safely escape user input in regular expressions
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Get all event managers with filters
// @route   GET /api/managers
// @access  Public
const getManagers = async (req, res) => {
  try {
    const { city, expertise, search } = req.query;
    const filters = {};
    if (city) filters.city = city;
    if (expertise) filters.expertise = expertise;
    if (search) filters.name = new RegExp(escapeRegex(search), 'i');

    const managers = await Manager.find(filters).limit(50);
    res.json(managers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve event managers' });
  }
};

// @desc    Get manager by ID
// @route   GET /api/managers/:id
// @access  Public
const getManagerById = async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id);
    if (!manager) return res.status(404).json({ message: 'Manager not found' });
    res.json(manager);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve manager details' });
  }
};

// @desc    Create new manager profile
// @route   POST /api/managers
// @access  Private (Organizers, Admin)
const createManager = async (req, res) => {
  try {
    const manager = await Manager.create(req.body);
    res.status(201).json(manager);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to create manager profile' });
  }
};

// @desc    Update manager profile
// @route   PUT /api/managers/:id
// @access  Private (Organizers, Admin)
const updateManager = async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id);
    if (!manager) return res.status(404).json({ message: 'Manager not found' });
    Object.assign(manager, req.body);
    await manager.save();
    res.json(manager);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to update manager profile' });
  }
};

// @desc    Delete manager profile
// @route   DELETE /api/managers/:id
// @access  Private/Admin
const deleteManager = async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id);
    if (!manager) return res.status(404).json({ message: 'Manager not found' });
    await manager.deleteOne();
    res.json({ message: 'Manager removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove manager' });
  }
};

module.exports = {
  getManagers,
  getManagerById,
  createManager,
  updateManager,
  deleteManager,
};
