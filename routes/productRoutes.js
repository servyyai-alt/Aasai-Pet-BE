const express = require('express');
const router = express.Router();
const { getProducts, getFeaturedProducts, getProduct, createProduct, updateProduct, deleteProduct, deleteProductImage, addReview, getAllProductsAdmin } = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/admin/all', protect, admin, getAllProductsAdmin);
router.post('/', protect, admin, upload.array('images', 5), createProduct);
router.get('/:id', getProduct);
router.put('/:id', protect, admin, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
router.delete('/:id/images/:imageId', protect, admin, deleteProductImage);
router.post('/:id/reviews', protect, addReview);

module.exports = router;
