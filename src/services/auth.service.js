const httpStatus = require('http-status');
const tokenService = require('./token.service');
const userService = require('./user.service');
const { Token } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || user.isDeleted) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  if (!(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

/**
 * Logout single session
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  await refreshTokenDoc.remove();
};

/**
 * Logout all sessions for a user
 * @param {ObjectId} userId
 * @returns {Promise}
 */
const logoutAll = async (userId) => {
  await Token.deleteMany({ user: userId });
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await tokenService.verifyToken(refreshToken);
    const user = await userService.getUserById(refreshTokenDoc.user);
    if (!user || user.isDeleted) {
      throw new Error();
    }
    await refreshTokenDoc.remove();
    return tokenService.generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

/**
 * Change password
 * @param {ObjectId} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise}
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await userService.getUserById(userId);
  if (!user || user.isDeleted) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  if (!(await user.isPasswordMatch(currentPassword))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect current password');
  }

  Object.assign(user, { password: newPassword });
  await user.save();

  // Revoke all sessions on successful password change
  await logoutAll(userId);
};

module.exports = {
  loginUserWithEmailAndPassword,
  logout,
  logoutAll,
  refreshAuth,
  changePassword,
};
