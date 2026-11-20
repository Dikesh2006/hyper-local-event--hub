const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, city, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const normalizedRole = ['eventManager', 'manager', 'organizer'].includes(role)
      ? 'eventManager'
      : ['hotelOwner', 'hallOwner'].includes(role)
        ? 'hotelOwner'
        : role === 'theatreOwner'
          ? 'theatreOwner'
          : role === 'admin'
            ? 'admin'
            : 'user';

    const user = await User.create({ name, email, password, role: normalizedRole, city, phone, status: normalizedRole === 'user' ? 'approved' : 'pending' });
    return res.status(201).json({
      message: 'Registration successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        phone: user.phone,
      },
      token: generateToken(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

// @desc    Login existing user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        phone: user.phone,
      },
      token: generateToken(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
