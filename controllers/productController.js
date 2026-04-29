const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

// @GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const query = { isActive: true };
  if (req.query.category) query.category = req.query.category;
  if (req.query.search) query.name = { $regex: req.query.search, $options: 'i' };
  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
  }

  let sortObj = { createdAt: -1 };
  if (req.query.sort === 'price_asc') sortObj = { price: 1 };
  if (req.query.sort === 'price_desc') sortObj = { price: -1 };
  if (req.query.sort === 'rating') sortObj = { rating: -1 };
  if (req.query.sort === 'popular') sortObj = { sold: -1 };

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort(sortObj).skip(skip).limit(limit);

  res.json({ products, page, pages: Math.ceil(total / limit), total });
});

// @GET /api/products/featured
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true })
    .populate('category', 'name').limit(8);
  res.json(products);
});

// @GET /api/products/:id
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) { res.status(404); throw new Error('Product not found'); }
  res.json(product);
});

// @POST /api/products (admin)
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, discountPrice, category, stock, brand, tags, specifications, isFeatured } = req.body;
  const images = req.files ? req.files.map(f => ({ url: f.path, public_id: f.filename })) : [];
  const product = await Product.create({
    name, description, price, discountPrice, category, stock, brand,
    tags: tags ? JSON.parse(tags) : [],
    specifications: specifications ? JSON.parse(specifications) : [],
    isFeatured, images,
    sku: `SKU-${Date.now()}`
  });
  res.status(201).json(product);
});

// @PUT /api/products/:id (admin)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  const fields = ['name', 'description', 'price', 'discountPrice', 'category', 'stock', 'brand', 'isFeatured', 'isActive'];
  fields.forEach(f => { if (req.body[f] !== undefined) product[f] = req.body[f]; });
  if (req.body.tags) product.tags = JSON.parse(req.body.tags);
  if (req.body.specifications) product.specifications = JSON.parse(req.body.specifications);
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map(f => ({ url: f.path, public_id: f.filename }));
    product.images = [...product.images, ...newImages];
  }

  const updated = await product.save();
  res.json(updated);
});

// @DELETE /api/products/:id (admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  for (const img of product.images) {
    if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
  }
  await product.deleteOne();
  res.json({ message: 'Product deleted' });
});

// @DELETE /api/products/:id/images/:imageId (admin)
const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  const img = product.images.find(i => i._id.toString() === req.params.imageId);
  if (img && img.public_id) await cloudinary.uploader.destroy(img.public_id);
  product.images = product.images.filter(i => i._id.toString() !== req.params.imageId);
  await product.save();
  res.json({ message: 'Image removed' });
});

// @POST /api/products/:id/reviews
const addReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
  if (alreadyReviewed) { res.status(400); throw new Error('Already reviewed'); }
  const review = { user: req.user._id, name: req.user.name, rating: Number(req.body.rating), comment: req.body.comment };
  product.reviews.push(review);
  await product.save();
  res.status(201).json({ message: 'Review added' });
});

// @GET /api/products/admin/all (admin)
const getAllProductsAdmin = asyncHandler(async (req, res) => {
  const products = await Product.find({}).populate('category', 'name').sort({ createdAt: -1 });
  res.json(products);
});

module.exports = { getProducts, getFeaturedProducts, getProduct, createProduct, updateProduct, deleteProduct, deleteProductImage, addReview, getAllProductsAdmin };
