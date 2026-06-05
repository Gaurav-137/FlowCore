const prisma = require('../prisma/client');
const { encrypt, decrypt } = require('./encryption.service');

async function getVariables(userId) {
  const vars = await prisma.variable.findMany({ where: { userId }, orderBy: { key: 'asc' } });
  return vars.map(v => v.type === 'secret' ? { ...v, value: '••••••••' } : v);
}

async function createVariable(userId, { key, value, type }) {
  const storeValue = type === 'secret' ? encrypt(value) : value;
  return prisma.variable.create({ data: { key, value: storeValue, type: type || 'string', userId } });
}

async function updateVariable(userId, variableId, { key, value, type }) {
  const v = await prisma.variable.findFirst({ where: { id: variableId, userId } });
  if (!v) throw new Error('Variable not found');
  const updateData = {};
  if (key !== undefined) updateData.key = key;
  if (type !== undefined) updateData.type = type;
  if (value !== undefined) {
    updateData.value = (type || v.type) === 'secret' ? encrypt(value) : value;
  }
  return prisma.variable.update({ where: { id: variableId }, data: updateData });
}

async function deleteVariable(userId, variableId) {
  const v = await prisma.variable.findFirst({ where: { id: variableId, userId } });
  if (!v) throw new Error('Variable not found');
  await prisma.variable.delete({ where: { id: variableId } });
  return true;
}

async function getDecryptedVariablesMap(userId) {
  const vars = await prisma.variable.findMany({ where: { userId } });
  return vars.reduce((acc, v) => {
    acc[v.key] = v.type === 'secret' ? decrypt(v.value) : v.value;
    return acc;
  }, {});
}

module.exports = { getVariables, createVariable, updateVariable, deleteVariable, getDecryptedVariablesMap };
