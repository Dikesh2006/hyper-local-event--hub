const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const movieRoutes = require('./movieRoutes');
const eventRoutes = require('./eventRoutes');
const hallRoutes = require('./hallRoutes');
const managerRoutes = require('./managerRoutes');
const bookingRoutes = require('./bookingRoutes');
const reviewRoutes = require('./reviewRoutes');
const paymentRoutes = require('./paymentRoutes');
const adminRoutes = require('./adminRoutes');
const businessRoutes = require('./businessRoutes');
const platformSettingsRoutes = require('./platformSettingsRoutes');
const theatreRoutes = require('./theatreRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/movies', movieRoutes);
router.use('/events', eventRoutes);
router.use('/halls', hallRoutes);
router.use('/managers', managerRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reviews', reviewRoutes);
router.use('/payments', paymentRoutes);
router.use('/theatres', theatreRoutes);
router.use('/admin/platform-settings', platformSettingsRoutes);
router.use('/admin', adminRoutes);
router.use('/business', businessRoutes);

module.exports = router;
