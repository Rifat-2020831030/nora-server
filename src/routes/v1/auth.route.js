const express = require('express');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/logout', auth(), validate(authValidation.logout), authController.logout);
router.post('/logout-all', auth(), authController.logoutAll);
router.post('/refresh', validate(authValidation.refreshTokens), authController.refreshTokens);
router.put('/change-password', auth(), validate(authValidation.changePassword), authController.changePassword);

module.exports = router;
