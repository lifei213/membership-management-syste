import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { memberApi } from '../../services/api';
import './MessageManagement.css';

const MessageManagement = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // 获取消息列表
  const fetchMessages = async (page = 1, status = 'all', search = '') => {
    setLoading(true);
    setError('');
    
    try {
      console.log('获取消息列表，页码:', page, '状态:', status, '搜索:', search);
      
      // 转换前端状态筛选为后端的is_read参数
      const isReadFilter = status === 'read' ? true : status === 'unread' ? false : undefined;
      
      const response = await memberApi.getAdminMessages(page, isReadFilter, search);
      
      if (response.success) {
        setMessages(response.data.messages || []);
        setTotalPages(response.data.totalPages || 1);
        setTotalMessages(response.data.totalCount || 0);
      } else {
        throw new Error(response.message || '获取消息列表失败');
      }
    } catch (err) {
      setError(err.message || '获取消息列表失败，请重试');
      console.error('获取消息列表错误:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取消息详情
  const fetchMessageDetail = async (messageId) => {
    try {
      console.log('获取消息详情，ID:', messageId);
      
      const response = await memberApi.getAdminMessageById(messageId);
      
      if (response.success) {
        setSelectedMessage(response.data.message);
        setShowDetailModal(true);
        // 刷新消息列表以更新状态
        fetchMessages(currentPage, statusFilter, searchTerm);
      } else {
        throw new Error(response.message || '获取消息详情失败');
      }
    } catch (err) {
      setError(err.message || '获取消息详情失败，请重试');
      console.error('获取消息详情错误:', err);
    }
  };

  // 标记消息已读
  const handleMarkAsRead = async (messageId) => {
    try {
      console.log('标记消息已读，ID:', messageId);
      
      const response = await memberApi.markMessageAsRead(messageId);
      
      if (response.success) {
        // 刷新消息列表以更新状态
        fetchMessages(currentPage, statusFilter, searchTerm);
        setSuccessMessage('消息已标记为已读');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(response.message || '标记已读失败');
      }
    } catch (err) {
      setError(err.message || '标记已读失败，请重试');
      console.error('标记已读错误:', err);
    }
  };

  // 处理状态筛选变化
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // 处理搜索
  const handleSearch = () => {
    setCurrentPage(1);
  };

  // 处理搜索框回车
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 处理分页
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 处理关闭详情弹窗
  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedMessage(null);
  };

  // 返回上一页
  const handleBack = () => {
    navigate(-1);
  };

  // 格式化日期函数
  const formatDate = (dateString) => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '未知';
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
    if (!bytes || bytes < 0) return '未知大小';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  // 初始加载和筛选条件变化时重新获取数据
  useEffect(() => {
    fetchMessages(currentPage, statusFilter, searchTerm);
  }, [currentPage, statusFilter, searchTerm]);

  // 生成分页按钮
  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // 上一页
    pages.push(
      <button
        key="prev"
        className="pagination-btn"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        上一页
      </button>
    );
    
    // 页码
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    
    // 下一页
    pages.push(
      <button
        key="next"
        className="pagination-btn"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        下一页
      </button>
    );
    
    return pages;
  };

  // 使用已定义的格式化函数

  return (
    <div className="message-management-container">
      <div className="message-management-header">
        <h1 className="message-management-title">消息管理</h1>
        <button className="back-button" onClick={handleBack}>
          返回主页
        </button>
      </div>

      {/* 过滤器和搜索 */}
      <div className="filter-container">
        <label className="filter-label">消息状态：</label>
        <select
          className="status-filter"
          value={statusFilter}
          onChange={handleStatusFilterChange}
        >
          <option value="all">全部消息</option>
          <option value="unread">未读消息</option>
          <option value="read">已读消息</option>
        </select>
        
        <input
          type="text"
          className="search-input"
          placeholder="搜索发件人、主题或内容..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleSearchKeyPress}
        />
      </div>

      {/* 消息提示 */}
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {/* 消息列表 */}
      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <div className="message-list">
          {messages.length === 0 ? (
            <div className="empty-message">暂无消息</div>
          ) : (
            <>
              <table className="message-table">
                <thead>
                  <tr>
                    <th>发件人</th>
                    <th>主题</th>
                    <th>发送时间</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((message) => (
                    <tr key={message.message_id}>
                      <td>
                        {message.sender ? `${message.sender.username} (${message.sender.email})` : '未知'}
                      </td>
                      <td>{message.subject || '无主题'}</td>
                      <td>{formatDate(message.created_at)}</td>
                      <td>
                        <span className={`status-badge status-${message.is_read ? 'read' : 'unread'}`}>
                          {message.is_read ? '已读' : '未读'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="action-button view-button"
                          onClick={() => fetchMessageDetail(message.message_id)}
                        >
                          查看详情
                        </button>
                        {!message.is_read && (
                          <button
                            className="action-button mark-read-button"
                            onClick={() => handleMarkAsRead(message.message_id)}
                          >
                            标记已读
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* 分页 */}
              <div className="pagination-container">
                <div className="pagination-info">
                  共 {totalMessages} 条消息，第 {currentPage} / {totalPages} 页
                </div>
                <div className="pagination-buttons">
                  {renderPagination()}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 消息详情弹窗 */}
      {showDetailModal && selectedMessage && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">消息详情</h2>
              <button className="close-button" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="message-detail-item">
                <div className="message-detail-label">发件人</div>
                <div className="message-detail-value">
                  {selectedMessage.sender ? (
                    <>
                      <strong>{selectedMessage.sender.username}</strong>
                      <br />
                      {selectedMessage.sender.email}
                    </>
                  ) : (
                    '未知'
                  )}
                </div>
              </div>
              
              <div className="message-detail-item">
                <div className="message-detail-label">主题</div>
                <div className="message-detail-value">
                  {selectedMessage.subject || '无主题'}
                </div>
              </div>
              
              <div className="message-detail-item">
                <div className="message-detail-label">发送时间</div>
                <div className="message-detail-value">
                  {formatDate(selectedMessage.created_at)}
                </div>
              </div>
              
              <div className="message-detail-item">
                <div className="message-detail-label">状态</div>
                <div className="message-detail-value">
                  <span className={`status-badge status-${selectedMessage.is_read ? 'read' : 'unread'}`}>
                    {selectedMessage.is_read ? '已读' : '未读'}
                  </span>
                </div>
              </div>
              
              <div className="message-detail-item">
                <div className="message-detail-label">消息内容</div>
                <div className="message-detail-value message-content">
                  {selectedMessage.content || '无内容'}
                </div>
              </div>
              
              {/* 附件显示区域 */}
              {/* 调试信息：显示完整的消息对象 */}
              <div className="debug-info">
                <h4>消息详细数据：</h4>
                <pre>{JSON.stringify(selectedMessage, null, 2)}</pre>
                <div style={{ marginTop: '10px', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
                  <p><strong>文件字段存在性检查：</strong></p>
                  <p>file_name: {selectedMessage.file_name ? '✅ 存在' : '❌ 不存在'}</p>
                  <p>file_path: {selectedMessage.file_path ? '✅ 存在' : '❌ 不存在'}</p>
                  <p>file_size: {selectedMessage.file_size ? '✅ 存在' : '❌ 不存在'}</p>
                  <p>file_type: {selectedMessage.file_type ? '✅ 存在' : '❌ 不存在'}</p>
                </div>
              </div>

              {/* 附件显示区域 - 改进版 */}
              {(selectedMessage.file_name || selectedMessage.file_path || selectedMessage.file_size || selectedMessage.file_type) && (
                <div className="message-detail-item">
                  <div className="message-detail-label">附件</div>
                  <div className="message-detail-value">
                    {selectedMessage.file_name ? (
                      <a 
                        href={`${selectedMessage.file_path}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="attachment-link"
                      >
                        📎 {selectedMessage.file_name} ({formatFileSize(selectedMessage.file_size)})
                      </a>
                    ) : (
                      <div style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
                        ⚠️ 文件信息不完整 - 文件名缺失
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageManagement;