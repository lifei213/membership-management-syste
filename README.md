# 广西自动化学会会员管理系统后端API

这是广西自动化学会会员管理系统的后端API服务，提供会员注册、登录、信息管理、会费查询和入会申请等功能。

## 项目结构

```
demo/
├── config/          # 配置文件
│   └── db.js        # 数据库配置
├── controllers/     # 控制器
│   ├── authController.js         # 认证控制器
│   ├── memberController.js       # 会员控制器
│   ├── feeController.js          # 会费控制器
│   └── applicationController.js  # 入会申请控制器
├── middleware/      # 中间件
│   ├── auth.js          # 认证中间件
│   └── errorHandler.js  # 错误处理中间件
├── models/          # 数据模型
│   ├── User.js               # 用户模型
│   ├── Member.js             # 会员模型
│   ├── MembershipFee.js      # 会费模型
│   ├── Application.js        # 申请模型
│   └── index.js              # 模型导出
├── routes/          # 路由
│   ├── authRoutes.js         # 认证路由
│   ├── memberRoutes.js       # 会员路由
│   ├── feeRoutes.js          # 会费路由
│   ├── applicationRoutes.js  # 入会申请路由
│   └── index.js              # 路由导出
├── utils/           # 工具函数
│   ├── jwtUtils.js      # JWT工具
│   ├── passwordUtils.js # 密码工具
│   └── emailUtils.js    # 邮件工具
├── .env            # 环境变量配置
├── package.json    # 项目配置
├── server.js       # 服务器入口
└── README.md       # 项目说明
```

## 安装和运行

1. 克隆或下载项目代码

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
   - 复制并修改`.env`文件，设置数据库连接、JWT密钥和邮件服务等配置

4. 启动服务器
   - 生产环境: `npm start`
   - 开发环境: `npm run dev`

## API接口

### 认证相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息（需要认证）

### 会员管理

- `POST /api/members/profile` - 创建会员信息（需要认证）
- `GET /api/members/profile` - 获取当前会员信息（需要认证）
- `PUT /api/members/profile` - 更新当前会员信息（需要认证）
- `GET /api/members/all` - 获取所有会员列表（需要管理员权限）
- `GET /api/members/:member_id` - 获取特定会员信息（需要管理员权限）
- `PUT /api/members/:member_id` - 更新会员信息（需要管理员权限）

### 会费管理

- `GET /api/fees/my-records` - 获取当前会员缴费记录（需要认证）
- `GET /api/fees/my-status` - 获取当前会员会籍状态（需要认证）
- `POST /api/fees/add` - 添加缴费记录（需要管理员权限）
- `GET /api/fees/all` - 获取所有缴费记录（需要管理员权限）
- `GET /api/fees/member/:member_id` - 获取特定会员缴费记录（需要管理员权限）
- `PUT /api/fees/:fee_id` - 更新缴费记录（需要管理员权限）

### 入会申请

- `POST /api/applications/submit` - 提交入会申请（无需登录）
- `GET /api/applications/all` - 获取所有申请列表（需要管理员权限）
- `GET /api/applications/:application_id` - 获取申请详情（需要管理员权限）
- `PUT /api/applications/:application_id/review` - 审核申请（需要管理员权限）
- `GET /api/applications/count/pending` - 获取待审核申请数量（需要管理员权限）
- `DELETE /api/applications/:application_id` - 删除申请（需要管理员权限）

## 环境变量配置

主要环境变量配置说明：

```
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=lyf
DB_PORT=3306

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# 邮件配置
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=username@example.com
SMTP_PASSWORD=password
SMTP_FROM=from@example.com

# 服务器配置
PORT=3000
NODE_ENV=development
```

## 安全注意事项

- 生产环境请修改JWT密钥和数据库密码
- 定期更新依赖包以避免安全漏洞
- 配置适当的CORS策略限制访问来源

## 技术栈

- Node.js
- Express
- Sequelize (ORM)
- MySQL
- JWT (认证)
- Nodemailer (邮件发送)

## 许可证

MIT