const bcrypt = require('bcrypt');
const prisma = require('../prisma/client');
const { signAccessToken, signRefreshToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

async function registerUser({ email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already registered');
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  return user;
}

async function validateUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return null;
  return user;
}

async function createTokensForUser(user) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });
  // persist refresh token
  await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken } });
  return { accessToken, refreshToken };
}

async function refreshTokens(oldRefreshToken) {
  const stored = await prisma.refreshToken.findUnique({ where: { token: oldRefreshToken } });
  if (!stored || stored.revoked) throw new Error('Invalid refresh token');
  // Optionally revoke and rotate
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  const { accessToken, refreshToken } = await createTokensForUser(user);
  return { accessToken, refreshToken };
}

module.exports = { registerUser, validateUser, createTokensForUser, refreshTokens };
