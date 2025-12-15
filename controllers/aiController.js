const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// 火山方舟API配置
const VOLCANO_ARK_CONFIG = {
  url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  apiKey: process.env.ARK_API_KEY || 'e70a1849-d992-4a39-b75f-c3af033fee4b',
  model: 'ep-20251208190154-944k6' // 使用用户提供的模型ID
};

// AI聊天接口
const chat = async (req, res) => {
  try {
    const { messages, model = VOLCANO_ARK_CONFIG.model } = req.body;
    
    // 验证请求参数
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }
    
    // 调用火山方舟API
    const response = await axios.post(
      VOLCANO_ARK_CONFIG.url,
      {
        model: model,
        messages: messages
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VOLCANO_ARK_CONFIG.apiKey}`
        }
      }
    );
    
    // 返回AI响应
    res.json(response.data);
  } catch (error) {
    console.error('AI Chat Error:', error.response?.data || error.message);
    
    // 检查是否是模型不存在的错误
    const errorDetails = error.response?.data || {};
    if (errorDetails.error?.code === 'InvalidEndpointOrModel.NotFound') {
      // 返回友好的错误信息
      return res.status(500).json({
        error: '模型不可用',
        details: '当前AI模型不可用，请联系管理员配置可用的模型。',
        mockResponse: true,
        choices: [{
          message: {
            role: 'assistant',
            content: '抱歉，当前AI模型服务不可用。\n\n如果您需要帮助，我可以为您提供以下信息：\n1. 会员注册流程\n2. 会费缴纳说明\n3. 申请审核状态查询\n4. 学会活动信息\n\n请告诉我您需要了解的具体内容。'
          }
        }]
      });
    }
    
    // 其他类型的错误
    res.status(500).json({
      error: 'AI service error',
      details: error.response?.data || error.message
    });
  }
};

module.exports = {
  chat
};