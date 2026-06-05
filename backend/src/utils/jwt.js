const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function signAccessToken(payload, opts = {}) {
  return jwt.sign(payload, jwtSecret, { expiresIn: opts.expiresIn || '15m' });
}

function signRefreshToken(payload, opts = {}) {
  return jwt.sign(payload, jwtSecret, { expiresIn: opts.expiresIn || '30d' });
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}

module.exports = { signAccessToken, signRefreshToken, verifyToken };
