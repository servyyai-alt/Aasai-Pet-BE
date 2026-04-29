// categoryRoutes.js
const express = require('express');
const router = express.Router();
const { getCategories, getAllCategoriesAdmin, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.get('/', getCategories);
router.get('/admin', protect, admin, getAllCategoriesAdmin);
router.post('/', protect, admin, upload.single('image'), createCategory);
router.put('/:id', protect, admin, upload.single('image'), updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

module.exports = router;
