import React, { useState } from 'react';
import { authApi } from '../services/api';
import '../pages/Login.css';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({}); // 用于表单验证错误

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除错误信息
    setError('');
    // 清除特定字段的验证错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 表单验证函数
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码长度至少为6位';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理传统密码登录
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    
    // 先进行表单验证
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    console.log('提交密码登录请求:', formData);

    try {
      const response = await authApi.login(formData);
      
      // 保存token和用户信息到本地存储
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('isLoggedIn', 'true'); // 添加登录状态标志
      
      console.log('登录成功，用户角色:', response.user.role);
      
      // 登录成功，根据用户角色跳转到不同页面
      window.location.href = '/';
    } catch (err) {
      console.error('登录失败:', err);
      
      // 更详细的错误信息处理
      let errorMessage = '登录失败，请重试';
      
      if (err.response) {
        // 服务器返回了错误响应
        if (err.response.status === 401) {
          errorMessage = '用户名或密码错误，请检查后重试';
        } else if (err.response.status === 403) {
          errorMessage = err.message || '账户已被禁用，请联系管理员';
        } else if (err.response.status === 500) {
          errorMessage = '服务器内部错误，请稍后再试';
        } else {
          errorMessage = err.message || `请求错误 (${err.response.status})`;
        }
      } else if (err.request) {
        // 请求已发送但未收到响应
        errorMessage = '网络连接失败，请检查您的网络设置';
      } else {
        // 请求配置出错
        errorMessage = err.message || '登录请求配置错误';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="login-container">
      <div className="login-form">
        <h2>用户登录</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

          <div className="form-group">
          <label htmlFor="username">用户名</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="请输入您的用户名"
            required
            disabled={loading}
            className={errors.username ? 'error-input' : ''}
          />
          {errors.username && <div className="field-error">{errors.username}</div>}
        </div>

        {/* 传统密码登录表单 */}
        <form onSubmit={handlePasswordLogin}>
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="请输入您的密码"
              required
              disabled={loading}
              className={errors.password ? 'error-input' : ''}
            />
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        
        <div className="register-link">
          还没有账号？ <a href="/register">立即注册</a>
        </div>
      </div>
    </div>
  );
}

export default Login;