const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const feeController = require('../controllers/feeController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

console.log('注册会费管理相关路由');

// 获取当前会员的缴费记录
router.get('/my-records', authenticateToken, [
  // 添加分页参数验证
  body('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0'),
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
], feeController.getMyFeeRecords);

// 获取当前会员的会籍状态
router.get('/my-status', authenticateToken, feeController.getMyMembershipStatus);

// 管理员添加缴费记录
router.post('/add', authenticateToken, authorizeAdmin, [
  body('member_id').notEmpty().isInt().withMessage('会员ID不能为空'),
  body('amount').notEmpty().isFloat({ gt: 0 }).withMessage('缴费金额必须大于0'),
  body('payment_date').notEmpty().isDate().withMessage('缴费日期不能为空'),
  body('valid_from').notEmpty().isDate().withMessage('有效期开始不能为空'),
  body('valid_until').notEmpty().isDate().withMessage('有效期截止不能为空'),
  body('payment_method').optional().isIn(['线上支付', '银行转账', '现金']).withMessage('无效的支付方式')
], feeController.addFeeRecord);

// 管理员获取所有缴费记录
router.get('/all', authenticateToken, authorizeAdmin, [
  // 添加分页参数验证
  body('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0'),
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
], feeController.getAllFeeRecords);

// 管理员获取特定会员的缴费记录
router.get('/member/:member_id', authenticateToken, authorizeAdmin, [
  // 添加分页参数验证
  body('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0'),
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
], feeController.getMemberFeeRecords);

// 管理员更新缴费记录
router.put('/:fee_id', authenticateToken, authorizeAdmin, [
  body('amount').optional().isFloat({ gt: 0 }).withMessage('缴费金额必须大于0'),
  body('payment_date').optional().isDate().withMessage('缴费日期格式无效'),
  body('valid_from').optional().isDate().withMessage('有效期开始格式无效'),
  body('valid_until').optional().isDate().withMessage('有效期截止格式无效'),
  body('payment_method').optional().isIn(['线上支付', '银行转账', '现金']).withMessage('无效的支付方式'),
  body('payment_status').optional().isIn(['待支付', '已支付', '已退款']).withMessage('无效的支付状态')
], feeController.updateFeeRecord);

// 添加路由错误处理中间件
router.use((err, req, res, next) => {
  console.error('会费管理路由错误:', err);
  res.status(err.status || 500).json({
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

module.exports = router;