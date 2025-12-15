const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
// 导入控制器
const memberController = require('../controllers/memberController');
const messageController = require('../controllers/messageController');
const { authenticateToken, authorizeAdmin, authorizeMember } = require('../middleware/auth');

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  },
  fileFilter: function (req, file, cb) {
    // 允许的文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});


// 添加导出会员数据路由
router.get('/export/excel', authenticateToken, authorizeAdmin, memberController.exportMembersToExcel);

console.log('注册会员相关路由');

// 创建会员信息（普通会员）
router.post('/profile', authenticateToken, [
  body('full_name').notEmpty().withMessage('真实姓名不能为空'),
  body('phone').notEmpty().withMessage('联系电话不能为空')
], memberController.createMemberProfile);

// 获取当前会员信息
router.get('/profile', authenticateToken, memberController.getMyProfile);

// 更新当前会员信息
router.put('/profile', authenticateToken, [
  body('full_name').optional().notEmpty().withMessage('真实姓名不能为空')
], memberController.updateMyProfile);

// 管理员获取所有会员列表
router.get('/all', authenticateToken, authorizeAdmin, [
  // 添加分页参数验证
  body('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0'),
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
], memberController.getAllMembers);

// 会员消息管理路由（会员查看自己的消息）
router.get('/messages', authenticateToken, memberController.getMemberMessages);
router.get('/messages/:messageId', authenticateToken, memberController.getMessageById);
router.get('/messages/unread/count', authenticateToken, memberController.getUnreadMessagesCount);
router.post('/message-to-admin', authenticateToken, upload.single('file'), memberController.sendMessageToAdmin);

// 管理员获取特定会员信息
router.get('/:member_id', authenticateToken, authorizeAdmin, memberController.getMemberById);

// 管理员更新会员信息
router.put('/:member_id', authenticateToken, authorizeAdmin, [
  body('full_name').optional().notEmpty().withMessage('真实姓名不能为空'),
  body('membership_status').optional().isIn(['正常', '欠费', '冻结', '退会']).withMessage('无效的会籍状态'),
  body('membership_level').optional().custom((value) => {
    // 允许null、空字符串或有效的ENUM值
    if (value === null || value === '' || ['理事', '秘书长', '副理事长', '理事长'].includes(value)) {
      return true;
    }
    throw new Error('无效的会员等级');
  }).withMessage('无效的会员等级')
], memberController.updateMemberById);

// 管理员删除会员
router.delete('/:member_id', authenticateToken, authorizeAdmin, memberController.deleteMemberById);

// 管理员发送消息给会员
router.post('/:member_id/message', authenticateToken, authorizeAdmin, upload.single('file'), memberController.sendMemberMessage);

// 管理员消息管理路由
router.get('/admin/messages', authenticateToken, authorizeAdmin, messageController.getAdminMessages);
router.get('/admin/messages/:messageId', authenticateToken, authorizeAdmin, messageController.getAdminMessageById);
router.put('/admin/messages/:messageId/read', authenticateToken, authorizeAdmin, messageController.markMessageAsRead);

// 添加路由错误处理中间件
router.use((err, req, res, next) => {
  console.error('会员路由错误:', err);
  res.status(err.status || 500).json({
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

module.exports = router;
