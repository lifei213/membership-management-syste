const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// AI聊天接口
router.post('/chat', aiController.chat);

module.exports = router;