// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

// This middleware verifies the JWT and attaches the user ID to req.user.id
const verifyToken = (req, res, next) => {
  // Expecting an Authorization header like: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Split out the token from "Bearer <token>"
  const tokenParts = authHeader.split(' ');
  const token = tokenParts.length === 2 ? tokenParts[1] : authHeader;

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    // Attach user ID to the request object for future use
    req.user = { id: decoded.id };
    next();
  });
};

// OPTIONAL: This middleware ensures the route param :id matches req.user.id
// so users can only fetch/update THEIR own data (if you want that restriction).
const checkSameUser = (req, res, next) => {
  // If the route param is present, compare it to the decoded user id
  if (req.params.id && Number(req.params.id) !== req.user.id) {
    return res.status(401).json({ error: 'Unauthorized: user mismatch' });
  }
  next();
};

module.exports = {
  verifyToken,
  checkSameUser, // use this if needed
};
