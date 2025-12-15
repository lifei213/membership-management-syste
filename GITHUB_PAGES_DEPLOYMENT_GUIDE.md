# GitHub Pages 部署指南 - 会员管理系统

## 概述

本指南详细说明如何使用GitHub Pages部署您的会员管理系统。GitHub Pages是GitHub提供的免费静态网站托管服务，无需第三方服务即可实现一键访问。

## 部署优势

✅ **完全免费** - GitHub Pages提供免费托管  
✅ **无需注册** - 使用GitHub账户即可  
✅ **自动部署** - 代码推送后自动更新  
✅ **国内可访问** - GitHub Pages在国内访问稳定  

## 部署步骤

### 第一步：创建GitHub仓库

1. 访问 [GitHub.com](https://github.com) 并登录您的账户
2. 点击右上角的 "+" 图标，选择 "New repository"
3. 填写仓库信息：
   - **Repository name**: `membership-management-system`
   - **Description**: `会员管理系统 - 基于React和Supabase`
   - **Visibility**: Public (必须选择Public才能使用GitHub Pages)
   - **Initialize this repository with**: 不要勾选任何选项

4. 点击 "Create repository"

### 第二步：上传项目文件到GitHub

#### 方法一：通过GitHub网页界面上传（推荐）

1. 在您新创建的GitHub仓库页面，点击 "Add file" → "Upload files"
2. 将整个项目文件夹拖拽到上传区域
3. 确保包含以下重要文件：
   - `frontend/` 目录及其所有内容
   - `.github/workflows/deploy.yml` (已配置GitHub Pages部署)
   - 所有配置文件

4. 填写提交信息：`Initial commit: Complete membership management system`
5. 点击 "Commit changes"

#### 方法二：通过GitHub Desktop

1. 下载并安装 [GitHub Desktop](https://desktop.github.com/)
2. 登录您的GitHub账户
3. 选择 "File" → "Clone repository"
4. 选择您刚刚创建的仓库
5. 将项目文件复制到本地仓库文件夹
6. 在GitHub Desktop中提交更改并推送到GitHub

### 第三步：配置GitHub Pages

1. 在GitHub仓库页面，点击 "Settings" 标签
2. 在左侧菜单中找到 "Pages"
3. 在 "Source" 部分选择：
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`

4. 点击 "Save"

### 第四步：配置环境变量

1. 在GitHub仓库页面，点击 "Settings" → "Secrets and variables" → "Actions"
2. 点击 "New repository secret"
3. 添加以下两个密钥：

#### 第一个密钥：
- **Name**: `VITE_SUPABASE_URL`
- **Value**: `https://tdbbstlkwmautdwnrgcb.supabase.co`

#### 第二个密钥：
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkYmJzdGxrd21hdXRkd25yZ2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTQzNjgsImV4cCI6MjA4MTIzMDM2OH0.DcOLXDcoS3l_SRjwacyeMh_SgVs6s1m9eXDcliAuUJU`

### 第五步：触发首次部署

1. 在GitHub仓库页面，点击 "Actions" 标签
2. 您应该能看到 "Deploy to GitHub Pages" 工作流
3. 如果工作流没有自动运行，您可以：
   - 推送一个新的提交到main分支
   - 或者手动运行工作流：点击 "Run workflow"

4. 等待部署完成（约2-5分钟）

### 第六步：访问您的网站

部署完成后，您的网站将通过以下URL访问：

```
https://您的GitHub用户名.github.io/membership-management-system/
```

例如，如果您的GitHub用户名是 `zhangsan`，则URL为：
`https://zhangsan.github.io/membership-management-system/`

## 技术配置说明

### 已完成的配置

1. **GitHub Actions工作流** (`deploy.yml`)
   - 自动构建React应用
   - 部署到GitHub Pages
   - 使用环境变量安全配置

2. **Vite配置** (`vite.config.js`)
   - 生产环境使用正确的base路径
   - 确保静态资源正确加载

3. **Supabase集成**
   - 前端直接调用Supabase API
   - 无需后端服务器

### 部署流程

```
代码推送 → GitHub Actions构建 → 部署到GitHub Pages → 网站可访问
```

## 测试部署

部署完成后，请测试以下功能：

1. **访问网站**: 打开GitHub Pages提供的URL
2. **登录测试**: 使用现有用户凭据登录
3. **会员管理**: 验证会员信息显示完整
4. **权限测试**: 确认管理员功能正常

## 故障排除

### 常见问题

1. **页面显示空白**
   - 检查GitHub Actions构建日志是否有错误
   - 确认环境变量是否正确配置
   - 验证vite.config.js中的base路径

2. **API连接失败**
   - 确认Supabase密钥正确
   - 检查浏览器控制台错误信息
   - 验证Supabase项目状态

3. **构建失败**
   - 查看GitHub Actions详细日志
   - 确认package.json依赖正确
   - 检查是否有语法错误

### 解决方案

1. **重新部署**: 推送新的提交触发重新构建
2. **检查日志**: 在GitHub Actions中查看详细错误信息
3. **环境变量**: 确认密钥名称和值正确

## 后续维护

### 代码更新
当您需要更新网站时：

1. 修改代码文件
2. 提交更改到GitHub
3. GitHub Actions将自动重新部署

### 环境变量更新
如果需要修改Supabase配置：

1. 进入仓库Settings → Secrets and variables → Actions
2. 更新相应的密钥值
3. 推送一个空提交触发重新部署

## 安全注意事项

- GitHub Pages只适合静态网站（无服务器端代码）
- 敏感信息通过环境变量管理
- 定期检查依赖包安全性
- 监控Supabase使用量

## 替代方案

如果GitHub Pages在国内访问不理想，可以考虑：

1. **Gitee Pages** - 码云的静态页面服务
2. **Netlify** - 另一个流行的静态网站托管
3. **自建服务器** - 如果有服务器资源

---

**部署状态**: ✅ 项目已配置GitHub Pages部署  
**预计部署时间**: 10-20分钟  
**访问URL格式**: `https://用户名.github.io/membership-management-system/`  
**技术支持**: 如有问题请检查GitHub Actions日志