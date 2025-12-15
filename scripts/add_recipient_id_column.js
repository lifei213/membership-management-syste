/**
 * 数据库迁移脚本：为messages表添加recipient_id列
 * 这个脚本用于修复"Could not find the 'recipient_id' column of 'messages' in the schema cache"错误
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function addRecipientIdColumn() {
  try {
    console.log('开始执行数据库迁移：为messages表添加recipient_id列');
    
    // 创建Supabase客户端
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('错误：缺少Supabase配置环境变量');
      console.error('请确保SUPABASE_URL和SUPABASE_SERVICE_ROLE_KEY已正确设置');
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
    
    // 检查messages表是否存在
    console.log('检查messages表是否存在...');
    const { data: tableExists, error: checkError } = await supabase
      .from('messages')
      .select('message_id')
      .limit(1);
    
    if (checkError && checkError.code === 'PGRST103') {
      console.error('错误：messages表不存在，请先创建messages表');
      process.exit(1);
    }
    
    // 检查recipient_id列是否已存在
    console.log('检查recipient_id列是否已存在...');
    try {
      const { data: testQuery, error: columnCheckError } = await supabase
        .from('messages')
        .select('recipient_id')
        .limit(1);
      
      if (!columnCheckError) {
        console.log('✓ recipient_id列已存在，无需添加');
        return;
      }
    } catch (error) {
      // 如果查询失败，说明列不存在，继续执行添加操作
    }
    
    // 执行SQL语句添加recipient_id列
    console.log('正在添加recipient_id列到messages表...');
    
    // 使用Supabase的SQL函数执行ALTER TABLE语句
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE messages 
        ADD COLUMN recipient_id UUID,
        ADD CONSTRAINT fk_messages_recipient 
        FOREIGN KEY (recipient_id) 
        REFERENCES users(user_id)
        ON DELETE SET NULL;
      `
    });
    
    if (alterError) {
      console.error('添加列失败，尝试使用更简单的方法...');
      
      // 如果RPC方法失败，尝试直接使用SQL查询
      // 注意：这需要Supabase项目启用SQL函数执行权限
      const { error: simpleAlterError } = await supabase
        .from('messages')
        .update({ recipient_id: null })
        .eq('message_id', '00000000-0000-0000-0000-000000000000'); // 使用不存在的ID触发错误以获取表结构
        
      if (simpleAlterError && simpleAlterError.message.includes('column')) {
        console.log('检测到列不存在，需要手动在Supabase控制台执行以下SQL：');
        console.log('\n=== 请在Supabase控制台执行以下SQL ===');
        console.log(`
          ALTER TABLE messages 
          ADD COLUMN recipient_id UUID;
          
          ALTER TABLE messages 
          ADD CONSTRAINT fk_messages_recipient 
          FOREIGN KEY (recipient_id) 
          REFERENCES users(user_id)
          ON DELETE SET NULL;
        `);
        console.log('=====================================\n');
        
        console.log('或者，您也可以：');
        console.log('1. 登录Supabase控制台');
        console.log('2. 进入SQL编辑器');
        console.log('3. 执行上面的SQL语句');
        console.log('4. 完成后重新启动应用程序');
      }
    } else {
      console.log('✓ recipient_id列添加成功');
    }
    
    console.log('数据库迁移完成');
    
  } catch (error) {
    console.error('数据库迁移失败:', error);
    console.log('\n手动解决方案：');
    console.log('1. 登录Supabase控制台 (https://supabase.com/dashboard)');
    console.log('2. 选择您的项目');
    console.log('3. 进入SQL编辑器');
    console.log('4. 执行以下SQL语句：');
    console.log(`
      ALTER TABLE messages 
      ADD COLUMN recipient_id UUID;
      
      ALTER TABLE messages 
      ADD CONSTRAINT fk_messages_recipient 
      FOREIGN KEY (recipient_id) 
      REFERENCES users(user_id)
      ON DELETE SET NULL;
    `);
    console.log('5. 完成后重新启动应用程序');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  addRecipientIdColumn();
}

module.exports = { addRecipientIdColumn };