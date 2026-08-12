const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const noteValidation = require('../../validations/note.validation');
const noteController = require('../../controllers/note.controller');
const shareValidation = require('../../validations/share.validation');
const shareController = require('../../controllers/share.controller');

const router = express.Router();

// Define this before /:noteId to prevent it being caught as a parameter
router.get('/shared-with-me', auth(), validate(shareValidation.getNotesSharedWithUser), shareController.getSharedWithMe);
router.get('/stats', auth(), noteController.getNoteStats);

router
  .route('/')
  .post(auth(), validate(noteValidation.createNote), noteController.createNote)
  .get(auth(), validate(noteValidation.getNotes), noteController.getNotes);

router
  .route('/:noteId')
  .get(auth(), validate(noteValidation.getNote), noteController.getNote)
  .patch(auth(), validate(noteValidation.updateNote), noteController.updateNote)
  .delete(auth(), validate(noteValidation.deleteNote), noteController.deleteNote);

router.post('/:noteId/archive', auth(), validate(noteValidation.archiveNote), noteController.archiveNote);
router.post('/:noteId/trash', auth(), validate(noteValidation.trashNote), noteController.trashNote);
router.post('/:noteId/restore', auth(), validate(noteValidation.restoreNote), noteController.restoreNote);

router
  .route('/:noteId/shares')
  .post(auth(), validate(shareValidation.shareNote), shareController.shareNote)
  .get(auth(), validate(shareValidation.getSharesForNote), shareController.getShares);

router.delete('/:noteId/shares/:shareId', auth(), validate(shareValidation.revokeShare), shareController.revokeShare);

module.exports = router;
