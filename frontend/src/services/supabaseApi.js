import supabase from './supabaseClient'

// 用户认证相关API - 直接使用Supabase Auth
export const authApi = {
  // 用户登录
  login: async (credentials) => {
    try {
      const { email, password } = credentials
      
      // 直接使用Supabase Auth进行登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        throw {
          code: 'AUTHENTICATION_FAILED',
          message: error.message || '登录失败',
          details: null
        }
      }
      
      return {
        user: data.user,
        session: data.session,
        message: '登录成功'
      }
    } catch (error) {
      if (error.code && error.message) {
        throw error
      }
      throw {
        code: 'NETWORK_ERROR',
        message: '网络连接失败，请检查服务器状态',
        details: null
      }
    }
  },
  
  // 用户注册
  register: async (userData) => {
    try {
      const { email, password, username } = userData
      
      // 直接使用Supabase Auth进行注册
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      })
      
      if (error) {
        throw {
          code: 'REGISTRATION_FAILED',
          message: error.message || '注册失败',
          details: null
        }
      }
      
      return {
        user: data.user,
        message: '注册成功，请检查邮箱确认邮件'
      }
    } catch (error) {
      if (error.code && error.message) {
        throw error
      }
      throw {
        code: 'NETWORK_ERROR',
        message: '网络连接失败，请检查服务器状态',
        details: null
      }
    }
  },
  
  // 获取当前用户信息
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('用户未登录')
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single()
      
    if (error) throw error
    
    return userData
  },
  
  // 修改密码
  changePassword: async (passwordData) => {
    const { newPassword } = passwordData
    
    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('用户未登录')
    
    // 更新密码
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (error) throw error
    
    return {
      code: 'PASSWORD_CHANGED',
      message: '密码修改成功',
      details: null
    }
  }
}

// 会员管理相关API
export const memberApi = {
  // 获取所有会员（管理员权限）
  getAllMembers: async () => {
    // 验证管理员权限
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')
    
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single()
      
    if (userData.role !== 'admin') throw new Error('需要管理员权限')
    
    // 获取会员数据（包含用户信息）
    const { data: members, error } = await supabase
      .from('members')
      .select(`
        *,
        users (
          username,
          email,
          role,
          account_status,
          last_active,
          last_login
        )
      `)
      .order('member_id', { ascending: true })
      
    if (error) throw error
    
    // 处理数据格式
    const processedMembers = members.map(member => ({
      member_id: member.member_id,
      username: member.users?.username || '-',
      email: member.users?.email || '-',
      role: '会员',
      membership_level: member.membership_level || '-',
      active_status: member.users?.account_status === 'active' ? '活跃' : '未活跃',
      last_active: member.users?.last_active || '-',
      last_login: member.users?.last_login || '-',
      full_name: member.full_name || '-',
      phone: member.phone || '-',
      gender: member.gender || '-',
      address: member.address || '-',
      birth_date: member.birth_date || '-',
      membership_status: member.membership_status || '正常',
      profile_updated_at: member.profile_updated_at || '-'
    }))
    
    return { members: processedMembers }
  },
  
  // 创建会员资料
  createMemberProfile: async (memberData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')
    
    const { data: userRecord } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', user.email)
      .single()
      
    const memberProfile = {
      ...memberData,
      user_id: userRecord.user_id,
      profile_updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('members')
      .insert(memberProfile)
      .select()
      .single()
      
    if (error) throw error
    
    return data
  },
  
  // 获取当前登录会员的信息
  getCurrentMember: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')
    
    const { data: userRecord } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', user.email)
      .single()
      
    const { data: member, error } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', userRecord.user_id)
      .single()
      
    if (error) throw error
    
    return member
  }
}

// 消息管理相关API
export const messageApi = {
  // 发送消息给管理员
  sendMessageToAdmin: async (messageData) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')
    
    const { data: userRecord } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', user.email)
      .single()
      
    const message = {
      ...messageData,
      sender_id: userRecord.user_id,
      receiver_id: null, // 发送给所有管理员
      message_type: 'member_to_admin',
      created_at: new Date().toISOString(),
      status: 'unread'
    }
    
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single()
      
    if (error) throw error
    
    return data
  },
  
  // 获取当前用户的消息
  getMessages: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')
    
    const { data: userRecord } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', user.email)
      .single()
      
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userRecord.user_id},receiver_id.eq.${userRecord.user_id}`)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    
    return messages
  }
}