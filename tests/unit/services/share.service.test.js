const mongoose = require('mongoose');
const httpStatus = require('http-status');
const shareService = require('../../../src/services/share.service');
const noteService = require('../../../src/services/note.service');
const { SharedNote, User } = require('../../../src/models');
const ApiError = require('../../../src/utils/ApiError');

jest.mock('../../../src/models/sharedNote.model.js');
jest.mock('../../../src/models/user.model.js');
jest.mock('../../../src/services/note.service.js');

describe('Share service', () => {
  let ownerId;
  let targetUserId;
  let noteId;
  let shareId;
  const targetEmail = 'test@example.com';

  beforeEach(() => {
    ownerId = new mongoose.Types.ObjectId();
    targetUserId = new mongoose.Types.ObjectId();
    noteId = new mongoose.Types.ObjectId();
    shareId = new mongoose.Types.ObjectId();
    jest.clearAllMocks();
  });

  describe('shareNoteByEmail', () => {
    test('should share note successfully', async () => {
      noteService.getNoteByIdAndOwner.mockResolvedValue({ _id: noteId, owner: ownerId });
      User.findOne.mockResolvedValue({ _id: targetUserId, email: targetEmail });
      SharedNote.findOne.mockResolvedValue(null);
      SharedNote.create.mockResolvedValue({ note: noteId, sharedWith: targetUserId, sharedBy: ownerId });

      const result = await shareService.shareNoteByEmail(noteId, ownerId, targetEmail);

      expect(noteService.getNoteByIdAndOwner).toHaveBeenCalledWith(noteId, ownerId);
      expect(User.findOne).toHaveBeenCalledWith({ email: targetEmail });
      expect(SharedNote.findOne).toHaveBeenCalledWith({ note: noteId, sharedWith: targetUserId });
      expect(SharedNote.create).toHaveBeenCalledWith({ note: noteId, sharedWith: targetUserId, sharedBy: ownerId });
      expect(result).toBeDefined();
    });

    test('should throw 404 if note not found or not owned by user', async () => {
      noteService.getNoteByIdAndOwner.mockResolvedValue(null);

      await expect(shareService.shareNoteByEmail(noteId, ownerId, targetEmail)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'Note not found')
      );
    });

    test('should throw 404 if target user not found', async () => {
      noteService.getNoteByIdAndOwner.mockResolvedValue({ _id: noteId, owner: ownerId });
      User.findOne.mockResolvedValue(null);

      await expect(shareService.shareNoteByEmail(noteId, ownerId, targetEmail)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'User with that email does not exist')
      );
    });

    test('should throw 400 if trying to share with self', async () => {
      noteService.getNoteByIdAndOwner.mockResolvedValue({ _id: noteId, owner: ownerId });
      User.findOne.mockResolvedValue({ _id: ownerId, email: targetEmail });

      await expect(shareService.shareNoteByEmail(noteId, ownerId, targetEmail)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, 'Cannot share a note with yourself')
      );
    });

    test('should throw 400 if note already shared with this user', async () => {
      noteService.getNoteByIdAndOwner.mockResolvedValue({ _id: noteId, owner: ownerId });
      User.findOne.mockResolvedValue({ _id: targetUserId, email: targetEmail });
      SharedNote.findOne.mockResolvedValue({ note: noteId, sharedWith: targetUserId });

      await expect(shareService.shareNoteByEmail(noteId, ownerId, targetEmail)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, 'Note is already shared with this user')
      );
    });
  });

  describe('revokeShare', () => {
    test('should revoke share successfully', async () => {
      noteService.getNoteByIdAndOwner.mockResolvedValue({ _id: noteId, owner: ownerId });
      const mockRemove = jest.fn();
      SharedNote.findOne.mockResolvedValue({ _id: shareId, note: noteId, remove: mockRemove });

      await shareService.revokeShare(noteId, ownerId, shareId);

      expect(SharedNote.findOne).toHaveBeenCalledWith({ _id: shareId, note: noteId });
      expect(mockRemove).toHaveBeenCalled();
    });

    test('should throw 404 if share record not found', async () => {
      noteService.getNoteByIdAndOwner.mockResolvedValue({ _id: noteId, owner: ownerId });
      SharedNote.findOne.mockResolvedValue(null);

      await expect(shareService.revokeShare(noteId, ownerId, shareId)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'Share record not found')
      );
    });
  });
});
