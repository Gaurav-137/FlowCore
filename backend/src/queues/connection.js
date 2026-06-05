const IORedis = require('ioredis');
const { redisUrl } = require('../config');
let redisClient;

function getRedis() {
  if (!redisClient) {
    redisClient = new IORedis(redisUrl);
  }
  return redisClient;
}

module.exports = { getRedis };
