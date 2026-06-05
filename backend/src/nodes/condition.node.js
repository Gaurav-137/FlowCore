const BaseNode = require('./base.node');

function evaluateOperator(a, op, b) {
  switch (op) {
    case 'equals':
      return a === b;
    case 'not_equals':
      return a !== b;
    case 'contains':
      return (String(a) || '').includes(String(b));
    case 'greater_than':
      return Number(a) > Number(b);
    case 'less_than':
      return Number(a) < Number(b);
    default:
      return false;
  }
}

class ConditionNode extends BaseNode {
  async execute(ctx) {
    const cfg = this.config || {};
    const left = cfg.leftPath ? getPath(ctx.input || {}, cfg.leftPath) : cfg.left;
    const right = cfg.rightPath ? getPath(ctx.input || {}, cfg.rightPath) : cfg.right;
    const op = cfg.operator || 'equals';
    const result = evaluateOperator(left, op, right);
    return { result };
  }
}

function getPath(obj, path) {
  return path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj);
}

module.exports = ConditionNode;
