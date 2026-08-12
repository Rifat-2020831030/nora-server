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
    {
      $project: {
        _id: 0,
        interest: '$_id',
        count: 1,
      },
    },
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
    {
      $project: {
        name: 1,
        email: 1,
        userPosts: '$posts',
      },
    },
  ]);
};

/**
 * Get user growth over time
 * @param {string} granularity - 'month' or 'day'
 * @returns {Promise<Array>}
 */
const getUserGrowthAnalytics = async (granularity = 'month') => {
  const format = granularity === 'day' ? '%Y-%m-%d' : '%Y-%m';
  return User.aggregate([
    {
      $group: {
        _id: { $dateToString: { format, date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        period: '$_id',
        count: 1,
      },
    },
  ]);
};

/**
 * Get note counts per user
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>}
 */
const getNoteCountsAnalytics = async (options) => {
  const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const skip = (page - 1) * limit;

  const results = await User.aggregate([
    {
      $lookup: {
        from: 'notes',
        localField: '_id',
        foreignField: 'owner',
        as: 'notes',
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        noteCount: {
          $size: {
            $filter: {
              input: '$notes',
              as: 'note',
              cond: { $eq: ['$$note.status', 'active'] },
            },
          },
        },
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);

  const totalResults = await User.countDocuments();
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

module.exports = {
  getInterestsAnalytics,
  getUserPostsAnalytics,
  getUserGrowthAnalytics,
  getNoteCountsAnalytics,
};
