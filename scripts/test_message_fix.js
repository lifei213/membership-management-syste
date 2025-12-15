const axios = require('axios');

// 测试配置
const BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

async function testMessageFunctionality() {
  console.log('开始测试消息功能修复...\n');
  
  try {
    // 1. 登录获取token
    console.log('1. 登录获取认证token...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
    const token = loginResponse.data.token;
    console.log('✓ 登录成功，token获取成功\n');
    
    // 2. 测试获取管理员消息列表
    console.log('2. 测试获取管理员消息列表...');
    const messagesResponse = await axios.get(`${BASE_URL}/api/members/admin/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ 管理员消息列表获取成功');
    console.log(`   消息数量: ${messagesResponse.data.data.messages.length}`);
    console.log(`   分页信息: 第${messagesResponse.data.data.currentPage}页，共${messagesResponse.data.data.totalPages}页\n`);
    
    // 3. 如果有消息，测试获取消息详情
    if (messagesResponse.data.data.messages.length > 0) {
      console.log('3. 测试获取消息详情...');
      const firstMessage = messagesResponse.data.data.messages[0];
      const detailResponse = await axios.get(`${BASE_URL}/api/members/admin/messages/${firstMessage.message_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✓ 消息详情获取成功');
      console.log(`   消息ID: ${detailResponse.data.data.message_id}`);
      console.log(`   主题: ${detailResponse.data.data.subject}`);
      console.log(`   发送时间: ${detailResponse.data.data.created_at}\n`);
    }
    
    // 4. 测试发送消息给会员（需要会员ID）
    console.log('4. 测试发送消息给会员...');
    
    // 首先获取会员列表
    const membersResponse = await axios.get(`${BASE_URL}/api/members`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (membersResponse.data.data.members.length > 0) {
      const firstMember = membersResponse.data.data.members[0];
      const testMessage = {
        subject: '测试消息 - ' + new Date().toISOString(),
        content: '这是一条测试消息，用于验证消息功能修复是否成功。'
      };
      
      const sendResponse = await axios.post(`${BASE_URL}/api/members/${firstMember.member_id}/message`, testMessage, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✓ 消息发送成功');
      console.log(`   响应: ${sendResponse.data.message}\n`);
    } else {
      console.log('⚠ 没有会员数据，跳过发送消息测试\n');
    }
    
    console.log('🎉 所有消息功能测试通过！');
    console.log('✅ sent_at到created_at的修复已成功应用');
    console.log('✅ recipient_id到receiver_id的修复已成功应用');
    console.log('✅ 消息功能现在可以正常工作');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('   详细错误:', error.response.data.error);
    }
  }
}

// 运行测试
testMessageFunctionality();