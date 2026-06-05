const axios = require('axios');
const BaseNode = require('./base.node');

class HttpRequestNode extends BaseNode {
  async execute(ctx) {
    const cfg = this.config;
    const method = (cfg.method || 'GET').toLowerCase();
    const url = cfg.url;
    const headers = cfg.headers || {};
    const timeout = cfg.timeout || 10000;
    const body = cfg.body || ctx.input || {};

    const res = await axios({ method, url, headers, timeout, data: body });
    return { status: res.status, data: res.data };
  }
}

module.exports = HttpRequestNode;
