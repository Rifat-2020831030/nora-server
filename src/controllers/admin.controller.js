const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const { userService, noteService, postService, analyticsService } = require('../services');

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);

  const { results, ...meta } = result;
  res.status(httpStatus.OK).send({
    success: true,
    data: results,
    meta,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  sendSuccess(res, httpStatus.OK, user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const restoreUser = catchAsync(async (req, res) => {
  const user = await userService.restoreUserById(req.params.userId);
  sendSuccess(res, httpStatus.OK, user);
});

const getGlobalNotes = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['status', 'tags', 'search', 'owner']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  // Note: we can use noteService.queryNotes to get notes regardless of owner
  // The service doesn't mandate owner in the filter itself, it just takes the filter.
  const result = await noteService.queryNotes(null, filter, options);

  const { results, ...meta } = result;
  res.status(httpStatus.OK).send({
    success: true,
    data: results,
    meta,
  });
});

const getGlobalPosts = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['search', 'author']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  if (req.query.deleted === 'true') {
    filter.isDeleted = true;
  } else if (req.query.deleted === 'false') {
    filter.isDeleted = false;
  }
  // If omitted, postService will not restrict isDeleted, returning both active and deleted posts.

  const result = await postService.queryPosts(filter, options);

  const { results, ...meta } = result;
  res.status(httpStatus.OK).send({
    success: true,
    data: results,
    meta,
  });
});

const restorePost = catchAsync(async (req, res) => {
  const post = await postService.restorePostById(req.params.id);
  sendSuccess(res, httpStatus.OK, post);
});

// Analytics endpoints
const getInterestsAnalytics = catchAsync(async (req, res) => {
  const data = await analyticsService.getInterestsAnalytics();
  sendSuccess(res, httpStatus.OK, data);
});

const getUserPostsAnalytics = catchAsync(async (req, res) => {
  const data = await analyticsService.getUserPostsAnalytics(req.params.userId);
  sendSuccess(res, httpStatus.OK, data);
});

const getGrowthAnalytics = catchAsync(async (req, res) => {
  const data = await analyticsService.getUserGrowthAnalytics(req.query.granularity);
  sendSuccess(res, httpStatus.OK, data);
});

const getNoteCountsAnalytics = catchAsync(async (req, res) => {
  const options = pick(req.query, ['limit', 'page']);
  const result = await analyticsService.getNoteCountsAnalytics(options);

  const { results, ...meta } = result;
  res.status(httpStatus.OK).send({
    success: true,
    data: results,
    meta,
  });
});

const getPlatformStats = catchAsync(async (req, res) => {
  const stats = await analyticsService.getPlatformStats();
  sendSuccess(res, httpStatus.OK, stats);
});

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  restoreUser,
  getGlobalNotes,
  getGlobalPosts,
  restorePost,
  getInterestsAnalytics,
  getUserPostsAnalytics,
  getGrowthAnalytics,
  getNoteCountsAnalytics,
  getPlatformStats,
};
