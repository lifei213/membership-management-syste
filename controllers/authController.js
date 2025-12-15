const { hashPassword, verifyPassword } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/jwtUtils');
const { validationResult } = require('express-validator');

/**
 * 用户注册
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function register(req, res) {
  try {
    console.log('注册请求接收到:', req.body);
    
    // 安全检查，防止空请求体
    if (!req.body || typeof req.body !== 'object') {
      console.error('无效的请求体:', req.body);
      return res.status(400).json({ message: '无效的请求体' });
    }
    
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('验证错误:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, email } = req.body;
    console.log('尝试注册用户:', username);

    // 检查用户名是否已存在
    const { data: existingUserByUsername, error: usernameError } = await req.supabase
      .from('users')
      .select('user_id')
      .eq('username', username)
      .single();

    if (existingUserByUsername) {
      console.log('用户名已存在:', username);
      return res.status(400).json({ message: '用户名已被使用' });
    }

    // 检查邮箱是否已存在
    const { data: existingUserByEmail, error: emailError } = await req.supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single();

    if (existingUserByEmail) {
      console.log('邮箱已存在:', email);
      return res.status(400).json({ message: '邮箱已被注册' });
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);
    console.log('密码加密成功');

    // 创建新用户
    const { data: newUser, error: insertError } = await req.supabase
      .from('users')
      .insert({
        username,
        password_hash: hashedPassword,
        email,
        role: 'member', // 默认注册为会员
        account_status: 'active'
      })
      .select()
      .single();

    if (insertError) {
      console.error('创建用户失败:', insertError);
      return res.status(500).json({ message: '创建用户失败', error: insertError.message });
    }

    console.log('用户创建成功，ID:', newUser.user_id);

    // 生成JWT令牌
    const token = generateToken({
      user_id: newUser.user_id,
      username: newUser.username,
      role: newUser.role
    });

    // 返回用户信息和令牌
    return res.status(201).json({
      message: '注册成功',
      user: {
        user_id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      },
      token
    });
  } catch (error) {
    console.error('注册失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 用户登录
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function login(req, res) {
  try {
    console.log('登录请求接收到:', req.body);
    
    // 安全检查，防止空请求体
    if (!req.body || typeof req.body !== 'object') {
      console.error('无效的请求体:', req.body);
      return res.status(400).json({
        code: 'INVALID_REQUEST_BODY',
        message: '无效的请求数据格式',
        details: null
      });
    }
    
    // 验证必填字段
    if (!req.body.username || !req.body.password) {
      console.error('缺少必要的登录凭证');
      return res.status(400).json({
        code: 'MISSING_CREDENTIALS',
        message: '请提供用户名和密码',
        details: null
      });
    }
    
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('验证错误:', errors.array());
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: '请求数据验证失败',
        details: errors.array()
      });
    }

    const { username, password } = req.body;
    console.log('尝试登录用户:', username);

    try {
      // 查找用户
      const { data: user, error: userError } = await req.supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      // 故意使用相同的错误消息，防止账户枚举攻击
      if (!user) {
        console.log('用户不存在:', username);
        // 安全考虑：不明确指出是用户名错误
        return res.status(401).json({
          code: 'AUTHENTICATION_FAILED',
          message: '用户名或密码错误',
          details: null
        });
      }

      // 检查账户状态
      if (user.account_status !== 'active') {
        console.log('账户非活跃状态:', user.account_status);
        let statusMessage = '';
        
        switch(user.account_status) {
          case 'suspended':
            statusMessage = '账户已被暂停，请联系管理员';
            break;
          case 'banned':
            statusMessage = '账户已被禁止，请联系管理员';
            break;
          case 'pending':
            statusMessage = '账户正在审核中，请稍后再试';
            break;
          default:
            statusMessage = '账户状态异常，请联系管理员';
        }
        
        return res.status(403).json({
          code: 'ACCOUNT_INACTIVE',
          message: statusMessage,
          details: {
            account_status: user.account_status
          }
        });
      }

      // 验证密码
      const isPasswordValid = await verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        console.log('密码验证失败');
        // 安全考虑：不明确指出是密码错误
        return res.status(401).json({
          code: 'AUTHENTICATION_FAILED',
          message: '用户名或密码错误',
          details: null
        });
      }

      // 更新最后登录时间
      await req.supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', user.user_id);
      
      console.log('用户最后登录时间已更新:', user.user_id);

      // 生成JWT令牌
      const token = generateToken({
        user_id: user.user_id,
        username: user.username,
        role: user.role
      });
      console.log('JWT令牌生成成功');

      // 返回用户信息和令牌
      return res.json({
        code: 'LOGIN_SUCCESS',
        message: '登录成功',
        user: {
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          role: user.role,
          account_status: user.account_status
        },
        token
      });
    } catch (dbError) {
      console.error('数据库操作失败:', dbError);
      return res.status(500).json({
        code: 'DATABASE_ERROR',
        message: '登录过程中数据库操作失败',
        details: null
      });
    }
  } catch (error) {
    console.error('登录失败:', error);
    return res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误',
      details: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
}

/**
 * 获取当前用户信息
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getCurrentUser(req, res) {
  try {
    console.log('获取当前用户信息请求');
    
    // 检查认证信息
    if (!req.user || !req.user.user_id) {
      console.error('未找到用户认证信息');
      return res.status(401).json({ message: '未认证' });
    }
    
    const { user_id } = req.user;
    console.log('尝试获取用户ID:', user_id);

    // 查找用户信息
    const { data: user, error: userError } = await req.supabase
      .from('users')
      .select('user_id, username, email, role, account_status, created_at, last_login')
      .eq('user_id', user_id)
      .single();

    if (!user) {
      console.log('用户不存在:', user_id);
      return res.status(404).json({ message: '用户不存在' });
    }
    
    console.log('用户信息获取成功:', user.username);

    // 返回用户信息（不包括密码哈希）
    return res.json({
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        account_status: user.account_status,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 创建管理员账号（只能由管理员创建）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function createAdmin(req, res) {
  try {
    console.log('创建管理员账号请求:', req.body);
    
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('验证错误:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, email } = req.body;
    console.log('尝试创建管理员:', username);

    // 检查用户名是否已存在
    const { data: existingUserByUsername, error: usernameError } = await req.supabase
      .from('users')
      .select('user_id')
      .eq('username', username)
      .single();

    if (existingUserByUsername) {
      console.log('用户名已存在:', username);
      return res.status(400).json({ message: '用户名已被使用' });
    }

    // 检查邮箱是否已存在
    const { data: existingUserByEmail, error: emailError } = await req.supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single();

    if (existingUserByEmail) {
      console.log('邮箱已存在:', email);
      return res.status(400).json({ message: '邮箱已被注册' });
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);
    console.log('密码加密成功');

    // 创建管理员用户
    const { data: newAdmin, error: insertError } = await req.supabase
      .from('users')
      .insert({
        username,
        password_hash: hashedPassword,
        email,
        role: 'admin', // 设置为管理员角色
        account_status: 'active'
      })
      .select()
      .single();

    if (insertError) {
      console.error('创建管理员失败:', insertError);
      return res.status(500).json({ message: '创建管理员失败', error: insertError.message });
    }

    console.log('管理员创建成功，ID:', newAdmin.user_id);

    return res.status(201).json({
      message: '管理员账号创建成功',
      user: {
        user_id: newAdmin.user_id,
        username: newAdmin.username,
        email: newAdmin.email,
        role: newAdmin.role
      }
    });
  } catch (error) {
    console.error('创建管理员失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 获取所有用户列表（仅管理员可访问）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function getUsers(req, res) {
  try {
    console.log('获取用户列表请求');
    
    // 支持分页
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // 查询用户列表，不包含密码哈希
    const { data: users, error: queryError, count } = await req.supabase
      .from('users')
      .select('user_id, username, email, role, account_status, created_at, last_login', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    if (queryError) {
      console.error('查询用户列表失败:', queryError);
      return res.status(500).json({ message: '查询用户列表失败', error: queryError.message });
    }
    
    console.log('获取用户列表成功，总数:', count);
    
    return res.json({
      users: users || [],
      total: count || 0,
      page,
      pages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 更新用户信息（仅管理员可访问）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function updateUser(req, res) {
  try {
    console.log('更新用户信息请求:', req.params.id, req.body);
    
    const userId = req.params.id;
    const updates = req.body;
    
    // 查找用户
    const { data: user, error: userError } = await req.supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 不允许修改自己的角色
    if (updates.role && req.user.user_id === parseInt(userId)) {
      return res.status(400).json({ message: '不能修改自己的角色' });
    }
    
    // 如果要更新密码，需要加密
    if (updates.password) {
      updates.password_hash = await hashPassword(updates.password);
      delete updates.password;
    }
    
    // 更新用户信息
    const { data: updatedUser, error: updateError } = await req.supabase
      .from('users')
      .update(updates)
      .eq('user_id', userId)
      .select('user_id, username, email, role, account_status, created_at, last_login')
      .single();

    if (updateError) {
      console.error('更新用户信息失败:', updateError);
      return res.status(500).json({ message: '更新用户信息失败', error: updateError.message });
    }
    
    console.log('用户信息更新成功:', userId);
    
    return res.json({
      message: '用户信息更新成功',
      user: updatedUser
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 删除用户（仅管理员可访问）
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function deleteUser(req, res) {
  try {
    console.log('删除用户请求:', req.params.id);
    
    const userId = req.params.id;
    
    // 不允许删除自己
    if (req.user.user_id === parseInt(userId)) {
      return res.status(400).json({ message: '不能删除自己的账号' });
    }
    
    // 删除用户
    const { error: deleteError } = await req.supabase
      .from('users')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('删除用户失败:', deleteError);
      return res.status(500).json({ message: '删除用户失败', error: deleteError.message });
    }
    
    console.log('用户删除成功:', userId);
    
    return res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户失败:', error);
    return res.status(500).json({ message: '服务器内部错误', error: error.message });
  }
}

/**
 * 修改用户密码
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
async function changePassword(req, res) {
  try {
    console.log('修改密码请求接收到');
    
    // 安全检查，防止空请求体
    if (!req.body || typeof req.body !== 'object') {
      console.error('无效的请求体');
      return res.status(400).json({
        code: 'INVALID_REQUEST_BODY',
        message: '无效的请求数据格式',
        details: null
      });
    }
    
    // 验证必填字段
    const { oldPassword, newPassword, confirmPassword } = req.body;
    
    if (!oldPassword || !newPassword || !confirmPassword) {
      console.error('缺少必要的密码字段');
      return res.status(400).json({
        code: 'MISSING_FIELDS',
        message: '请提供旧密码、新密码和确认密码',
        details: null
      });
    }
    
    // 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('验证错误:', errors.array());
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: '请求数据验证失败',
        details: errors.array()
      });
    }
    
    // 验证新密码和确认密码是否一致
    if (newPassword !== confirmPassword) {
      console.error('新密码和确认密码不一致');
      return res.status(400).json({
        code: 'PASSWORD_MISMATCH',
        message: '新密码和确认密码不一致',
        details: null
      });
    }
    
    // 获取当前用户信息
    const { user_id } = req.user;
    console.log('尝试修改用户ID:', user_id, '的密码');
    
    // 查找用户
    const { data: user, error: userError } = await req.supabase
      .from('users')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (!user) {
      console.log('用户不存在:', user_id);
      return res.status(404).json({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
        details: null
      });
    }
    
    // 验证旧密码
    const isOldPasswordValid = await verifyPassword(oldPassword, user.password_hash);
    if (!isOldPasswordValid) {
      console.error('旧密码验证失败');
      return res.status(401).json({
        code: 'INVALID_OLD_PASSWORD',
        message: '旧密码错误',
        details: null
      });
    }
    
    // 验证新密码不能与旧密码相同
    const isNewPasswordSame = await verifyPassword(newPassword, user.password_hash);
    if (isNewPasswordSame) {
      console.error('新密码不能与旧密码相同');
      return res.status(400).json({
        code: 'PASSWORD_UNCHANGED',
        message: '新密码不能与旧密码相同',
        details: null
      });
    }
    
    // 加密新密码
    const hashedPassword = await hashPassword(newPassword);
    console.log('新密码加密成功');
    
    // 更新密码
    const { error: updateError } = await req.supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('user_id', user_id);

    if (updateError) {
      console.error('更新密码失败:', updateError);
      return res.status(500).json({
        code: 'UPDATE_FAILED',
        message: '密码更新失败',
        details: null
      });
    }
    
    console.log('用户密码修改成功:', user_id);
    
    return res.json({
      code: 'PASSWORD_CHANGED',
      message: '密码修改成功',
      details: null
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    return res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误',
      details: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
}

module.exports = {
  register,
  login,
  getCurrentUser,
  createAdmin,
  getUsers,
  updateUser,
  deleteUser,
  changePassword
};