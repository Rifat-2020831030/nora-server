const mongoose = require('mongoose');
const analyticsService = require('../../../src/services/analytics.service');
const { User } = require('../../../src/models');

jest.mock('../../../src/models/user.model.js');

describe('Analytics service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInterestsAnalytics', () => {
    test('should construct correct aggregation pipeline for interests', async () => {
      User.aggregate.mockResolvedValue([{ _id: 'coding', count: 5 }]);

      const result = await analyticsService.getInterestsAnalytics();

      expect(User.aggregate).toHaveBeenCalledWith([
        { $unwind: '$interests' },
        {
          $group: {
            _id: '$interests',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);
      expect(result).toEqual([{ _id: 'coding', count: 5 }]);
    });
  });

  describe('getUserPostsAnalytics', () => {
    test('should construct correct aggregation pipeline with lookup', async () => {
      const userId = new mongoose.Types.ObjectId();
      User.aggregate.mockResolvedValue([{ _id: userId, posts: [] }]);

      const result = await analyticsService.getUserPostsAnalytics(userId);

      expect(User.aggregate).toHaveBeenCalledWith([
        { $match: { _id: mongoose.Types.ObjectId(userId) } },
        {
          $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: 'author',
            as: 'posts',
          },
        },
      ]);
      expect(result).toBeDefined();
    });
  });

  describe('getUserGrowthAnalytics', () => {
    test('should construct correct aggregation pipeline for user growth', async () => {
      User.aggregate.mockResolvedValue([{ _id: '2023-10-01', newUsers: 2 }]);

      const result = await analyticsService.getUserGrowthAnalytics();

      expect(User.aggregate).toHaveBeenCalledWith([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            newUsers: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      expect(result).toBeDefined();
    });
  });
});
