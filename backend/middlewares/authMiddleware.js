// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  // The token is expected to be in the "Authorization" header in the format: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const tokenParts = authHeader.split(' ');
  const token = tokenParts.length === 2 ? tokenParts[1] : authHeader;
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    // Save user id for later use in controllers
    req.userId = decoded.id;
    next();
  });
};
