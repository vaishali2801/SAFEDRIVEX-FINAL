const User = require('../models/User');
const SafetyScore = require('../models/SafetyScore');
const scoringService = require('../services/scoringService');
const { successResponse, errorResponse } = require('../utils/response');
const { getScoreGrade } = require('../utils/calculations');

const getSafetyScore = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('safetyScore totalPoints');
    if (!user) return errorResponse(res, 'User not found', null, 404);

    return successResponse(res, 'Safety score fetched', {
      safetyScore: user.safetyScore,
      totalPoints: user.totalPoints,
      grade: getScoreGrade(user.safetyScore),
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch safety score', error);
  }
};

const getSafetyScoreHistory = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const history = await scoringService.getSafetyScoreHistory(req.userId, parseInt(limit));
    return successResponse(res, 'Safety score history fetched', history);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch history', error);
  }
};

const getScoreBreakdown = async (req, res) => {
  try {
    const history = await SafetyScore.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(100);

    const breakdown = {
      helmet: 0,
      seatbelt: 0,
      speed: 0,
      phone: 0,
      smoothDriving: 0,
      braking: 0,
      signals: 0,
      distance: 0,
      dailyChallenge: 0,
      weeklyChallenge: 0,
      violations: {},
    };

    history.forEach((record) => {
      if (record.change > 0) {
        switch (record.reason) {
          case 'HELMET_COMPLIANCE':
            breakdown.helmet += record.change;
            break;
          case 'SEATBELT_COMPLIANCE':
            breakdown.seatbelt += record.change;
            break;
          case 'SPEED_COMPLIANCE':
            breakdown.speed += record.change;
            break;
          case 'NO_PHONE_USAGE':
            breakdown.phone += record.change;
            break;
          case 'SMOOTH_DRIVING':
            breakdown.smoothDriving += record.change;
            break;
          case 'SAFE_BRAKING':
            breakdown.braking += record.change;
            break;
          case 'TRAFFIC_SIGNAL_COMPLIANCE':
            breakdown.signals += record.change;
            break;
          case 'SAFE_DISTANCE':
            breakdown.distance += record.change;
            break;
          case 'DAILY_CHALLENGE':
            breakdown.dailyChallenge += record.change;
            break;
          case 'WEEKLY_SAFE_DRIVER':
            breakdown.weeklyChallenge += record.change;
            break;
        }
      } else {
        breakdown.violations[record.reason] = (breakdown.violations[record.reason] || 0) + Math.abs(record.change);
      }
    });

    return successResponse(res, 'Score breakdown fetched', breakdown);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch breakdown', error);
  }
};

module.exports = {
  getSafetyScore,
  getSafetyScoreHistory,
  getScoreBreakdown,
};