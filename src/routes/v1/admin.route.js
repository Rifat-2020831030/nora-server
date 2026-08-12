const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const adminValidation = require('../../validations/admin.validation');
const adminController = require('../../controllers/admin.controller');

const router = express.Router();

// Apply auth('manageUsers') to all admin routes
router.use(auth('manageUsers'));

router
  .route('/users')
  .get(validate(adminValidation.getUsers), adminController.getUsers);

router
  .route('/users/:userId')
  .patch(validate(adminValidation.updateUser), adminController.updateUser)
  .delete(validate(adminValidation.deleteUser), adminController.deleteUser);

// Global content views
router.get('/notes', adminController.getGlobalNotes);
router.get('/posts', adminController.getGlobalPosts);

// Analytics
router.get('/analytics/interests', adminController.getInterestsAnalytics);
router.get('/analytics/growth', adminController.getGrowthAnalytics);
router.get('/analytics/user-posts/:userId', validate(adminValidation.getUserPostsAnalytics), adminController.getUserPostsAnalytics);

module.exports = router;
