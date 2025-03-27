// routes/search.js
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, searchController.searchAll);

module.exports = router;
