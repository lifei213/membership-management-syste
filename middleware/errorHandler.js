/**
 * 全局错误处理中间件
 * @param {Error} err - 错误对象
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express next函数
 */
function errorHandler(err, req, res, next) {
  // 记录错误到日志
  console.error('发生错误:', err);

  // 处理验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: '数据验证失败',
      errors: Object.values(err.errors).map(el => el.message)
    });
  }

  // 处理数据库唯一约束错误
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      message: '数据库约束冲突',
      errors: err.errors.map(el => el.message)
    });
  }

  // 处理JWT错误
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: '无效或过期的令牌',
      error: err.message
    });
  }

  // 处理404错误
  if (err.status === 404) {
    return res.status(404).json({
      message: '请求的资源不存在',
      error: err.message || '未找到资源'
    });
  }

  // 处理403错误
  if (err.status === 403) {
    return res.status(403).json({
      message: '权限不足',
      error: err.message || '没有足够的权限执行此操作'
    });
  }

  // 处理401错误
  if (err.status === 401) {
    return res.status(401).json({
      message: '未授权',
      error: err.message || '请先登录'
    });
  }

  // 默认处理500错误
  return res.status(500).json({
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'production' ? '请联系管理员' : err.message
  });
}

module.exports = errorHandler;