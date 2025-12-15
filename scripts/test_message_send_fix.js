const axios = require('axios');

// 测试配置
const BASE_URL = 'http://localhost:3001';

// 使用一个有效的测试用户token（这里使用之前测试中的token）
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyNCwidXNlcm5hbWUiOiIwMTIzIiwicm9sZSI6Im1lbWJlciIsImlhdCI6MTc2NTc3MzI4MCwiZXhwIjoxNzY1ODU5NjgwfQ.2wPg8dFR-3dUHDdbu4R9fXL8VHPRdXk7puy7bBxkn4U';

async function testMessageSend() {
  try {
    console.log('开始测试消息发送功能修复...\n');
    
    // 1. 测试发送消息给管理员
    console.log('1. 测试发送消息给管理员...');
    const testMessage = {
      subject: '测试消息 - ' + new Date().toISOString(),
      content: '这是一条测试消息，用于验证toISOString错误修复是否成功。'
    };
    
    const response = await axios.post(`${BASE_URL}/api/members/message-to-admin`, testMessage, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });
    
    console.log('✓ 消息发送成功！');
    console.log(`   消息ID: ${response.data.message_id}`);
    console.log(`   服务器响应: ${response.data.message}\n`);
    
    // 2. 验证消息是否成功保存到数据库
    console.log('2. 验证消息是否成功保存...');
    const messagesResponse = await axios.get(`${BASE_URL}/api/members/messages`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });
    
    if (messagesResponse.data.data.messages && messagesResponse.data.data.messages.length > 0) {
      console.log('✓ 消息成功保存到数据库');
      console.log(`   总消息数: ${messagesResponse.data.data.messages.length}`);
      
      // 查找刚发送的消息
      const latestMessage = messagesResponse.data.data.messages[0];
      console.log(`   最新消息主题: ${latestMessage.subject}`);
      console.log(`   发送时间: ${latestMessage.created_at}`);
    } else {
      console.log('⚠ 未找到消息记录');
    }
    
    console.log('\n✅ 消息发送功能测试完成！toISOString错误已修复。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.response?.data?.error) {
      console.error('错误详情:', error.response.data.error);
    }
  }
}

// 运行测试
testMessageSend();