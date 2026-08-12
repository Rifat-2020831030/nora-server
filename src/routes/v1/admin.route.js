const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const adminValidation = require('../../validations/admin.validation');
const adminController = require('../../controllers/admin.controller');

const router = express.Router();

// Apply auth('manageUsers') to all admin routes
router.use(auth('manageUsers'));

router.route('/users').get(validate(adminValidation.getUsers), adminController.getUsers);

router
  .route('/users/:userId')
  .patch(validate(adminValidation.updateUser), adminController.updateUser)
  .delete(validate(adminValidation.deleteUser), adminController.deleteUser);

router.post('/users/:userId/restore', validate(adminValidation.restoreUser), adminController.restoreUser);

// Global content views
router.get('/notes', validate(adminValidation.getGlobalNotes), adminController.getGlobalNotes);
router.get('/posts', validate(adminValidation.getGlobalPosts), adminController.getGlobalPosts);
router.patch('/posts/:id/restore', validate(adminValidation.restorePost), adminController.restorePost);

// Analytics
router.get('/analytics/interests', adminController.getInterestsAnalytics);
router.get('/analytics/user-growth', validate(adminValidation.getUserGrowthAnalytics), adminController.getGrowthAnalytics);
router.get(
  '/analytics/user-posts/:userId',
  validate(adminValidation.getUserPostsAnalytics),
  adminController.getUserPostsAnalytics
);
router.get(
  '/analytics/note-counts',
  validate(adminValidation.getNoteCountsAnalytics),
  adminController.getNoteCountsAnalytics
);

module.exports = router;
