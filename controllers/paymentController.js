const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @POST /api/payment/create-order
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const options = {
    amount: Math.round(amount * 100), // Convert to paise
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
  };
  const order = await razorpay.orders.create(options);
  res.json({ orderId: order.id, currency: order.currency, amount: order.amount });
});

// @POST /api/payment/verify
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  if (expectedSignature === razorpay_signature) {
    res.json({ verified: true, message: 'Payment verified successfully' });
  } else {
    res.status(400).json({ verified: false, message: 'Payment verification failed' });
  }
});

// @GET /api/payment/key
const getRazorpayKey = asyncHandler(async (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

module.exports = { createRazorpayOrder, verifyPayment, getRazorpayKey };
