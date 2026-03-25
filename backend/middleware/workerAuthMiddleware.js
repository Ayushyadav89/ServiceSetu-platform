const jwt = require('jsonwebtoken');
const Worker = require('../models/Worker');

/**
 * Protect worker routes — verifies worker JWT token
 */
const protectWorker = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. Please login.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure it's a worker token not a user token
    if (decoded.type !== 'worker') {
      return res.status(401).json({ success: false, message: 'Invalid token type.' });
    }

    const worker = await Worker.findById(decoded.id);
    if (!worker) return res.status(401).json({ success: false, message: 'Worker not found.' });
    if (!worker.isActive) return res.status(401).json({ success: false, message: 'Account deactivated.' });

    req.worker = worker;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

module.exports = { protectWorker };