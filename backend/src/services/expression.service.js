const { logger } = require('../utils/logger');

class ExpressionEngine {
  evaluate(template, context) {
    if (!template || typeof template !== 'string') return template;
    if (!template.includes('{{')) return template;

    // If entire template is a single expression, return raw value (preserve type)
    const singleMatch = template.match(/^\{\{([\s\S]*)\}\}$/);
    if (singleMatch && template.indexOf('{{') === template.lastIndexOf('{{')) {
      try {
        return this.evaluateExpression(singleMatch[1].trim(), context);
      } catch (e) {
        logger.warn({ expr: singleMatch[1], error: e.message }, 'Expression evaluation failed');
        return template;
      }
    }

    // Mixed template: replace all {{ }} blocks, stringify results
    return template.replace(/\{\{([\s\S]*?)\}\}/g, (match, expr) => {
      try {
        const result = this.evaluateExpression(expr.trim(), context);
        return result === undefined || result === null ? '' : String(result);
      } catch (e) {
        logger.warn({ expr, error: e.message }, 'Expression evaluation failed');
        return match;
      }
    });
  }

  evaluateExpression(expr, context) {
    const sandbox = {
      $json: context.currentItem?.json || {},
      $binary: context.currentItem?.binary || {},
      $input: {
        item: context.currentItem,
        all: () => context.inputItems || [],
        first: () => (context.inputItems || [])[0],
        last: () => { const items = context.inputItems || []; return items[items.length - 1]; }
      },
      $node: context.nodeOutputs || {},
      $vars: context.variables || {},
      $env: context.env || {},
      $execution: { id: context.runId, mode: context.mode },
      $workflow: { id: context.workflowId, name: context.workflowName },
      $now: new Date().toISOString(),
      $today: new Date().toISOString().split('T')[0],
      $runIndex: context.runIndex || 0,
      $itemIndex: context.itemIndex || 0,
      // Safe builtins
      Math, JSON, Object, Array, String, Number, Boolean, Date,
      parseInt, parseFloat, encodeURIComponent, decodeURIComponent,
      isNaN, isFinite,
    };

    // Block dangerous patterns
    const blocked = ['require(', 'import ', 'process.', 'global.', '__proto__', 'constructor[', 'eval(', 'Function('];
    for (const b of blocked) {
      if (expr.includes(b)) throw new Error(`Expression contains blocked pattern: ${b}`);
    }

    const keys = Object.keys(sandbox);
    const values = Object.values(sandbox);
    try {
      const fn = new Function(...keys, `"use strict"; return (${expr});`);
      return fn(...values);
    } catch (e) {
      throw new Error(`Expression error: ${e.message}`);
    }
  }

  validate(template) {
    try {
      const dummyContext = {
        currentItem: { json: {}, binary: {} },
        inputItems: [],
        nodeOutputs: {},
        variables: {},
        env: {},
        runId: 'validate', mode: 'manual',
        workflowId: 'validate', workflowName: 'validate'
      };
      this.evaluate(template, dummyContext);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  resolveNodeParameters(parameters, context) {
    if (!parameters) return {};
    const resolved = {};
    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string') {
        resolved[key] = this.evaluate(value, context);
      } else if (Array.isArray(value)) {
        resolved[key] = value.map(v => typeof v === 'string' ? this.evaluate(v, context) : v);
      } else if (typeof value === 'object' && value !== null) {
        resolved[key] = this.resolveNodeParameters(value, context);
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  }
}

module.exports = new ExpressionEngine();
