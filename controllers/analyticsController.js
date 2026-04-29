const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// @GET /api/analytics/overview
const getOverview = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const totalUsers = await User.countDocuments({ role: 'user' });
  const totalProducts = await Product.countDocuments({ isActive: true });
  const revenueResult = await Order.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);
  const totalRevenue = revenueResult[0]?.total || 0;
  const pendingOrders = await Order.countDocuments({ orderStatus: 'Pending' });
  const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10 }, isActive: true });

  res.json({ totalOrders, totalUsers, totalProducts, totalRevenue, pendingOrders, lowStockProducts });
});

// @GET /api/analytics/sales
const getSalesData = asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const salesData = await Order.aggregate([
    { $match: { isPaid: true, createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json(salesData);
});

// @GET /api/analytics/top-products
const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true }).sort({ sold: -1 }).limit(10).populate('category', 'name');
  res.json(products);
});

// @GET /api/analytics/orders-by-status
const getOrdersByStatus = asyncHandler(async (req, res) => {
  const data = await Order.aggregate([
    { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
  ]);
  res.json(data);
});

// @GET /api/analytics/recent-activity
const getRecentActivity = asyncHandler(async (req, res) => {
  const recentOrders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(10);
  const newUsers = await User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5);
  res.json({ recentOrders, newUsers });
});

// @GET /api/analytics/category-sales
const getCategorySales = asyncHandler(async (req, res) => {
  const data = await Order.aggregate([
    { $match: { isPaid: true } },
    { $unwind: '$orderItems' },
    { $lookup: { from: 'products', localField: 'orderItems.product', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $lookup: { from: 'categories', localField: 'product.category', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $group: { _id: '$category.name', revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }, count: { $sum: '$orderItems.quantity' } } },
    { $sort: { revenue: -1 } }
  ]);
  res.json(data);
});

module.exports = { getOverview, getSalesData, getTopProducts, getOrdersByStatus, getRecentActivity, getCategorySales };
