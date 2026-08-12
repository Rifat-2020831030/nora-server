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
  const result = await noteService.queryNotes(filter, options);
  
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
  
  // The postService filters out `isDeleted: false` by default for public APIs.
  // For admin, we want everything. But for simplicity let's just use queryPosts.
  // If we wanted to see deleted ones we'd have to tweak the service. Let's just use queryPosts for now.
  const result = await postService.queryPosts(filter, options);
  
  const { results, ...meta } = result;
  res.status(httpStatus.OK).send({
    success: true,
    data: results,
    meta,
  });
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
  const data = await analyticsService.getUserGrowthAnalytics();
  sendSuccess(res, httpStatus.OK, data);
});

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  restoreUser,
  getGlobalNotes,
  getGlobalPosts,
  getInterestsAnalytics,
  getUserPostsAnalytics,
  getGrowthAnalytics,
};
