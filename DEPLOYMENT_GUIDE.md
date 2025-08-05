# GitHub Actions 自动部署配置指南

## 📋 概述

本指南将帮助您配置 GitHub Repository Secrets，以实现 Vue3 项目的自动化部署到云服务器。

## 🔐 Repository Secrets 配置

### 如何添加 Repository Secrets

1. 打开您的 GitHub 仓库页面
2. 点击 **Settings** 选项卡
3. 在左侧菜单中找到 **Secrets and variables** → **Actions**
4. 点击 **New repository secret** 按钮
5. 输入密钥名称和值，然后点击 **Add secret**

### 必需的 Secrets 配置

#### 🖥️ 服务器连接配置

| Secret 名称 | 描述 | 示例值 | 必需 |
|------------|------|--------|------|
| `SERVER_HOST` | 服务器 IP 地址或域名 | `192.168.1.100` 或 `example.com` | ✅ |
| `SERVER_USER` | SSH 登录用户名 | `root` 或 `ubuntu` | ✅ |
| `SSH_PRIVATE_KEY` | SSH 私钥内容 | `-----BEGIN OPENSSH PRIVATE KEY-----...` | ✅ |
| `SERVER_PORT` | SSH 端口号 | `22`（默认值，可选） | ❌ |

#### 📁 部署路径配置

| Secret 名称 | 描述 | 示例值 | 必需 |
|------------|------|--------|------|
| `DEPLOY_PATH` | 网站部署目录 | `/var/www/html` 或 `/usr/share/nginx/html` | ✅ |
| `BACKUP_PATH` | 备份存储目录 | `/var/backups/webapp`（默认值，可选） | ❌ |

#### 🔍 监控配置（可选）

| Secret 名称 | 描述 | 示例值 | 必需 |
|------------|------|--------|------|
| `HEALTH_CHECK_URL` | 健康检查 URL | `https://yourdomain.com/api/health` | ❌ |
| `NOTIFICATION_WEBHOOK` | 通知 Webhook URL | `https://hooks.slack.com/...` | ❌ |

## 🔑 SSH 密钥配置详解

### 1. 生成 SSH 密钥对

在您的本地机器上执行以下命令：

```bash
# 生成新的 SSH 密钥对
ssh-keygen -t rsa -b 4096 -C "github-actions@yourdomain.com" -f ~/.ssh/github_actions_key

# 不要设置密码短语（直接按回车）
```

### 2. 配置服务器端

将公钥添加到服务器的授权密钥文件中：

```bash
# 在服务器上执行
cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 3. 获取私钥内容

```bash
# 显示私钥内容
cat ~/.ssh/github_actions_key
```

将完整的私钥内容（包括 `-----BEGIN OPENSSH PRIVATE KEY-----` 和 `-----END OPENSSH PRIVATE KEY-----`）复制到 `SSH_PRIVATE_KEY` secret 中。

## 🗂️ 服务器目录结构建议

```
/var/www/html/                 # 网站根目录 (DEPLOY_PATH)
├── index.html                 # Vue3 构建产物
├── assets/                    # 静态资源
└── ...

/var/backups/webapp/           # 备份目录 (BACKUP_PATH)
├── backup-20241201-143022.tar.gz
├── backup-20241201-120015.tar.gz
└── ...
```

## 🔧 服务器环境要求

### 必需软件

- **Web 服务器**: Nginx 或 Apache
- **系统权限**: sudo 权限（用于文件操作和服务重启）
- **网络**: 允许 GitHub Actions IP 访问

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/html;
    index index.html;
    
    # Vue3 SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 健康检查端点（可选）
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

## 🚀 部署流程说明

### 自动触发条件

1. **推送到 main 分支**: 自动触发部署
2. **手动触发**: 在 GitHub Actions 页面手动运行

### 部署步骤

1. **代码检出**: 获取最新代码
2. **环境设置**: 配置 Node.js 和 pnpm
3. **依赖安装**: 安装项目依赖（带缓存优化）
4. **代码检查**: 执行 lint 检查（可选）
5. **项目构建**: 构建 Vue3 项目
6. **文件压缩**: 压缩构建产物
7. **文件传输**: 上传到服务器
8. **服务器部署**: 备份、解压、权限设置
9. **服务重启**: 重启 Web 服务
10. **健康检查**: 验证部署结果
11. **状态通知**: 发送部署结果通知

## 🛠️ 故障排除

### 常见问题

#### 1. SSH 连接失败

**错误**: `Permission denied (publickey)`

**解决方案**:
- 检查 SSH 私钥格式是否正确
- 确认公钥已添加到服务器 `~/.ssh/authorized_keys`
- 检查服务器 SSH 配置是否允许密钥认证

#### 2. 权限不足

**错误**: `Permission denied` 或 `sudo: no tty present`

**解决方案**:
- 确保用户有 sudo 权限
- 配置免密码 sudo：`echo "username ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers`

#### 3. 部署目录不存在

**错误**: `No such file or directory`

**解决方案**:
- 手动创建部署目录：`sudo mkdir -p /var/www/html`
- 设置正确的目录权限

#### 4. Web 服务重启失败

**错误**: `Failed to reload nginx`

**解决方案**:
- 检查 Nginx 配置语法：`sudo nginx -t`
- 确保 Nginx 服务正在运行：`sudo systemctl status nginx`

### 调试技巧

1. **查看 GitHub Actions 日志**: 在仓库的 Actions 页面查看详细日志
2. **SSH 手动测试**: 使用相同的密钥手动连接服务器测试
3. **服务器日志**: 检查 `/var/log/nginx/error.log` 等日志文件
4. **权限检查**: 确认文件和目录权限设置正确

## 📞 技术支持

如果遇到问题，请检查：

1. GitHub Actions 执行日志
2. 服务器系统日志
3. Web 服务器错误日志
4. 网络连接状态

---

**注意**: 请妥善保管您的 SSH 私钥，不要在公开场所分享。定期更新密钥以确保安全性。