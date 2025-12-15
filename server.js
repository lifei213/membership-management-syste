const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');

// 加载环境变量
dotenv.config();

// 导入Supabase客户端
const { supabase, testSupabaseConnection } = require('./config/supabase');

// 导入路由和中间件
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

// 创建Express应用
const app = express();

// 导出app实例用于测试
module.exports = app;

// 将Supabase客户端添加为全局中间件
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// 配置安全相关中间件
// app.use(helmet());

// 配置CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 请求体解析中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 创建uploads目录
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置文件上传中间件
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制文件大小为10MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});

// 使upload中间件在全局可用
app.upload = upload;

// 使uploads目录可以通过HTTP访问
app.use('/uploads', express.static(uploadsDir));

// 单独设置健康检查路由，使用根路径而不是API前缀，确保它不需要认证
app.get('/health', (req, res) => {
  res.status(200).json({ message: '服务运行正常' });
});

// 配置API请求限流
// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15分钟
//   max: 100, // 每个IP在windowMs内最多100个请求
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: { error: '请求过于频繁，请稍后再试' }
// });

// 对API路由应用限流
// app.use('/api', apiLimiter);

// 注册API路由
app.use('/api', apiRoutes);

// 配置静态文件服务，提供前端构建产物
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// 配置单页应用路由，所有非API请求都返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

// 404处理中间件
app.use((req, res, next) => {
  const error = new Error('请求的资源不存在');
  error.status = 404;
  next(error);
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // 测试Supabase连接
    await testSupabaseConnection();
    console.log('Supabase连接成功');

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// 仅在直接运行时启动服务器，测试时不启动
if (require.main === module) {
  startServer();
}

// 优雅关闭处理
process.on('SIGINT', () => {
  console.log('收到终止信号，正在关闭服务器...');
  process.exit(0);
});