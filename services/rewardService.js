const Reward = require('../models/Reward');
const RewardRedemption = require('../models/RewardRedemption');
const User = require('../models/User');
const Alert = require('../models/Alert');
const { generateRedemptionCode } = require('../utils/calculations');
const { REDEMPTION_STATUS, ALERT_TYPES, ALERT_SEVERITY } = require('../utils/constants');
const { emitToUser } = require('../config/socket');

class RewardService {
  async getAllRewards(query = {}) {
    const { category, isActive, minPoints, maxPoints, page = 1, limit = 20 } = query;
    const filter = {};

    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (minPoints || maxPoints) {
      filter.pointsRequired = {};
      if (minPoints) filter.pointsRequired.$gte = parseInt(minPoints);
      if (maxPoints) filter.pointsRequired.$lte = parseInt(maxPoints);
    }

    const rewards = await Reward.find(filter)
      .sort({ pointsRequired: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Reward.countDocuments(filter);

    return {
      rewards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getRewardById(id) {
    return Reward.findById(id);
  }

  async redeemReward(userId, rewardId) {
    const session = await RewardRedemption.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      if (!user) throw new Error('User not found');

      const reward = await Reward.findById(rewardId).session(session);
      if (!reward) throw new Error('Reward not found');

      if (!reward.isActive) throw new Error('Reward is not available');

      if (reward.stock !== -1 && reward.stock <= 0) throw new Error('Reward out of stock');

      if (user.totalPoints < reward.pointsRequired) {
        throw new Error('Insufficient points');
      }

      user.totalPoints -= reward.pointsRequired;
      await user.save({ session });

      if (reward.stock !== -1) {
        reward.stock -= 1;
        await reward.save({ session });
      }

      const redemptionCode = generateRedemptionCode();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 90);

      const redemption = await RewardRedemption.create(
        [
          {
            userId,
            rewardId,
            pointsDeducted: reward.pointsRequired,
            redemptionCode,
            expiryDate,
            status: REDEMPTION_STATUS.APPROVED,
            metadata: { rewardName: reward.name },
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      const alert = await Alert.create({
        userId,
        type: ALERT_TYPES.REWARD_AVAILABLE,
        severity: ALERT_SEVERITY.INFO,
        message: `Successfully redeemed: ${reward.name}`,
        metadata: { redemptionId: redemption[0]._id, rewardId: reward._id },
      });

      emitToUser(userId, 'alert:new', alert);
      emitToUser(userId, 'points:update', { totalPoints: user.totalPoints, change: -reward.pointsRequired });

      return { redemption: redemption[0], reward, userPoints: user.totalPoints };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async getUserRedemptions(userId, query = {}) {
    const { status, page = 1, limit = 20 } = query;
    const filter = { userId };

    if (status) filter.status = status;

    const redemptions = await RewardRedemption.find(filter)
      .populate('rewardId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await RewardRedemption.countDocuments(filter);

    return {
      redemptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async createReward(data) {
    return Reward.create(data);
  }

  async updateReward(id, data) {
    return Reward.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async deleteReward(id) {
    return Reward.findByIdAndDelete(id);
  }

  async checkAndNotifyRewards(userId) {
    const user = await User.findById(userId).select('totalPoints');
    if (!user) return;

    const availableRewards = await Reward.find({
      isActive: true,
      pointsRequired: { $lte: user.totalPoints },
      $or: [{ stock: -1 }, { stock: { $gt: 0 } }],
    }).sort({ pointsRequired: 1 }).limit(3);

    if (availableRewards.length > 0) {
      const alert = await Alert.create({
        userId,
        type: ALERT_TYPES.REWARD_AVAILABLE,
        severity: ALERT_SEVERITY.INFO,
        message: `${availableRewards.length} reward(s) available for redemption!`,
        metadata: { rewards: availableRewards.map((r) => ({ id: r._id, name: r.name, points: r.pointsRequired })) },
      });

      emitToUser(userId, 'alert:new', alert);
    }
  }
}

module.exports = new RewardService();