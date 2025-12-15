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

async function addFileColumnsToMessages() {
  console.log('开始为messages表添加文件相关列...\n');
  
  try {
    // 检查messages表是否存在
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'messages');
    
    if (tablesError) {
      console.error('查询表信息失败:', tablesError);
      return;
    }
    
    if (!tables || tables.length === 0) {
      console.log('messages表不存在，请先创建messages表');
      return;
    }
    
    console.log('messages表存在，开始添加列...\n');
    
    // 添加file_name列
    console.log('1. 添加file_name列...');
    try {
      const { error: fileNameError } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'messages',
        column_name: 'file_name',
        column_type: 'text'
      });
      
      if (fileNameError) {
        console.log('   file_name列可能已存在或需要手动添加:', fileNameError.message);
      } else {
        console.log('   ✓ file_name列添加成功');
      }
    } catch (error) {
      console.log('   使用RPC添加file_name列失败，尝试直接执行SQL...');
    }
    
    // 添加file_path列
    console.log('2. 添加file_path列...');
    try {
      const { error: filePathError } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'messages',
        column_name: 'file_path',
        column_type: 'text'
      });
      
      if (filePathError) {
        console.log('   file_path列可能已存在或需要手动添加:', filePathError.message);
      } else {
        console.log('   ✓ file_path列添加成功');
      }
    } catch (error) {
      console.log('   使用RPC添加file_path列失败，尝试直接执行SQL...');
    }
    
    // 添加file_size列
    console.log('3. 添加file_size列...');
    try {
      const { error: fileSizeError } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'messages',
        column_name: 'file_size',
        column_type: 'bigint'
      });
      
      if (fileSizeError) {
        console.log('   file_size列可能已存在或需要手动添加:', fileSizeError.message);
      } else {
        console.log('   ✓ file_size列添加成功');
      }
    } catch (error) {
      console.log('   使用RPC添加file_size列失败，尝试直接执行SQL...');
    }
    
    // 添加file_type列
    console.log('4. 添加file_type列...');
    try {
      const { error: fileTypeError } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'messages',
        column_name: 'file_type',
        column_type: 'text'
      });
      
      if (fileTypeError) {
        console.log('   file_type列可能已存在或需要手动添加:', fileTypeError.message);
      } else {
        console.log('   ✓ file_type列添加成功');
      }
    } catch (error) {
      console.log('   使用RPC添加file_type列失败，尝试直接执行SQL...');
    }
    
    console.log('\n所有列添加完成！');
    console.log('如果RPC方法失败，请手动在Supabase控制台为messages表添加以下列：');
    console.log('- file_name (text)');
    console.log('- file_path (text)');
    console.log('- file_size (bigint)');
    console.log('- file_type (text)');
    
  } catch (error) {
    console.error('添加列过程中出错:', error);
  }
}

// 如果RPC函数不存在，创建它
async function createAddColumnFunction() {
  console.log('检查并创建add_column_if_not_exists函数...');
  
  // 这里需要手动在Supabase SQL编辑器中执行以下SQL：
  /*
  CREATE OR REPLACE FUNCTION add_column_if_not_exists(
    table_name text,
    column_name text,
    column_type text
  )
  RETURNS void
  LANGUAGE plpgsql
  AS $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = add_column_if_not_exists.table_name 
      AND column_name = add_column_if_not_exists.column_name
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', 
        add_column_if_not_exists.table_name, 
        add_column_if_not_exists.column_name, 
        add_column_if_not_exists.column_type);
    END IF;
  END;
  $$;
  */
  
  console.log('请手动在Supabase SQL编辑器中执行上面的SQL语句来创建函数');
}

// 运行主函数
addFileColumnsToMessages();