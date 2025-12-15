/**
 * 消息管理控制器
 */

/**
 * 管理员获取消息列表
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getAdminMessages(req, res) {
  try {
    console.log('管理员获取消息列表');
    
    // 解析查询参数
    const page = parseInt(req.query.page) || 1;
    const is_read = req.query.is_read === undefined ? undefined : req.query.is_read === 'true';
    const search = req.query.search || '';
    const limit = 10;
    const offset = (page - 1) * limit;
    
    console.log('查询参数:', { page, is_read, search, limit, offset });
    
    // 构建基础查询
    let query = req.supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // 添加状态筛选
    if (is_read !== undefined) {
      query = query.eq('is_read', is_read);
    }
    
    // 执行查询
    const { data: messages, error: queryError, count } = await query;
    
    if (queryError) {
      console.error('获取消息列表失败:', queryError);
      return res.status(500).json({
        success: false,
        message: '获取消息列表失败',
        error: queryError.message
      });
    }
    
    // 单独查询用户信息并合并到消息数据中
    const messagesWithUserInfo = await Promise.all(
      messages.map(async (message) => {
        // 查询发送者信息
        let senderInfo = null;
        if (message.sender_id) {
          const { data: sender } = await req.supabase
            .from('users')
            .select('username, email')
            .eq('user_id', message.sender_id)
            .single();
          senderInfo = sender;
        }
        
        // 查询接收者信息
        let receiverInfo = null;
        if (message.receiver_id) {
          const { data: receiver } = await req.supabase
            .from('users')
            .select('username, email')
            .eq('user_id', message.receiver_id)
            .single();
          receiverInfo = receiver;
        }
        
        return {
          ...message,
          sender: senderInfo,
          receiver: receiverInfo
        };
      })
    );
    
    // 应用搜索过滤
    let filteredMessages = messagesWithUserInfo;
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filteredMessages = messagesWithUserInfo.filter(message => 
        (message.subject || '').toLowerCase().includes(searchLower) ||
        (message.content || '').toLowerCase().includes(searchLower) ||
        (message.sender?.username || '').toLowerCase().includes(searchLower) ||
        (message.sender?.email || '').toLowerCase().includes(searchLower)
      );
    }
    
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    
    console.log('获取消息列表成功:', filteredMessages.length, '条记录');
    
    return res.json({
      success: true,
      data: {
        messages: filteredMessages,
        totalCount,
        totalPages,
        currentPage: page
      }
    });
  } catch (error) {
    console.error('获取消息列表异常:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
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
    
    const { messageId } = req.params;
    
    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: '消息ID不能为空'
      });
    }
    
    // 查询消息详情
    const { data: message, error: queryError } = await req.supabase
      .from('messages')
      .select('*')
      .eq('message_id', messageId)
      .single();
    
    if (queryError) {
      console.error('获取消息详情失败:', queryError);
      return res.status(500).json({
        success: false,
        message: '获取消息详情失败',
        error: queryError.message
      });
    }
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      });
    }
    
    // 单独查询发送者和接收者信息
    let senderInfo = null;
    if (message.sender_id) {
      const { data: sender } = await req.supabase
        .from('users')
        .select('username, email')
        .eq('user_id', message.sender_id)
        .single();
      senderInfo = sender;
    }
    
    let receiverInfo = null;
    if (message.receiver_id) {
      const { data: receiver } = await req.supabase
        .from('users')
        .select('username, email')
        .eq('user_id', message.receiver_id)
        .single();
      receiverInfo = receiver;
    }
    
    // 合并用户信息到消息数据
    const messageWithUserInfo = {
      ...message,
      sender: senderInfo,
      receiver: receiverInfo
    };
    
    // 如果消息未读，标记为已读
    if (!message.is_read) {
      await req.supabase
        .from('messages')
        .update({ is_read: true })
        .eq('message_id', messageId);
    }
    
    console.log('获取消息详情成功:', messageId);
    
    return res.json({
      success: true,
      data: { message: messageWithUserInfo }
    });
  } catch (error) {
    console.error('获取消息详情异常:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
}

/**
 * 标记消息为已读
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function markMessageAsRead(req, res) {
  try {
    console.log('标记消息为已读');
    
    const { messageId } = req.params;
    
    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: '消息ID不能为空'
      });
    }
    
    // 更新消息状态
    const { data: message, error: updateError } = await req.supabase
      .from('messages')
      .update({ is_read: true })
      .eq('message_id', messageId)
      .select()
      .single();
    
    if (updateError) {
      console.error('标记消息已读失败:', updateError);
      return res.status(500).json({
        success: false,
        message: '标记消息已读失败',
        error: updateError.message
      });
    }
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: '消息不存在'
      });
    }
    
    console.log('标记消息已读成功:', messageId);
    
    return res.json({
      success: true,
      message: '消息已标记为已读',
      data: { message }
    });
  } catch (error) {
    console.error('标记消息已读异常:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
}

module.exports = {
  getAdminMessages,
  getAdminMessageById,
  markMessageAsRead
};
