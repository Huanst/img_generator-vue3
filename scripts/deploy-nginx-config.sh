#!/bin/bash

# Nginx 配置部署脚本
# 用于在生产服务器上部署正确的 Nginx 配置

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "此脚本需要 root 权限运行"
        echo "请使用: sudo bash $0"
        exit 1
    fi
}

# 备份现有配置
backup_existing_config() {
    print_info "备份现有 Nginx 配置..."
    
    local backup_dir="/var/backups/nginx-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    if [[ -f "/etc/nginx/sites-available/default" ]]; then
        cp "/etc/nginx/sites-available/default" "$backup_dir/"
        print_success "已备份 default 配置到 $backup_dir"
    fi
    
    if [[ -f "/etc/nginx/sites-available/vue-app" ]]; then
        cp "/etc/nginx/sites-available/vue-app" "$backup_dir/"
        print_success "已备份 vue-app 配置到 $backup_dir"
    fi
    
    echo "$backup_dir" > /tmp/nginx_backup_path
}

# 安装新的 Nginx 配置
install_nginx_config() {
    print_info "安装新的 Nginx 配置..."
    
    # 创建新的站点配置
    cat > /etc/nginx/sites-available/vue-app << 'EOF'
server {
    listen 80;
    server_name huanst.cn www.huanst.cn;
    root /var/www/html;
    index index.html;
    
    # 日志配置
    access_log /var/log/nginx/vue-app.access.log;
    error_log /var/log/nginx/vue-app.error.log;
    
    # API 反向代理 - 重要！这是解决404的关键配置
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
        
        # 错误处理
        proxy_intercept_errors on;
        error_page 502 503 504 /50x.html;
    }
    
    # Vue3 SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
        
        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }
    
    # 静态资源缓存优化
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip_static on;
    }
    
    # 字体文件缓存
    location ~* \.(woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
    }
    
    # 图片缓存
    location ~* \.(jpg|jpeg|png|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
    
    # CSS/JS 缓存
    location ~* \.(css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip_static on;
    }
    
    # 健康检查端点 - 前端健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # 禁止访问敏感文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # 禁止访问备份文件
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
EOF

    print_success "Nginx 配置文件已创建"
}

# 启用站点配置
enable_site() {
    print_info "启用站点配置..."
    
    # 禁用默认站点
    if [[ -L "/etc/nginx/sites-enabled/default" ]]; then
        rm -f /etc/nginx/sites-enabled/default
        print_success "已禁用默认站点"
    fi
    
    # 启用新站点
    ln -sf /etc/nginx/sites-available/vue-app /etc/nginx/sites-enabled/
    print_success "已启用 vue-app 站点"
}

# 测试 Nginx 配置
test_nginx_config() {
    print_info "测试 Nginx 配置..."
    
    if nginx -t; then
        print_success "Nginx 配置测试通过"
        return 0
    else
        print_error "Nginx 配置测试失败"
        return 1
    fi
}

# 重启 Nginx 服务
restart_nginx() {
    print_info "重启 Nginx 服务..."
    
    if systemctl restart nginx; then
        print_success "Nginx 服务重启成功"
        
        # 检查服务状态
        if systemctl is-active --quiet nginx; then
            print_success "Nginx 服务运行正常"
        else
            print_error "Nginx 服务启动失败"
            return 1
        fi
    else
        print_error "Nginx 服务重启失败"
        return 1
    fi
}

# 验证配置
verify_configuration() {
    print_info "验证配置..."
    
    # 检查后端服务
    if curl -f "http://localhost:5004/api/health" >/dev/null 2>&1; then
        print_success "后端服务 (端口 5004) 运行正常"
    else
        print_warning "后端服务 (端口 5004) 可能未运行"
        print_info "请确保后端服务已启动: pm2 start ecosystem.config.js"
    fi
    
    # 检查前端健康检查
    if curl -f "http://localhost/health" >/dev/null 2>&1; then
        print_success "前端健康检查正常"
    else
        print_warning "前端健康检查失败"
    fi
    
    # 检查 API 代理
    if curl -f "http://localhost/api/health" >/dev/null 2>&1; then
        print_success "API 代理配置正常"
    else
        print_warning "API 代理配置可能有问题"
    fi
}

# 显示配置信息
show_configuration_info() {
    print_info "配置完成！"
    echo
    echo -e "${GREEN}测试命令:${NC}"
    echo "  前端健康检查: curl http://huanst.cn/health"
    echo "  API 健康检查: curl http://huanst.cn/api/health"
    echo "  后端直接访问: curl http://localhost:5004/api/health"
    echo
    echo -e "${YELLOW}重要提醒:${NC}"
    echo "  1. 确保后端服务在端口 5004 运行"
    echo "  2. 如果使用域名，请确保 DNS 解析正确"
    echo "  3. 如果需要 HTTPS，请配置 SSL 证书"
    echo
    echo -e "${BLUE}后端服务管理:${NC}"
    echo "  启动: pm2 start ecosystem.config.js --env production"
    echo "  查看状态: pm2 status"
    echo "  查看日志: pm2 logs img-generator-backend"
}

# 回滚配置
rollback_configuration() {
    print_warning "配置失败，正在回滚..."
    
    if [[ -f "/tmp/nginx_backup_path" ]]; then
        local backup_dir=$(cat /tmp/nginx_backup_path)
        
        if [[ -f "$backup_dir/default" ]]; then
            cp "$backup_dir/default" /etc/nginx/sites-available/
            ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/
        fi
        
        if [[ -f "$backup_dir/vue-app" ]]; then
            cp "$backup_dir/vue-app" /etc/nginx/sites-available/
        fi
        
        nginx -t && systemctl restart nginx
        print_success "配置已回滚"
    fi
}

# 主函数
main() {
    print_info "开始部署 Nginx 配置..."
    
    # 检查权限
    check_root
    
    # 备份现有配置
    backup_existing_config
    
    # 安装新配置
    install_nginx_config
    
    # 启用站点
    enable_site
    
    # 测试配置
    if ! test_nginx_config; then
        rollback_configuration
        exit 1
    fi
    
    # 重启服务
    if ! restart_nginx; then
        rollback_configuration
        exit 1
    fi
    
    # 验证配置
    verify_configuration
    
    # 显示信息
    show_configuration_info
    
    print_success "Nginx 配置部署完成！"
}

# 运行主函数
main "$@"