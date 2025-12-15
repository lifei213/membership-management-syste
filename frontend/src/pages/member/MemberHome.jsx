import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { memberApi } from '../../services/api';
import './MemberHome.css';

const MemberHome = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [unreadCount, setUnreadCount] = useState(0);
  
  // 获取未读消息数量
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await memberApi.getUnreadMessagesCount();
        if (response.success) {
          setUnreadCount(response.data.count || 0);
        }
      } catch (error) {
        console.error('获取未读消息数量失败:', error);
      }
    };
    
    fetchUnreadCount();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // 修改密码
  const handleChangePassword = () => {
    // 跳转到修改密码页面
    navigate('/member/change-password');
  };

  const handleViewProfile = () => {
    navigate('/member/profile');
  };

  const handleViewMembershipStatus = () => {
    // 这里可以实现跳转到会员状态页面
    alert('会员状态查询功能待实现');
  };

  const handleApplyMembership = () => {
    // 这里可以实现跳转到入会申请页面
    alert('入会申请功能待实现');
  };
  
  const handleViewMessages = () => {
    navigate('/member/messages');
  };

  const handleSendMessageToAdmin = () => {
    navigate('/member/send-message');
  };

  return (
    <div className="member-home-container">
      <div className="member-home-header">
        <h1>欢迎回来，{user?.username || '用户'}！</h1>
        <p>这是广西自动化学会会员管理系统的会员主页。</p>
      </div>

      <div className="member-features-section">
        <h2>会员功能</h2>
        <div className="feature-buttons-grid">
          <div className="feature-card">
            <h3>个人资料</h3>
            <p>查看和管理您的个人信息</p>
            <button 
              className="feature-button primary-button"
              onClick={handleViewProfile}
            >
              查看个人资料
            </button>
          </div>

          <div className="feature-card">
            <h3>密码管理</h3>
            <p>安全地修改您的账户密码</p>
            <button 
              className="feature-button secondary-button"
              onClick={handleChangePassword}
            >
              修改密码
            </button>
          </div>

          <div className="feature-card">
            <h3>会员状态</h3>
            <p>查询您的会员等级和状态</p>
            <button 
              className="feature-button success-button"
              onClick={handleViewMembershipStatus}
            >
              查询状态
            </button>
          </div>

          <div className="feature-card">
            <h3>入会申请</h3>
            <p>提交新的会员入会申请</p>
            <button 
              className="feature-button info-button"
              onClick={handleApplyMembership}
            >
              入会申请
            </button>
          </div>
          
          <div className="feature-card">
            <h3>消息中心</h3>
            <p>查看管理员发送的消息</p>
            <button 
              className="feature-button warning-button"
              onClick={handleViewMessages}
            >
              查看消息
              {unreadCount > 0 && (
                <span className="unread-badge">{unreadCount}</span>
              )}
            </button>
          </div>
          
          <div className="feature-card">
            <h3>联系管理员</h3>
            <p>向管理员发送消息或咨询问题</p>
            <button 
              className="feature-button info-button"
              onClick={handleSendMessageToAdmin}
            >
              发送消息
            </button>
          </div>
        </div>
      </div>

      <div className="member-actions-section">
        <h2>快捷操作</h2>
        <div className="quick-actions">
          <button 
            className="action-button profile-button"
            onClick={handleViewProfile}
          >
            查看个人资料
          </button>
          <button 
            className="action-button password-button"
            onClick={handleChangePassword}
          >
            修改密码
          </button>
          <button 
            className="action-button logout-button"
            onClick={handleLogout}
          >
            退出登录
          </button>
        </div>
      </div>

      <div className="member-announcements">
        <h2>公告</h2>
        <div className="announcement-card">
          <h3>系统更新通知</h3>
          <p>尊敬的会员，系统已完成最新更新，为您带来更好的用户体验！</p>
          <small>发布时间：2024-06-01</small>
        </div>
      </div>
    </div>
  );
};

export default MemberHome;