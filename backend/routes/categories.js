const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Protected endpoint for listing categories (remove verifyToken for public access)
router.get('/', verifyToken, categoryController.getAllCategories);

module.exports = router;
