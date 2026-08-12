const multer = require('multer');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

// Limit file size to 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Store in memory, will upload to R2 from buffer
const storage = multer.memoryStorage();

// File filter to allow images and common media types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(httpStatus.BAD_REQUEST, 'Invalid file type. Only JPEG, PNG, GIF, WEBP, MP4, and PDF are allowed.'),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

module.exports = upload;
