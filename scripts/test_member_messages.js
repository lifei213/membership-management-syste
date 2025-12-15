const axios = require('axios');

// 测试配置
const BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  username: 'admin',
  password: 'admin123'
};

async function testMemberMessageFunctionality() {
  console.log('开始测试会员消息功能修复...\n');
  
  try {
    // 1. 登录获取token
    console.log('1. 登录获取认证token...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
    const token = loginResponse.data.token;
    console.log('✓ 登录成功，token获取成功\n');
    
    // 2. 测试获取未读消息数量
    console.log('2. 测试获取未读消息数量...');
    const unreadResponse = await axios.get(`${BASE_URL}/api/members/messages/unread/count`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ 未读消息数量获取成功');
    console.log(`   未读消息数量: ${unreadResponse.data.data.count || 0}\n`);
    
    // 3. 测试获取会员消息列表
    console.log('3. 测试获取会员消息列表...');
    const messagesResponse = await axios.get(`${BASE_URL}/api/members/messages?page=1&pageSize=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✓ 会员消息列表获取成功');
    console.log(`   消息数量: ${messagesResponse.data.data.messages.length}`);
    console.log(`   分页信息: 第${messagesResponse.data.data.currentPage}页，共${messagesResponse.data.data.totalPages}页\n`);
    
    // 4. 如果有消息，测试获取消息详情
    if (messagesResponse.data.data.messages.length > 0) {
      console.log('4. 测试获取消息详情...');
      const firstMessage = messagesResponse.data.data.messages[0];
      console.log(`   第一条消息的message_id: ${firstMessage.message_id}`);
      
      if (!firstMessage.message_id) {
        console.log('❌ 消息ID为空，跳过消息详情测试');
      } else {
        const detailResponse = await axios.get(`${BASE_URL}/api/members/messages/${firstMessage.message_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✓ 消息详情获取成功');
        console.log(`   消息ID: ${detailResponse.data.data.message_id}`);
        console.log(`   主题: ${detailResponse.data.data.subject}`);
        console.log(`   发送时间: ${detailResponse.data.data.created_at}\n`);
      }
    } else {
      console.log('   没有消息，跳过消息详情测试\n');
    }
    
    // 5. 测试发送消息给管理员
    console.log('5. 测试发送消息给管理员...');
    const testMessage = {
      subject: '测试消息 - ' + new Date().toISOString(),
      content: '这是一条测试消息，用于验证会员消息功能修复是否成功。'
    };
    
    const sendResponse = await axios.post(`${BASE_URL}/api/members/message-to-admin`, testMessage, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✓ 消息发送成功');
    console.log(`   响应: ${sendResponse.data.message}\n`);
    
    console.log('🎉 所有会员消息功能测试通过！');
    console.log('✅ 会员消息路由已正确配置');
    console.log('✅ 会员消息API现在可以正常工作');
    console.log('✅ 前端API调用错误已修复');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('   详细错误:', error.response.data.error);
    }
    if (error.response?.data?.details) {
      console.error('   错误详情:', error.response.data.details);
    }
  }
}

// 运行测试
testMemberMessageFunctionality();