const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 创建Supabase客户端实例
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase配置错误：缺少SUPABASE_URL或SUPABASE_SERVICE_ROLE_KEY环境变量');
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

// 测试Supabase连接
async function testSupabaseConnection() {
  try {
    // 尝试执行一个简单的查询
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('Supabase连接失败:', error.message);
      return false;
    }
    
    console.log('Supabase连接成功');
    return true;
  } catch (error) {
    console.error('Supabase连接异常:', error);
    return false;
  }
}

module.exports = {
  supabase,
  testSupabaseConnection
};
