const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { adminUserStatusValidation, rewardValidation, paginationValidation } = require('../middleware/validationMiddleware');
const { apiLimiter } = require('../middleware/rateLimitMiddleware');

router.use(protect);
router.use(adminOnly);
router.use(apiLimiter);

router.get('/dashboard', adminController.getAdminDashboard);
router.get('/analytics', adminController.getAnalytics);

router.get('/users', paginationValidation, adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/status', adminUserStatusValidation, adminController.updateUserStatus);

router.get('/violations', paginationValidation, adminController.getViolations);

router.get('/sensors', adminController.getSensors);

router.get('/rewards', adminController.getRewards);
router.post('/rewards', rewardValidation, adminController.createReward);
router.patch('/rewards/:id', rewardValidation, adminController.updateReward);
router.delete('/rewards/:id', adminController.deleteReward);

module.exports = router;