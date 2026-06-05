const credentialService = require('../services/credential.service');

async function createCredential(req, res, next) {
  try {
    const cred = await credentialService.createCredential(req.user.id, req.body);
    res.status(201).json(cred);
  } catch (err) { next(err); }
}

async function listCredentials(req, res, next) {
  try {
    const creds = await credentialService.getCredentials(req.user.id);
    res.json(creds);
  } catch (err) { next(err); }
}

async function getCredential(req, res, next) {
  try {
    const cred = await credentialService.getCredentialById(req.user.id, req.params.id);
    res.json(cred);
  } catch (err) { next(err); }
}

async function updateCredential(req, res, next) {
  try {
    const cred = await credentialService.updateCredential(req.user.id, req.params.id, req.body);
    res.json(cred);
  } catch (err) { next(err); }
}

async function deleteCredential(req, res, next) {
  try {
    await credentialService.deleteCredential(req.user.id, req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
}

async function testCredential(req, res, next) {
  try {
    const result = await credentialService.testCredential(req.user.id, req.params.id);
    res.json(result);
  } catch (err) { next(err); }
}

const registry = require('../credentials/registry');

async function listCredentialTypes(req, res, next) {
  try {
    res.json(registry.getDescriptions());
  } catch (err) { next(err); }
}

module.exports = { createCredential, listCredentials, getCredential, updateCredential, deleteCredential, testCredential, listCredentialTypes };

