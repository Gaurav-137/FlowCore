const BaseNode = require('./base.node');

class DelayNode extends BaseNode {
  async execute() {
    const ms = Number(this.config.ms || 1000);
    return { delayed: true, delayMs: ms };
  }
}

module.exports = DelayNode;
