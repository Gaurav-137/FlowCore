const registry = require('../nodes/registry');

function listNodeTypes(req, res) {
  res.json(registry.getDescriptions());
}

module.exports = { listNodeTypes };
