/**
 * 检查messages表结构的脚本
 * 用于确定当前messages表有哪些列可用
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkMessagesSchema() {
  try {
    console.log('开始检查messages表结构...');
    
    // 创建Supabase客户端
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('错误：缺少Supabase配置环境变量');
      process.exit(1);
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
    });
    
    // 尝试获取一条消息记录来查看表结构
    console.log('获取messages表结构信息...');
    
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('查询messages表失败:', error);
        
        // 尝试获取表信息
        const { data: tableInfo, error: tableError } = await supabase
          .from('messages')
          .select('message_id')
          .limit(1);
          
        if (tableError) {
          console.error('messages表可能不存在:', tableError);
          return;
        }
        
        console.log('messages表存在，但无法获取完整结构');
        return;
      }
      
      if (messages && messages.length > 0) {
        console.log('\n=== messages表结构 ===');
        const message = messages[0];
        Object.keys(message).forEach(key => {
          console.log(`${key}: ${typeof message[key]} (示例值: ${message[key]})`);
        });
        console.log('========================\n');
        
        // 检查是否有接收者相关的列
        const recipientColumns = Object.keys(message).filter(key => 
          key.includes('recipient') || key.includes('receiver') || key.includes('to') || key.includes('target')
        );
        
        if (recipientColumns.length > 0) {
          console.log('找到可能的接收者列:', recipientColumns);
        } else {
          console.log('未找到接收者相关的列，当前可用的列有:');
          console.log(Object.keys(message).join(', '));
        }
        
      } else {
        console.log('messages表为空，无法确定结构');
      }
      
    } catch (err) {
      console.error('检查表结构时出错:', err);
      
      // 尝试另一种方法：通过插入测试数据来触发错误信息
      console.log('\n尝试通过插入测试数据来获取表结构信息...');
      
      const testData = {
        sender_id: '00000000-0000-0000-0000-000000000000',
        subject: '测试消息',
        content: '这是一个测试消息',
        is_read: false,
        created_at: new Date().toISOString()
      };
      
      const { error: insertError } = await supabase
        .from('messages')
        .insert(testData);
        
      if (insertError) {
        console.log('插入测试数据时的错误信息:');
        console.log(insertError);
      }
    }
    
  } catch (error) {
    console.error('检查表结构失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkMessagesSchema();
}

module.exports = { checkMessagesSchema };