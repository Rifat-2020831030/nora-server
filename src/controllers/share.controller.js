const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const { shareService } = require('../services');

const shareNote = catchAsync(async (req, res) => {
  const share = await shareService.shareNoteByEmail(req.params.noteId, req.user.id, req.body.email);
  sendSuccess(res, httpStatus.CREATED, share);
});

const getShares = catchAsync(async (req, res) => {
  const shares = await shareService.getSharesForNote(req.params.noteId, req.user.id);
  // shares is an array, let's wrap it in an envelope
  res.status(httpStatus.OK).send({
    success: true,
    data: shares,
  });
});

const revokeShare = catchAsync(async (req, res) => {
  await shareService.revokeShare(req.params.noteId, req.user.id, req.params.shareId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getSharedWithMe = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await shareService.getNotesSharedWithUser(req.user.id, options);
  
  const { results, ...meta } = result;
  // Send with custom envelope
  res.status(httpStatus.OK).send({
    success: true,
    data: results,
    meta,
  });
});

module.exports = {
  shareNote,
  getShares,
  revokeShare,
  getSharedWithMe,
};
