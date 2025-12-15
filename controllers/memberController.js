const { validationResult } = require('express-validator');
const XLSX = require('xlsx');
const { sendMessageToMember } = require('../utils/emailUtils');

/**
 * 创建会员信息
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function createMemberProfile(req, res) {
  try {
    console.log('开始创建会员信息');
    
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('请求数据验证失败:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user || !req.user.user_id) {
      console.error('未找到用户认证信息');
      return res.status(401).json({ message: '未认证' });
    }
    
    const { user_id } = req.user;
    const memberData = req.body;
    
    console.log('用户ID:', user_id, '请求数据:', Object.keys(memberData));

    // 检查是否已有会员信息
    const { data: existingMember, error: checkError } = await req.supabase
      .from('members')
      .select('*')
      .eq('user_id', user_id)
      .single();
    
    if (existingMember) {
      console.log('会员信息已存在:', user_id);
      return res.status(400).json({ message: '会员信息已存在，请使用更新接口' });
    }

    // 创建会员信息
    console.log('开始创建会员记录');
    const { data: newMember, error: createError } = await req.supabase
      .from('members')
      .insert({
        ...memberData,
        user_id,
        profile_updated_at: new Date()
      })
      .select()
      .single();
    
    if (createError) {
      console.error('创建会员信息失败:', createError);
      return res.status(500).json({ message: '创建会员信息失败', error: createError.message });
    }
    
    console.log('会员信息创建成功:', newMember.member_id);

    return res.status(201).json({
      message: '会员信息创建成功',
      member: newMember
    });
  } catch (error) {
    console.error('创建会员信息失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 获取当前会员信息
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getMyProfile(req, res) {
  try {
    console.log('开始获取会员信息');
    
    if (!req.user || !req.user.user_id) {
      console.error('未找到用户认证信息');
      return res.status(401).json({ message: '未认证' });
    }
    
    const { user_id } = req.user;
    console.log('用户ID:', user_id);

    // 查询会员信息
    console.log('查询会员数据库记录');
    const { data: member, error: queryError } = await req.supabase
      .from('members')
      .select(`
        *,
        users:user_id (username, email)
      `)
      .eq('user_id', user_id)
      .single();

    if (queryError || !member) {
      console.log('会员信息不存在:', user_id);
      return res.status(404).json({ message: '会员信息不存在，请先创建会员资料' });
    }
    
    console.log('会员信息查询成功:', member.member_id);

    return res.json({ member });
  } catch (error) {
    console.error('获取会员信息失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 更新会员信息
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function updateMyProfile(req, res) {
  try {
    console.log('开始更新会员信息');
    
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('请求数据验证失败:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user || !req.user.user_id) {
      console.error('未找到用户认证信息');
      return res.status(401).json({ message: '未认证' });
    }
    
    const { user_id } = req.user;
    const updatedData = req.body;
    
    console.log('用户ID:', user_id, '更新数据:', Object.keys(updatedData));

    // 排除不允许会员自己更新的字段
    delete updatedData.membership_level;
    delete updatedData.membership_status;
    delete updatedData.member_id;
    delete updatedData.user_id;
    
    console.log('过滤后的更新字段:', Object.keys(updatedData));

    // 查找会员信息
    console.log('查找会员记录');
    const { data: member, error: findError } = await req.supabase
      .from('members')
      .select('*')
      .eq('user_id', user_id)
      .single();
    
    if (findError || !member) {
      console.log('会员信息不存在:', user_id);
      return res.status(404).json({ message: '会员信息不存在' });
    }

    // 更新会员信息
    console.log('开始更新会员记录:', member.member_id);
    const { data: updatedMember, error: updateError } = await req.supabase
      .from('members')
      .update({
        ...updatedData,
        profile_updated_at: new Date()
      })
      .eq('user_id', user_id)
      .select()
      .single();
    
    if (updateError) {
      console.error('更新会员信息失败:', updateError);
      return res.status(500).json({ message: '更新会员信息失败', error: updateError.message });
    }
    
    console.log('会员信息更新成功:', member.member_id);

    return res.json({
      message: '会员信息更新成功',
      member
    });
  } catch (error) {
    console.error('更新会员信息失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 管理员获取所有会员列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getAllMembers(req, res) {
  try {
    console.log('管理员获取所有会员列表');
    
    if (!req.user || !req.user.user_id) {
      console.error('未找到管理员认证信息');
      return res.status(401).json({ message: '未认证' });
    }
    
    // 获取分页参数
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    console.log('分页参数:', { page, limit, offset });

    // 查询会员列表
    console.log('查询会员数据库');
    const { data: members, error: queryError, count } = await req.supabase
      .from('members')
      .select(`
        *,
        users:user_id (username, email, role, account_status, last_login, last_active)
      `, { count: 'exact' })
      .order('member_id', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (queryError) {
      console.error('查询会员列表失败:', queryError);
      throw queryError;
    }
    
    console.log('查询成功，找到', count, '个会员');

    return res.json({
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: page,
      members
    });
  } catch (error) {
    console.error('获取会员列表失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 管理员获取特定会员信息
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getMemberById(req, res) {
  try {
    console.log('管理员获取特定会员信息');
    
    if (!req.user || !req.user.user_id) {
      console.error('未找到管理员认证信息');
      return res.status(401).json({ message: '未认证' });
    }
    
    const { member_id } = req.params;
    console.log('会员ID:', member_id);

    // 查询会员信息
    console.log('查询特定会员记录');
    const { data: member, error: queryError } = await req.supabase
      .from('members')
      .select(`
        *,
        users:user_id (username, email, role, account_status)
      `)
      .eq('member_id', member_id)
      .single();

    if (queryError) {
      console.error('查询会员信息失败:', queryError);
      if (queryError.code === 'PGRST116') {
        console.log('会员不存在:', member_id);
        return res.status(404).json({ message: '会员不存在' });
      }
      throw queryError;
    }

    if (!member) {
      console.log('会员不存在:', member_id);
      return res.status(404).json({ message: '会员不存在' });
    }
    
    console.log('会员信息查询成功:', member.member_id);

    return res.json({ member });
  } catch (error) {
    console.error('获取会员信息失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 管理员更新会员信息（包括等级和状态）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function updateMemberById(req, res) {
  try {
    console.log('管理员更新会员信息');
    
    if (!req.user || !req.user.user_id) {
      console.error('未找到管理员认证信息');
      return res.status(401).json({ message: '未认证' });
    }
    
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('请求数据验证失败:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { member_id } = req.params;
    const updatedData = req.body;
    
    console.log('会员ID:', member_id, '更新数据:', Object.keys(updatedData));

    // 分离需要更新的字段
    const membersTableFields = ['full_name', 'gender', 'birth_date', 'phone', 'id_number', 
                               'work_unit', 'professional_title', 'address', 'membership_level', 
                               'membership_status'];
    const usersTableFields = ['username', 'email', 'role'];
    
    const membersUpdateData = {};
    const usersUpdateData = {};
    
    // 分离数据
    for (const [key, value] of Object.entries(updatedData)) {
      if (membersTableFields.includes(key)) {
        membersUpdateData[key] = value;
      } else if (usersTableFields.includes(key)) {
        usersUpdateData[key] = value;
      }
    }
    
    // 排除不能更新的字段
    delete membersUpdateData.member_id;
    delete membersUpdateData.user_id;
    delete usersUpdateData.user_id;
    
    console.log('过滤后的更新字段 - members表:', Object.keys(membersUpdateData));
    console.log('过滤后的更新字段 - users表:', Object.keys(usersUpdateData));

    // 查找会员信息
    console.log('查找会员记录');
    const { data: member, error: queryError } = await req.supabase
      .from('members')
      .select('*, users:user_id (username, email, role)')
      .eq('member_id', member_id)
      .single();
    
    if (queryError) {
      console.error('查找会员记录失败:', queryError);
      if (queryError.code === 'PGRST116') {
        console.log('会员不存在:', member_id);
        return res.status(404).json({ message: '会员不存在' });
      }
      throw queryError;
    }

    if (!member) {
      console.log('会员不存在:', member_id);
      return res.status(404).json({ message: '会员不存在' });
    }

    // 更新users表信息（如果有需要更新的字段）
    if (Object.keys(usersUpdateData).length > 0) {
      console.log('开始更新users表记录:', member.user_id);
      const { error: usersUpdateError } = await req.supabase
        .from('users')
        .update(usersUpdateData)
        .eq('user_id', member.user_id);
      
      if (usersUpdateError) {
        console.error('更新users表信息失败:', usersUpdateError);
        throw usersUpdateError;
      }
      console.log('users表信息更新成功');
    }

    // 更新members表信息
    console.log('开始更新members表记录:', member.member_id);
    const { data: updatedMember, error: updateError } = await req.supabase
      .from('members')
      .update({
        ...membersUpdateData,
        profile_updated_at: new Date()
      })
      .eq('member_id', member_id)
      .select('*, users:user_id (username, email, role)')
      .single();
    
    if (updateError) {
      console.error('更新会员信息失败:', updateError);
      throw updateError;
    }
    
    console.log('会员信息更新成功:', member.member_id);

    return res.json({
      message: '会员信息更新成功',
      member
    });
  } catch (error) {
    console.error('更新会员信息失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 管理员导出所有会员数据为Excel文件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function exportMembersToExcel(req, res) {
  try {
    console.log('管理员导出会员数据为Excel');
    
    if (!req.user || !req.user.user_id) {
      console.error('未找到管理员认证信息');
      return res.status(401).json({ message: '未认证' });
    }
    
    // 查询所有会员信息，包含用户表关联数据
    console.log('查询所有会员数据');
    const { data: allMembers, error: queryError } = await req.supabase
      .from('members')
      .select(`
        *,
        users:user_id (username, email, account_status)
      `)
      .order('member_id', { ascending: true });
    
    if (queryError) {
      console.error('查询会员数据失败:', queryError);
      throw queryError;
    }
    
    console.log('查询成功，找到', allMembers.length, '个会员');
    
    // 准备Excel数据
    const excelData = allMembers.map(member => ({
      '会员ID': member.member_id,
      '用户名': member.users.username,
      '邮箱': member.users.email,
      '真实姓名': member.full_name,
      '性别': member.gender || '-',
      '出生日期': member.birth_date ? member.birth_date.toLocaleDateString() : '-',
      '联系电话': member.phone || '-',
      '身份证号': member.id_number || '-',
      '工作单位': member.work_unit || '-',
      '职称': member.professional_title || '-',
      '通讯地址': member.address || '-',
      '会员等级': member.membership_level,
      '会籍状态': member.membership_status,
      '账号状态': member.users.account_status,
      '信息更新时间': member.profile_updated_at ? member.profile_updated_at.toLocaleString() : '-'
    }));
    
    // 创建工作簿和工作表
    console.log('创建Excel工作簿');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // 设置列宽
    const colWidths = [
      { wch: 8 },  // 会员ID
      { wch: 15 }, // 用户名
      { wch: 25 }, // 邮箱
      { wch: 15 }, // 真实姓名
      { wch: 6 },  // 性别
      { wch: 12 }, // 出生日期
      { wch: 15 }, // 联系电话
      { wch: 20 }, // 身份证号
      { wch: 30 }, // 工作单位
      { wch: 15 }, // 职称
      { wch: 40 }, // 通讯地址
      { wch: 10 }, // 会员等级
      { wch: 10 }, // 会籍状态
      { wch: 10 }, // 账号状态
      { wch: 20 }  // 信息更新时间
    ];
    ws['!cols'] = colWidths;
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '会员列表');
    
    // 生成Excel文件名称
    const fileName = `会员数据_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // 设置响应头，使浏览器下载文件
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);
    
    // 写入Excel文件到响应流
    console.log('生成Excel文件并发送响应');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    return res.send(excelBuffer);
  } catch (error) {
    console.error('导出会员数据失败:', error);
    return res.status(500).json({ message: '导出失败', error: error.message });
  }
}

/**
 * 删除会员
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function deleteMemberById(req, res) {
  try {
    console.log('开始删除会员');
    
    // 验证管理员权限
    if (!req.user || !req.user.user_id) {
      console.error('未找到管理员认证信息');
      return res.status(401).json({ message: '未认证' });
    }
    
    const { member_id } = req.params;
    console.log('会员ID:', member_id);
    
    // 查找会员
    console.log('查找会员记录');
    const { data: member, error: queryError } = await req.supabase
      .from('members')
      .select('*')
      .eq('member_id', member_id)
      .single();
    
    if (queryError) {
      console.error('查找会员记录失败:', queryError);
      if (queryError.code === 'PGRST116') {
        console.log('会员不存在:', member_id);
        return res.status(404).json({ message: '会员不存在' });
      }
      throw queryError;
    }
    
    if (!member) {
      console.log('会员不存在:', member_id);
      return res.status(404).json({ message: '会员不存在' });
    }
    
    // 删除会员记录
    console.log('开始删除会员记录:', member_id);
    const { error: deleteError } = await req.supabase
      .from('members')
      .delete()
      .eq('member_id', member_id);
      
    if (deleteError) {
      console.error('删除会员记录失败:', deleteError);
      throw deleteError;
    }
    
    console.log('会员删除成功:', member_id);
    
    return res.json({ message: '会员删除成功' });
    
  } catch (error) {
    console.error('删除会员失败:', error);
    return res.status(500).json({ message: '删除失败', error: error.message });
  }
}

/**
 * 发送消息给特定会员
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function sendMemberMessage(req, res) {
  try {
    console.log('开始发送消息给会员');
    
    if (!req.user || !req.user.user_id) {
      console.error('未找到管理员认证信息');
      return res.status(401).json({ message: '未认证' });
    }
    
    const { member_id } = req.params;
    // 从FormData中获取数据
    const { subject, content } = req.body;
    
    console.log('会员ID:', member_id, '消息主题:', subject);
    
    // 验证请求数据
    if (!subject || !content) {
      console.log('消息主题或内容不能为空');
      return res.status(400).json({ message: '消息主题和内容不能为空' });
    }
    
    // 查询会员信息和用户信息
    console.log('查询会员和用户记录');
    const { data: member, error: queryError } = await req.supabase
      .from('members')
      .select(`
        *,
        users:user_id (username, email)
      `)
      .eq('member_id', member_id)
      .single();
    
    if (queryError) {
      console.error('查询会员记录失败:', queryError);
      if (queryError.code === 'PGRST116') {
        console.log('会员不存在:', member_id);
        return res.status(404).json({ message: '会员不存在' });
      }
      throw queryError;
    }
    
    if (!member || !member.users) {
      console.log('会员不存在或未关联用户:', member_id);
      return res.status(404).json({ message: '会员不存在' });
    }
    
    const user = member.users;
    console.log('找到会员:', user.username, '邮箱:', user.email);
    
    // 准备消息数据
    const messageData = {
      sender_id: req.user.user_id,
      receiver_id: member.user_id,
      subject: subject,
      content: content,
      is_read: false,
      created_at: new Date()
    };
    
    // 处理文件上传
    console.log('检查请求中的文件数据:', req.file ? {
      originalname: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : '没有文件上传');
    
    if (req.file) {
      console.log('开始处理上传的文件:', req.file.originalname);
      messageData.file_name = req.file.originalname;
      messageData.file_path = `/uploads/${req.file.filename}`;
      messageData.file_size = req.file.size;
      messageData.file_type = req.file.mimetype;
      console.log('文件数据已添加到messageData:', {
        file_name: messageData.file_name,
        file_path: messageData.file_path,
        file_size: messageData.file_size,
        file_type: messageData.file_type
      });
    } else {
      console.log('没有接收到上传的文件，继续创建不含附件的消息');
    }
    
    // 发送邮件消息
    console.log('开始发送邮件消息');
    await sendMessageToMember(user.email, user.username, subject, content);
    
    // 同时将消息存储到数据库
    console.log('开始将消息存储到数据库');
    const { data: newMessage, error: createError } = await req.supabase
      .from('messages')
      .insert(messageData)
      .select();
      
    if (createError) {
      console.error('存储消息到数据库失败:', createError);
      throw createError;
    }
    
    console.log('消息发送成功并已存储到数据库');
    return res.json({ message: '消息发送成功' });
    
  } catch (error) {
    console.error('发送消息失败:', error);
    return res.status(500).json({ message: '发送失败', error: error.message });
  }
}

/**
 * 获取会员的消息列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getMemberMessages(req, res) {
  try {
    console.log('开始获取会员消息列表');
    
    if (!req.user || !req.user.user_id) {
      console.error('未找到用户认证信息');
      return res.status(401).json({ message: '未认证' });
    }
    
    const { user_id } = req.user;
    const { page = 1, pageSize = 10 } = req.query;
    
    // 查询该用户的所有消息，按发送时间倒序排列
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;
    
    console.log('用户ID:', user_id, '页码:', page, '每页数量:', pageSize);
    
    // 查询消息记录
    console.log('查询消息记录');
    const { data: messages, error: queryError, count } = await req.supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('receiver_id', user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSizeNum - 1);
    
    if (queryError) {
      console.error('查询消息记录失败:', queryError);
      throw queryError;
    }
    
    console.log('查询成功，找到', count, '条消息');
    
    // 处理消息数据
    const processedMessages = messages.map(msg => ({
      ...msg
    }));
    
    return res.json({
      success: true,
      data: {
        messages: processedMessages,
        totalCount: count,
        currentPage: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(count / pageSizeNum)
      }
    });
  } catch (error) {
    console.error('获取消息列表失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 获取消息详情
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getMessageById(req, res) {
  try {
    console.log('开始获取消息详情');
    
    if (!req.user || !req.user.user_id) {
      console.error('未找到用户认证信息');
      return res.status(401).json({ message: '未认证' });
    }
    
    const { user_id } = req.user;
    const { messageId } = req.params;
    
    console.log('用户ID:', user_id, '消息ID:', messageId);
    
    // 查询消息详情，并确保是该用户的消息
    console.log('查询消息详情');
    const { data: message, error: queryError } = await req.supabase
      .from('messages')
      .select('*')
      .eq('message_id', messageId)
      .eq('receiver_id', user_id)
      .single();
    
    if (queryError) {
      console.error('查询消息详情失败:', queryError);
      if (queryError.code === 'PGRST116') {
        console.log('消息不存在或无权访问:', messageId);
        return res.status(404).json({ message: '消息不存在或无权访问' });
      }
      throw queryError;
    }
    
    if (!message) {
      console.log('消息不存在或无权访问:', messageId);
      return res.status(404).json({ message: '消息不存在或无权访问' });
    }
    
    // 如果消息未读，则标记为已读
    if (!message.is_read) {
      console.log('开始更新消息状态');
      const { error: updateError } = await req.supabase
        .from('messages')
        .update({ is_read: true })
        .eq('message_id', messageId);
        
      if (updateError) {
        console.error('更新消息状态失败:', updateError);
        throw updateError;
      }
      console.log('消息已标记为已读:', messageId);
    }
    
    // 处理消息数据，添加状态字段
    const processedMessage = {
      ...message,
      status: message.is_read ? 'read' : 'unread'
    };
    
    return res.json({
      success: true,
      data: { message: processedMessage }
    });
  } catch (error) {
    console.error('获取消息详情失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 获取未读消息数量
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getUnreadMessagesCount(req, res) {
  try {
    console.log('开始获取未读消息数量');
    
    if (!req.user || !req.user.user_id) {
      console.error('未找到用户认证信息');
      return res.status(401).json({ message: '未认证' });
    }
    
    const { user_id } = req.user;
    
    console.log('用户ID:', user_id);
    
    // 查询未读消息数量
    console.log('查询未读消息数量');
    const { count, error: countError } = await req.supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user_id)
      .eq('is_read', false);
    
    if (countError) {
      console.error('查询未读消息数量失败:', countError);
      throw countError;
    }
    
    console.log('未读消息数量:', count);
    
    return res.json({
      success: true,
      data: { count: count }
    });
  } catch (error) {
    console.error('获取未读消息数量失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 会员发送消息给管理员
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function sendMessageToAdmin(req, res) {
  try {
    console.log('开始处理会员发送给管理员的消息');
    
    if (!req.user || !req.user.user_id) {
      console.error('未找到用户认证信息');
      return res.status(401).json({ message: '未认证' });
    }
    
    const { user_id } = req.user;
    // 兼容前端使用的title字段，映射到subject
    const { subject, title, content } = req.body;
    const finalSubject = subject || title;
    
    // 添加日志记录1：记录完整的请求参数信息
    console.log(`[消息发送请求] 用户ID: ${user_id}, 请求时间: ${new Date().toISOString()}, 消息主题长度: ${finalSubject?.length || 0}字符, 内容长度: ${content?.length || 0}字符`);
    
    // 验证请求数据
    if (!finalSubject || !content) {
      return res.status(400).json({ message: '消息主题和内容不能为空' });
    }
    
    // 创建消息记录
    // 假设管理员ID为1，可以根据实际情况调整或查询
    const adminId = 1;
    const messageData = {
      sender_id: user_id,
      receiver_id: adminId,
      subject: finalSubject,
      content,
      is_read: false,
      created_at: new Date()
    };
    
    // 添加日志记录2：检查文件上传状态
    console.log('[文件上传检查] req.file存在吗?', req.file ? '是' : '否');
    console.log('[文件上传检查] req.files存在吗?', req.files ? '是' : '否');
    
    if (req.file) {
      console.log('[文件处理开始] 发现上传文件:', req.file.originalname);
      console.log('[文件处理详情]', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
      messageData.file_name = req.file.originalname;
      messageData.file_path = `/uploads/${req.file.filename}`;
      messageData.file_size = req.file.size;
      messageData.file_type = req.file.mimetype;
      console.log('[文件处理完成] 文件信息已添加到消息数据');
    } else {
      console.log('[文件处理] 未发现上传文件，继续处理文本消息');
    }
    
    const { data: newMessage, error: createError } = await req.supabase
      .from('messages')
      .insert(messageData)
      .select();
      
    if (createError) {
      console.error('存储消息到数据库失败:', createError);
      throw createError;
    }
    
    const message = newMessage[0];
    
    // 添加日志记录2：记录消息创建成功的详细信息，包含文件信息
    const createdAt = message.created_at ? new Date(message.created_at) : new Date();
    console.log(`[消息发送成功] 消息ID: ${message.message_id}, 发送者ID: ${message.sender_id}, 发送时间: ${createdAt.toISOString()}, 消息状态: ${message.is_read ? '已读' : '未读'}`);
    // 详细记录文件信息（如果有）
    if (message.file_name) {
      console.log(`[文件信息] 文件名: ${message.file_name}, 文件路径: ${message.file_path}, 文件大小: ${message.file_size}字节, 文件类型: ${message.file_type}`);
    } else {
      console.log('[文件信息] 消息中不包含文件');
    }
    
    return res.status(201).json({
      message: '消息发送成功',
      message_id: message.message_id
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    return res.status(500).json({ message: '发送消息失败', error: error.message });
  }
}

/**
 * 管理员获取消息详情
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getAdminMessageById(req, res) {
  try {
    console.log('管理员获取消息详情');
    
    if (!req.user || !req.user.user_id) {
      console.error('未找到管理员认证信息');
      return res.status(401).json({ message: '未认证' });
    }
    
    const { user_id } = req.user;
    const { messageId } = req.params;
    
    console.log('管理员ID:', user_id, '消息ID:', messageId);
    
    // 查询消息详情，确保包含所有文件相关字段
    console.log('查询消息详情');
    const { data: message, error: queryError } = await req.supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (username, email),
        recipient:recipient_id (username, email)
      `)
      .eq('message_id', messageId)
      .single();
    
    if (queryError) {
      console.error('查询消息详情失败:', queryError);
      if (queryError.code === 'PGRST116') {
        console.log('消息不存在:', messageId);
        return res.status(404).json({ message: '消息不存在' });
      }
      throw queryError;
    }
    
    if (!message) {
      console.log('消息不存在或无权访问:', messageId);
      return res.status(404).json({ message: '消息不存在或无权访问' });
    }
    
    // 如果消息未读，则标记为已读
    if (!message.is_read) {
      await message.update({ is_read: true });
      console.log('消息已标记为已读:', messageId);
    }
    
    return res.json({
      success: true,
      data: { message }
    });
  } catch (error) {
    console.error('获取消息详情失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 管理员获取所有消息列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getAdminMessages(req, res) {
  try {
    console.log('管理员获取消息列表');
    
    if (!req.user || !req.user.user_id) {
      console.error('未找到管理员认证信息');
      return res.status(401).json({ message: '未认证' });
    }
    
    const { user_id } = req.user;
    const { page = 1, pageSize = 10 } = req.query;
    
    // 从查询参数中获取is_read过滤条件
    const is_read = req.query.is_read === 'true' || req.query.is_read === true;
    const is_read_filter = req.query.is_read === 'false' || req.query.is_read === false ? false : (req.query.is_read === 'true' || req.query.is_read === true ? true : undefined);
    
    console.log('管理员ID:', user_id, '页码:', page, '每页数量:', pageSize, 'is_read过滤:', is_read_filter);
    
    // 构建查询条件
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    // 构建Supabase查询
    let query = req.supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (username, email),
        receiver:receiver_id (username, email)
      `, { count: 'exact' })
      .eq('receiver_id', user_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(pageSize) - 1);
    
    // 如果指定了is_read过滤
    if (is_read_filter !== undefined) {
      query = query.eq('is_read', is_read_filter);
    }
    
    // 查询消息列表
    console.log('查询管理员消息列表');
    const { data: messages, error: queryError, count } = await query;
    
    if (queryError) {
      console.error('查询管理员消息列表失败:', queryError);
      throw queryError;
    }
    
    console.log('查询成功，找到', count, '条消息');
    
    // 处理消息数据
    const processedMessages = messages.map(msg => ({
      ...msg
    }));
    
    return res.json({
      success: true,
      data: {
        messages: processedMessages,
        totalCount: count,
        currentPage: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('获取管理员消息列表失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 管理员标记消息已读
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function markMessageAsRead(req, res) {
  try {
    console.log('管理员标记消息已读');
    
    if (!req.user || !req.user.user_id) {
      console.error('未找到管理员认证信息');
      return res.status(401).json({ message: '未认证' });
    }
    
    const { user_id } = req.user;
    const { message_id } = req.params;
    
    console.log('管理员ID:', user_id, '消息ID:', message_id);
    
    // 查找消息并确保是该管理员的消息
    console.log('查询消息详情');
    const { data: message, error: queryError } = await req.supabase
      .from('messages')
      .select('*')
      .eq('message_id', message_id)
      .eq('receiver_id', user_id)
      .single();
    
    if (queryError) {
      console.error('查询消息详情失败:', queryError);
      if (queryError.code === 'PGRST116') {
        console.log('消息不存在或无权访问:', message_id);
        return res.status(404).json({ message: '消息不存在或无权访问' });
      }
      throw queryError;
    }
    
    if (!message) {
      console.log('消息不存在或无权访问:', message_id);
      return res.status(404).json({ message: '消息不存在或无权访问' });
    }
    
    // 检查消息状态
    if (message.is_read) {
      return res.json({
        success: true,
        message: '消息已经是已读状态'
      });
    }
    
    // 更新消息状态
    console.log('开始更新消息状态');
    const { error: updateError } = await req.supabase
      .from('messages')
      .update({ is_read: true })
      .eq('message_id', message_id);
      
    if (updateError) {
      console.error('更新消息状态失败:', updateError);
      throw updateError;
    }
    
    console.log('消息已成功标记为已读:', message_id);
    
    return res.json({
      success: true,
      message: '消息已成功标记为已读'
    });
  } catch (error) {
    console.error('标记消息已读失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

module.exports = {
  createMemberProfile,
  getMyProfile,
  updateMyProfile,
  getAllMembers,
  getMemberById,
  updateMemberById,
  deleteMemberById,
  exportMembersToExcel,
  sendMemberMessage,
  getMemberMessages,
  getMessageById,
  getUnreadMessagesCount,
  sendMessageToAdmin,
  getAdminMessages,
  getAdminMessageById,
  markMessageAsRead
}