const mongoose = require('mongoose');
const dns = require('dns');
const config = require('../config/config');
const logger = require('../config/logger');
const { noteService } = require('../services');

dns.setServers(['8.8.8.8', '8.8.4.4']);

mongoose
  .connect(config.mongoose.url, config.mongoose.options)
  .then(async () => {
    logger.info('Connected to MongoDB (Cleanup Script)');

    try {
      logger.info('Starting trash cleanup...');
      const result = await noteService.cleanupTrashedNotes();
      logger.info(`Trash cleanup completed successfully. Deleted ${result.deletedCount} notes.`);

      // Disconnect gracefully
      await mongoose.disconnect();
      logger.info('Disconnected from MongoDB');
      process.exit(0);
    } catch (error) {
      logger.error('Error during trash cleanup:', error);
      await mongoose.disconnect();
      process.exit(1);
    }
  })
  .catch((error) => {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  });
