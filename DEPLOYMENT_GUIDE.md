# 🚀 会员管理系统 - GitHub Pages + Supabase Edge Functions 部署指南

## 📋 部署概述

本系统采用**前后端分离架构**：
- **前端**：React + Vite → 部署到 GitHub Pages（静态文件）
- **后端**：Supabase Edge Functions（无需单独部署服务器）
- **数据库**：Supabase（云端数据库）
- **认证**：Supabase Auth（直接集成）

## 🛠️ 部署前准备

### 1. 创建GitHub仓库

1. 访问 [GitHub.com](https://github.com) 并登录
2. 创建新仓库：`membership-management-system`（或自定义名称）
3. 设置仓库为 **Public**（GitHub Pages需要）

### 2. 配置Supabase环境变量

在GitHub仓库的Settings → Secrets中设置以下环境变量：
- `VITE_SUPABASE_URL`：`https://tdbbstlkwmautdwnrgcb.supabase.co`
- `VITE_SUPABASE_ANON_KEY`：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkYmJzdGxrd21hdXRkd25yZ2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTQzNjgsImV4cCI6MjA4MTIzMDM2OH0.8j7v7v7v7v7v7v7v7v7v7v7v7v7`

### 3. 配置Supabase Edge Functions（可选）

如果需要部署自定义Edge Functions，设置：
- `SUPABASE_ACCESS_TOKEN`：你的Supabase访问令牌
- `SUPABASE_PROJECT_REF`：你的Supabase项目ID

## 📦 前端部署到GitHub Pages

### 步骤1：上传项目到GitHub

```bash
# 初始化Git仓库
git init
git add .
git commit -m "Initial commit: Complete membership management system"

# 连接到GitHub仓库
git remote add origin https://github.com/你的用户名/你的仓库名.git
git branch -M main
git push -u origin main
```

### 步骤2：配置仓库名称

在以下文件中替换 `YOUR_REPO_NAME` 为你的实际仓库名称：
1. `frontend/vite.config.js` 中的 `base` 路径
2. `frontend/.env.production` 中的 `VITE_APP_BASE_URL`

### 步骤3：启用GitHub Pages

1. 进入GitHub仓库设置
2. 左侧菜单选择 "Pages"
3. 分支选择 "gh-pages"（GitHub Actions会自动创建）
4. 文件夹选择 "/ (root)"
5. 点击 "Save"

### 步骤4：自动部署流程

项目已包含 `.github/workflows/deploy.yml`，推送代码到main分支后会自动：
- 构建前端静态文件
- 创建404.html用于SPA路由
- 部署到GitHub Pages
- 生成访问地址：`https://你的用户名.github.io/你的仓库名/`

## 🔌 Supabase Edge Functions部署

### 步骤1：安装Supabase CLI

```bash
# 使用npm安装
npm install -g supabase

# 或使用其他包管理器
# yarn global add supabase
# pnpm add -g supabase
```

### 步骤2：登录Supabase

```bash
supabase login
```

### 步骤3：部署Edge Functions

```bash
# 进入supabase目录
cd supabase

# 部署API函数
supabase functions deploy api --project-ref 你的项目ID
```

### 步骤4：自动部署（推荐）

项目包含 `.github/workflows/supabase-deploy.yml`，当supabase相关文件变更时会自动部署Edge Functions。

## 🔧 生产环境配置

### 前端配置

生产环境变量已配置在 `frontend/.env.production`：
- 使用Supabase REST API直接连接
- 使用Supabase Auth进行认证
- 无需单独的API服务器

### 路由配置

GitHub Actions会自动创建404.html文件，确保SPA路由正常工作。

## 🌐 最终访问地址

部署完成后，你的网站将可通过以下地址访问：
`https://你的用户名.github.io/你的仓库名/`

## 🔍 测试部署

1. 访问网站首页
2. 测试用户注册/登录功能
3. 测试消息发送和接收功能
4. 验证管理员和会员权限

- **前端网站**：`https://你的用户名.github.io/membership-management-system/`
- **后端API**：`https://membership-management-system.vercel.app/api`

## 🧪 测试部署

### 前端功能测试
1. 打开前端网址
2. 测试用户注册/登录
3. 测试会员管理功能
4. 测试消息发送功能

### API连接测试
```bash
# 测试API连接
curl https://membership-management-system.vercel.app/api/health
```

## 🔄 自动更新

每次向 `main` 分支推送代码时：
1. GitHub Actions会自动构建和部署前端
2. Vercel会自动重新部署后端API

## 🚨 常见问题解决

### 问题1：前端无法连接API
**解决方案**：检查Vercel API地址是否正确配置在GitHub Secrets中

### 问题2：CORS错误
**解决方案**：后端已配置CORS，确保API地址正确

### 问题3：数据库连接失败
**解决方案**：检查Supabase环境变量是否正确

### 问题4：静态资源加载失败
**解决方案**：检查GitHub Pages的base路径配置

## 📞 技术支持

如遇部署问题，请检查：
1. GitHub Actions日志
2. Vercel部署日志
3. 浏览器开发者工具控制台

---

**部署成功标志**：能够通过GitHub Pages网址正常访问系统，所有功能正常工作！