const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createNote = {
  body: Joi.object().keys({
    title: Joi.string().required().trim(),
    body: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).default([]),
    status: Joi.string().valid('active', 'archived', 'trashed').default('active'),
  }),
};

const getNotes = {
  query: Joi.object().keys({
    status: Joi.string().valid('active', 'archived', 'trashed'),
    tags: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
    search: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getNote = {
  params: Joi.object().keys({
    noteId: Joi.string().custom(objectId).required(),
  }),
};

const updateNote = {
  params: Joi.object().keys({
    noteId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().trim(),
      body: Joi.string(),
      tags: Joi.array().items(Joi.string()),
      status: Joi.string().valid('active', 'archived', 'trashed'),
    })
    .min(1),
};

const deleteNote = {
  params: Joi.object().keys({
    noteId: Joi.string().custom(objectId).required(),
  }),
};

const archiveNote = {
  params: Joi.object().keys({
    noteId: Joi.string().custom(objectId).required(),
  }),
};

const trashNote = {
  params: Joi.object().keys({
    noteId: Joi.string().custom(objectId).required(),
  }),
};

const restoreNote = {
  params: Joi.object().keys({
    noteId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createNote,
  getNotes,
  getNote,
  updateNote,
  deleteNote,
  archiveNote,
  trashNote,
  restoreNote,
};
