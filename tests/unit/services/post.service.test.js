const mongoose = require('mongoose');
const httpStatus = require('http-status');
const postService = require('../../../src/services/post.service');
const { Post } = require('../../../src/models');
const ApiError = require('../../../src/utils/ApiError');

jest.mock('../../../src/models/post.model.js');

describe('Post service', () => {
  let userId;
  let postId;
  let otherUserId;
  let postBody;

  beforeEach(() => {
    userId = new mongoose.Types.ObjectId();
    postId = new mongoose.Types.ObjectId();
    otherUserId = new mongoose.Types.ObjectId();
    postBody = {
      title: 'New Post',
      body: 'Content of the new post',
      mediaUrls: [],
    };
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    test('should create a post with the author field set to userId', async () => {
      Post.create.mockResolvedValue({ ...postBody, author: userId });

      const result = await postService.createPost(userId, postBody);

      expect(Post.create).toHaveBeenCalledWith({ ...postBody, author: userId });
      expect(result).toBeDefined();
    });
  });

  describe('queryPosts', () => {
    test('should apply filter and pagination options correctly, omitting deleted posts', async () => {
      const filter = {};
      const options = { limit: 10, page: 1 };

      Post.paginate.mockResolvedValue({ results: [], totalPages: 0, totalResults: 0 });

      await postService.queryPosts(filter, options);

      expect(Post.paginate).toHaveBeenCalledWith({ isDeleted: false }, expect.objectContaining(options));
    });

    test('should apply text search filter when search keyword is provided', async () => {
      const filter = { search: 'test' };
      const options = {};

      Post.paginate.mockResolvedValue({ results: [], totalPages: 0, totalResults: 0 });

      await postService.queryPosts(filter, options);

      expect(Post.paginate).toHaveBeenCalledWith(
        { isDeleted: false, $text: { $search: 'test' } },
        expect.objectContaining(options)
      );
    });
  });

  describe('getPostById', () => {
    test('should return post if found and not deleted', async () => {
      const mockPopulate = jest.fn().mockResolvedValue({ _id: postId, isDeleted: false });
      Post.findOne.mockReturnValue({ populate: mockPopulate });

      const result = await postService.getPostById(postId);

      expect(Post.findOne).toHaveBeenCalledWith({ _id: postId, isDeleted: false });
      expect(mockPopulate).toHaveBeenCalledWith('author', 'name email');
      expect(result).toBeDefined();
    });

    test('should throw 404 error if post not found', async () => {
      const mockPopulate = jest.fn().mockResolvedValue(null);
      Post.findOne.mockReturnValue({ populate: mockPopulate });

      await expect(postService.getPostById(postId)).rejects.toThrow(new ApiError(httpStatus.NOT_FOUND, 'Post not found'));
    });
  });

  describe('deletePostById', () => {
    test('should soft delete post if user is author', async () => {
      const mockSave = jest.fn();
      const mockPopulate = jest
        .fn()
        .mockResolvedValue({ _id: postId, author: { _id: userId }, isDeleted: false, save: mockSave });
      Post.findOne.mockReturnValue({ populate: mockPopulate });

      await postService.deletePostById(postId, userId);

      expect(mockSave).toHaveBeenCalled();
    });

    test('should throw 403 error if user is not author', async () => {
      const mockSave = jest.fn();
      const mockPopulate = jest
        .fn()
        .mockResolvedValue({ _id: postId, author: { _id: otherUserId }, isDeleted: false, save: mockSave });
      Post.findOne.mockReturnValue({ populate: mockPopulate });

      await expect(postService.deletePostById(postId, userId)).rejects.toThrow(
        new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to delete this post')
      );
    });
  });
});
