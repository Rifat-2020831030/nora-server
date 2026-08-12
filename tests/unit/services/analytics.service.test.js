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
      User.aggregate.mockResolvedValue([{ interest: 'coding', count: 5 }]);

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
        {
          $project: {
            _id: 0,
            interest: '$_id',
            count: 1,
          },
        },
      ]);
      expect(result).toEqual([{ interest: 'coding', count: 5 }]);
    });
  });

  describe('getUserPostsAnalytics', () => {
    test('should construct correct aggregation pipeline with lookup', async () => {
      const userId = new mongoose.Types.ObjectId();
      User.aggregate.mockResolvedValue([{ email: 'test@test.com', name: 'Test', userPosts: [] }]);

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
        {
          $project: {
            name: 1,
            email: 1,
            userPosts: '$posts',
          },
        },
      ]);
      expect(result).toBeDefined();
    });
  });

  describe('getUserGrowthAnalytics', () => {
    test('should construct correct aggregation pipeline for user growth (month)', async () => {
      User.aggregate.mockResolvedValue([{ period: '2023-10', count: 2 }]);

      const result = await analyticsService.getUserGrowthAnalytics();

      expect(User.aggregate).toHaveBeenCalledWith([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
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
      expect(result).toBeDefined();
    });
    
    test('should construct correct aggregation pipeline for user growth (day)', async () => {
      User.aggregate.mockResolvedValue([{ period: '2023-10-01', count: 2 }]);

      const result = await analyticsService.getUserGrowthAnalytics('day');

      expect(User.aggregate).toHaveBeenCalledWith([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
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
      expect(result).toBeDefined();
    });
  });

  describe('getNoteCountsAnalytics', () => {
    test('should construct correct aggregation pipeline for note counts', async () => {
      User.aggregate.mockResolvedValue([{ name: 'Test', email: 't@t.com', noteCount: 5 }]);
      User.countDocuments.mockResolvedValue(1);

      const result = await analyticsService.getNoteCountsAnalytics({ limit: 10, page: 1 });

      expect(User.aggregate).toHaveBeenCalledWith([
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
        { $skip: 0 },
        { $limit: 10 },
      ]);
      expect(result).toBeDefined();
    });
  });
});
