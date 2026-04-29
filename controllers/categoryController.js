const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true });
  res.json(categories);
});

const getAllCategoriesAdmin = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ createdAt: -1 });
  res.json(categories);
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const exists = await Category.findOne({ slug });
  if (exists) { res.status(400); throw new Error('Category already exists'); }
  const image = req.file ? req.file.path : '';
  const category = await Category.create({ name, slug, description, image });
  res.status(201).json(category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) { res.status(404); throw new Error('Category not found'); }
  category.name = req.body.name || category.name;
  category.description = req.body.description || category.description;
  category.isActive = req.body.isActive !== undefined ? req.body.isActive : category.isActive;
  if (req.body.name) category.slug = req.body.name.toLowerCase().replace(/\s+/g, '-');
  if (req.file) category.image = req.file.path;
  const updated = await category.save();
  res.json(updated);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) { res.status(404); throw new Error('Category not found'); }
  await category.deleteOne();
  res.json({ message: 'Category deleted' });
});

module.exports = { getCategories, getAllCategoriesAdmin, createCategory, updateCategory, deleteCategory };
