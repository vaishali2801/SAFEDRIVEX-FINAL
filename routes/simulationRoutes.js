const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');
const { protect } = require('../middleware/authMiddleware');
const { simulationValidation, demoValidation } = require('../middleware/validationMiddleware');
const { simulationLimiter, demoLimiter } = require('../middleware/rateLimitMiddleware');
router.use(protect);
router.use(simulationLimiter);

router.post('/start', simulationValidation, simulationController.startSimulation);
router.post('/stop', simulationController.stopSimulation);
router.post('/safe', simulationController.simulateSafe);
router.post('/warning', simulationController.simulateWarning);
router.post('/violation', simulationValidation, simulationController.simulateViolation);
router.post('/emergency', simulationController.simulateEmergency);

router.use(demoLimiter);
router.post('/demo/start', simulationController.startDemo);
router.post('/demo/next', simulationController.nextDemoStage);
router.post('/demo/reset', simulationController.resetDemo);

module.exports = router;