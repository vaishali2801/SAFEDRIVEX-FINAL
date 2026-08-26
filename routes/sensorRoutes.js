const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');
const { protect } = require('../middleware/authMiddleware');
const { sensorDataValidation, paginationValidation } = require('../middleware/validationMiddleware');
const { sensorLimiter, apiLimiter } = require('../middleware/rateLimitMiddleware');

router.use(apiLimiter);

router.post('/data', sensorLimiter, sensorDataValidation, sensorController.receiveSensorData);

router.use(protect);

router.get('/', paginationValidation, sensorController.getSensors);
router.get('/device/:deviceId', sensorController.getSensorByDeviceId);
router.get('/device/:deviceId/status', sensorController.getDeviceStatus);
router.post('/device/register', sensorController.registerDevice);
router.get('/devices', sensorController.getUserDevices);
router.patch('/device/:deviceId/sensor/:sensorType', sensorController.updateSensorStatus);

module.exports = router;