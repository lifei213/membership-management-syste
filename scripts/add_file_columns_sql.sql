-- 为messages表添加文件相关列的SQL语句
-- 请在Supabase控制台的SQL编辑器中执行以下语句

-- 1. 添加file_name列
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 2. 添加file_path列  
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_path TEXT;

-- 3. 添加file_size列
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- 4. 添加file_type列
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type TEXT;

-- 5. 验证列是否添加成功
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;