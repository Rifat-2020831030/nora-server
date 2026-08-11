const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const sharedNoteSchema = mongoose.Schema(
  {
    note: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Note',
      required: true,
    },
    sharedWith: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    sharedBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
sharedNoteSchema.plugin(toJSON);
sharedNoteSchema.plugin(paginate);

// Ensure a note cannot be shared with the same user multiple times
sharedNoteSchema.index({ note: 1, sharedWith: 1 }, { unique: true });

/**
 * @typedef SharedNote
 */
const SharedNote = mongoose.model('SharedNote', sharedNoteSchema);

module.exports = SharedNote;
