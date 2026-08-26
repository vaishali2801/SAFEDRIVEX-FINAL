const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimitMiddleware');

router.use(protect);
router.use(apiLimiter);

router.get('/', dashboardController.getDashboard);

module.exports = router;