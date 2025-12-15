import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { memberApi } from '../../services/api';
import './MessagesList.css';

const MessagesList = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // 获取消息列表
  const fetchMessages = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const response = await memberApi.getMemberMessages(page, pageSize);
      
      if (response.success) {
        setMessages(response.data.messages || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalCount(response.data.totalCount || 0);
        setCurrentPage(page);
      } else {
        setError(response.message || '获取消息列表失败');
      }
    } catch (err) {
      console.error('获取消息列表时出错:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // 查看消息详情
  const handleViewMessage = (messageId) => {
    navigate(`/member/messages/${messageId}`);
  };

  // 翻页处理
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchMessages(newPage);
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="messages-list-container">
      <div className="messages-header">
        <h1>我的消息</h1>
        <button className="back-button" onClick={() => navigate('/member')}>
          返回首页
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载消息中...</p>
        </div>
      ) : (
        <>
          <div className="messages-stats">
            <p>共 {totalCount} 条消息</p>
          </div>

          {messages.length === 0 ? (
            <div className="no-messages">
              <p>暂无消息</p>
            </div>
          ) : (
            <div className="messages-table-container">
              <table className="messages-table">
                <thead>
                  <tr>
                    <th>状态</th>
                    <th>主题</th>
                    <th>发送者</th>
                    <th>发送时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((message) => (
                    <tr key={message.message_id} className={!message.is_read ? 'unread-message' : ''}>
                      <td>
                        {!message.is_read ? (
                          <span className="unread-badge-small">未读</span>
                        ) : (
                          <span className="read-badge">已读</span>
                        )}
                      </td>
                      <td className="message-subject">{message.subject || '无主题'}</td>
                      <td>管理员</td>
                      <td>{formatDate(message.created_at)}</td>
                      <td>
                        <button 
                          className="view-button"
                          onClick={() => handleViewMessage(message.message_id)}
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="page-button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                上一页
              </button>
              
              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    className={`page-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button 
                className="page-button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MessagesList;