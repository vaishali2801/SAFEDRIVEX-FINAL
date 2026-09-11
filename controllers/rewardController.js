const rewardService = require('../services/rewardService');
const { successResponse, errorResponse } = require('../utils/response');

const getRewards = async (req, res) => {
  try {
    const result = await rewardService.getAllRewards(req.query);
    return successResponse(res, 'Rewards fetched', result);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch rewards', error);
  }
};

const getRewardById = async (req, res) => {
  try {
    const reward = await rewardService.getRewardById(req.params.id);
    if (!reward) return errorResponse(res, 'Reward not found', null, 404);
    return successResponse(res, 'Reward fetched', reward);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch reward', error);
  }
};

const redeemReward = async (req, res) => {
  try {
    const result = await rewardService.redeemReward(req.userId, req.params.id);
    return successResponse(res, 'Reward redeemed successfully', result);
  } catch (error) {
    return errorResponse(res, error.message, error, 400);
  }
};

const getMyRedemptions = async (req, res) => {
  try {
    const result = await rewardService.getUserRedemptions(req.userId, req.query);
    return successResponse(res, 'Redemptions fetched', result);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch redemptions', error);
  }
};

module.exports = {
  getRewards,
  getRewardById,
  redeemReward,
  getMyRedemptions,
};