const prisma = require('../prisma/client');
const { encrypt, decrypt } = require('./encryption.service');

async function createCredential(userId, { name, type, data }) {
  const encryptedData = encrypt(data);
  const cred = await prisma.credential.create({
    data: { name, type, data: encryptedData, userId }
  });
  return { ...cred, data: undefined };
}

async function getCredentials(userId) {
  const creds = await prisma.credential.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  return creds.map(c => ({ id: c.id, name: c.name, type: c.type, createdAt: c.createdAt, updatedAt: c.updatedAt }));
}

async function getCredentialById(userId, credentialId) {
  const cred = await prisma.credential.findFirst({ where: { id: credentialId, userId } });
  if (!cred) throw new Error('Credential not found');
  return { id: cred.id, name: cred.name, type: cred.type, createdAt: cred.createdAt, updatedAt: cred.updatedAt };
}

async function getDecryptedCredential(credentialId, userId) {
  const cred = await prisma.credential.findFirst({ where: { id: credentialId, userId } });
  if (!cred) throw new Error('Credential not found');
  return { ...cred, data: decrypt(cred.data) };
}

async function updateCredential(userId, credentialId, { name, type, data }) {
  const cred = await prisma.credential.findFirst({ where: { id: credentialId, userId } });
  if (!cred) throw new Error('Credential not found');
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (type !== undefined) updateData.type = type;
  if (data !== undefined) updateData.data = encrypt(data);
  const updated = await prisma.credential.update({ where: { id: credentialId }, data: updateData });
  return { id: updated.id, name: updated.name, type: updated.type, createdAt: updated.createdAt, updatedAt: updated.updatedAt };
}

async function deleteCredential(userId, credentialId) {
  const cred = await prisma.credential.findFirst({ where: { id: credentialId, userId } });
  if (!cred) throw new Error('Credential not found');
  await prisma.credential.delete({ where: { id: credentialId } });
  return true;
}

async function testCredential(userId, credentialId) {
  try {
    await getDecryptedCredential(credentialId, userId);
    return { success: true, message: 'Credential decrypted successfully' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

module.exports = { createCredential, getCredentials, getCredentialById, getDecryptedCredential, updateCredential, deleteCredential, testCredential };
