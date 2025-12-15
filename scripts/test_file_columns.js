const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 从环境变量中读取Supabase配置
const supabaseUrl = process.env.SUPABASE_URL || 'https://tdbbstlkwmautdwnrgcb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkYmJzdGxrd21hdXRkd25yZ2NiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY1NDM2OCwiZXhwIjoyMDgxMjMwMzY4fQ.-8weJDkyy-pXU05yx6kR_Eu37ydC1DkF_KhHP9HW3d0';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
});

async function testFileColumns() {
  console.log('测试messages表的文件相关列...\n');
  
  try {
    // 尝试插入一条包含文件字段的消息
    console.log('1. 尝试插入包含文件字段的消息...');
    const testMessage = {
      sender_id: 1,
      receiver_id: 2,
      subject: '测试文件上传',
      content: '这是一个测试消息，包含文件字段',
      message_type: '测试消息',
      is_read: false,
      created_at: new Date().toISOString(),
      file_name: 'test.txt',
      file_path: '/uploads/test.txt',
      file_size: 1024,
      file_type: 'text/plain'
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert(testMessage)
      .select();
    
    if (error) {
      console.log('   插入失败，错误信息:', error.message);
      console.log('   错误代码:', error.code);
      
      if (error.code === 'PGRST204') {
        console.log('   ❌ messages表缺少文件相关列，需要手动添加');
        console.log('   请在Supabase控制台为messages表添加以下列：');
        console.log('   - file_name (text)');
        console.log('   - file_path (text)');
        console.log('   - file_size (bigint)');
        console.log('   - file_type (text)');
      }
    } else {
      console.log('   ✓ 插入成功，文件相关列已存在');
      console.log('   插入的消息ID:', data[0].message_id);
    }
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 运行测试
testFileColumns();