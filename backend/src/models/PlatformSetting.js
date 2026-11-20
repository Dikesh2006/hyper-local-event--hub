const mongoose = require('mongoose');

const platformSettingSchema = new mongoose.Schema(
  {
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PlatformSetting', platformSettingSchema);
