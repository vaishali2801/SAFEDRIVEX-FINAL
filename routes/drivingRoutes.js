const express = require('express');
const router = express.Router();
const drivingController = require('../controllers/drivingController');
const { protect } = require('../middleware/authMiddleware');
const { startDrivingValidation, endDrivingValidation, paginationValidation, dateRangeValidation } = require('../middleware/validationMiddleware');
const { apiLimiter } = require('../middleware/rateLimitMiddleware');

router.use(protect);
router.use(apiLimiter);

router.post('/start', startDrivingValidation, drivingController.startSession);
router.get('/active', drivingController.getActiveSession);
router.post('/end', endDrivingValidation, drivingController.endSession);
router.get('/history', paginationValidation, dateRangeValidation, drivingController.getHistory);
router.get('/stats', drivingController.getStats);
router.get('/:id', drivingController.getSessionById);
router.patch('/:id', drivingController.updateSession);
router.get('/sensors/status', drivingController.getSensorStatus);

module.exports = router;