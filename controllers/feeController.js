const { validationResult } = require('express-validator');

console.log('会费管理控制器已加载');

/**
 * 获取当前会员的缴费记录
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getMyFeeRecords(req, res) {
  console.log('收到获取当前会员缴费记录请求');
  try {
    const { user_id } = req.user;
    console.log('用户ID:', user_id);

    // 查找当前用户的会员信息
    console.log('查询会员信息，用户ID:', user_id);
    const { data: member, error: memberError } = await req.supabase
      .from('members')
      .select('*')
      .eq('user_id', user_id)
      .single();
      
    if (memberError || !member) {
      console.warn('未找到会员信息，用户ID:', user_id);
      return res.status(404).json({ message: '会员信息不存在' });
    }
    console.log('找到会员信息:', { member_id: member.member_id, full_name: member.full_name });

    // 获取分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    console.log('分页参数:', { page, limit, offset });

    // 查询缴费记录
    console.log('开始查询缴费记录，会员ID:', member.member_id);
    const { data: fees, error: feesError, count } = await req.supabase
      .from('membership_fees')
      .select('*', { count: 'exact' })
      .eq('member_id', member.member_id)
      .order('payment_date', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (feesError) {
      console.error('查询缴费记录失败:', feesError);
      throw feesError;
    }
    
    console.log('缴费记录查询完成，总数:', count, '当前页记录数:', fees.length);

    // 查询会员最新状态和级别
    const membershipInfo = {
      membership_level: member.membership_level,
      membership_status: member.membership_status
    };

    // 获取当前有效缴费记录（如果有）
    const currentDate = new Date().toISOString();
    console.log('查询当前有效缴费记录，日期:', currentDate);
    const { data: currentFee, error: currentFeeError } = await req.supabase
      .from('membership_fees')
      .select('*')
      .eq('member_id', member.member_id)
      .eq('payment_status', '已支付')
      .lte('valid_from', currentDate)
      .gte('valid_until', currentDate)
      .order('valid_until', { ascending: false })
      .limit(1);
      
    if (currentFeeError) {
      console.error('查询当前有效缴费记录失败:', currentFeeError);
    }
    console.log('当前有效缴费记录查询结果:', currentFee && currentFee.length > 0 ? '存在' : '不存在');

    console.log('获取缴费记录成功，返回数据');
    return res.json({
      membership_info: membershipInfo,
      current_fee: currentFee && currentFee.length > 0 ? currentFee[0] : null,
      payment_history: {
        total: count,
        pages: Math.ceil(count / limit),
        current_page: page,
        fees
      }
    });
  } catch (error) {
    console.error('获取缴费记录失败:', error.message);
    console.error('错误详情:', error);
    return res.status(500).json({ 
      message: '服务器内部错误', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}

/**
 * 获取当前会员的会员状态和缴费有效性
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getMyMembershipStatus(req, res) {
  console.log('收到获取会员状态请求');
  try {
    const { user_id } = req.user;
    console.log('用户ID:', user_id);

    // 查找当前用户的会员信息
    console.log('查询会员信息，用户ID:', user_id);
    const { data: member, error: memberError } = await req.supabase
      .from('members')
      .select('*')
      .eq('user_id', user_id)
      .single();
      
    if (memberError || !member) {
      console.warn('未找到会员信息，用户ID:', user_id);
      return res.status(404).json({ message: '会员信息不存在' });
    }
    console.log('找到会员信息:', { member_id: member.member_id, full_name: member.full_name });

    // 获取当前日期
    const currentDate = new Date().toISOString();
    console.log('当前日期:', currentDate);

    // 查询当前有效的缴费记录
    console.log('查询当前有效的缴费记录，会员ID:', member.member_id);
    const { data: currentFee, error: currentFeeError } = await req.supabase
      .from('membership_fees')
      .select('*')
      .eq('member_id', member.member_id)
      .eq('payment_status', '已支付')
      .lte('valid_from', currentDate)
      .gte('valid_until', currentDate)
      .order('valid_until', { ascending: false })
      .limit(1);
      
    if (currentFeeError) {
      console.error('查询当前有效缴费记录失败:', currentFeeError);
    }
    console.log('当前有效缴费记录查询结果:', currentFee && currentFee.length > 0 ? '存在' : '不存在');

    // 确定会员的缴费状态
    let paymentStatus = '未缴费';
    let validityPeriod = null;
    
    if (currentFee && currentFee.length > 0) {
      paymentStatus = '已缴费';
      validityPeriod = {
        start: currentFee[0].valid_from,
        end: currentFee[0].valid_until
      };
    }

    // 返回会员状态信息
    console.log('获取会员状态成功，缴费状态:', paymentStatus);
    return res.json({
      membership_level: member.membership_level,
      membership_status: member.membership_status,
      payment_status: paymentStatus,
      validity_period: validityPeriod,
      next_payment_due: currentFee && currentFee.length > 0 ? currentFee[0].valid_until : null
    });
  } catch (error) {
    console.error('获取会员状态失败:', error.message);
    console.error('错误详情:', error);
    return res.status(500).json({ 
      message: '服务器内部错误', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}

/**
 * 管理员添加会费缴纳记录
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function addFeeRecord(req, res) {
  console.log('收到添加会费缴纳记录请求');
  try {
    // 验证用户权限（管理员）
    const { user_id, role } = req.user;
    console.log('管理员用户ID:', user_id, '角色:', role);
    
    // 验证请求数据
    console.log('验证请求数据');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('请求数据验证失败:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const feeData = req.body;
    console.log('会费数据:', feeData);

    // 验证会员是否存在
    console.log('验证会员是否存在，会员ID:', feeData.member_id);
    const { data: member, error: memberError } = await req.supabase
      .from('members')
      .select('*')
      .eq('member_id', feeData.member_id)
      .single();
      
    if (memberError || !member) {
      console.warn('会员不存在，会员ID:', feeData.member_id);
      return res.status(404).json({ message: '会员不存在' });
    }

    // 添加缴纳记录
    console.log('开始创建会费记录');
    const { data: newFeeRecord, error: insertError } = await req.supabase
      .from('membership_fees')
      .insert(feeData)
      .select()
      .single();
      
    if (insertError) {
      console.error('创建会费记录失败:', insertError);
      throw insertError;
    }
    
    console.log('会费记录创建成功，记录ID:', newFeeRecord.fee_id);

    // 如果缴费成功，更新会员状态为正常
    if (newFeeRecord.payment_status === '已支付') {
      console.log('缴费状态为已支付，更新会员状态为正常，会员ID:', feeData.member_id);
      const { error: updateError } = await req.supabase
        .from('members')
        .update({ membership_status: '正常' })
        .eq('member_id', feeData.member_id);
        
      if (updateError) {
        console.error('更新会员状态失败:', updateError);
      } else {
        console.log('会员状态更新成功');
      }
    }

    console.log('会费记录添加流程完成');
    return res.status(201).json({
      message: '缴费记录添加成功',
      fee: newFeeRecord
    });
  } catch (error) {
    console.error('添加缴费记录失败:', error.message);
    console.error('错误详情:', error);
    return res.status(500).json({ 
      message: '服务器内部错误', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}

/**
 * 管理员获取所有会员的缴费记录
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getAllFeeRecords(req, res) {
  console.log('收到获取所有会员缴费记录请求');
  try {
    // 验证用户权限（管理员）
    const { user_id, role } = req.user;
    console.log('管理员用户ID:', user_id, '角色:', role);
    
    // 获取分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    console.log('分页参数:', { page, limit, offset });
    
    // 获取查询条件
    let query = req.supabase
      .from('membership_fees')
      .select(`
        *,
        members!inner(*, users!inner(username, email))
      `, { count: 'exact' })
      .order('payment_date', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (req.query.member_id) {
      console.log('按会员ID筛选:', req.query.member_id);
      query = query.eq('member_id', req.query.member_id);
    }
    
    if (req.query.payment_status) {
      console.log('按支付状态筛选:', req.query.payment_status);
      query = query.eq('payment_status', req.query.payment_status);
    }
    
    console.log('查询条件已设置');

    // 查询缴费记录
    console.log('开始查询所有缴费记录');
    const { data: fees, error: feesError, count } = await query;
    
    if (feesError) {
      console.error('查询缴费记录失败:', feesError);
      throw feesError;
    }
    
    console.log('缴费记录查询完成，总数:', count, '当前页记录数:', fees.length);

    return res.json({
      total: count,
      pages: Math.ceil(count / limit),
      current_page: page,
      fees
    });
  } catch (error) {
    console.error('获取所有缴费记录失败:', error.message);
    console.error('错误详情:', error);
    return res.status(500).json({ 
      message: '服务器内部错误', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}

/**
 * 管理员获取特定会员的缴费记录
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getMemberFeeRecords(req, res) {
  console.log('收到获取特定会员缴费记录请求');
  try {
    const { member_id } = req.params;
    console.log('会员ID:', member_id);
    
    // 验证用户权限（管理员）
    const { user_id, role } = req.user;
    console.log('管理员用户ID:', user_id, '角色:', role);

    // 获取分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    console.log('分页参数:', { page, limit, offset });

    // 检查会员是否存在
    console.log('检查会员是否存在');
    const { data: member, error: memberError } = await req.supabase
      .from('members')
      .select('*')
      .eq('member_id', member_id)
      .single();
      
    if (memberError || !member) {
      console.warn('会员不存在，会员ID:', member_id);
      return res.status(404).json({ message: '会员不存在' });
    }
    
    console.log('会员信息:', { member_id: member.member_id, full_name: member.full_name });

    // 查询缴费记录
    console.log('查询会员缴费记录');
    const { data: fees, error: feesError, count } = await req.supabase
      .from('membership_fees')
      .select('*', { count: 'exact' })
      .eq('member_id', member_id)
      .order('payment_date', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (feesError) {
      console.error('查询缴费记录失败:', feesError);
      throw feesError;
    }
    
    console.log('缴费记录查询完成，总数:', count, '当前页记录数:', fees.length);

    return res.json({
      member_info: {
        member_id: member.member_id,
        full_name: member.full_name,
        membership_level: member.membership_level,
        membership_status: member.membership_status
      },
      fees: {
        total: count,
        pages: Math.ceil(count / limit),
        current_page: page,
        records: fees
      }
    });
  } catch (error) {
    console.error('获取会员缴费记录失败:', error.message);
    console.error('错误详情:', error);
    return res.status(500).json({ 
      message: '服务器内部错误', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}

/**
 * 管理员更新缴费记录
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function updateFeeRecord(req, res) {
  console.log('收到更新缴费记录请求');
  try {
    // 验证用户权限（管理员）
    const { user_id, role } = req.user;
    console.log('管理员用户ID:', user_id, '角色:', role);
    
    // 验证请求数据
    console.log('验证请求数据');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('请求数据验证失败:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { fee_id } = req.params;
    const updatedData = req.body;
    console.log('缴费记录ID:', fee_id, '更新数据:', updatedData);

    // 查找缴费记录
    console.log('查找缴费记录');
    const { data: fee, error: feeError } = await req.supabase
      .from('membership_fees')
      .select('*')
      .eq('fee_id', fee_id)
      .single();
      
    if (feeError || !fee) {
      console.warn('缴费记录不存在，记录ID:', fee_id);
      return res.status(404).json({ message: '缴费记录不存在' });
    }
    
    console.log('找到缴费记录:', { fee_id: fee.fee_id, member_id: fee.member_id });

    // 更新缴费记录
    console.log('更新缴费记录');
    const { data: updatedFee, error: updateError } = await req.supabase
      .from('membership_fees')
      .update(updatedData)
      .eq('fee_id', fee_id)
      .select()
      .single();
      
    if (updateError) {
      console.error('更新缴费记录失败:', updateError);
      throw updateError;
    }
    
    console.log('缴费记录更新成功');

    // 如果缴费状态变更为已支付，更新会员状态为正常
    if (updatedData.payment_status === '已支付') {
      console.log('缴费状态变更为已支付，更新会员状态为正常，会员ID:', fee.member_id);
      const { error: memberUpdateError } = await req.supabase
        .from('members')
        .update({ membership_status: '正常' })
        .eq('member_id', fee.member_id);
        
      if (memberUpdateError) {
        console.error('更新会员状态失败:', memberUpdateError);
      } else {
        console.log('会员状态更新成功');
      }
    }

    return res.json({
      message: '缴费记录更新成功',
      fee: updatedFee
    });
  } catch (error) {
    console.error('更新缴费记录失败:', error.message);
    console.error('错误详情:', error);
    return res.status(500).json({ 
      message: '服务器内部错误', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}

module.exports = {
  getMyFeeRecords,
  getMyMembershipStatus,
  addFeeRecord,
  getAllFeeRecords,
  getMemberFeeRecords,
  updateFeeRecord
};