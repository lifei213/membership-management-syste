const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const authController = require('../controllers/authController');

console.log('注册认证相关路由');

// 用户注册
router.post('/register', [
  // 验证输入
  body('username').notEmpty().withMessage('用户名不能为空').isLength({ min: 3, max: 50 }).withMessage('用户名长度必须在3-50个字符之间'),
  body('email').isEmail().withMessage('请输入有效的邮箱地址').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('密码长度不能少于6个字符')
], authController.register);

// 用户登录
router.post('/login', [
  body('username').notEmpty().withMessage('用户名或邮箱不能为空'),
  body('password').notEmpty().withMessage('密码不能为空')
], authController.login);



// 获取当前用户信息
router.get('/me', authenticateToken, authController.getCurrentUser);

// 修改密码（需要认证）
router.post('/change-password', authenticateToken, [
  body('oldPassword').notEmpty().withMessage('旧密码不能为空'),
  body('newPassword').isLength({ min: 6 }).withMessage('新密码长度不能少于6个字符'),
  body('confirmPassword').notEmpty().withMessage('确认密码不能为空')
], authController.changePassword);

// 创建管理员账号（需要管理员权限）
router.post('/create-admin', authenticateToken, authorizeAdmin, [
  body('username').notEmpty().withMessage('用户名不能为空').isLength({ min: 3, max: 50 }).withMessage('用户名长度必须在3-50个字符之间'),
  body('email').isEmail().withMessage('请输入有效的邮箱地址').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('密码长度不能少于6个字符')
], authController.createAdmin);

// 需要管理员权限的路由
router.get('/users', authenticateToken, authorizeAdmin, authController.getUsers); // 获取所有用户
router.put('/users/:id', authenticateToken, authorizeAdmin, authController.updateUser); // 更新用户信息
router.delete('/users/:id', authenticateToken, authorizeAdmin, authController.deleteUser); // 删除用户

// 添加路由错误处理中间件
router.use((err, req, res, next) => {
  console.error('认证路由错误:', err);
  res.status(err.status || 500).json({
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

module.exports = router;