const PlatformSetting = require('../models/PlatformSetting');

// @desc    Get platform settings
// @route   GET /api/admin/platform-settings
// @access  Private/Admin
const getPlatformSettings = async (req, res) => {
  try {
    const doc = await PlatformSetting.findOne({});
    res.json(doc?.settings || {});
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve platform settings' });
  }
};

// @desc    Update platform settings
// @route   PUT /api/admin/platform-settings
// @access  Private/Admin
const updatePlatformSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    const doc = await PlatformSetting.findOne({});

    if (!doc) {
      const created = await PlatformSetting.create({ settings: settings || {} });
      return res.json(created.settings);
    }

    doc.settings = settings || {};
    await doc.save();
    res.json(doc.settings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update platform settings' });
  }
};

module.exports = {
  getPlatformSettings,
  updatePlatformSettings,
};
