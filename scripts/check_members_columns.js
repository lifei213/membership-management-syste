const { supabase } = require('../config/supabase');

async function checkMembersTable() {
  console.log('开始检查members表的所有列...\n');
  
  try {
    // 获取members表的所有列
    const { data: columns, error } = await supabase
      .from('members')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('获取members表结构失败:', error);
      return;
    }
    
    if (!columns || columns.length === 0) {
      console.log('members表为空或不存在');
      return;
    }
    
    const firstRow = columns[0];
    console.log('获取members表结构信息...\n');
    console.log('=== members表所有列 ===');
    
    for (const [key, value] of Object.entries(firstRow)) {
      const type = typeof value;
      console.log(`${key}: ${type} (示例值: ${value})`);
    }
    
    console.log('========================\n');
    
    // 检查是否有email列
    if ('email' in firstRow) {
      console.log('✓ members表包含email列');
    } else {
      console.log('✗ members表不包含email列');
      console.log('可用的列:', Object.keys(firstRow).join(', '));
    }
    
  } catch (error) {
    console.error('检查members表时出错:', error);
  }
}

checkMembersTable();