const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { profileUpdateValidation, passwordChangeValidation } = require('../middleware/validationMiddleware');

router.use(protect);

router.get('/profile', userController.getProfile);
router.patch('/profile', profileUpdateValidation, userController.updateProfile);
router.patch('/password', passwordChangeValidation, userController.changePassword);
router.get('/stats', userController.getStats);

router.get('/vehicles', userController.getVehicles);
router.post('/vehicles', userController.addVehicle);
router.patch('/vehicles/primary', userController.setPrimaryVehicle);

module.exports = router;