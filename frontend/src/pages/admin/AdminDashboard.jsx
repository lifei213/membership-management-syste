import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  // 判断当前活动菜单
  const getActiveClass = (path) => {
    return location.pathname === path ? 'menu-item active' : 'menu-item';
  };

  // 模拟数据 - 在实际应用中应该从API获取
  const dashboardStats = {
    totalUsers: 120,
    totalMembers: 85,
    totalAdmins: 5,
    todayLogins: 12
  };

  const handleViewSystemLogs = () => {
    alert('系统日志功能待实现');
  };

  const handleViewStatistics = () => {
    alert('统计报表功能待实现');
  };

  const handleViewSystemSettings = () => {
    alert('系统设置功能待实现');
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>广西自动化学会管理系统 - 管理员控制台</h1>
        <div className="admin-info">
          <span className="user-greeting">欢迎，{user?.username || '管理员'}</span>
          <div className="header-actions">
            <button 
              className="header-btn settings-btn"
              onClick={handleViewSystemSettings}
              title="系统设置"
            >
              ⚙️
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              退出登录
            </button>
          </div>
        </div>
      </div>
      
      <div className="admin-menu">
        <button 
          onClick={() => handleNavigate('/admin/dashboard')} 
          className={getActiveClass('/admin/dashboard')}
          aria-current={location.pathname === '/admin/dashboard' ? 'page' : undefined}
        >
          🏠 控制台
        </button>
        <button 
          onClick={() => handleNavigate('/admin/users')} 
          className={getActiveClass('/admin/users')}
          aria-current={location.pathname === '/admin/users' ? 'page' : undefined}
        >
          👥 用户管理
        </button>
        <button 
          onClick={() => handleNavigate('/admin/members')} 
          className={getActiveClass('/admin/members')}
          aria-current={location.pathname === '/admin/members' ? 'page' : undefined}
        >
          📋 会员管理
        </button>
        <button 
          onClick={() => handleNavigate('/admin/messages')} 
          className={getActiveClass('/admin/messages')}
          aria-current={location.pathname === '/admin/messages' ? 'page' : undefined}
        >
          💬 消息管理
        </button>
        <button 
          onClick={() => handleNavigate('/admin/create-admin')} 
          className={getActiveClass('/admin/create-admin')}
          aria-current={location.pathname === '/admin/create-admin' ? 'page' : undefined}
        >
          👑 创建管理员
        </button>
      </div>
      
      <div className="admin-content">
        <div className="dashboard-overview">
          <h2>系统概览</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>用户总数</h3>
              <p className="stat-number">{dashboardStats.totalUsers}</p>
              <small>注册用户数量</small>
            </div>
            <div className="stat-card">
              <h3>会员总数</h3>
              <p className="stat-number">{dashboardStats.totalMembers}</p>
              <small>正式会员数量</small>
            </div>
            <div className="stat-card">
              <h3>管理员总数</h3>
              <p className="stat-number">{dashboardStats.totalAdmins}</p>
              <small>系统管理员数量</small>
            </div>
            <div className="stat-card">
              <h3>今日登录</h3>
              <p className="stat-number">{dashboardStats.todayLogins}</p>
              <small>今日活跃用户数</small>
            </div>
          </div>
        </div>
        
        <div className="dashboard-actions">
          <h3>快捷操作</h3>
          <div className="actions-grid">
            <button 
              onClick={() => handleNavigate('/admin/users')} 
              className="action-btn primary"
              title="管理所有用户账户"
            >
              <span>👥</span>
              管理用户
            </button>
            <button 
              onClick={() => handleNavigate('/admin/members')} 
              className="action-btn secondary"
              title="管理会员信息"
            >
              <span>📋</span>
              会员管理
            </button>
            <button 
              onClick={() => handleNavigate('/admin/create-admin')} 
              className="action-btn success"
              title="添加新的系统管理员"
            >
              <span>👑</span>
              创建管理员
            </button>
            <button 
              onClick={() => handleNavigate('/admin/messages')} 
              className="action-btn info"
              title="查看和管理所有消息"
            >
              <span>💬</span>
              消息管理
            </button>
            <button 
              onClick={handleViewSystemLogs} 
              className="action-btn danger"
              title="查看系统操作日志"
            >
              <span>📝</span>
              系统日志
            </button>
            <button 
              onClick={handleViewStatistics} 
              className="action-btn info"
              title="查看系统统计报表"
            >
              <span>📊</span>
              统计报表
            </button>
            <button 
              onClick={handleViewSystemSettings} 
              className="action-btn warning"
              title="管理系统全局设置"
            >
              <span>⚙️</span>
              系统设置
            </button>
          </div>
        </div>

        <div className="dashboard-navigation-panel">
          <h3>功能导航</h3>
          <div className="navigation-cards">
            <div className="nav-card">
              <h4>用户与会员管理</h4>
              <div className="nav-card-buttons">
                <button 
                  onClick={() => handleNavigate('/admin/users')}
                  className="nav-button"
                >
                  👥 用户列表
                </button>
                <button 
                  onClick={() => handleNavigate('/admin/members')}
                  className="nav-button"
                >
                  📋 会员管理
                </button>
              </div>
            </div>
            
            <div className="nav-card">
              <h4>管理员与系统</h4>
              <div className="nav-card-buttons">
                <button 
                  onClick={() => handleNavigate('/admin/create-admin')}
                  className="nav-button"
                >
                  👑 创建管理员
                </button>
                <button 
                  onClick={handleViewSystemLogs}
                  className="nav-button"
                >
                  📝 系统日志
                </button>
              </div>
            </div>
            
            <div className="nav-card">
              <h4>数据分析</h4>
              <div className="nav-card-buttons">
                <button 
                  onClick={handleViewStatistics}
                  className="nav-button"
                >
                  📊 统计报表
                </button>
                <button 
                  onClick={handleViewSystemSettings}
                  className="nav-button"
                >
                  ⚙️ 系统设置
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;