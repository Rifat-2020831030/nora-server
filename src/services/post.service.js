const httpStatus = require('http-status');
const { Post } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a post
 * @param {ObjectId} userId
 * @param {Object} postBody
 * @returns {Promise<Post>}
 */
const createPost = async (userId, postBody) => {
  return Post.create({ ...postBody, author: userId });
};

/**
 * Query for posts
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryPosts = async (filter, options) => {
  const postFilter = { ...filter };

  if (postFilter.isDeleted === undefined) {
    postFilter.isDeleted = false;
  }

  if (filter.search) {
    postFilter.$text = { $search: filter.search };
    delete postFilter.search;
  }

  // Always populate author
  const queryOptions = { ...options, populate: 'author' };

  const posts = await Post.paginate(postFilter, queryOptions);
  return posts;
};

/**
 * Get post by id
 * @param {ObjectId} postId
 * @returns {Promise<Post>}
 */
const getPostById = async (postId) => {
  const post = await Post.findOne({ _id: postId, isDeleted: false }).populate('author', 'name email');
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }
  return post;
};

/**
 * Update post by id
 * @param {ObjectId} postId
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<Post>}
 */
const updatePostById = async (postId, userId, updateBody) => {
  const post = await getPostById(postId);

  if (post.author._id.toString() !== userId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to edit this post');
  }

  Object.assign(post, updateBody);
  await post.save();
  return post;
};

/**
 * Soft delete post by id
 * @param {ObjectId} postId
 * @param {ObjectId} userId
 * @returns {Promise<Post>}
 */
const deletePostById = async (postId, userId) => {
  const post = await getPostById(postId);

  if (post.author._id.toString() !== userId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have permission to delete this post');
  }

  post.isDeleted = true;
  await post.save();
  return post;
};

/**
 * Restore soft deleted post by id
 * @param {ObjectId} postId
 * @returns {Promise<Post>}
 */
const restorePostById = async (postId) => {
  const post = await Post.findOne({ _id: postId, isDeleted: true });
  if (!post) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Post is not deleted');
  }

  post.isDeleted = false;
  await post.save();
  return post;
};

module.exports = {
  createPost,
  queryPosts,
  getPostById,
  updatePostById,
  deletePostById,
  restorePostById,
};
