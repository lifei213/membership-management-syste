import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthRoute from './components/AuthRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import CreateAdmin from './pages/admin/CreateAdmin';
import MembersManagement from './pages/admin/MembersManagement';
import MessageManagement from './pages/admin/MessageManagement';
import MemberProfile from './pages/MemberProfile';
import MemberHome from './pages/member/MemberHome';
import MessagesList from './pages/member/MessagesList';
import MessageDetail from './pages/member/MessageDetail';
import ChangePassword from './pages/member/ChangePassword';
import SendMessageToAdmin from './pages/member/SendMessageToAdmin';
import AIChat from './components/AIChat';
import './App.css';

// 会员首页组件已移至独立文件 ./pages/member/MemberHome.jsx

// 管理员首页组件
const AdminHome = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return (
    <div className="home-container">
      <h1>管理员控制台</h1>
      <p>欢迎，{user?.username || '管理员'}！</p>
      <div className="admin-actions">
        <button onClick={() => window.location.href = '/admin/users'}>用户管理</button>
        <button onClick={() => window.location.href = '/admin/create-admin'}>创建管理员</button>
      </div>
      <button className="logout-btn" onClick={() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }}>
        退出登录
      </button>
    </div>
  );
};

// 动态首页组件 - 根据用户角色显示不同内容
const Home = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    return <Navigate to="/login" />;
  }
  // 管理员直接重定向到完整的AdminDashboard
  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" />;
  }
  return <MemberHome />;
};

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* 通用首页 - 直接根据角色重定向到相应控制台 */}
          <Route path="/" element={<AuthRoute><Home /></AuthRoute>} />
          
          {/* 管理员专属路由 */}
          <Route path="/admin" element={<AuthRoute roles="admin"><AdminDashboard /></AuthRoute>} />
          <Route path="/admin/dashboard" element={<AuthRoute roles="admin"><AdminDashboard /></AuthRoute>} />
          <Route path="/admin/users" element={<AuthRoute roles="admin"><UserManagement /></AuthRoute>} />
          <Route path="/admin/create-admin" element={<AuthRoute roles="admin"><CreateAdmin /></AuthRoute>} />
          <Route path="/admin/members" element={<AuthRoute roles="admin"><MembersManagement /></AuthRoute>} />
          <Route path="/admin/messages" element={<AuthRoute roles="admin"><MessageManagement /></AuthRoute>} />
          
          {/* 会员专属路由 */}
          <Route path="/member" element={<AuthRoute roles="member"><MemberHome /></AuthRoute>} />
          <Route path="/member/profile" element={<AuthRoute roles="member"><MemberProfile /></AuthRoute>} />
          <Route path="/member/messages" element={<AuthRoute roles="member"><MessagesList /></AuthRoute>} />
          <Route path="/member/messages/:message_id" element={<AuthRoute roles="member"><MessageDetail /></AuthRoute>} />
          <Route path="/member/change-password" element={<AuthRoute roles="member"><ChangePassword /></AuthRoute>} />
          <Route path="/member/send-message" element={<AuthRoute roles="member"><SendMessageToAdmin /></AuthRoute>} />
          
          {/* 重定向其他路由到登录页 */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
        
        {/* AI智能小助手 */}
        <AIChat />
      </div>
    </Router>
  );
}

export default App;
