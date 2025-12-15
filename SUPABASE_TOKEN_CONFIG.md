# Supabase Access Token 配置指南

## 问题分析
从GitHub Actions的部署日志可以看到，Supabase Edge Functions部署失败，错误信息为：

```
Access token not provided
```

这是因为GitHub Actions工作流中尝试使用`SUPABASE_ACCESS_TOKEN`环境变量，但该变量尚未在GitHub仓库的Secrets中配置。

## 解决步骤

### 1. 获取Supabase Access Token

1. 登录到Supabase控制台：https://supabase.com/dashboard
2. 点击右上角的个人头像，选择「Account Settings」
3. 在左侧导航栏中选择「Access Tokens」
4. 点击「Generate New Token」按钮
5. 为令牌命名（例如："GitHub Actions Deployment"）
6. 选择适当的权限（建议选择"Organization Member"或"Full Access"，确保有权限部署Edge Functions）
7. 点击「Generate Token」
8. **复制生成的令牌**（请务必保存好，因为它只会显示一次）

### 2. 在GitHub仓库中配置Secrets

1. 访问GitHub仓库：https://github.com/lifetree213/membership-management-system
2. 点击顶部导航栏的「Settings」
3. 在左侧导航栏中选择「Secrets and variables」→「Actions」
4. 点击「New repository secret」按钮
5. 在「Name」字段中输入：`SUPABASE_ACCESS_TOKEN`
6. 在「Secret」字段中粘贴之前复制的Supabase Access Token
7. 点击「Add secret」按钮保存

### 3. 重新触发部署

配置完成后，您可以：

1. 重新推送代码到main分支，自动触发GitHub Actions工作流
2. 或者在GitHub Actions页面中找到失败的工作流，点击「Re-run jobs」按钮重新运行

## 验证部署

部署成功后，您可以：

1. 查看GitHub Actions的部署状态
2. 访问Supabase控制台的Functions页面：https://supabase.com/dashboard/project/tdbbstlkwmautdwnrgcb/functions
3. 检查api函数的部署状态

## 注意事项

- 请妥善保管您的Supabase Access Token，不要将其暴露在代码或公共场合
- 如果令牌丢失或泄露，应立即在Supabase控制台中撤销该令牌并生成新的令牌
- 确保令牌具有足够的权限来部署Edge Functions