#!/bin/bash

# GitHub Actions 部署环境设置脚本
# 用于快速配置服务器环境和生成 SSH 密钥

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
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

# 显示脚本标题
echo -e "${BLUE}"
echo "================================================"
echo "    GitHub Actions 部署环境设置脚本"
echo "================================================"
echo -e "${NC}"

# 检查操作系统
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
else
    print_error "不支持的操作系统: $OSTYPE"
    exit 1
fi

print_info "检测到操作系统: $OS"

# 函数：生成 SSH 密钥对
generate_ssh_key() {
    print_info "开始生成 SSH 密钥对..."
    
    # 设置密钥文件路径
    KEY_PATH="$HOME/.ssh/github_actions_deploy"
    
    # 检查是否已存在密钥
    if [[ -f "$KEY_PATH" ]]; then
        print_warning "SSH 密钥已存在: $KEY_PATH"
        read -p "是否覆盖现有密钥? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "跳过密钥生成"
            return 0
        fi
        rm -f "$KEY_PATH" "$KEY_PATH.pub"
    fi
    
    # 获取邮箱地址
    read -p "请输入您的邮箱地址 (用于密钥注释): " EMAIL
    if [[ -z "$EMAIL" ]]; then
        EMAIL="github-actions@deploy.local"
    fi
    
    # 生成密钥
    ssh-keygen -t rsa -b 4096 -C "$EMAIL" -f "$KEY_PATH" -N ""
    
    if [[ $? -eq 0 ]]; then
        print_success "SSH 密钥生成成功!"
        print_info "私钥路径: $KEY_PATH"
        print_info "公钥路径: $KEY_PATH.pub"
    else
        print_error "SSH 密钥生成失败"
        exit 1
    fi
}

# 函数：显示公钥内容
show_public_key() {
    KEY_PATH="$HOME/.ssh/github_actions_deploy.pub"
    
    if [[ ! -f "$KEY_PATH" ]]; then
        print_error "公钥文件不存在: $KEY_PATH"
        return 1
    fi
    
    print_info "公钥内容 (需要添加到服务器):"
    echo -e "${GREEN}"
    cat "$KEY_PATH"
    echo -e "${NC}"
    
    print_info "请将上述公钥内容添加到服务器的 ~/.ssh/authorized_keys 文件中"
}

# 函数：显示私钥内容
show_private_key() {
    KEY_PATH="$HOME/.ssh/github_actions_deploy"
    
    if [[ ! -f "$KEY_PATH" ]]; then
        print_error "私钥文件不存在: $KEY_PATH"
        return 1
    fi
    
    print_info "私钥内容 (用于 GitHub Repository Secret):"
    print_warning "请将以下内容复制到 GitHub Repository Secret 'SSH_PRIVATE_KEY' 中"
    echo -e "${YELLOW}"
    cat "$KEY_PATH"
    echo -e "${NC}"
}

# 函数：测试 SSH 连接
test_ssh_connection() {
    read -p "请输入服务器 IP 地址或域名: " SERVER_HOST
    read -p "请输入 SSH 用户名: " SERVER_USER
    read -p "请输入 SSH 端口 (默认 22): " SERVER_PORT
    
    if [[ -z "$SERVER_PORT" ]]; then
        SERVER_PORT=22
    fi
    
    KEY_PATH="$HOME/.ssh/github_actions_deploy"
    
    if [[ ! -f "$KEY_PATH" ]]; then
        print_error "私钥文件不存在，请先生成 SSH 密钥"
        return 1
    fi
    
    print_info "测试 SSH 连接..."
    print_info "连接信息: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
    
    # 测试连接
    ssh -i "$KEY_PATH" -p "$SERVER_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" "echo 'SSH 连接测试成功!'"
    
    if [[ $? -eq 0 ]]; then
        print_success "SSH 连接测试成功!"
        
        # 保存连接信息到文件
        cat > "deployment_config.txt" << EOF
# GitHub Repository Secrets 配置信息
# 请将以下信息添加到 GitHub Repository Secrets 中

SERVER_HOST=$SERVER_HOST
SERVER_USER=$SERVER_USER
SERVER_PORT=$SERVER_PORT

# 其他需要配置的 Secrets:
# DEPLOY_PATH=/var/www/html
# SSH_PRIVATE_KEY=(使用脚本生成的私钥内容)
EOF
        print_success "连接信息已保存到 deployment_config.txt"
    else
        print_error "SSH 连接测试失败，请检查:"
        echo "  1. 服务器地址和端口是否正确"
        echo "  2. 用户名是否正确"
        echo "  3. 公钥是否已添加到服务器"
        echo "  4. 服务器防火墙设置"
    fi
}

# 函数：安装服务器依赖
install_server_dependencies() {
    print_info "生成服务器环境安装脚本..."
    
    cat > "server_setup.sh" << 'EOF'
#!/bin/bash

# 服务器环境设置脚本
# 在目标服务器上运行此脚本以安装必要的依赖

set -e

echo "开始安装服务器依赖..."

# 更新包管理器
if command -v apt-get &> /dev/null; then
    sudo apt-get update
    PACKAGE_MANAGER="apt-get"
elif command -v yum &> /dev/null; then
    sudo yum update -y
    PACKAGE_MANAGER="yum"
elif command -v dnf &> /dev/null; then
    sudo dnf update -y
    PACKAGE_MANAGER="dnf"
else
    echo "错误: 不支持的包管理器"
    exit 1
fi

echo "检测到包管理器: $PACKAGE_MANAGER"

# 安装 Nginx
echo "安装 Nginx..."
if [[ "$PACKAGE_MANAGER" == "apt-get" ]]; then
    sudo apt-get install -y nginx
elif [[ "$PACKAGE_MANAGER" == "yum" ]]; then
    sudo yum install -y nginx
elif [[ "$PACKAGE_MANAGER" == "dnf" ]]; then
    sudo dnf install -y nginx
fi

# 启动并启用 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 创建部署目录
echo "创建部署目录..."
sudo mkdir -p /var/www/html
sudo mkdir -p /var/backups/webapp

# 设置目录权限
echo "设置目录权限..."
sudo chown -R www-data:www-data /var/www/html 2>/dev/null || sudo chown -R nginx:nginx /var/www/html
sudo chmod -R 755 /var/www/html

# 创建基本的 Nginx 配置
echo "配置 Nginx..."
sudo tee /etc/nginx/sites-available/vue-app > /dev/null << 'NGINX_CONFIG'
server {
    listen 80;
    server_name _;
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
    
    # 健康检查端点
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINX_CONFIG

# 启用站点配置
if [[ -d "/etc/nginx/sites-enabled" ]]; then
    sudo ln -sf /etc/nginx/sites-available/vue-app /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
fi

# 测试 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

echo "服务器环境设置完成!"
echo "Nginx 状态:"
sudo systemctl status nginx --no-pager
EOF

    chmod +x "server_setup.sh"
    print_success "服务器安装脚本已生成: server_setup.sh"
    print_info "请将此脚本上传到服务器并执行: bash server_setup.sh"
}

# 函数：显示 Repository Secrets 配置指南
show_secrets_guide() {
    print_info "GitHub Repository Secrets 配置指南:"
    echo
    echo -e "${YELLOW}1. 打开 GitHub 仓库页面${NC}"
    echo -e "${YELLOW}2. 点击 Settings 选项卡${NC}"
    echo -e "${YELLOW}3. 在左侧菜单中选择 Secrets and variables → Actions${NC}"
    echo -e "${YELLOW}4. 点击 New repository secret 按钮${NC}"
    echo -e "${YELLOW}5. 添加以下 Secrets:${NC}"
    echo
    echo -e "${GREEN}必需的 Secrets:${NC}"
    echo "  • SERVER_HOST: 服务器 IP 地址或域名"
    echo "  • SERVER_USER: SSH 用户名"
    echo "  • SSH_PRIVATE_KEY: SSH 私钥内容 (使用本脚本生成)"
    echo "  • DEPLOY_PATH: 部署路径 (如: /var/www/html)"
    echo
    echo -e "${BLUE}可选的 Secrets:${NC}"
    echo "  • SERVER_PORT: SSH 端口 (默认: 22)"
    echo "  • BACKUP_PATH: 备份路径 (默认: /var/backups/webapp)"
    echo "  • HEALTH_CHECK_URL: 健康检查 URL"
    echo "  • NOTIFICATION_WEBHOOK: 通知 Webhook URL"
}

# 主菜单
show_menu() {
    echo
    echo -e "${BLUE}请选择操作:${NC}"
    echo "1. 生成 SSH 密钥对"
    echo "2. 显示公钥 (用于服务器配置)"
    echo "3. 显示私钥 (用于 GitHub Secret)"
    echo "4. 测试 SSH 连接"
    echo "5. 生成服务器安装脚本"
    echo "6. 显示 Repository Secrets 配置指南"
    echo "7. 退出"
    echo
}

# 主循环
while true; do
    show_menu
    read -p "请输入选项 (1-7): " choice
    
    case $choice in
        1)
            generate_ssh_key
            ;;
        2)
            show_public_key
            ;;
        3)
            show_private_key
            ;;
        4)
            test_ssh_connection
            ;;
        5)
            install_server_dependencies
            ;;
        6)
            show_secrets_guide
            ;;
        7)
            print_success "感谢使用部署设置脚本!"
            exit 0
            ;;
        *)
            print_error "无效选项，请输入 1-7"
            ;;
    esac
    
    echo
    read -p "按回车键继续..."
done