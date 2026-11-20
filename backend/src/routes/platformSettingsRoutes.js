const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getPlatformSettings, updatePlatformSettings } = require('../controllers/platformSettingsController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/', getPlatformSettings);
router.put('/', updatePlatformSettings);

module.exports = router;
