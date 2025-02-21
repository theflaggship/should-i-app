const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Protected search endpoint (remove verifyToken if you want public access)
router.get('/', verifyToken, searchController.searchPolls);

module.exports = router;
