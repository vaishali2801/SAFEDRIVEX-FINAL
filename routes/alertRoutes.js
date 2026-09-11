const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');
const { paginationValidation } = require('../middleware/validationMiddleware');
const { apiLimiter } = require('../middleware/rateLimitMiddleware');

router.use(protect);
router.use(apiLimiter);

router.get('/', paginationValidation, alertController.getAlerts);
router.get('/unread-count', alertController.getUnreadCount);
router.patch('/:id/read', alertController.markAsRead);
router.patch('/read-all', alertController.markAllAsRead);
router.delete('/:id', alertController.deleteAlert);

module.exports = router;