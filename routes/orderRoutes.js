const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrder, updateOrderToPaid, getAllOrders, updateOrderStatus, cancelMyOrder } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/', protect, admin, getAllOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/pay', protect, updateOrderToPaid);
router.put('/:id/cancel', protect, cancelMyOrder);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;
