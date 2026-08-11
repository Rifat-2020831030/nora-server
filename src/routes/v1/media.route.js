const express = require('express');
const auth = require('../../middlewares/auth');
const upload = require('../../middlewares/upload');
const mediaController = require('../../controllers/media.controller');

const router = express.Router();

router.post('/upload', auth(), upload.single('file'), mediaController.uploadFile);

module.exports = router;
