const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

class NodeRegistry {
  constructor() {
    this.nodes = new Map();
  }

  loadAll() {
    const nodesDir = path.join(__dirname, 'definitions');
    if (!fs.existsSync(nodesDir)) {
      logger.warn('No nodes/definitions directory found');
      return;
    }
    const files = fs.readdirSync(nodesDir).filter(f => f.endsWith('.node.js'));
    for (const file of files) {
      try {
        const nodeDef = require(path.join(nodesDir, file));
        if (nodeDef.description && nodeDef.description.name) {
          this.nodes.set(nodeDef.description.name, nodeDef);
        }
      } catch (e) {
        logger.error({ file, error: e.message }, 'Failed to load node definition');
      }
    }
    logger.info({ count: this.nodes.size }, 'Node definitions loaded');
  }

  get(name) {
    return this.nodes.get(name);
  }

  getAll() {
    return [...this.nodes.values()];
  }

  getDescriptions() {
    return this.getAll().map(n => n.description);
  }

  has(name) {
    return this.nodes.has(name);
  }
}

const registry = new NodeRegistry();
registry.loadAll();

module.exports = registry;
