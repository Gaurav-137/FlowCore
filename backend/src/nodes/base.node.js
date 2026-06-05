class BaseNode {
  constructor(config = {}) {
    this.config = config;
  }

  async validate() {
    return true;
  }

  async execute() {
    throw new Error('execute() not implemented');
  }
}

module.exports = BaseNode;
