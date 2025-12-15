const { validationResult } = require('express-validator');
const {
  sendApplicationConfirmation,
  sendApplicationResult
} = require('../utils/emailUtils');

console.log('申请管理控制器已加载');

/**
 * 提交入会申请
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function submitApplication(req, res) {
  try {
    console.log('收到入会申请提交请求:', { method: req.method, url: req.originalUrl });
    
    // 验证请求体是否存在
    if (!req.body || typeof req.body !== 'object') {
      console.error('提交入会申请失败: 请求体为空或无效');
      return res.status(400).json({ message: '请求体为空或格式无效' });
    }

    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('申请数据验证失败:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const applicationData = req.body;
    console.log('处理申请数据:', { applicant_name: applicationData.applicant_name, applicant_email: applicationData.applicant_email });

    // 创建新申请
    console.log('开始创建申请记录');
    const { data: newApplication, error: createError } = await req.supabase
      .from('applications')
      .insert(applicationData)
      .select()
      .single();
    
    if (createError) {
      console.error('创建申请记录失败:', createError);
      throw createError;
    }
    
    console.log('申请记录创建成功:', { application_id: newApplication.application_id });

    // 发送申请确认邮件
    try {
      console.log('准备发送申请确认邮件:', applicationData.applicant_email);
      await sendApplicationConfirmation(
        applicationData.applicant_email,
        applicationData.applicant_name
      );
      console.log('申请确认邮件发送成功:', applicationData.applicant_email);
    } catch (emailError) {
      console.error('发送确认邮件失败，但申请已成功提交:', emailError);
      // 即使邮件发送失败，申请也已经成功提交，只记录错误而不中断流程
    }

    return res.status(201).json({
      message: '入会申请已提交成功，我们将尽快审核',
      application: newApplication
    });
  } catch (error) {
    console.error('提交入会申请失败:', error);
    console.error('错误详情:', { message: error.message, stack: error.stack });
    return res.status(500).json({ message: '服务器内部错误', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
}

/**
 * 管理员获取所有申请列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getAllApplications(req, res) {
  try {
    console.log('收到获取申请列表请求:', { method: req.method, url: req.originalUrl, user: req.user?.username || 'unknown' });
    
    // 验证管理员认证信息
    if (!req.user || !req.user.is_admin) {
      console.error('非管理员尝试访问申请列表');
      return res.status(403).json({ message: '权限不足，需要管理员权限' });
    }

    // 获取分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    console.log('分页参数:', { page, limit, offset });
    
    // 获取查询条件
    const filters = {};
    if (req.query.status) {
      filters.status = req.query.status;
      console.log('应用状态筛选:', req.query.status);
    }

    // 查询申请列表
    console.log('开始查询申请列表');
    
    // 构建查询条件
    let query = req.supabase
      .from('applications')
      .select('*, users:processed_by(username, email)', { count: 'exact' });
    
    // 应用筛选条件
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    // 执行查询
    const { data: applications, error: queryError, count } = await query
      .order('application_date', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (queryError) {
      console.error('查询申请列表失败:', queryError);
      throw queryError;
    }
    
    console.log('申请列表查询完成:', { total: count, current_page: page, applications_found: applications.length });

    return res.json({
      total: count,
      pages: Math.ceil(count / limit),
      current_page: page,
      applications
    });
  } catch (error) {
    console.error('获取申请列表失败:', error);
    console.error('错误详情:', { message: error.message, stack: error.stack });
    return res.status(500).json({ message: '服务器内部错误', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
}

/**
 * 管理员获取申请详情
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getApplicationById(req, res) {
  try {
    console.log('收到获取申请详情请求:', { method: req.method, url: req.originalUrl, user: req.user?.username || 'unknown' });
    
    // 验证管理员认证信息
    if (!req.user || !req.user.is_admin) {
      console.error('非管理员尝试访问申请详情');
      return res.status(403).json({ message: '权限不足，需要管理员权限' });
    }

    const { application_id } = req.params;
    
    // 验证参数
    if (!application_id || isNaN(application_id)) {
      console.error('无效的申请ID参数:', application_id);
      return res.status(400).json({ message: '无效的申请ID' });
    }
    
    console.log('查询申请ID:', application_id);

    // 查询申请详情
    console.log('开始查询申请详情');
    const { data: application, error: queryError } = await req.supabase
      .from('applications')
      .select('*, users:processed_by(username, email)')
      .eq('application_id', application_id)
      .single();

    if (queryError) {
      console.error('查询申请详情失败:', queryError);
      if (queryError.code === 'PGRST116') {
        console.log('申请记录不存在:', application_id);
        return res.status(404).json({ message: '申请记录不存在' });
      }
      throw queryError;
    }

    if (!application) {
      console.log('申请记录不存在:', application_id);
      return res.status(404).json({ message: '申请记录不存在' });
    }
    
    console.log('申请详情查询成功:', { application_id: application.application_id, status: application.status });

    return res.json({ application });
  } catch (error) {
    console.error('获取申请详情失败:', error);
    console.error('错误详情:', { message: error.message, stack: error.stack });
    return res.status(500).json({ message: '服务器内部错误', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
}

/**
 * 管理员审核申请
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function reviewApplication(req, res) {
  try {
    console.log('收到申请审核请求:', { method: req.method, url: req.originalUrl, user: req.user?.username || 'unknown' });
    
    // 验证管理员认证信息
    if (!req.user || !req.user.is_admin) {
      console.error('非管理员尝试审核申请');
      return res.status(403).json({ message: '权限不足，需要管理员权限' });
    }
    
    // 验证请求体是否存在
    if (!req.body || typeof req.body !== 'object') {
      console.error('审核申请失败: 请求体为空或无效');
      return res.status(400).json({ message: '请求体为空或格式无效' });
    }

    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('审核数据验证失败:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { application_id } = req.params;
    const { status, review_notes } = req.body;
    const { user_id, username } = req.user;
    
    // 验证参数
    if (!application_id || isNaN(application_id)) {
      console.error('无效的申请ID参数:', application_id);
      return res.status(400).json({ message: '无效的申请ID' });
    }

    // 检查状态是否有效
    if (!['审核通过', '审核不通过'].includes(status)) {
      console.error('无效的审核状态:', status);
      return res.status(400).json({ message: '无效的审核状态' });
    }
    
    console.log('开始审核申请:', { application_id, status, reviewed_by: username });

    // 查询申请
    console.log('查询申请记录');
    const { data: application, error: queryError } = await req.supabase
      .from('applications')
      .select('*')
      .eq('application_id', application_id)
      .single();
    
    if (queryError) {
      console.error('查询申请记录失败:', queryError);
      if (queryError.code === 'PGRST116') {
        console.log('申请记录不存在:', application_id);
        return res.status(404).json({ message: '申请记录不存在' });
      }
      throw queryError;
    }

    if (!application) {
      console.log('申请记录不存在:', application_id);
      return res.status(404).json({ message: '申请记录不存在' });
    }

    // 检查申请是否已经被处理
    if (application.status !== '待审核') {
      console.log('申请已被处理:', { application_id, current_status: application.status });
      return res.status(400).json({ message: '该申请已经被处理' });
    }

    // 更新申请状态
    console.log('更新申请状态');
    const { data: updatedApplication, error: updateError } = await req.supabase
      .from('applications')
      .update({
        status,
        processed_by: user_id,
        processed_date: new Date(),
        review_notes
      })
      .eq('application_id', application_id)
      .select()
      .single();
    
    if (updateError) {
      console.error('更新申请状态失败:', updateError);
      throw updateError;
    }
    
    console.log('申请状态更新成功:', { application_id, new_status: status });

    // 发送审核结果邮件
    try {
      console.log('准备发送审核结果邮件:', application.applicant_email);
      const isApproved = status === '审核通过';
      await sendApplicationResult(
        application.applicant_email,
        application.applicant_name,
        isApproved,
        review_notes
      );
      console.log('审核结果邮件发送成功:', application.applicant_email);
    } catch (emailError) {
      console.error('发送审核结果邮件失败，但审核已成功完成:', emailError);
      // 即使邮件发送失败，审核也已经成功完成，只记录错误而不中断流程
    }

    return res.json({
      message: '申请审核成功',
      application
    });
  } catch (error) {
    console.error('审核申请失败:', error);
    console.error('错误详情:', { message: error.message, stack: error.stack });
    return res.status(500).json({ message: '服务器内部错误', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
}

/**
 * 管理员获取待审核申请数量
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getPendingApplicationsCount(req, res) {
  try {
    console.log('收到获取待审核申请数量请求:', { method: req.method, url: req.originalUrl, user: req.user?.username || 'unknown' });
    
    // 验证管理员认证信息
    if (!req.user || !req.user.is_admin) {
      console.error('非管理员尝试获取待审核申请数量');
      return res.status(403).json({ message: '权限不足，需要管理员权限' });
    }

    // 计算待审核申请数量
    console.log('开始计算待审核申请数量');
    const { count: pendingCount, error: countError } = await req.supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', '待审核');
    
    if (countError) {
      console.error('计算待审核申请数量失败:', countError);
      throw countError;
    }
    
    console.log('待审核申请数量查询完成:', { count: pendingCount });

    return res.json({ pending_count: pendingCount });
  } catch (error) {
    console.error('获取待审核申请数量失败:', error);
    console.error('错误详情:', { message: error.message, stack: error.stack });
    return res.status(500).json({ message: '服务器内部错误', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
}

/**
 * 管理员删除申请（通常用于错误提交的申请）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function deleteApplication(req, res) {
  try {
    console.log('收到删除申请请求:', { method: req.method, url: req.originalUrl, user: req.user?.username || 'unknown' });
    
    // 验证管理员认证信息
    if (!req.user || !req.user.is_admin) {
      console.error('非管理员尝试删除申请');
      return res.status(403).json({ message: '权限不足，需要管理员权限' });
    }

    const { application_id } = req.params;
    
    // 验证参数
    if (!application_id || isNaN(application_id)) {
      console.error('无效的申请ID参数:', application_id);
      return res.status(400).json({ message: '无效的申请ID' });
    }
    
    console.log('删除申请ID:', application_id);

    // 查找申请
    console.log('开始查找申请记录');
    const { data: application, error: queryError } = await req.supabase
      .from('applications')
      .select('*')
      .eq('application_id', application_id)
      .single();
    
    if (queryError) {
      console.error('查找申请记录失败:', queryError);
      if (queryError.code === 'PGRST116') {
        console.log('申请记录不存在:', application_id);
        return res.status(404).json({ message: '申请记录不存在' });
      }
      throw queryError;
    }
    
    if (!application) {
      console.log('申请记录不存在:', application_id);
      return res.status(404).json({ message: '申请记录不存在' });
    }
    
    console.log('找到申请记录:', { application_id, applicant_name: application.applicant_name });

    // 删除申请
    console.log('开始删除申请记录');
    const { error: deleteError } = await req.supabase
      .from('applications')
      .delete()
      .eq('application_id', application_id);
    
    if (deleteError) {
      console.error('删除申请记录失败:', deleteError);
      throw deleteError;
    }
    
    console.log('申请记录删除成功:', application_id);

    return res.json({ message: '申请记录已删除' });
  } catch (error) {
    console.error('删除申请失败:', error);
    console.error('错误详情:', { message: error.message, stack: error.stack });
    return res.status(500).json({ message: '服务器内部错误', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
}

module.exports = {
  submitApplication,
  getAllApplications,
  getApplicationById,
  reviewApplication,
  getPendingApplicationsCount,
  deleteApplication
};