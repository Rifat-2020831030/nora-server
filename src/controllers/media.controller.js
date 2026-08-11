const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const { mediaService } = require('../services');

const uploadFile = catchAsync(async (req, res) => {
  const publicUrl = await mediaService.uploadFile(req.file);
  sendSuccess(res, httpStatus.CREATED, { url: publicUrl });
});

module.exports = {
  uploadFile,
};
