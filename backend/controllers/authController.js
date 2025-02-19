const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/signup
exports.signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, email, password: hashedPassword });
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      return next(err);
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error('Invalid credentials');
      err.status = 401;
      return next(err);
    }
    // Generate JWT token valid for 1 hour
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token, user: { id: user.id, username: user.username } });
  } catch (error) {
    next(error);
  }
};
