const {
  VIOLATION_PENALTIES,
  SAFE_BEHAVIOR_REWARDS,
  MIN_SAFETY_SCORE,
  MAX_SAFETY_SCORE,
  INITIAL_SAFETY_SCORE,
} = require('./constants');

const calculateSafetyScore = (currentScore, reason, isViolation = false) => {
  let change = 0;

  if (isViolation) {
    const penalty = VIOLATION_PENALTIES[reason];
    if (penalty) {
      change = -penalty.score;
    }
  } else {
    const reward = SAFE_BEHAVIOR_REWARDS[reason];
    if (reward) {
      change = reward.score;
    }
  }

  const newScore = Math.max(MIN_SAFETY_SCORE, Math.min(MAX_SAFETY_SCORE, currentScore + change));
  return {
    newScore,
    change: newScore - currentScore,
  };
};

const calculatePoints = (currentPoints, reason, isViolation = false) => {
  let change = 0;

  if (isViolation) {
    const penalty = VIOLATION_PENALTIES[reason];
    if (penalty) {
      change = -penalty.points;
    }
  } else {
    const reward = SAFE_BEHAVIOR_REWARDS[reason];
    if (reward) {
      change = reward.points;
    }
  }

  const newPoints = Math.max(0, currentPoints + change);
  return {
    newPoints,
    change: newPoints - currentPoints,
  };
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value) => {
  return (value * Math.PI) / 180;
};

const calculateAverageSpeed = (distanceKm, durationMinutes) => {
  if (durationMinutes <= 0) return 0;
  return (distanceKm / durationMinutes) * 60;
};

const generateRedemptionCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'SDX-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const calculateWeeklyScore = (sessions) => {
  if (!sessions || sessions.length === 0) return INITIAL_SAFETY_SCORE;
  const totalScore = sessions.reduce((sum, s) => sum + (s.safetyScore || INITIAL_SAFETY_SCORE), 0);
  return Math.round(totalScore / sessions.length);
};

const getScoreGrade = (score) => {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'F';
};

const calculateTripStats = (sessions) => {
  const completed = sessions.filter((s) => s.status === 'COMPLETED');
  const totalTrips = completed.length;
  const safeTrips = completed.filter((s) => s.safetyScore >= 70).length;
  const totalDistance = completed.reduce((sum, s) => sum + (s.distance || 0), 0);
  const averageScore = totalTrips > 0 ? calculateWeeklyScore(completed) : INITIAL_SAFETY_SCORE;
  const averageSpeed =
    totalTrips > 0
      ? completed.reduce((sum, s) => sum + (s.averageSpeed || 0), 0) / totalTrips
      : 0;
  const violations = completed.reduce(
    (sum, s) => sum + (s.violations ? s.violations.length : 0),
    0
  );

  return {
    totalTrips,
    safeTrips,
    totalDistance: Math.round(totalDistance * 100) / 100,
    averageScore,
    averageSpeed: Math.round(averageSpeed * 10) / 10,
    violations,
  };
};

module.exports = {
  calculateSafetyScore,
  calculatePoints,
  calculateDistance,
  calculateAverageSpeed,
  generateRedemptionCode,
  calculateWeeklyScore,
  getScoreGrade,
  calculateTripStats,
};