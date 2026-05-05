const express = require('express');
const router = express.Router();
const {
  getGalleryItems,
  getGalleryItem,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} = require('../controllers/galleryController');
const { protect, admin } = require('../middleware/authMiddleware');
const { galleryUpload } = require('../config/cloudinary');

router.get('/', getGalleryItems);
router.get('/:id', getGalleryItem);
router.post('/', protect, admin, galleryUpload.single('media'), createGalleryItem);
router.put('/:id', protect, admin, galleryUpload.single('media'), updateGalleryItem);
router.delete('/:id', protect, admin, deleteGalleryItem);

module.exports = router;

