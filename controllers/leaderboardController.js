const User = require('../models/User');
const DrivingSession = require('../models/DrivingSession');
const { successResponse, errorResponse } = require('../utils/response');
const { LEADERBOARD_PERIODS } = require('../utils/constants');

const getLeaderboard = async (req, res) => {
  try {
    const { period = LEADERBOARD_PERIODS.WEEKLY, page = 1, limit = 50 } = req.query;

    let startDate = new Date();
    if (period === LEADERBOARD_PERIODS.WEEKLY) {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === LEADERBOARD_PERIODS.MONTHLY) {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate = new Date(0);
    }

    const users = await User.aggregate([
      { $match: { isActive: true, role: 'USER' } },
      {
        $lookup: {
          from: 'drivingsessions',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$userId', '$$userId'] },
                status: 'COMPLETED',
                startTime: { $gte: startDate },
              },
            },
          ],
          as: 'sessions',
        },
      },
      {
        $addFields: {
          periodTrips: { $size: '$sessions' },
          periodSafeTrips: {
            $size: {
              $filter: {
                input: '$sessions',
                cond: { $gte: ['$$this.safetyScore', 70] },
              },
            },
          },
          avgSafetyScore: {
            $cond: [
              { $gt: [{ $size: '$sessions' }, 0] },
              { $avg: '$sessions.safetyScore' },
              85,
            ],
          },
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          profileImage: 1,
          totalPoints: 1,
          safetyScore: 1,
          totalTrips: 1,
          safeTrips: 1,
          periodTrips: 1,
          periodSafeTrips: 1,
          avgSafetyScore: 1,
        },
      },
      {
        $sort: {
          avgSafetyScore: -1,
          totalPoints: -1,
          periodSafeTrips: -1,
        },
      },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) },
    ]);

    let userRank = null;
    if (req.userId) {
      const allUsers = await User.aggregate([
        { $match: { isActive: true, role: 'USER' } },
        {
          $lookup: {
            from: 'drivingsessions',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$userId', '$$userId'] },
                  status: 'COMPLETED',
                  startTime: { $gte: startDate },
                },
              },
            ],
            as: 'sessions',
          },
        },
        {
          $addFields: {
            avgSafetyScore: {
              $cond: [
                { $gt: [{ $size: '$sessions' }, 0] },
                { $avg: '$sessions.safetyScore' },
                85,
              ],
            },
          },
        },
        { $sort: { avgSafetyScore: -1, totalPoints: -1 } },
      ]);

      userRank = allUsers.findIndex((u) => u._id.toString() === req.userId.toString()) + 1;
    }

    return successResponse(res, 'Leaderboard fetched', {
      leaderboard: users.map((u, i) => ({
        rank: (parseInt(page) - 1) * parseInt(limit) + i + 1,
        user: {
          id: u._id,
          name: u.name,
          profileImage: u.profileImage,
        },
        safetyScore: Math.round(u.avgSafetyScore || u.safetyScore),
        points: u.totalPoints,
        safeTrips: u.periodSafeTrips || u.safeTrips,
      })),
      userRank,
      period,
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch leaderboard', error);
  }
};

module.exports = {
  getLeaderboard,
};