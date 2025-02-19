// controllers/searchController.js
const { Poll } = require('../models');
const { Op } = require('sequelize');

// GET /api/search - Search polls by query parameter in the question field
exports.searchPolls = async (req, res, next) => {
  try {
    const query = req.query.query;
    if (!query) {
      const err = new Error('Query parameter is required');
      err.status = 400;
      return next(err);
    }
    const polls = await Poll.findAll({
      where: { question: { [Op.iLike]: `%${query}%` } }
    });
    res.status(200).json(polls);
  } catch (error) {
    next(error);
  }
};
