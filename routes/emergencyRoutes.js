const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');
const { protect } = require('../middleware/authMiddleware');
const { emergencyValidation, paginationValidation } = require('../middleware/validationMiddleware');
const { emergencyLimiter } = require('../middleware/rateLimitMiddleware');

router.use(protect);
router.use(emergencyLimiter);

router.post('/sos', emergencyValidation, emergencyController.triggerSOS);
router.get('/history', paginationValidation, emergencyController.getEmergencyHistory);
router.get('/:id', emergencyController.getEmergencyById);

module.exports = router;