/**
 * Standardize successful API responses
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Object|Array} data - The payload to send
 * @param {Object} [meta] - Optional pagination meta
 */
const sendSuccess = (res, statusCode, data, meta = undefined) => {
  const response = {
    success: true,
    data,
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  res.status(statusCode).send(response);
};

module.exports = {
  sendSuccess,
};
