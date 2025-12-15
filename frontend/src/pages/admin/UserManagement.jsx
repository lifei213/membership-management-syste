import React, { useState, useEffect } from 'react';
import { authApi } from '../../services/api';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});

  // 加载用户列表
  const loadUsers = async (pageNum = 1) => {
    setLoading(true);
    setError('');
    try {
      // 修复：authApi.getUsers不接受参数
      const data = await authApi.getUsers();
      // 修复：响应拦截器已直接返回response.data，直接使用返回的数据
      setUsers(Array.isArray(data.users) ? data.users : []);
      setTotal(typeof data.total === 'number' ? data.total : 0);
      setPage(pageNum);
    } catch (err) {
      setError('加载用户列表失败，请重试');
      console.error('加载用户失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 处理删除用户
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('确定要删除此用户吗？')) return;
    
    try {
      await authApi.deleteUser(userId);
      // 重新加载用户列表
      loadUsers(page);
    } catch {
      setError('删除用户失败');
    }
  };

  // 开始编辑用户
  const startEditing = (user) => {
    setEditingUser(user.user_id);
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role,
      account_status: user.account_status
    });
  };

  // 保存用户编辑
  const saveEditUser = async (userId) => {
    try {
      await authApi.updateUser(userId, editForm);
      setEditingUser(null);
      loadUsers(page);
    } catch {
      setError('更新用户信息失败');
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  // 过滤用户（前端搜索）
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>用户管理</h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="搜索用户名或邮箱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">加载中...</div>
      ) : (
        <>
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>用户名</th>
                  <th>邮箱</th>
                  <th>角色</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>最后登录</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.user_id}>
                    <td>{user.user_id}</td>
                    <td>
                      {editingUser === user.user_id ? (
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                        />
                      ) : (
                        user.username
                      )}
                    </td>
                    <td>
                      {editingUser === user.user_id ? (
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        />
                      ) : (
                        user.email
                      )}
                    </td>
                    <td>
                      {editingUser === user.user_id ? (
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                        >
                          <option value="member">会员</option>
                          <option value="admin">管理员</option>
                        </select>
                      ) : (
                        user.role === 'admin' ? '管理员' : '会员'
                      )}
                    </td>
                    <td>
                      {editingUser === user.user_id ? (
                        <select
                          value={editForm.account_status}
                          onChange={(e) => setEditForm({...editForm, account_status: e.target.value})}
                        >
                          <option value="active">活跃</option>
                          <option value="inactive">未激活</option>
                          <option value="suspended">已暂停</option>
                        </select>
                      ) : (
                        user.account_status === 'active' ? '活跃' : 
                        user.account_status === 'inactive' ? '未激活' : '已暂停'
                      )}
                    </td>
                    <td>{new Date(user.created_at).toLocaleString()}</td>
                    <td>{user.last_login ? new Date(user.last_login).toLocaleString() : '-'}</td>
                    <td>
                      {editingUser === user.user_id ? (
                        <>
                          <button onClick={() => saveEditUser(user.user_id)} className="btn btn-success">保存</button>
                          <button onClick={cancelEdit} className="btn btn-cancel">取消</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditing(user)} className="btn btn-edit">编辑</button>
                          <button 
                            onClick={() => handleDeleteUser(user.user_id)}
                            className="btn btn-delete"
                            disabled={user.user_id === JSON.parse(localStorage.getItem('user'))?.user_id}
                          >
                            删除
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          <div className="pagination">
            <button 
              onClick={() => loadUsers(page - 1)}
              disabled={page === 1}
            >
              上一页
            </button>
            <span>第 {page} 页，共 {totalPages} 页</span>
            <button 
              onClick={() => loadUsers(page + 1)}
              disabled={page >= totalPages}
            >
              下一页
            </button>
          </div>

          {users.length === 0 && <div className="no-users">暂无用户</div>}
        </>
      )}
    </div>
  );
};

export default UserManagement;