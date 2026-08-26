const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const { protect } = require('../middleware/authMiddleware');
const { rewardRedemptionValidation, paginationValidation } = require('../middleware/validationMiddleware');
const { rewardLimiter } = require('../middleware/rateLimitMiddleware');

router.use(protect);
router.use(rewardLimiter);

router.get('/', paginationValidation, rewardController.getRewards);
router.get('/my-redemptions', paginationValidation, rewardController.getMyRedemptions);
router.get('/:id', rewardController.getRewardById);
router.post('/:id/redeem', rewardRedemptionValidation, rewardController.redeemReward);

module.exports = router;