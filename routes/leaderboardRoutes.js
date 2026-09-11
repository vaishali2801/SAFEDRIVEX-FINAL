const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { paginationValidation } = require('../middleware/validationMiddleware');
const { apiLimiter } = require('../middleware/rateLimitMiddleware');

router.use(optionalAuth);
router.use(apiLimiter);

router.get('/', paginationValidation, leaderboardController.getLeaderboard);

module.exports = router;