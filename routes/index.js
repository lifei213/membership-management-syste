const express = require('express');
const router = express.Router();

// 导入各模块路由
const authRoutes = require('./authRoutes');
const memberRoutes = require('./memberRoutes');
const feeRoutes = require('./feeRoutes');
const applicationRoutes = require('./applicationRoutes');
const aiRoutes = require('./aiRoutes');

// 使用路由模块
router.use('/auth', authRoutes);
router.use('/members', memberRoutes);
router.use('/fees', feeRoutes);
router.use('/applications', applicationRoutes);
router.use('/ai', aiRoutes);

module.exports = router;