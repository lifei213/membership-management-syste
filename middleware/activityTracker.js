/**
 * 用户活跃状态跟踪中间件
 * 用于记录用户的最后活跃时间
 */
async function trackUserActivity(req, res, next) {
  try {
    // 检查用户是否已认证且有用户ID
    if (req.user && req.user.user_id && req.supabase) {
      // 更新用户的最后活跃时间
      await req.supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('user_id', req.user.user_id);
    }
    
    // 继续处理请求
    next();
  } catch (error) {
    console.error('更新用户活跃状态失败:', error);
    // 即使更新失败，也继续处理请求
    next();
  }
}

module.exports = trackUserActivity;