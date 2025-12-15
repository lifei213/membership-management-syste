const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('错误：缺少Supabase环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  console.log('开始检查数据库中的用户数据...\n');
  
  try {
    // 查询用户表
    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, username, email, role')
      .limit(10);
    
    if (error) {
      console.error('查询用户失败:', error);
      return;
    }
    
    console.log('=== 数据库用户列表 ===');
    users.forEach(user => {
      console.log(`用户ID: ${user.user_id}, 用户名: ${user.username}, 邮箱: ${user.email}, 角色: ${user.role}`);
    });
    
    // 检查是否有管理员用户
    const adminUsers = users.filter(user => user.role === 'admin');
    if (adminUsers.length > 0) {
      console.log('\n=== 管理员用户 ===');
      adminUsers.forEach(admin => {
        console.log(`管理员ID: ${admin.user_id}, 邮箱: ${admin.email}`);
      });
    }
    
  } catch (error) {
    console.error('检查用户数据失败:', error);
  }
}

checkUsers();