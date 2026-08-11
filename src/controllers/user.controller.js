const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const { sendSuccess } = require('../utils/response');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  sendSuccess(res, httpStatus.CREATED, user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  // By default, exclude soft-deleted users in normal listings
  if (req.query.isDeleted !== undefined) {
    filter.isDeleted = req.query.isDeleted === 'true';
  } else {
    filter.isDeleted = false;
  }
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  
  const meta = {
    page: result.page,
    limit: result.limit,
    total: result.totalResults,
    totalPages: result.totalPages,
  };
  
  sendSuccess(res, httpStatus.OK, result.results, meta);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  sendSuccess(res, httpStatus.OK, user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  sendSuccess(res, httpStatus.OK, user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getMe = catchAsync(async (req, res) => {
  sendSuccess(res, httpStatus.OK, req.user);
});

const updateMe = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.user.id, req.body);
  sendSuccess(res, httpStatus.OK, user);
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
};
