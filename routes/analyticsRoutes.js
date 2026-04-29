const express = require('express');
const router = express.Router();
const { getOverview, getSalesData, getTopProducts, getOrdersByStatus, getRecentActivity, getCategorySales } = require('../controllers/analyticsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect, admin);
router.get('/overview', getOverview);
router.get('/sales', getSalesData);
router.get('/top-products', getTopProducts);
router.get('/orders-by-status', getOrdersByStatus);
router.get('/recent-activity', getRecentActivity);
router.get('/category-sales', getCategorySales);

module.exports = router;
