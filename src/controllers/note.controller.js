const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const { noteService } = require('../services');

const createNote = catchAsync(async (req, res) => {
  const note = await noteService.createNote(req.user.id, req.body);
  sendSuccess(res, httpStatus.CREATED, note);
});

const getNotes = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['status', 'search']);
  if (req.query.tags) {
    // If multiple tags are provided as array or single tag as string
    filter.tags = Array.isArray(req.query.tags) ? { $in: req.query.tags } : req.query.tags;
  }
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await noteService.queryNotes(req.user.id, filter, options);

  // result comes back with results and meta (if using paginate plugin)
  // Assuming our sendSuccess accepts standard paginate payload:
  // We'll map results to data and pass the rest as meta
  const { results, ...meta } = result;
  // Send with custom envelope
  res.status(httpStatus.OK).send({
    success: true,
    data: results,
    meta,
  });
});

const getNote = catchAsync(async (req, res) => {
  const note = await noteService.getNoteByIdForUser(req.params.noteId, req.user.id);
  if (!note) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Note not found');
  }
  sendSuccess(res, httpStatus.OK, note);
});

const updateNote = catchAsync(async (req, res) => {
  const note = await noteService.updateNoteById(req.params.noteId, req.user.id, req.body);
  sendSuccess(res, httpStatus.OK, note);
});

const deleteNote = catchAsync(async (req, res) => {
  await noteService.deleteNoteById(req.params.noteId, req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const archiveNote = catchAsync(async (req, res) => {
  const note = await noteService.archiveNoteById(req.params.noteId, req.user.id);
  sendSuccess(res, httpStatus.OK, note);
});

const trashNote = catchAsync(async (req, res) => {
  const note = await noteService.trashNoteById(req.params.noteId, req.user.id);
  sendSuccess(res, httpStatus.OK, note);
});

const restoreNote = catchAsync(async (req, res) => {
  const note = await noteService.restoreNoteById(req.params.noteId, req.user.id);
  sendSuccess(res, httpStatus.OK, note);
});

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
