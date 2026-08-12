const mongoose = require('mongoose');
const httpStatus = require('http-status');
const noteService = require('../../../src/services/note.service');
const { Note } = require('../../../src/models');
const ApiError = require('../../../src/utils/ApiError');

jest.mock('../../../src/models/note.model.js');

describe('Note service', () => {
  let userId;
  let noteId;

  beforeEach(() => {
    userId = new mongoose.Types.ObjectId();
    noteId = new mongoose.Types.ObjectId();
    jest.clearAllMocks();
  });

  describe('createNote', () => {
    test('should create a note with the owner field set to userId', async () => {
      const noteBody = { title: 'Test Title', body: 'Test Body' };
      Note.create.mockResolvedValue({ ...noteBody, owner: userId, id: noteId });

      const result = await noteService.createNote(userId, noteBody);

      expect(Note.create).toHaveBeenCalledWith({ ...noteBody, owner: userId });
      expect(result).toHaveProperty('owner', userId);
    });
  });

  describe('queryNotes', () => {
    test('should apply filter and pagination options correctly', async () => {
      const filter = { status: 'active' };
      const options = { limit: 10, page: 1 };

      Note.paginate.mockResolvedValue({ results: [], page: 1, limit: 10, totalPages: 1, totalResults: 0 });

      await noteService.queryNotes(userId, filter, options);

      expect(Note.paginate).toHaveBeenCalledWith({ status: 'active', owner: userId }, options);
    });

    test('should apply text search filter when search keyword is provided', async () => {
      const filter = { search: 'keyword' };
      const options = { limit: 10, page: 1 };

      Note.paginate.mockResolvedValue({ results: [], page: 1, limit: 10, totalPages: 1, totalResults: 0 });

      await noteService.queryNotes(userId, filter, options);

      expect(Note.paginate).toHaveBeenCalledWith({ owner: userId, $text: { $search: 'keyword' } }, options);
    });
  });

  describe('getNoteByIdAndOwner', () => {
    test('should return note if found', async () => {
      Note.findOne.mockResolvedValue({ id: noteId, owner: userId, title: 'Test' });

      const result = await noteService.getNoteByIdAndOwner(noteId, userId);

      expect(Note.findOne).toHaveBeenCalledWith({ _id: noteId, owner: userId });
      expect(result).toBeDefined();
    });
  });

  describe('updateNoteById', () => {
    test('should update note if found', async () => {
      const updateBody = { title: 'Updated' };
      const mockSave = jest.fn();
      const mockNote = { id: noteId, owner: userId, title: 'Test', save: mockSave };

      Note.findOne.mockResolvedValue(mockNote);

      const result = await noteService.updateNoteById(noteId, userId, updateBody);

      expect(Note.findOne).toHaveBeenCalledWith({ _id: noteId, owner: userId });
      expect(mockNote.title).toBe('Updated');
      expect(mockSave).toHaveBeenCalled();
      expect(result.title).toBe('Updated');
    });

    test('should throw 404 error if note not found', async () => {
      Note.findOne.mockResolvedValue(null);

      await expect(noteService.updateNoteById(noteId, userId, { title: 'Updated' })).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'Note not found')
      );
    });
  });

  describe('deleteNoteById', () => {
    test('should delete note if found', async () => {
      const mockRemove = jest.fn();
      const mockNote = { id: noteId, owner: userId, title: 'Test', remove: mockRemove };

      Note.findOne.mockResolvedValue(mockNote);

      const result = await noteService.deleteNoteById(noteId, userId);

      expect(mockRemove).toHaveBeenCalled();
      expect(result.title).toBe('Test');
    });

    test('should throw 404 error if note not found', async () => {
      Note.findOne.mockResolvedValue(null);

      await expect(noteService.deleteNoteById(noteId, userId)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'Note not found')
      );
    });
  });

  describe('archiveNoteById', () => {
    test('should archive note if found', async () => {
      const mockSave = jest.fn();
      const mockNote = { id: noteId, owner: userId, title: 'Test', save: mockSave };

      Note.findOne.mockResolvedValue(mockNote);

      await noteService.archiveNoteById(noteId, userId);

      expect(mockNote.status).toBe('archived');
      expect(mockNote.trashedAt).toBeNull();
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('trashNoteById', () => {
    test('should trash note if found', async () => {
      const mockSave = jest.fn();
      const mockNote = { id: noteId, owner: userId, title: 'Test', save: mockSave };

      Note.findOne.mockResolvedValue(mockNote);

      await noteService.trashNoteById(noteId, userId);

      expect(mockNote.status).toBe('trashed');
      expect(mockNote.trashedAt).toBeInstanceOf(Date);
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('restoreNoteById', () => {
    test('should restore note if found', async () => {
      const mockSave = jest.fn();
      const mockNote = {
        id: noteId,
        owner: userId,
        title: 'Test',
        status: 'trashed',
        trashedAt: new Date(),
        save: mockSave,
      };

      Note.findOne.mockResolvedValue(mockNote);

      await noteService.restoreNoteById(noteId, userId);

      expect(mockNote.status).toBe('active');
      expect(mockNote.trashedAt).toBeNull();
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('getNoteByIdForUser', () => {
    test('should return note if user is owner', async () => {
      Note.findById.mockResolvedValue({ _id: noteId, owner: userId });

      const result = await noteService.getNoteByIdForUser(noteId, userId);

      expect(Note.findById).toHaveBeenCalledWith(noteId);
      expect(result).toBeDefined();
    });
    // Can test shared interaction via integration tests later
  });
});
