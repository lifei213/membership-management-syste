# Supabase Access Token 获取指南

## 重要说明
您需要的是**Supabase CLI Access Token**，而不是项目的API密钥（如anon key或service role key）。

## 具体步骤

### 1. 打开Supabase账户设置
在Supabase控制台页面：
- 点击右上角的**用户头像**（在页面右上角，铃铛图标的右侧）
- 在下拉菜单中选择**Account Settings**（账户设置）

### 2. 导航到Access Tokens页面
在账户设置页面：
- 在左侧导航栏中选择**Access Tokens**（访问令牌）

### 3. 生成新令牌
在Access Tokens页面：
- 点击**Generate New Token**（生成新令牌）按钮
- 为令牌命名（例如：`GitHub Actions Deployment`）
- 选择权限：建议选择**Organization Member**或**Full Access**（确保有部署Edge Functions的权限）
- 点击**Generate Token**（生成令牌）按钮

### 4. 保存令牌
- 生成的令牌会显示一次，请**立即复制并保存**
- 这个令牌就是您需要在GitHub Secrets中配置的`SUPABASE_ACCESS_TOKEN`

## 不要混淆的其他密钥

**以下不是您需要的Access Token**：
- 项目的`anon key`（用于客户端）
- 项目的`service role key`（用于服务器端）
- 项目的`API URL`

这些密钥在项目设置的**API**页面中，但它们不是用于GitHub Actions部署Edge Functions的Access Token。

## 配置完成后
配置好GitHub Secrets后，您可以：
1. 重新推送代码到main分支
2. 或在GitHub Actions页面重新运行失败的工作流

部署成功后，您可以在Supabase控制台的**Edge Functions**页面看到已部署的api函数。