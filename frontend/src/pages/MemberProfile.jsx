import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { memberApi } from '../services/api';
import '../styles/MemberProfile.css';

const MemberProfile = () => {
  const navigate = useNavigate();
  const [memberProfile, setMemberProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    gender: '',
    birth_date: '',
    phone: '',
    address: ''
    // 以下字段在Supabase中不存在，暂时注释掉
    // email: '',
    // avatar: '',
    // education_level: '',
    // occupation: '',
    // emergency_contact: '',
    // health_info: ''
  });
  
  // 返回会员首页
  const handleBackToHome = () => {
    // 确保导航到正确的会员首页路径
    navigate('/member');
  };

  // 获取个人资料
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await memberApi.getMyProfile();
      if (response && response.member) {
        const memberData = response.member;
        setMemberProfile(memberData);
        setFormData({
          full_name: memberData.full_name || '',
          gender: memberData.gender || '',
          birth_date: memberData.birth_date || '',
          phone: memberData.phone || '',
          address: memberData.address || ''
          // 以下字段在Supabase中不存在，暂时注释掉
          // email: memberData.email || '',
          // avatar: memberData.avatar || '',
          // education_level: memberData.education_level || '',
          // occupation: memberData.occupation || '',
          // emergency_contact: memberData.emergency_contact || '',
          // health_info: memberData.health_info || ''
        });
      }
    } catch (err) {
      // 检查错误消息是否包含'会员信息不存在'，说明用户还没有创建会员资料
      if (err && err.message && (err.message.includes('会员信息不存在') || err.message.includes('不存在'))) {
        console.log('检测到会员信息不存在，切换到创建模式');
        setMemberProfile(null);
        setEditing(true);
        setError(null); // 清除错误状态，允许用户创建新资料
      } else {
        setError('获取个人资料失败，请重试');
        console.error('获取个人资料失败:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  // 创建或更新会员资料
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let response;
      
      // 准备提交数据，对日期格式进行处理
      const submitData = { ...formData };
      
      console.log('原始日期值:', submitData.birth_date);
      
      // 处理出生日期，确保格式正确
      if (submitData.birth_date && submitData.birth_date !== 'Invalid date') {
        try {
          const date = new Date(submitData.birth_date);
          // 检查日期是否有效
          if (!isNaN(date.getTime())) {
            // 格式化为标准的YYYY-MM-DD格式
            submitData.birth_date = date.toISOString().split('T')[0];
            console.log('格式化后的日期:', submitData.birth_date);
          } else {
            // 如果日期无效，设置为空
            submitData.birth_date = null;
            console.log('日期无效，设置为null');
          }
        } catch (error) {
          // 捕获任何日期解析错误
          submitData.birth_date = null;
          console.log('日期解析错误，设置为null:', error);
        }
      } else {
        // 如果日期为空或已标记为Invalid date，设置为null
        submitData.birth_date = null;
        console.log('日期为空或无效，设置为null');
      }
      
      if (memberProfile) {
        // 更新现有资料
        response = await memberApi.updateMyProfile(submitData);
        setMemberProfile(response.member || response);
        setEditing(false);
      } else {
        // 创建新的会员资料
        response = await memberApi.createMemberProfile(submitData);
        setMemberProfile(response.member || response);
        setEditing(false);
      }
      
      alert(memberProfile ? '资料更新成功！' : '会员资料创建成功！');
      setError(null); // 清除错误状态
    } catch (err) {
      console.error('操作失败:', err);
      
      // 处理表单验证错误（errors数组）
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        // 将验证错误信息拼接成字符串显示给用户
        const validationErrors = err.errors.join('\n');
        setError(memberProfile ? '更新资料失败，请检查表单' : '创建资料失败，请检查表单');
        alert(`表单验证错误:\n${validationErrors}`);
      } else {
        // 处理其他类型的错误
        setError(memberProfile ? '更新资料失败' : '创建资料失败');
        alert(`操作失败: ${err.message || '请重试'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 处理表单输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 初始化时获取个人资料
  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="loading-container">加载中...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>错误</h2>
        <p>{error}</p>
        <button onClick={fetchProfile}>重试</button>
        <button onClick={handleBackToHome} className="back-btn">返回首页</button>
      </div>
    );
  }

  // 编辑模式或没有资料时显示表单
  if (editing || !memberProfile) {
    return (
      <div className="member-profile-container">
        <h2>{memberProfile ? '编辑个人资料' : '创建会员资料'}</h2>
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="full_name">会员姓名 *</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="gender">性别</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">请选择</option>
              <option value="男">男</option>
              <option value="女">女</option>
              <option value="其他">其他</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="birth_date">出生日期</label>
            <input
              type="date"
              id="birth_date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">手机号码 *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">邮箱</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="address">地址</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="education_level">教育程度</label>
            <input
              type="text"
              id="education_level"
              name="education_level"
              value={formData.education_level}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="occupation">职业</label>
            <input
              type="text"
              id="occupation"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="emergency_contact">紧急联系人</label>
            <input
              type="text"
              id="emergency_contact"
              name="emergency_contact"
              value={formData.emergency_contact}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="health_info">健康信息</label>
            <textarea
              id="health_info"
              name="health_info"
              value={formData.health_info}
              onChange={handleChange}
              rows="3"
            />
          </div>
          
          <div className="form-actions">
            <button onClick={handleBackToHome} className="back-btn" type="button">
              返回首页
            </button>
            <button type="submit" disabled={loading}>
              {loading ? '保存中...' : (memberProfile ? '更新资料' : '创建资料')}
            </button>
            {memberProfile && (
              <button type="button" onClick={() => setEditing(false)}>
                取消编辑
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  // 显示模式
  return (
    <div className="member-profile-container">
      <h2>个人资料</h2>
      <div className="profile-header">
        <button onClick={handleBackToHome} className="back-btn">
          返回首页
        </button>
        <button onClick={() => setEditing(true)} className="edit-btn">
          编辑资料
        </button>
      </div>
      
      <div className="profile-info">
        <div className="info-row">
          <div className="info-label">会员姓名:</div>
          <div className="info-value">{memberProfile.full_name}</div>
        </div>
        
        <div className="info-row">
          <div className="info-label">性别:</div>
          <div className="info-value">
            {memberProfile.gender || '未设置'}
          </div>
        </div>
        
        <div className="info-row">
          <div className="info-label">出生日期:</div>
          <div className="info-value">{memberProfile.birth_date || '未设置'}</div>
        </div>
        
        <div className="info-row">
          <div className="info-label">手机号码:</div>
          <div className="info-value">{memberProfile.phone || '未设置'}</div>
        </div>
        
        <div className="info-row">
          <div className="info-label">邮箱:</div>
          <div className="info-value">{memberProfile.email || '未设置'}</div>
        </div>
        
        <div className="info-row">
          <div className="info-label">地址:</div>
          <div className="info-value">{memberProfile.address || '未设置'}</div>
        </div>
        
        <div className="info-row">
          <div className="info-label">教育程度:</div>
          <div className="info-value">{memberProfile.education_level || '未设置'}</div>
        </div>
        
        <div className="info-row">
          <div className="info-label">职业:</div>
          <div className="info-value">{memberProfile.occupation || '未设置'}</div>
        </div>
        
        <div className="info-row">
          <div className="info-label">紧急联系人:</div>
          <div className="info-value">{memberProfile.emergency_contact || '未设置'}</div>
        </div>
        
        <div className="info-row">
          <div className="info-label">健康信息:</div>
          <div className="info-value">{memberProfile.health_info || '未设置'}</div>
        </div>
        
        <div className="info-row">
          <div className="info-label">创建时间:</div>
          <div className="info-value">
            {memberProfile.created_at ? new Date(memberProfile.created_at).toLocaleString() : '未知'}
          </div>
        </div>
        
        <div className="info-row">
          <div className="info-label">更新时间:</div>
          <div className="info-value">
            {memberProfile.profile_updated_at ? new Date(memberProfile.profile_updated_at).toLocaleString() : '未知'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;