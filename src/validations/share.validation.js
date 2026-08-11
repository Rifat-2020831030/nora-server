const Joi = require('joi');
const { objectId } = require('./custom.validation');

const shareNote = {
  params: Joi.object().keys({
    noteId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const getSharesForNote = {
  params: Joi.object().keys({
    noteId: Joi.string().custom(objectId).required(),
  }),
};

const revokeShare = {
  params: Joi.object().keys({
    noteId: Joi.string().custom(objectId).required(),
    shareId: Joi.string().custom(objectId).required(),
  }),
};

const getNotesSharedWithUser = {
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

module.exports = {
  shareNote,
  getSharesForNote,
  revokeShare,
  getNotesSharedWithUser,
};
