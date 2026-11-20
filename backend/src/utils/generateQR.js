const QRCode = require('qrcode');

const createQRCode = async (text) => {
  try {
    return await QRCode.toDataURL(text, { margin: 2, width: 320 });
  } catch (error) {
    throw new Error('QR generation failed');
  }
};

module.exports = createQRCode;
