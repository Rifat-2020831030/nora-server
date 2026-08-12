const httpStatus = require('http-status');
const { Note, SharedNote } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a note
 * @param {ObjectId} userId
 * @param {Object} noteBody
 * @returns {Promise<Note>}
 */
const createNote = async (userId, noteBody) => {
  return Note.create({ ...noteBody, owner: userId });
};

/**
 * Query for notes
 * @param {ObjectId} userId
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryNotes = async (userId, filter, options) => {
  const noteFilter = { ...filter };
  if (userId) {
    noteFilter.owner = userId;
  }

  if (filter.search) {
    noteFilter.$text = { $search: filter.search };
    delete noteFilter.search;
  }

  const notes = await Note.paginate(noteFilter, options);
  return notes;
};

/**
 * Get note by id and owner
 * @param {ObjectId} noteId
 * @param {ObjectId} userId
 * @returns {Promise<Note>}
 */
const getNoteByIdAndOwner = async (noteId, userId) => {
  return Note.findOne({ _id: noteId, owner: userId });
};

/**
 * Update note by id
 * @param {ObjectId} noteId
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<Note>}
 */
const updateNoteById = async (noteId, userId, updateBody) => {
  const note = await getNoteByIdAndOwner(noteId, userId);
  if (!note) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Note not found');
  }
  Object.assign(note, updateBody);
  await note.save();
  return note;
};

/**
 * Delete note by id
 * @param {ObjectId} noteId
 * @param {ObjectId} userId
 * @returns {Promise<Note>}
 */
const deleteNoteById = async (noteId, userId) => {
  const note = await getNoteByIdAndOwner(noteId, userId);
  if (!note) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Note not found');
  }
  await note.remove();
  return note;
};

/**
 * Get note by id and user (owner or shared)
 * @param {ObjectId} noteId
 * @param {ObjectId} userId
 * @returns {Promise<Note>}
 */
const getNoteByIdForUser = async (noteId, userId) => {
  const note = await Note.findById(noteId);
  if (!note) {
    return null;
  }

  if (note.owner.toString() === userId.toString()) {
    return note;
  }

  // Check if it's shared with the user
  const shared = await SharedNote.findOne({ note: noteId, sharedWith: userId });
  if (shared) {
    return note;
  }

  return null;
};

/**
 * Archive note by id
 * @param {ObjectId} noteId
 * @param {ObjectId} userId
 * @returns {Promise<Note>}
 */
const archiveNoteById = async (noteId, userId) => {
  const note = await getNoteByIdAndOwner(noteId, userId);
  if (!note) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Note not found');
  }
  note.status = 'archived';
  note.trashedAt = null;
  await note.save();
  return note;
};

/**
 * Trash note by id
 * @param {ObjectId} noteId
 * @param {ObjectId} userId
 * @returns {Promise<Note>}
 */
const trashNoteById = async (noteId, userId) => {
  const note = await getNoteByIdAndOwner(noteId, userId);
  if (!note) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Note not found');
  }
  note.status = 'trashed';
  note.trashedAt = new Date();
  await note.save();
  return note;
};

/**
 * Restore note by id
 * @param {ObjectId} noteId
 * @param {ObjectId} userId
 * @returns {Promise<Note>}
 */
const restoreNoteById = async (noteId, userId) => {
  const note = await getNoteByIdAndOwner(noteId, userId);
  if (!note) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Note not found');
  }
  note.status = 'active';
  note.trashedAt = null;
  await note.save();
  return note;
};

module.exports = {
  createNote,
  queryNotes,
  getNoteByIdAndOwner,
  getNoteByIdForUser,
  updateNoteById,
  deleteNoteById,
  archiveNoteById,
  trashNoteById,
  restoreNoteById,
};
