const mongoose = require('mongoose');
const app = require('../src/app');
const config = require('../src/config/config');
const logger = require('../src/config/logger');

// Set DNS for MongoDB SRV resolution in serverless environments
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

let isConnected;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }
  const db = await mongoose.connect(config.mongoose.url, config.mongoose.options);
  isConnected = db.connections[0].readyState;
  logger.info('Connected to MongoDB (Vercel Serverless)');
};

// Export the serverless handler
module.exports = async (req, res) => {
  await connectToDatabase();
  return app(req, res);
};
