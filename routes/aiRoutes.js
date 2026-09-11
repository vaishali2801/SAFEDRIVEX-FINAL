const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const {protect}  = require('../middleware/authMiddleware');
const { aiDetectionValidation } = require('../middleware/validationMiddleware');
const { aiLimiter } = require('../middleware/rateLimitMiddleware');

router.use(protect);
router.use(aiLimiter);

router.post('/helmet', aiDetectionValidation, aiController.helmetDetection);
router.post('/phone', aiDetectionValidation, aiController.phoneDetection);
router.post('/seatbelt', aiDetectionValidation, aiController.seatbeltDetection);
router.post('/drowsiness', aiDetectionValidation, aiController.drowsinessDetection);
router.post('/lane', aiDetectionValidation, aiController.laneDetection);
router.post('/driving-behaviour', aiController.drivingBehaviour);
router.get('/endpoints', aiController.getAIEndpoints);

module.exports = router;