# 🚀 GitHub Actions 自动部署快速开始指南

## 📋 概述

本指南将帮助您在 **5 分钟内** 完成 Vue3 项目的自动化部署配置。

## ⚡ 快速配置步骤

### 第一步：运行配置脚本

```bash
# 进入项目目录
cd /Users/huan/develop/img_generator/img_generator-vue3

# 运行自动配置脚本
./scripts/setup-deployment.sh
```

### 第二步：按照脚本提示操作

1. **选择选项 1**: 生成 SSH 密钥对
2. **选择选项 2**: 显示公钥（复制到服务器）
3. **选择选项 5**: 生成服务器安装脚本
4. **选择选项 4**: 测试 SSH 连接
5. **选择选项 3**: 显示私钥（用于 GitHub Secret）

### 第三步：配置服务器

```bash
# 1. 将公钥添加到服务器
ssh your-user@your-server
echo "你的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 2. 运行服务器安装脚本
bash server_setup.sh
```

### 第四步：配置 GitHub Repository Secrets

在 GitHub 仓库中添加以下 Secrets：

| Secret 名称 | 值 | 获取方式 |
|------------|----|---------|
| `SERVER_HOST` | 服务器 IP 或域名 | 您的服务器信息 |
| `SERVER_USER` | SSH 用户名 | 您的服务器用户 |
| `SSH_PRIVATE_KEY` | SSH 私钥 | 脚本选项 3 显示 |
| `DEPLOY_PATH` | `/var/www/html` | 网站部署目录 |

### 第五步：测试部署

```bash
# 推送代码到 main 分支触发自动部署
git add .
git commit -m "配置自动部署"
git push origin main
```

## 📁 文件说明

### 核心配置文件

- **`.github/workflows/depoly-cloud.yml`**: GitHub Actions 工作流配置
- **`scripts/setup-deployment.sh`**: 自动化配置脚本
- **`DEPLOYMENT_GUIDE.md`**: 详细部署指南
- **`QUICK_START.md`**: 本快速开始指南

### 生成的文件

- **`server_setup.sh`**: 服务器环境安装脚本
- **`deployment_config.txt`**: 部署配置信息
- **`~/.ssh/github_actions_deploy`**: SSH 私钥
- **`~/.ssh/github_actions_deploy.pub`**: SSH 公钥

## 🔧 工作流特性

### ✨ 主要功能

- **自动构建**: 使用 pnpm 构建 Vue3 项目
- **智能缓存**: 依赖和构建缓存，加速部署
- **安全传输**: SSH 密钥认证，压缩传输
- **自动备份**: 部署前自动备份当前版本
- **健康检查**: 部署后自动验证服务状态
- **错误处理**: 完善的错误处理和回滚机制

### 🎯 触发条件

- **自动触发**: 推送到 `main` 分支
- **手动触发**: GitHub Actions 页面手动运行
- **环境选择**: 支持 production/staging 环境

### 📊 部署流程

```
代码推送 → 环境准备 → 依赖安装 → 项目构建 → 文件压缩 → 上传服务器 → 备份旧版本 → 部署新版本 → 重启服务 → 健康检查 → 完成通知
```

## 🛠️ 常用命令

### 本地测试

```bash
# 本地构建测试
pnpm install
pnpm run build

# 本地预览构建结果
pnpm run preview
```

### SSH 连接测试

```bash
# 使用生成的密钥测试连接
ssh -i ~/.ssh/github_actions_deploy your-user@your-server

# 测试部署目录权限
ssh -i ~/.ssh/github_actions_deploy your-user@your-server "ls -la /var/www/html"
```

### 服务器状态检查

```bash
# 检查 Nginx 状态
sudo systemctl status nginx

# 检查部署目录
ls -la /var/www/html

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/error.log
```

## 🔍 故障排除

### 常见问题快速解决

| 问题 | 解决方案 |
|------|----------|
| SSH 连接失败 | 检查密钥格式和服务器配置 |
| 权限不足 | 确保用户有 sudo 权限 |
| 构建失败 | 检查 Node.js 版本和依赖 |
| 部署目录不存在 | 运行服务器安装脚本 |
| Nginx 重启失败 | 检查配置语法和服务状态 |

### 调试步骤

1. **查看 GitHub Actions 日志**
2. **SSH 手动连接测试**
3. **检查服务器日志**
4. **验证文件权限**
5. **测试网络连接**

## 📞 获取帮助

### 查看详细文档

- **完整配置指南**: `DEPLOYMENT_GUIDE.md`
- **GitHub Actions 日志**: 仓库 Actions 页面
- **服务器日志**: `/var/log/nginx/error.log`

### 脚本帮助

```bash
# 重新运行配置脚本
./scripts/setup-deployment.sh

# 查看脚本选项
./scripts/setup-deployment.sh --help
```

## 🎉 完成！

配置完成后，每次推送到 `main` 分支都会自动触发部署。您可以在 GitHub Actions 页面查看部署进度和日志。

---

**提示**: 首次部署可能需要较长时间，后续部署会因为缓存而显著加速。