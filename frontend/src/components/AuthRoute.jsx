import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

/**
 * 认证路由组件 - 基于用户角色的权限控制
 * @param {Object} props
 * @param {string|string[]} props.roles - 允许访问的角色列表或单个角色
 * @param {React.ReactNode} props.children - 要渲染的子组件
 * @param {React.ReactNode} props.fallback - 未授权时显示的内容，默认重定向到登录页
 */
const AuthRoute = ({ roles = null, children, fallback = <Navigate to="/login" /> }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  // 安全地解析用户信息，处理可能的错误
  let user = null;
  try {
    const userData = localStorage.getItem('user');
    if (userData && userData !== 'undefined' && userData !== 'null') {
      user = JSON.parse(userData);
    }
  } catch (error) {
    console.error('解析用户信息失败:', error);
    // 清除无效的localStorage数据
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
  
  // 检查是否登录
  if (!token || !user) {
    return fallback;
  }
  
  // 检查角色权限 - 如果未指定角色要求，则所有登录用户都可以访问
  if (roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(user.role)) {
      return <div className="access-denied">
        <h2>访问被拒绝</h2>
        <p>您没有权限访问此页面。</p>
        <p>当前用户角色: {user.role}</p>
        <p>需要的角色: {allowedRoles.join(', ')}</p>
        <button onClick={() => navigate('/')}>返回首页</button>
      </div>;
    }
  }
  
  return children;
};

export default AuthRoute;