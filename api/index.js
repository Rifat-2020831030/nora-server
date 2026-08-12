const mongoose = require('mongoose');
const dns = require('dns');
const app = require('../src/app');
const config = require('../src/config/config');
const logger = require('../src/config/logger');

dns.setServers(['8.8.8.8', '8.8.4.4']);

mongoose
  .connect(config.mongoose.url, config.mongoose.options)
  .then(() => logger.info('Connected to MongoDB (Vercel Serverless)'))
  .catch((err) => logger.error('MongoDB connection error:', err));

module.exports = app;
