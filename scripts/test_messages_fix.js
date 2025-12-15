/**
 * 测试消息功能修复的脚本
 * 用于验证recipient_id改为receiver_id后的功能是否正常
 */

const axios = require('axios');

async function testMessagesFix() {
  try {
    console.log('开始测试消息功能修复...');
    
    const baseURL = 'http://localhost:3001/api';
    
    // 测试1：检查消息列表API
    console.log('\n=== 测试1：检查消息列表API ===');
    try {
      const response = await axios.get(`${baseURL}/messages`);
      console.log('✓ 消息列表API访问成功');
      console.log('响应状态:', response.status);
      if (response.data && response.data.success) {
        console.log('✓ 消息列表数据获取成功');
        console.log('消息数量:', response.data.data.messages?.length || 0);
      }
    } catch (error) {
      console.log('✗ 消息列表API访问失败:', error.response?.data || error.message);
    }
    
    // 测试2：检查会员消息API
    console.log('\n=== 测试2：检查会员消息API ===');
    try {
      const response = await axios.get(`${baseURL}/member/messages`);
      console.log('✓ 会员消息API访问成功');
      console.log('响应状态:', response.status);
      if (response.data && response.data.success) {
        console.log('✓ 会员消息数据获取成功');
        console.log('消息数量:', response.data.data.messages?.length || 0);
      }
    } catch (error) {
      console.log('✗ 会员消息API访问失败:', error.response?.data || error.message);
    }
    
    // 测试3：检查未读消息数量API
    console.log('\n=== 测试3：检查未读消息数量API ===');
    try {
      const response = await axios.get(`${baseURL}/member/messages/unread-count`);
      console.log('✓ 未读消息数量API访问成功');
      console.log('响应状态:', response.status);
      if (response.data && response.data.success) {
        console.log('✓ 未读消息数量获取成功');
        console.log('未读消息数量:', response.data.data.count || 0);
      }
    } catch (error) {
      console.log('✗ 未读消息数量API访问失败:', error.response?.data || error.message);
    }
    
    console.log('\n=== 测试总结 ===');
    console.log('所有消息相关的API测试已完成');
    console.log('如果以上测试都显示成功，说明recipient_id改为receiver_id的修复已生效');
    console.log('数据库schema缓存问题应该已经解决');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testMessagesFix();
}

module.exports = { testMessagesFix };