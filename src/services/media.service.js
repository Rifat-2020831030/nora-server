const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const config = require('../config/config');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: config.r2.endpoint,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});

/**
 * Upload a file to Cloudflare R2
 * @param {Object} file - The file object from Multer
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
const uploadFile = async (file) => {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No file provided for upload');
  }

  const extension = path.extname(file.originalname);
  const uniqueFilename = `${uuidv4()}${extension}`;

  const command = new PutObjectCommand({
    Bucket: config.r2.bucketName,
    Key: uniqueFilename,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  try {
    await s3Client.send(command);
    // Construct public URL
    const publicUrl = `${config.r2.publicDomain}/${uniqueFilename}`;
    return publicUrl;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to upload media');
  }
};

module.exports = {
  uploadFile,
};
