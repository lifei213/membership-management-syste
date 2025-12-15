import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { memberApi } from '../../services/api';
import './MessageDetail.css';

const MessageDetail = () => {
  const navigate = useNavigate();
  const { message_id } = useParams();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 获取消息详情
  const fetchMessageDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!message_id) {
        throw new Error('消息ID不存在');
      }
      
      const response = await memberApi.getMessageById(message_id);
      
      if (response.success) {
        setMessage(response.data.message);
      } else {
        setError(response.message || '获取消息详情失败');
      }
    } catch (err) {
      console.error('获取消息详情时出错:', err);
      setError(err.message || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [message_id]);

  useEffect(() => {
    fetchMessageDetail();
  }, [fetchMessageDetail]);

  // 返回消息列表
  const handleBackToList = () => {
    navigate('/member/messages');
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <div className="message-detail-container">
      <div className="message-detail-header">
        <h1>消息详情</h1>
        <button className="back-button" onClick={handleBackToList}>
          返回消息列表
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载消息中...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : !message ? (
        <div className="not-found">
          <p>消息不存在或已被删除</p>
        </div>
      ) : (
        <div className="message-card">
          <div className="message-meta">
            <div className="message-status">
              {message.is_read ? (
                <span className="read-badge">已读消息</span>
              ) : (
                <span className="unread-badge">未读消息</span>
              )}
            </div>
            <div className="message-date">
              发送时间：{formatDate(message.created_at)}
            </div>
          </div>
          
          <div className="message-header">
            <h2 className="message-subject">{message.subject || '无主题'}</h2>
            <div className="message-sender">
              发送者：管理员
            </div>
          </div>
          
          <div className="message-content">
            <div className="content-body">
              {message.content || '该消息没有内容'}
            </div>
            
            {/* 附件显示区域 */}
            {(message.file_name || message.file_path || message.file_size || message.file_type) && (
              <div className="message-attachments">
                <div className="attachment-label">附件：</div>
                <div className="attachment-item">
                  <a 
                    href={`${message.file_path}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="attachment-link"
                  >
                    {message.file_name} ({formatFileSize(message.file_size)})
                  </a>
                </div>
              </div>
            )}
          </div>
          
          <div className="message-footer">
            <div className="message-info">
              消息ID：{message.message_id}
            </div>
            {message.receiver_id && (
              <div className="recipient-info">
                接收者ID：{message.receiver_id}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageDetail;