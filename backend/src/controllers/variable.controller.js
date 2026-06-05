const variableService = require('../services/variable.service');

async function listVariables(req, res, next) {
  try {
    const vars = await variableService.getVariables(req.user.id);
    res.json(vars);
  } catch (err) { next(err); }
}

async function createVariable(req, res, next) {
  try {
    const v = await variableService.createVariable(req.user.id, req.body);
    res.status(201).json(v);
  } catch (err) { next(err); }
}

async function updateVariable(req, res, next) {
  try {
    const v = await variableService.updateVariable(req.user.id, req.params.id, req.body);
    res.json(v);
  } catch (err) { next(err); }
}

async function deleteVariable(req, res, next) {
  try {
    await variableService.deleteVariable(req.user.id, req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
}

module.exports = { listVariables, createVariable, updateVariable, deleteVariable };
