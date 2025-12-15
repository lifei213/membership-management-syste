const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const applicationController = require('../controllers/applicationController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

console.log('注册申请管理相关路由');

// 提交入会申请（无需登录）
router.post('/submit', [
  body('applicant_name').notEmpty().withMessage('申请人姓名不能为空'),
  body('applicant_email').notEmpty().isEmail().withMessage('申请人邮箱不能为空且必须是有效的邮箱地址'),
  body('applicant_phone').notEmpty().withMessage('申请人电话不能为空'),
  body('work_unit').notEmpty().withMessage('工作单位不能为空'),
  body('application_reason').notEmpty().withMessage('申请理由不能为空')
], applicationController.submitApplication);

// 管理员获取所有申请列表
router.get('/all', authenticateToken, authorizeAdmin, applicationController.getAllApplications);

// 管理员获取特定申请详情
router.get('/:application_id', authenticateToken, authorizeAdmin, applicationController.getApplicationById);

// 管理员审核申请
router.put('/:application_id/review', authenticateToken, authorizeAdmin, [
  body('status').notEmpty().isIn(['审核通过', '审核不通过']).withMessage('审核状态必须为"审核通过"或"审核不通过"'),
  body('review_notes').optional()
], applicationController.reviewApplication);

// 管理员获取待审核申请数量
router.get('/count/pending', authenticateToken, authorizeAdmin, applicationController.getPendingApplicationsCount);

// 管理员删除申请
router.delete('/:application_id', authenticateToken, authorizeAdmin, applicationController.deleteApplication);

// 添加路由错误处理中间件
router.use((err, req, res, next) => {
  console.error('申请管理路由错误:', err);
  res.status(err.status || 500).json({
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

module.exports = router;