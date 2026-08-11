const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService } = require('../services');
const { sendSuccess } = require('../utils/response');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  sendSuccess(res, httpStatus.CREATED, { user, ...tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  sendSuccess(res, httpStatus.OK, { user, ...tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const logoutAll = catchAsync(async (req, res) => {
  await authService.logoutAll(req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  sendSuccess(res, httpStatus.OK, { ...tokens });
});

const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Password changed. All sessions have been revoked.',
  });
});

module.exports = {
  register,
  login,
  logout,
  logoutAll,
  refreshTokens,
  changePassword,
};
