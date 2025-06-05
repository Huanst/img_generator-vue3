# Image Generator Vue3

基于 Vue3 + TypeScript 的图片生成工具

## 特性

- 🚀 Vue3 + TypeScript
- 📦 Vite 构建
- 🎨 图片生成和编辑
- 🔄 自动部署

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

硅基流动 apikey 获取地址：
https://cloud.siliconflow.cn/i/ub4Y8OWs
邀请码：ub4Y8OWs
注册后点击API密钥 → 新建API密钥，然后复制下来填写在.env.local里即可使用

## 部署

项目使用 GitHub Actions 自动部署到服务器。

## 更新记录

- 2024-04-29: 优化部署流程
- 2024-03-17: 项目初始化

## 部署注意事项

### 跨域问题解决方案

前端在生产环境中可能会遇到跨域(CORS)问题，有两种解决方案：

#### 1. 配置Nginx反向代理（推荐）

在Nginx配置中添加以下内容，将前端请求代理到后端API：

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name www.huanst.cn;

    # SSL配置...

    location / {
        root /path/to/your/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 关键配置：将/api路径代理到后端服务器
    location /api/ {
        proxy_pass https://huanst.cn/api/;
        proxy_set_header Host huanst.cn;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 2. 修改后端CORS配置

如果无法使用Nginx代理，请联系后端开发人员修改CORS配置，允许前端域名：

```
Access-Control-Allow-Origin: https://www.huanst.cn
Access-Control-Allow-Credentials: true
```

### 混合内容问题

确保所有资源（包括API请求）都使用HTTPS，避免出现混合内容警告。
