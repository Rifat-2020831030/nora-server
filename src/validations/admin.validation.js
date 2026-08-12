const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
      role: Joi.string().valid('user', 'admin'),
      interests: Joi.array().items(Joi.string()),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const getUserPostsAnalytics = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const restoreUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const getGlobalNotes = {
  query: Joi.object().keys({
    status: Joi.string(),
    tags: Joi.string(),
    search: Joi.string(),
    owner: Joi.string().custom(objectId),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getGlobalPosts = {
  query: Joi.object().keys({
    search: Joi.string(),
    author: Joi.string().custom(objectId),
    deleted: Joi.string().valid('true', 'false'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const restorePost = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const getNoteCountsAnalytics = {
  query: Joi.object().keys({
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUserGrowthAnalytics = {
  query: Joi.object().keys({
    granularity: Joi.string().valid('month', 'day'),
  }),
};

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  restoreUser,
  getUserPostsAnalytics,
  getGlobalNotes,
  getGlobalPosts,
  restorePost,
  getNoteCountsAnalytics,
  getUserGrowthAnalytics,
};
