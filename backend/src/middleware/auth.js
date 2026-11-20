const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

const normalizeRole = (role) => {
  if (!role) return 'user';
  if (role === 'admin') return 'admin';
  if (['organizer'].includes(role)) return 'organizer';
  if (['manager', 'eventManager'].includes(role)) return 'manager';
  if (['hall_owner', 'hallOwner', 'hotelOwner', 'theatreOwner'].includes(role)) return 'hall_owner';
  return role;
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const normalizedAllowedRoles = roles.map(normalizeRole);
    const normalizedUserRole = normalizeRole(req.user.role);
    
    if (!normalizedAllowedRoles.includes(normalizedUserRole) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: insufficient privileges' });
    }
    next();
  };
};

module.exports = { protect, authorize, normalizeRole };
