// controllers/categoryController.js
const { Category } = require('../models');

// GET /api/categories - Retrieve all categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll();
    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};
