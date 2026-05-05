const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    mediaUrl: { type: String, required: true, trim: true },
    mediaPublicId: { type: String, trim: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Gallery', gallerySchema);

