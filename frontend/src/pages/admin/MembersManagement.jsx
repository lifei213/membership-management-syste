import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { memberApi } from '../../services/api';
import './MembersManagement.css';

const MembersManagement = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingMember, setEditingMember] = useState(null);
    const [editedData, setEditedData] = useState({});
    const [exporting, setExporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [currentMembers, setCurrentMembers] = useState([]);
    // 添加发送消息相关状态
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [messageSubject, setMessageSubject] = useState('');
    const [messageContent, setMessageContent] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const [messageSuccess, setMessageSuccess] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

  // 返回主页函数
  const goToHome = () => {
    navigate('/');
  };
  
  // 获取真实会员数据
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // 调用真实API获取会员数据
      const response = await memberApi.getAllMembers();
      
      // 确保正确处理响应数据格式
      const membersData = Array.isArray(response?.members) ? response.members : [];
      setMembers(membersData);
    } catch (err) {
      setError('获取会员数据失败，请重试');
      console.error('获取会员数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 过滤和分页
  useEffect(() => {
    let filtered = members;
    
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = members.filter(member => 
        (member.users?.username || '').toLowerCase().includes(query) || 
        (member.users?.email || '').toLowerCase().includes(query)
      );
    }
    
    setFilteredMembers(filtered);
    
    // 计算总页数
    const total = Math.ceil(filtered.length / pageSize);
    setTotalPages(total > 0 ? total : 1);
    
    // 确保当前页不超过总页数
    if (currentPage > total) {
      setCurrentPage(1);
    }
  }, [members, searchQuery, pageSize, currentPage]);

  // 更新当前页显示的会员
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setCurrentMembers(filteredMembers.slice(startIndex, endIndex));
  }, [filteredMembers, currentPage, pageSize]);

  // 初始加载
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // 处理搜索
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // 重置为第一页
  };

  // 开始编辑会员
  const startEditing = (member) => {
    setEditingMember(member.member_id);
    setEditedData({
      username: member.users?.username || '',
      email: member.users?.email || '',
      role: member.users?.role || 'member',
      membership_level: member.membership_level || ''
    });
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingMember(null);
    setEditedData({});
  };

  // 处理编辑数据变化
  const handleEditChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 保存会员编辑
  const saveMemberEdit = async (memberId) => {
    try {
      setError('');
      
      // 验证数据
      if (!editedData.username || !editedData.email) {
        throw new Error('用户名和邮箱不能为空');
      }
      
      // 调用真实API更新会员数据
      const updatedMember = await memberApi.updateMember(memberId, editedData);
      
      // 更新本地数据
  const updatedMembers = members.map(member => 
    member.member_id === memberId ? { ...member, ...updatedMember } : member
  );
      
      setMembers(updatedMembers);
      setEditingMember(null);
      setEditedData({});
    } catch (err) {
      setError(err.message || '保存失败，请重试');
      console.error('保存会员编辑失败:', err);
    }
  };

  // 删除会员
  const deleteMember = async (memberId) => {
    if (window.confirm('确定要删除这个会员吗？此操作不可撤销。')) {
      try {
        setError('');
        
        // 调用真实API删除会员 - 使用正确的member_id字段
        await memberApi.deleteMember(memberId);
        
        // 更新本地数据 - 使用member_id字段进行过滤
        const updatedMembers = members.filter(member => member.member_id !== memberId);
        setMembers(updatedMembers);
      } catch (err) {
        setError(err.message || '删除失败，请重试');
        console.error('删除会员失败:', err);
      }
    }
  };

  // 导出Excel
  const exportMembersToExcel = async () => {
    try {
      setExporting(true);
      setError('');
      
      // 调用真实API导出会员数据
      const blob = await memberApi.exportMembersToExcel();
      
      // 创建下载链接并触发下载
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      
      // 设置文件名，包含当前日期
      const today = new Date();
      const dateStr = today.getFullYear() + 
                      String(today.getMonth() + 1).padStart(2, '0') + 
                      String(today.getDate()).padStart(2, '0');
      link.setAttribute('download', `会员数据_${dateStr}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      setError('导出会员数据失败，请重试');
      console.error('导出Excel失败:', err);
    } finally {
      setExporting(false);
    }
  };

  // 分页处理
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 渲染分页控件
  const renderPagination = () => {
    const pageNumbers = [];
    
    // 简单分页逻辑
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="pagination">
        <button 
          onClick={goToPreviousPage} 
          disabled={currentPage === 1}
        >
          上一页
        </button>
        
        {pageNumbers.map(page => (
          <button 
            key={page}
            className={currentPage === page ? 'active' : ''}
            onClick={() => goToPage(page)}
          >
            {page}
          </button>
        ))}
        
        <button 
          onClick={goToNextPage} 
          disabled={currentPage === totalPages}
        >
          下一页
        </button>
      </div>
    );
  };

  // 渲染会员行
  const renderMemberRow = (member, index) => {
    // 确保key的唯一性，使用member.member_id或索引作为后备
    const rowKey = member.member_id ? `member-${member.member_id}` : `member-index-${index}`;
    
    const formattedDate = member.createdAt 
      ? new Date(member.createdAt).toLocaleString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      : '-';

    if (editingMember === member.member_id) {
      return (
        <tr key={`edit-${rowKey}`}>
          <td>
            <input
              type="text"
              value={editedData.username}
              onChange={(e) => handleEditChange('username', e.target.value)}
              placeholder="用户名"
            />
          </td>
          <td>
            <input
              type="email"
              value={editedData.email}
              onChange={(e) => handleEditChange('email', e.target.value)}
              placeholder="邮箱"
            />
          </td>
          <td>
            <select
              value={editedData.role}
              onChange={(e) => handleEditChange('role', e.target.value)}
            >
              <option value="member">会员</option>
              <option value="admin">管理员</option>
            </select>
          </td>
          <td>
            <select
              value={editedData.membership_level}
              onChange={(e) => handleEditChange('membership_level', e.target.value === '' ? null : e.target.value)}
            >
              <option value="">无</option>
              <option value="理事">理事</option>
              <option value="秘书长">秘书长</option>
              <option value="副理事长">副理事长</option>
              <option value="理事长">理事长</option>
            </select>
          </td>
          <td>{formattedDate}</td>
          <td>
            <button 
              className="btn btn-success"
              onClick={() => saveMemberEdit(member.member_id)}
            >
              保存
            </button>
            <button 
              className="btn btn-cancel"
              onClick={cancelEditing}
            >
              取消
            </button>
          </td>
        </tr>
      );
    }

    // 格式化活跃时间
    const lastActiveDate = member.users?.last_active 
      ? new Date(member.users.last_active).toLocaleString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      : '-';
    
    // 格式化登录时间
    const lastLoginDate = member.users?.last_login 
      ? new Date(member.users.last_login).toLocaleString('zh-CN', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      : '-';
    
    // 计算用户状态
    const getStatus = () => {
      if (!member.users?.last_active) return { text: '未活跃', class: 'status-inactive' };
      
      const now = new Date();
      const lastActive = new Date(member.users.last_active);
      const diffMinutes = (now - lastActive) / (1000 * 60);
      
      if (diffMinutes < 5) return { text: '在线', class: 'status-online' };
      if (diffMinutes < 30) return { text: '活跃', class: 'status-active' };
      return { text: '离线', class: 'status-offline' };
    };
    
    const status = getStatus();
    
    return (
      <tr key={`view-${rowKey}`}>
        <td>{member.users?.username || ''}</td>
        <td>{member.users?.email || ''}</td>
        <td>
          <span className={`role-badge ${member.users?.role || 'member'}`}>
            {member.users?.role === 'admin' ? '管理员' : '会员'}
          </span>
        </td>
        <td>{(['理事', '秘书长', '副理事长', '理事长'].includes(member.membership_level)) ? member.membership_level : '-'}</td>
        <td>
          <span className={`status-badge ${status.class}`}>
            {status.text}
          </span>
        </td>
        <td>{lastActiveDate}</td>
        <td>{lastLoginDate}</td>
        <td>
          <button 
            className="btn btn-edit"
            onClick={() => startEditing(member)}
          >
            编辑
          </button>
          <button 
            className="btn btn-delete"
            onClick={() => deleteMember(member.member_id)}
          >
            删除
          </button>
          <button 
            className="btn btn-message"
            onClick={() => openMessageModal(member)}
          >
            发送消息
          </button>
        </td>
      </tr>
    );
  };

  // 主渲染逻辑
  const renderContent = () => {
    if (loading) {
      return <div key="loading" className="loading">加载中...</div>;
    }

    if (error) {
      return (
        <div key="error-content">
          <div key="error" className="error-message">{error}</div>
          <div key="no-members" className="no-members">无法加载会员数据</div>
        </div>
      );
    }

    return (
      <React.Fragment key="content">
        <div key="table-container" className="members-table-container">
          {currentMembers.length === 0 ? (
            <div key="no-members" className="no-members">
              {searchQuery ? '没有找到匹配的会员' : '当前没有会员'}
            </div>
          ) : (
            <table key="members-table" className="members-table">
              <thead>
          <tr>
            <th>用户名</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>会员等级</th>
            <th>活跃状态</th>
            <th>最后活跃</th>
            <th>最后登录</th>
            <th>操作</th>
          </tr>
        </thead>
              <tbody>
                {currentMembers.map(renderMemberRow)}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div key="pagination">
            {renderPagination()}
          </div>
        )}

        <div key="stats-info" className="stats-info">
          <p>共 {members.length} 个会员，筛选后 {filteredMembers.length} 个会员</p>
        </div>
      </React.Fragment>
    );
  };

  // 打开发送消息弹窗
  const openMessageModal = (member) => {
    setSelectedMember(member);
    setMessageSubject('');
    setMessageContent('');
    setSelectedFile(null);
    setMessageSuccess('');
    setShowMessageModal(true);
  };

  // 关闭发送消息弹窗
  const closeMessageModal = () => {
    setShowMessageModal(false);
    setSelectedMember(null);
    setMessageSubject('');
    setMessageContent('');
    setSelectedFile(null);
    setMessageSuccess('');
  };

  // 处理文件选择
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 检查文件大小（限制为10MB）
      if (file.size > 10 * 1024 * 1024) {
        setError('文件大小不能超过10MB');
        return;
      }
      
      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('只支持JPG、PNG、GIF、PDF和Word文件');
        return;
      }
      
      setSelectedFile(file);
      setError('');
    }
  };

  // 移除选中的文件
  const removeFile = () => {
    setSelectedFile(null);
  };

  // 发送消息给会员
  const sendMessage = async () => {
    if (!selectedMember || !messageSubject.trim() || !messageContent.trim()) {
      setError('请填写主题和内容');
      return;
    }

    try {
      setSendingMessage(true);
      setError('');
      setMessageSuccess('');

      console.log('准备发送消息，会员ID:', selectedMember.member_id || '未定义');
      
      // 调用API发送消息，确保使用正确的member_id
      const memberId = selectedMember.member_id || selectedMember.id;
      if (!memberId) {
        throw new Error('无法获取会员ID');
      }

      // 创建FormData对象
      const formData = new FormData();
      formData.append('subject', messageSubject.trim());
      formData.append('content', messageContent.trim());
      
      // 如果有文件，添加到FormData
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      // 调用API发送消息
      const response = await memberApi.sendMessageToMember(memberId, formData);

      console.log('消息发送API响应:', response);
      setMessageSuccess('消息发送成功！');
      // 清空内容但保持弹窗打开，方便继续发送给同一会员
      setMessageSubject('');
      setMessageContent('');
      setSelectedFile(null);
    } catch (err) {
      console.error('发送消息失败:', err);
      // 更详细的错误信息
      const errorMessage = err.response?.data?.message || err.message || '发送消息失败，请重试';
      setError(errorMessage);
    } finally {
      setSendingMessage(false);
    }
  };

  // 渲染发送消息弹窗
  const renderMessageModal = () => {
    if (!showMessageModal || !selectedMember) return null;

    return (
      <div className="modal-overlay" onClick={closeMessageModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>发送消息给会员</h3>
            <button className="modal-close" onClick={closeMessageModal}>×</button>
          </div>
          
          <div className="modal-body">
            <div className="member-info">
              <p><strong>会员：</strong>{selectedMember.users?.username || ''}</p>
              <p><strong>邮箱：</strong>{selectedMember.users?.email || ''}</p>
            </div>
            
            {error && (
              <div className="error-message modal-error">{error}</div>
            )}
            
            {messageSuccess && (
              <div className="success-message modal-success">{messageSuccess}</div>
            )}
            
            <div className="form-group">
              <label htmlFor="messageSubject">主题 *</label>
              <input
                id="messageSubject"
                type="text"
                value={messageSubject}
                onChange={(e) => setMessageSubject(e.target.value)}
                placeholder="请输入消息主题"
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="messageContent">内容 *</label>
              <textarea
                id="messageContent"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="请输入消息内容"
                className="form-control"
                rows={6}
              />
            </div>
            
            {/* 文件上传区域 */}
            <div className="form-group">
              <label>附件</label>
              <div className="file-upload-container">
                <label htmlFor="fileUpload" className="file-upload-label">
                  选择文件 (最大10MB，支持JPG、PNG、GIF、PDF、Word)
                  <input
                    id="fileUpload"
                    type="file"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                </label>
                
                {selectedFile && (
                  <div className="selected-file-info">
                    <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                    <button 
                      type="button" 
                      className="remove-file-btn"
                      onClick={removeFile}
                    >
                      移除
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              className="btn btn-cancel"
              onClick={closeMessageModal}
              disabled={sendingMessage}
            >
              取消
            </button>
            <button 
              className="btn btn-primary"
              onClick={sendMessage}
              disabled={sendingMessage || !messageSubject.trim() || !messageContent.trim()}
            >
              {sendingMessage ? '发送中...' : '发送消息'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="members-management">
      <div className="page-header">
        <div className="header-left">
          <button className="btn btn-back" onClick={goToHome}>
            ← 返回主页
          </button>
          <h1>会员管理</h1>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-export" 
            onClick={exportMembersToExcel}
            disabled={exporting || members.length === 0}
          >
            {exporting ? '导出中...' : '导出Excel'}
          </button>
          <div className="search-bar">
            <input
              type="text"
              placeholder="搜索用户名或邮箱..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>
      </div>

      {renderContent()}
      {renderMessageModal()}
    </div>
  );
};

export default MembersManagement;