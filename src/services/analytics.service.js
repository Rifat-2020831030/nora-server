const { User } = require('../models');
const mongoose = require('mongoose');

/**
 * Get user interests aggregation
 * @returns {Promise<Array>}
 */
const getInterestsAnalytics = async () => {
  return User.aggregate([
    { $unwind: '$interests' },
    {
      $group: {
        _id: '$interests',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

/**
 * Get user with their posts via lookup
 * @param {ObjectId} userId
 * @returns {Promise<Array>}
 */
const getUserPostsAnalytics = async (userId) => {
  return User.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: 'posts', // The collection name for Post model
        localField: '_id',
        foreignField: 'author',
        as: 'posts',
      },
    },
  ]);
};

/**
 * Get user growth over time
 * @returns {Promise<Array>}
 */
const getUserGrowthAnalytics = async () => {
  return User.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        newUsers: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

module.exports = {
  getInterestsAnalytics,
  getUserPostsAnalytics,
  getUserGrowthAnalytics,
};
