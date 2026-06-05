const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

class CredentialTypeRegistry {
  constructor() {
    this.types = new Map();
  }

  loadAll() {
    const typesDir = path.join(__dirname, 'types');
    if (!fs.existsSync(typesDir)) {
      logger.warn('No credentials/types directory found');
      return;
    }
    const files = fs.readdirSync(typesDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      try {
        const typeDef = require(path.join(typesDir, file));
        if (typeDef.name) {
          this.types.set(typeDef.name, typeDef);
        }
      } catch (e) {
        logger.error({ file, error: e.message }, 'Failed to load credential type');
      }
    }
    logger.info({ count: this.types.size }, 'Credential types loaded');
  }

  get(name) {
    return this.types.get(name);
  }

  getAll() {
    return [...this.types.values()];
  }

  getDescriptions() {
    return this.getAll().map(t => ({
      name: t.name,
      displayName: t.displayName,
      properties: t.properties
    }));
  }
}

const registry = new CredentialTypeRegistry();
registry.loadAll();

module.exports = registry;
