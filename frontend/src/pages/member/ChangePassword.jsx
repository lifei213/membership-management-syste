import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';
import './ChangePassword.css';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success'); // 'success' or 'error'

  // 处理表单输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // 清除之前的消息
    if (message) {
      setMessage('');
    }
  };

  // 表单验证
  const validateForm = () => {
    const newErrors = {};
    
    // 验证旧密码
    if (!formData.oldPassword.trim()) {
      newErrors.oldPassword = '请输入旧密码';
    }
    
    // 验证新密码
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = '请输入新密码';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = '新密码长度不能少于6个字符';
    }
    
    // 验证确认密码
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = '请确认新密码';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '新密码和确认密码不一致';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 清除之前的消息
    setMessage('');
    
    // 表单验证
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // 调用修改密码API
      const response = await authApi.changePassword(formData);
      
      console.log('密码修改成功:', response);
      setMessageType('success');
      setMessage(response.message || '密码修改成功！');
      
      // 重置表单
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // 5秒后自动返回会员中心
      setTimeout(() => {
        navigate('/member');
      }, 5000);
      
    } catch (error) {
      console.error('密码修改失败:', error);
      setMessageType('error');
      
      // 处理错误信息
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else if (error.response?.data?.errors) {
        // 处理验证错误
        const validationErrors = {};
        error.response.data.errors.forEach(err => {
          if (err.param) {
            validationErrors[err.param] = err.msg;
          }
        });
        setErrors(validationErrors);
        setMessage('请检查输入信息');
      } else {
        setMessage('密码修改失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 处理返回按钮点击
  const handleBack = () => {
    navigate('/member');
  };

  return (
    <div className="change-password-container">
      <div className="change-password-header">
        <h1>修改密码</h1>
        <p>请输入您的旧密码和新密码</p>
      </div>
      
      <div className="change-password-form-wrapper">
        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="form-group">
            <label htmlFor="oldPassword">旧密码 <span className="required">*</span></label>
            <input
              type="password"
              id="oldPassword"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              placeholder="请输入您的旧密码"
              disabled={loading}
            />
            {errors.oldPassword && (
              <span className="error-message">{errors.oldPassword}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword">新密码 <span className="required">*</span></label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="请输入新密码（至少6个字符）"
              disabled={loading}
            />
            {errors.newPassword && (
              <span className="error-message">{errors.newPassword}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">确认新密码 <span className="required">*</span></label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="请再次输入新密码"
              disabled={loading}
            />
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? '修改中...' : '确认修改'}
            </button>
            <button 
              type="button" 
              className="back-button"
              onClick={handleBack}
              disabled={loading}
            >
              返回会员中心
            </button>
          </div>
        </form>
        
        <div className="password-tips">
          <h3>密码安全提示</h3>
          <ul>
            <li>密码长度至少为6个字符</li>
            <li>建议使用字母、数字和特殊字符的组合</li>
            <li>请勿使用与其他网站相同的密码</li>
            <li>定期更换密码以保障账户安全</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;