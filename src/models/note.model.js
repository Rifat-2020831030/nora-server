const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const noteSchema = mongoose.Schema(
  {
    owner: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'trashed'],
      default: 'active',
    },
    trashedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
noteSchema.plugin(toJSON);
noteSchema.plugin(paginate);

// Indexes per sprint plan
noteSchema.index({ owner: 1, status: 1 });
noteSchema.index({ status: 1 });
noteSchema.index({ title: 'text', body: 'text', tags: 'text' });

/**
 * @typedef Note
 */
const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
