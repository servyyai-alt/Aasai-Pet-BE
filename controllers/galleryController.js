const asyncHandler = require('express-async-handler');
const Gallery = require('../models/Gallery');
const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

const parseMediaType = (value) => {
  if (!value) return null;
  const v = String(value).toLowerCase().trim();
  if (v === 'image' || v === 'video') return v;
  return null;
};

const destroyCloudinaryAsset = async ({ publicId, mediaType }) => {
  if (!publicId) return;
  const resource_type = mediaType === 'video' ? 'video' : 'image';
  await cloudinary.uploader.destroy(publicId, { resource_type });
};

// @GET /api/gallery
const getGalleryItems = asyncHandler(async (req, res) => {
  const items = await Gallery.find({})
    .sort({ createdAt: -1 })
    .select('title description mediaType mediaUrl productId createdAt');
  res.json(items);
});

// @GET /api/gallery/:id
const getGalleryItem = asyncHandler(async (req, res) => {
  const item = await Gallery.findById(req.params.id).populate({
    path: 'productId',
    populate: { path: 'category', select: 'name slug' },
  });
  if (!item) {
    res.status(404);
    throw new Error('Gallery item not found');
  }
  res.json(item);
});

// @POST /api/gallery (admin)
const createGalleryItem = asyncHandler(async (req, res) => {
  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim();
  const explicitType = parseMediaType(req.body.mediaType);
  const productId = req.body.productId ? String(req.body.productId).trim() : undefined;

  if (!title) {
    res.status(400);
    throw new Error('Title is required');
  }

  const file = req.file;
  const mediaUrl = file?.path || String(req.body.mediaUrl || '').trim();
  const mediaPublicId = file?.filename || String(req.body.mediaPublicId || '').trim();
  const inferredType = file?.mimetype?.startsWith('video/') ? 'video' : (file ? 'image' : null);
  const mediaType = explicitType || inferredType;

  if (!mediaType) {
    res.status(400);
    throw new Error('mediaType must be "image" or "video"');
  }
  if (!mediaUrl) {
    res.status(400);
    throw new Error('mediaUrl is required (or upload a media file)');
  }

  if (productId) {
    const exists = await Product.exists({ _id: productId });
    if (!exists) {
      res.status(400);
      throw new Error('Invalid productId');
    }
  }

  const created = await Gallery.create({
    title,
    description,
    mediaType,
    mediaUrl,
    mediaPublicId: mediaPublicId || undefined,
    productId: productId || undefined,
  });

  res.status(201).json(created);
});

// @PUT /api/gallery/:id (admin)
const updateGalleryItem = asyncHandler(async (req, res) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Gallery item not found');
  }

  const previousPublicId = item.mediaPublicId;
  const previousMediaType = item.mediaType;

  const title = req.body.title !== undefined ? String(req.body.title || '').trim() : undefined;
  const description = req.body.description !== undefined ? String(req.body.description || '').trim() : undefined;
  const mediaType = req.body.mediaType !== undefined ? parseMediaType(req.body.mediaType) : undefined;
  const productId = req.body.productId !== undefined ? (String(req.body.productId || '').trim() || null) : undefined;

  if (title !== undefined && !title) {
    res.status(400);
    throw new Error('Title cannot be empty');
  }
  if (req.body.mediaType !== undefined && !mediaType) {
    res.status(400);
    throw new Error('mediaType must be "image" or "video"');
  }
  if (productId !== undefined && productId) {
    const exists = await Product.exists({ _id: productId });
    if (!exists) {
      res.status(400);
      throw new Error('Invalid productId');
    }
  }

  if (title !== undefined) item.title = title;
  if (description !== undefined) item.description = description;
  if (mediaType !== undefined) item.mediaType = mediaType;
  if (productId !== undefined) item.productId = productId || undefined;

  if (req.file) {
    await destroyCloudinaryAsset({ publicId: previousPublicId, mediaType: previousMediaType });
    item.mediaUrl = req.file.path;
    item.mediaPublicId = req.file.filename;
    item.mediaType = req.file.mimetype?.startsWith('video/') ? 'video' : 'image';
  } else if (req.body.mediaUrl !== undefined) {
    const mediaUrl = String(req.body.mediaUrl || '').trim();
    if (!mediaUrl) {
      res.status(400);
      throw new Error('mediaUrl cannot be empty');
    }
    item.mediaUrl = mediaUrl;
  }

  const updated = await item.save();
  res.json(updated);
});

// @DELETE /api/gallery/:id (admin)
const deleteGalleryItem = asyncHandler(async (req, res) => {
  const item = await Gallery.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Gallery item not found');
  }

  await destroyCloudinaryAsset({ publicId: item.mediaPublicId, mediaType: item.mediaType });
  await item.deleteOne();
  res.json({ message: 'Gallery item deleted' });
});

module.exports = {
  getGalleryItems,
  getGalleryItem,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
};
