import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { memberApi } from '../../services/api';
import './SendMessageToAdmin.css';

const SendMessageToAdmin = () => {
  const [formData, setFormData] = useState({
    subject: '',
    content: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    console.log('文件选择事件触发', e.target.files);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('选中的文件信息:', { name: file.name, size: file.size, type: file.type });
      // 检查文件大小（10MB限制）
      if (file.size > 10 * 1024 * 1024) {
        console.log('文件大小超出限制:', file.size / (1024 * 1024), 'MB');
        setMessage('文件大小不能超过10MB');
        return;
      }
      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        console.log('不支持的文件类型:', file.type);
        setMessage('不支持的文件类型');
        return;
      }
      setSelectedFile(file);
      setMessage('');
      console.log('文件成功选中并设置到状态');
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    document.getElementById('file-upload').value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.subject.trim()) {
      setMessage('请输入消息主题');
      return;
    }
    
    if (!formData.content.trim()) {
      setMessage('请输入消息内容');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      // 创建FormData对象用于文件上传
      const uploadData = new FormData();
      uploadData.append('subject', formData.subject);
      uploadData.append('content', formData.content);
      
      console.log('构建FormData对象，selectedFile存在:', !!selectedFile);
      if (selectedFile) {
        console.log('将文件添加到FormData:', { name: selectedFile.name, size: selectedFile.size, type: selectedFile.type });
        // 确保使用正确的字段名'file'，与后端期望匹配
        uploadData.append('file', selectedFile);
        // 验证FormData内容
        console.log('FormData内容验证开始:');
        const entries = {};
        for (const [key, value] of uploadData.entries()) {
          if (key === 'file') {
            entries[key] = `[文件: ${value.name}, 类型: ${value.type}, 大小: ${value.size}]`;
          } else {
            entries[key] = value;
          }
        }
        console.log('FormData完整内容:', entries);
      }
      
      console.log('准备发送消息给管理员，表单数据:', formData);
      const response = await memberApi.sendMessageToAdmin(uploadData);
      
      // 添加日志记录 - 第1条日志
      console.log('消息发送成功，响应数据:', response);
      
      setMessage(response.message || '消息发送成功！');
      
      // 重置表单
      setFormData({ subject: '', content: '' });
      setSelectedFile(null);
      document.getElementById('file-upload').value = '';
      
      // 3秒后返回会员首页
      setTimeout(() => {
        navigate('/member');
      }, 3000);
    } catch (error) {
      // 添加日志记录 - 第2条日志
      console.error('消息发送失败，错误详情:', error);
      setMessage(error.message || '消息发送失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="send-message-container">
      <h1>发送消息给管理员</h1>
      <div className="message-form-wrapper">
        {message && (
          <div className={`message ${message.includes('成功') ? 'success-message' : 'error-message'}`}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="message-form">
          <div className="form-group">
            <label htmlFor="subject">消息主题 *</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="请输入消息主题"
              maxLength={100}
              className="form-input"
            />
            <small className="char-count">{formData.subject.length}/100</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="content">消息内容 *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="请详细描述您的问题或建议..."
              rows={6}
              maxLength={1000}
              className="form-textarea"
            />
            <small className="char-count">{formData.content.length}/1000</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="file-upload">附件（可选）</label>
            <div className="file-upload-container">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                disabled={loading}
                className="file-input"
              />
              <label htmlFor="file-upload" className="file-upload-label">
                {loading ? '上传中...' : '选择文件'}
              </label>
              <small className="file-upload-hint">支持图片、PDF、Word、文本文件，最大10MB</small>
            </div>
            {selectedFile && (
              <div className="selected-file-info">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                <button 
                  type="button" 
                  className="remove-file-btn"
                  onClick={removeFile}
                  disabled={loading}
                >
                  移除
                </button>
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/member')}
              disabled={loading}
            >
              返回
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '发送中...' : '发送消息'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendMessageToAdmin;