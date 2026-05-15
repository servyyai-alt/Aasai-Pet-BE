const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @POST /api/orders
const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;
  if (!orderItems || orderItems.length === 0) {
    res.status(400); throw new Error('No order items');
  }

  const productIds = orderItems.map(i => i.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  const normalizedItems = orderItems.map(i => {
    const p = productMap.get(i.product.toString());
    if (!p) {
      res.status(400);
      throw new Error('One or more products are invalid');
    }
    return {
      product: p._id,
      name: p.name,
      image: p.images?.[0]?.url,
      price: Number(p.discountPrice || p.price),
      quantity: Number(i.quantity) || 1,
    };
  });

  const itemsPrice = normalizedItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shippingPrice = normalizedItems.reduce((acc, i) => {
    const p = productMap.get(i.product.toString());
    return acc + (Number(p?.shippingCharge || 0) * i.quantity);
  }, 0);
  const taxPrice = Math.round(itemsPrice * 0.18);
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  const order = await Order.create({
    user: req.user._id,
    orderItems: normalizedItems,
    shippingAddress,
    paymentMethod: paymentMethod || 'razorpay',
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  });
  res.status(201).json(order);
});

// @GET /api/orders/myorders
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// @GET /api/orders/:id
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorized');
  }
  res.json(order);
});

// @PUT /api/orders/:id/pay
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  order.isPaid = true;
  order.paidAt = Date.now();
  order.orderStatus = 'Processing';
  order.paymentResult = req.body;
  // Update product stock & sold
  for (const item of order.orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity, sold: item.quantity }
    });
  }
  const updated = await order.save();
  res.json(updated);
});

// @GET /api/orders (admin)
const getAllOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const query = {};
  if (req.query.status) query.orderStatus = req.query.status;
  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 }).skip(skip).limit(limit);
  res.json({ orders, total, page, pages: Math.ceil(total / limit) });
});

// @PUT /api/orders/:id/status (admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  order.orderStatus = req.body.status;
  if (req.body.status === 'Delivered') order.deliveredAt = Date.now();
  if (req.body.status === 'Cancelled') order.cancelReason = req.body.cancelReason;
  const updated = await order.save();
  res.json(updated);
});

// @PUT /api/orders/:id/cancel (user)
const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized');
  }
  if (!order.isPaid) {
    res.status(400); throw new Error('Order can be cancelled only after payment');
  }
  if (order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered') {
    res.status(400); throw new Error('Order cannot be cancelled after it is shipped');
  }
  if (order.orderStatus === 'Cancelled') {
    res.status(400); throw new Error('Order is already cancelled');
  }
  const reason = String(req.body?.cancelReason || '').trim();
  if (!reason) {
    res.status(400); throw new Error('Cancel reason is required');
  }

  order.orderStatus = 'Cancelled';
  order.cancelReason = reason;
  const updated = await order.save();
  res.json(updated);
});

module.exports = { createOrder, getMyOrders, getOrder, updateOrderToPaid, getAllOrders, updateOrderStatus, cancelMyOrder };
