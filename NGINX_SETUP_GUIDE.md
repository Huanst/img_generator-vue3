# Nginx 配置指南 - 解决 API 404 问题

## 🚨 **问题诊断**

您遇到的 404 错误是因为 Nginx 没有正确配置 API 反向代理。当前配置缺少 `/api/` 路径的代理设置。

## 🔧 **解决方案**

### **方案一：使用自动部署脚本（推荐）**

1. **上传配置文件到服务器**
   ```bash
   # 将 deploy-nginx-config.sh 上传到服务器
   scp deploy-nginx-config.sh user@huanst.cn:/tmp/
   ```

2. **在服务器上执行脚本**
   ```bash
   # SSH 连接到服务器
   ssh user@huanst.cn
   
   # 运行配置脚本
   sudo bash /tmp/deploy-nginx-config.sh
   ```

### **方案二：手动配置**

1. **SSH 连接到服务器**
   ```bash
   ssh user@huanst.cn
   ```

2. **备份现有配置**
   ```bash
   sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
   ```

3. **创建新的站点配置**
   ```bash
   sudo nano /etc/nginx/sites-available/vue-app
   ```

4. **复制以下配置内容**
   ```nginx
   server {
       listen 80;
       server_name huanst.cn www.huanst.cn;
       root /var/www/html;
       index index.html;
       
       # 日志配置
       access_log /var/log/nginx/vue-app.access.log;
       error_log /var/log/nginx/vue-app.error.log;
       
       # 🔥 API 反向代理 - 这是解决 404 的关键！
       location /api/ {
           proxy_pass http://localhost:5004/api/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
           
           # 超时设置
           proxy_connect_timeout 60s;
           proxy_send_timeout 60s;
           proxy_read_timeout 60s;
       }
       
       # Vue3 SPA 路由支持
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # 静态资源缓存
       location /assets/ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
       
       # 健康检查端点
       location /health {
           access_log off;
           return 200 "healthy\n";
           add_header Content-Type text/plain;
       }
   }
   ```

5. **启用新配置**
   ```bash
   # 禁用默认站点
   sudo rm -f /etc/nginx/sites-enabled/default
   
   # 启用新站点
   sudo ln -s /etc/nginx/sites-available/vue-app /etc/nginx/sites-enabled/
   ```

6. **测试配置**
   ```bash
   sudo nginx -t
   ```

7. **重启 Nginx**
   ```bash
   sudo systemctl restart nginx
   ```

## ✅ **验证配置**

### **1. 检查后端服务**
```bash
# 在服务器上检查后端是否运行
curl http://localhost:5004/api/health
```

### **2. 检查 API 代理**
```bash
# 测试通过 Nginx 代理访问 API
curl http://huanst.cn/api/health
```

### **3. 检查前端健康检查**
```bash
# 测试前端健康检查
curl http://huanst.cn/health
```

## 🔍 **故障排除**

### **如果 API 仍然 404**

1. **检查后端服务状态**
   ```bash
   # 检查 PM2 进程
   pm2 status
   
   # 如果没有运行，启动后端
   cd /path/to/backend
   pm2 start ecosystem.config.js --env production
   ```

2. **检查端口占用**
   ```bash
   # 确认 5004 端口被占用
   lsof -i :5004
   ```

3. **查看 Nginx 错误日志**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/vue-app.error.log
   ```

4. **查看后端日志**
   ```bash
   pm2 logs img-generator-backend
   ```

### **如果配置测试失败**

1. **检查配置语法**
   ```bash
   sudo nginx -t
   ```

2. **查看详细错误信息**
   ```bash
   sudo nginx -T
   ```

### **如果服务无法启动**

1. **检查端口冲突**
   ```bash
   sudo netstat -tlnp | grep :80
   ```

2. **检查权限问题**
   ```bash
   sudo chown -R www-data:www-data /var/www/html
   sudo chmod -R 755 /var/www/html
   ```

## 📋 **完整的部署检查清单**

- [ ] 后端服务在端口 5004 运行
- [ ] Nginx 已安装并运行
- [ ] 新的站点配置已创建
- [ ] API 代理配置已添加
- [ ] 配置语法测试通过
- [ ] Nginx 服务已重启
- [ ] API 健康检查返回 200
- [ ] 前端页面可以正常访问

## 🎯 **关键配置说明**

### **API 代理配置**
```nginx
location /api/ {
    proxy_pass http://localhost:5004/api/;
    # ... 其他代理设置
}
```

这个配置的作用：
- 将所有 `/api/*` 请求代理到 `http://localhost:5004/api/*`
- 例如：`https://huanst.cn/api/health` → `http://localhost:5004/api/health`

### **Vue SPA 路由支持**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

这个配置确保 Vue Router 的前端路由正常工作。

## 🚀 **部署后测试**

配置完成后，您应该能够：

1. **访问前端应用**: `https://huanst.cn`
2. **API 健康检查**: `https://huanst.cn/api/health`
3. **前端健康检查**: `https://huanst.cn/health`

如果所有测试都通过，说明配置成功！

## 📞 **需要帮助？**

如果按照以上步骤操作后仍有问题，请提供：
1. Nginx 错误日志
2. 后端服务状态
3. 具体的错误信息

这样我可以进一步协助您解决问题。