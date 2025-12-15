/**
 * 检查messages表所有列的脚本
 * 用于确定当前messages表有哪些时间戳列可用
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkMessagesColumns() {
  try {
    console.log('开始检查messages表的所有列...');
    
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
    
    // 获取messages表的一条记录来查看所有列
    console.log('获取messages表结构信息...');
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('查询messages表失败:', error);
      return;
    }
    
    if (messages && messages.length > 0) {
      console.log('\n=== messages表所有列 ===');
      const message = messages[0];
      Object.keys(message).forEach(key => {
        console.log(`${key}: ${typeof message[key]} (示例值: ${message[key]})`);
      });
      console.log('========================\n');
      
      // 检查时间戳相关的列
      const timestampColumns = Object.keys(message).filter(key => 
        key.includes('time') || key.includes('date') || key.includes('at') || key.includes('stamp')
      );
      
      if (timestampColumns.length > 0) {
        console.log('找到时间戳相关的列:', timestampColumns);
        console.log('建议使用以下列替代sent_at:');
        timestampColumns.forEach(col => {
          console.log(`- ${col}: ${message[col]}`);
        });
      } else {
        console.log('未找到时间戳相关的列，当前可用的列有:');
        console.log(Object.keys(message).join(', '));
      }
      
    } else {
      console.log('messages表为空，无法确定结构');
    }
    
  } catch (error) {
    console.error('检查表结构失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkMessagesColumns();
}

module.exports = { checkMessagesColumns };