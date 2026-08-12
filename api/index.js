const mongoose = require('mongoose');
const dns = require('dns');
const app = require('../src/app');
const config = require('../src/config/config');
const logger = require('../src/config/logger');

dns.setServers(['8.8.8.8', '8.8.4.4']);

let connectionPromise = null;

const connectToDatabase = () => {
  if (mongoose.connection.readyState === 1) return Promise.resolve();

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(config.mongoose.url, config.mongoose.options)
      .then(() => logger.info('Connected to MongoDB (Vercel Serverless)'))
      .catch((err) => {
        // Reset so next request can retry
        connectionPromise = null;
        throw err;
      });
  }

  return connectionPromise;
};

module.exports = async (req, res) => {
  try {
    await connectToDatabase();
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    return res.status(500).json({ message: 'Database connection failed' });
  }

  return app(req, res);
};
