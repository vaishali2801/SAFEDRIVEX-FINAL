const express = require('express');
const router = express.Router();
const safetyController = require('../controllers/safetyController');
const { protect } = require('../middleware/authMiddleware');
const { paginationValidation } = require('../middleware/validationMiddleware');
const { apiLimiter } = require('../middleware/rateLimitMiddleware');

router.use(protect);
router.use(apiLimiter);

router.get('/score', safetyController.getSafetyScore);
router.get('/history', paginationValidation, safetyController.getSafetyScoreHistory);
router.get('/breakdown', safetyController.getScoreBreakdown);

module.exports = router;