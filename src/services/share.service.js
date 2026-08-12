const httpStatus = require('http-status');
const { SharedNote, User } = require('../models');
const ApiError = require('../utils/ApiError');
const noteService = require('./note.service');

/**
 * Share a note with a user by email
 * @param {ObjectId} noteId
 * @param {ObjectId} ownerId
 * @param {string} targetEmail
 * @returns {Promise<SharedNote>}
 */
const shareNoteByEmail = async (noteId, ownerId, targetEmail) => {
  // Verify the owner owns the note
  const note = await noteService.getNoteByIdAndOwner(noteId, ownerId);
  if (!note) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Note not found');
  }

  // Find target user
  const targetUser = await User.findOne({ email: targetEmail });
  if (!targetUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User with that email does not exist');
  }

  // Cannot share with yourself
  if (targetUser._id.toString() === ownerId.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot share a note with yourself');
  }

  // Check if already shared
  const existingShare = await SharedNote.findOne({ note: noteId, sharedWith: targetUser._id });
  if (existingShare) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Note is already shared with this user');
  }

  return SharedNote.create({
    note: noteId,
    sharedWith: targetUser._id,
    sharedBy: ownerId,
  });
};

/**
 * Get all shares for a note
 * @param {ObjectId} noteId
 * @param {ObjectId} ownerId
 * @returns {Promise<SharedNote[]>}
 */
const getSharesForNote = async (noteId, ownerId) => {
  // Verify the owner owns the note
  const note = await noteService.getNoteByIdAndOwner(noteId, ownerId);
  if (!note) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Note not found');
  }

  return SharedNote.find({ note: noteId }).populate('sharedWith', 'name email').populate('sharedBy', 'name email');
};

/**
 * Revoke a share
 * @param {ObjectId} noteId
 * @param {ObjectId} ownerId
 * @param {ObjectId} shareId
 * @returns {Promise<SharedNote>}
 */
const revokeShare = async (noteId, ownerId, shareId) => {
  // Verify the owner owns the note
  const note = await noteService.getNoteByIdAndOwner(noteId, ownerId);
  if (!note) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Note not found');
  }

  const share = await SharedNote.findOne({ _id: shareId, note: noteId });
  if (!share) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Share record not found');
  }

  await share.remove();
  return share;
};

/**
 * Get notes shared with a user
 * @param {ObjectId} userId
 * @param {Object} options - Pagination options
 * @returns {Promise<QueryResult>}
 */
const getNotesSharedWithUser = async (userId, options) => {
  // Find all shared notes for this user
  // This uses populate on the note field. Since we want pagination,
  // we can use the paginate plugin on SharedNote and populate 'note'.
  const queryOptions = { ...options, populate: 'note,sharedBy' };
  return SharedNote.paginate({ sharedWith: userId }, queryOptions);
};

module.exports = {
  shareNoteByEmail,
  getSharesForNote,
  revokeShare,
  getNotesSharedWithUser,
};
