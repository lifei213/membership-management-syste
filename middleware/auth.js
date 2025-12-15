const { verifyToken } = require('../utils/jwtUtils');

/**
 * 用户身份验证中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
function authenticateToken(req, res, next) {
  try {
    console.log('开始JWT认证');
    
    // 从请求头获取令牌
    const authHeader = req.headers.authorization;
    console.log('Authorization头:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1]; // Bearer Token

    if (!token) {
      console.log('未提供认证令牌');
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    // 验证令牌
    const decoded = verifyToken(token);
    req.user = decoded; // 将用户信息存储在请求对象中，供后续处理程序使用
    console.log('JWT认证成功，用户:', decoded.username || '未知用户');
    
    // 更新用户最后活跃时间
    if (req.supabase) {
      req.supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('user_id', decoded.user_id)
        .then(() => {
          console.log('用户最后活跃时间已更新:', decoded.user_id);
        })
        .catch(err => {
          console.error('更新用户活跃时间失败:', err.message);
          // 即使更新失败，也不影响主流程
        });
    } else {
      console.warn('未找到Supabase客户端实例，无法更新用户活跃时间');
    }
    
    next();
  } catch (error) {
    console.error('JWT验证失败:', error.message);
    return res.status(403).json({ message: '无效的认证令牌' });
  }
}

/**
 * 管理员权限验证中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
function authorizeAdmin(req, res, next) {
  try {
    console.log('验证管理员权限');
    
    // 确保用户已通过认证
    if (!req.user) {
      console.error('未认证，无法验证管理员权限');
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    // 检查用户角色是否为管理员
    if (req.user.role !== 'admin') {
      console.log('权限不足，用户角色:', req.user.role);
      return res.status(403).json({ message: '需要管理员权限' });
    }

    console.log('管理员权限验证通过');
    next();
  } catch (error) {
    console.error('权限验证过程发生错误:', error);
    return res.status(500).json({ message: '权限验证过程发生错误', error: error.message });
  }
}

/**
 * 会员权限验证中间件（允许会员和管理员访问）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
function authorizeMember(req, res, next) {
  try {
    console.log('验证会员权限');
    
    // 确保用户已通过认证
    if (!req.user) {
      console.error('未认证，无法验证会员权限');
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    // 检查用户角色是否为会员或管理员
    if (req.user.role !== 'member' && req.user.role !== 'admin') {
      console.log('权限不足，用户角色:', req.user.role);
      return res.status(403).json({ message: '需要会员权限' });
    }

    console.log('会员权限验证通过');
    next();
  } catch (error) {
    console.error('权限验证过程发生错误:', error);
    return res.status(500).json({ message: '权限验证过程发生错误', error: error.message });
  }
}

module.exports = {
  authenticateToken,
  authorizeAdmin,
  authorizeMember
};