const { registerSchema, loginSchema } = require('../validators/auth.validator');
const { registerUser, validateUser, createTokensForUser, refreshTokens } = require('../services/auth.service');

async function register(req, res, next) {
  try {
    const body = registerSchema.parse(req.body);
    const user = await registerUser(body);
    const tokens = await createTokensForUser(user);
    res.status(201).json({ user: { id: user.id, email: user.email }, tokens });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const body = loginSchema.parse(req.body);
    const user = await validateUser(body);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const tokens = await createTokensForUser(user);
    res.json({ user: { id: user.id, email: user.email }, tokens });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Refresh token required' });
    const tokens = await refreshTokens(token);
    res.json(tokens);
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  const user = req.user;
  res.json({ id: user.id, email: user.email, role: user.role });
}

module.exports = { register, login, refresh, me };
