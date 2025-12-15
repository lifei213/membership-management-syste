import axios from 'axios';

// 根据环境变量设置API基础URL
const getApiBaseUrl = () => {
  // 开发环境使用代理到本地服务器
  if (import.meta.env.DEV) {
    return '/api';
  }
  // 生产环境使用环境变量，确保指向正确的API地址
  // 注意：在GitHub Pages部署中，需要设置完整的API URL
  return import.meta.env.VITE_API_BASE_URL;
};

// 创建axios实例
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000
  // 注意：不设置默认的Content-Type，让浏览器根据请求类型自动处理
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 增强错误处理
api.interceptors.response.use(
  response => {
    // 统一返回响应数据，确保数据格式一致性
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  error => {
    // 构建统一的错误对象
    let errorObj = {
      code: 'UNKNOWN_ERROR',
      message: '请求处理失败，请稍后再试',
      details: null
    };

    if (error.response) {
      // 服务器返回错误状态码
      console.error('API Error:', error.response.data);
      
      // 处理401未授权错误
      if (error.response.status === 401) {
        console.warn('用户认证失败，重定向到登录页');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        // 仅在当前不在登录页时重定向，避免循环重定向
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        errorObj = {
          code: 'UNAUTHORIZED',
          message: '登录已过期，请重新登录',
          details: error.response.data
        };
      }
      // 处理403禁止访问错误
      else if (error.response.status === 403) {
        errorObj = {
          code: 'FORBIDDEN',
          message: '您没有权限执行此操作',
          details: error.response.data
        };
      }
      // 处理404资源不存在错误
      else if (error.response.status === 404) {
        errorObj = {
          code: 'NOT_FOUND',
          message: '请求的资源不存在',
          details: error.response.data
        };
      }
      // 处理429请求频率限制错误
      else if (error.response.status === 429) {
        errorObj = {
          code: 'TOO_MANY_REQUESTS',
          message: '请求过于频繁，请稍后再试',
          details: error.response.data
        };
      }
      // 处理5xx服务器错误
      else if (error.response.status >= 500) {
        errorObj = {
          code: 'SERVER_ERROR',
          message: '服务器内部错误，请稍后再试',
          details: error.response.data
        };
      }
      // 处理其他错误状态码
      else {
        // 尝试从响应数据中提取错误信息
        if (error.response.data) {
          errorObj = {
            code: error.response.status.toString(),
            message: error.response.data.message || error.response.data.error || '操作失败',
            details: error.response.data
          };
        } else {
          errorObj = {
            code: error.response.status.toString(),
            message: `请求失败 (状态码: ${error.response.status})`,
            details: null
          };
        }
      }
      
      return Promise.reject(errorObj);
    } else if (error.request) {
      // 请求已发送但未收到响应
      console.error('Network Error:', error.request);
      // 检查是否是超时错误
      if (error.message && error.message.includes('timeout')) {
        errorObj = {
          code: 'TIMEOUT',
          message: '请求超时，请检查网络连接或稍后再试',
          details: null
        };
      } else {
        errorObj = {
          code: 'NETWORK_ERROR',
          message: '网络连接失败，请检查您的网络设置',
          details: null
        };
      }
      return Promise.reject(errorObj);
    } else {
      // 请求配置出错
      console.error('Request Error:', error.message || 'Unknown error');
      errorObj = {
        code: 'REQUEST_ERROR',
        message: error.message || '请求配置错误',
        details: null
      };
      return Promise.reject(errorObj);
    }
  }
);

// 认证相关API
export const authApi = {
  // 用户注册
  register: (userData) => api.post('/auth/register', userData),
  
  // 用户登录
  login: (credentials) => api.post('/auth/login', credentials),
  
  // 人脸登录
  faceLogin: (faceData) => api.post('/auth/face-login', faceData),
  
  // 获取当前用户信息
  getCurrentUser: () => api.get('/auth/me'),
  
  // 修改密码
  changePassword: (passwordData) => {
    console.log('调用修改密码API，路径: /auth/change-password');
    return api.post('/auth/change-password', passwordData);
  },
  
  // 创建管理员账号（仅管理员可用）
  createAdmin: (adminData) => api.post('/auth/create-admin', adminData),
  
  // 获取所有用户（仅管理员可用）
  getUsers: (params) => api.get('/auth/users', { params }),
  
  // 更新用户信息（仅管理员可用）
  updateUser: (userId, userData) => api.put(`/auth/users/${userId}`, userData),
  
  // 删除用户（仅管理员可用）
  deleteUser: (userId) => api.delete(`/auth/users/${userId}`)
};

// 会员管理相关API
export const memberApi = {
  // 创建会员资料
  createMemberProfile: (memberData) => api.post('/members/profile', memberData),
  // 获取所有会员（仅管理员可用）
  getAllMembers: () => api.get('/members/all'),
  
  // 获取特定会员信息（仅管理员可用）
  getMember: (memberId) => api.get(`/members/${memberId}`),
  
  // 更新会员信息（仅管理员可用）
  updateMember: (memberId, memberData) => api.put(`/members/${memberId}`, memberData),
  
  // 删除会员（仅管理员可用）
  deleteMember: (memberId) => api.delete(`/members/${memberId}`),
  
  // 获取当前登录会员的信息
  getMyProfile: () => api.get('/members/profile'),
  
  // 更新当前登录会员的个人资料
  updateMyProfile: (profileData) => api.put('/members/profile', profileData),
  
  // 发送消息给会员（仅管理员可用）
  sendMessageToMember: (memberId, messageData) => {
    // 如果是FormData（文件上传），确保不设置Content-Type，让浏览器自动处理
    if (messageData instanceof FormData) {
      console.log('检测到FormData对象，将让浏览器自动处理Content-Type');
      // 确保不设置Content-Type，允许浏览器自动设置带边界的multipart/form-data
      return api.post(`/members/${memberId}/message`, messageData, {});
    }
    return api.post(`/members/${memberId}/message`, messageData);
  },
  
  // 导出会员数据为Excel文件（仅管理员可用）
  exportMembersToExcel: async () => {
    // 使用不经过响应拦截器的直接调用，因为需要处理文件流
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('/api/members/export/excel', {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        },
        responseType: 'blob' // 重要：设置响应类型为blob
      });
      // 直接返回blob对象而不是整个响应
      return response.data;
    } catch (error) {
      // 处理错误，保持与拦截器一致的错误格式
      if (error.response) {
        throw error.response.data || { message: '导出失败' };
      } else {
        throw { message: error.message || '网络错误' };
      }
    }
  },
  
  // 消息相关接口
  getMemberMessages: (page = 1, pageSize = 10) => api.get(`/members/messages?page=${page}&pageSize=${pageSize}`),
  getMessageById: (messageId) => api.get(`/members/messages/${messageId}`),
  getUnreadMessagesCount: () => api.get('/members/messages/unread/count'),
  // 会员发送消息给管理员
  sendMessageToAdmin: (messageData) => {
    console.log('调用发送消息给管理员API，路径: /members/message-to-admin');
    // 如果是FormData（文件上传），确保不设置Content-Type，让浏览器自动处理
    if (messageData instanceof FormData) {
      console.log('检测到FormData对象，将让浏览器自动处理Content-Type');
      // 确保不设置Content-Type，允许浏览器自动设置带边界的multipart/form-data
      return api.post('/members/message-to-admin', messageData, {});
    }
    return api.post('/members/message-to-admin', messageData);
  },
  // 管理员消息管理相关接口
  getAdminMessages: (page = 1, is_read, search = '') => {
    let query = `?page=${page}`;
    if (is_read !== undefined) {
      query += `&is_read=${is_read}`;
    }
    if (search.trim()) {
      query += `&search=${encodeURIComponent(search.trim())}`;
    }
    return api.get(`/members/admin/messages${query}`);
  },
  getAdminMessageById: (messageId) => api.get(`/members/admin/messages/${messageId}`),
  markMessageAsRead: (messageId) => api.put(`/members/admin/messages/${messageId}/read`)
};

export default api;