# Image Generator Backend API

基于 Node.js + Express + MySQL 的图片生成器后端API服务。

## 功能特性

- 用户注册和登录
- JWT身份验证
- 头像文件上传
- MySQL数据库存储
- CORS跨域支持
- 文件上传限制和验证
- 错误处理和日志记录

## 技术栈

- **Node.js** - 运行时环境
- **Express.js** - Web框架
- **MySQL** - 数据库
- **JWT** - 身份验证
- **Multer** - 文件上传
- **bcryptjs** - 密码加密
- **CORS** - 跨域资源共享

## 安装和运行

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 环境配置

复制 `.env` 文件并根据需要修改配置：

```bash
cp .env.example .env
```

主要配置项：
- `PORT`: 服务器端口（默认5001）
- `JWT_SECRET`: JWT密钥（生产环境请使用安全的密钥）
- `DB_*`: 数据库连接配置

### 3. 数据库设置

确保MySQL数据库服务正在运行，并且配置信息正确。服务器启动时会自动创建所需的数据表。

### 4. 启动服务器

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

服务器启动后，API将在 `http://localhost:5001` 上运行。

## API接口文档

### 基础信息

- **Base URL**: `http://localhost:5001/api`
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token (JWT)

### 接口列表

#### 1. 健康检查

```http
GET /api/health
```

**响应示例**:
```json
{
  "status": "success",
  "message": "API服务正常运行",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### 2. 用户注册

```http
POST /api/auth/register
Content-Type: multipart/form-data
```

**请求参数**:
- `username` (string, required): 用户名 (3-20字符)
- `email` (string, required): 邮箱地址
- `password` (string, required): 密码 (6-20字符)
- `avatar` (file, optional): 头像文件 (JPG/PNG/GIF/WEBP, 最大5MB)

**响应示例**:
```json
{
  "status": "success",
  "message": "注册成功",
  "data": {
    "userId": 1,
    "username": "testuser",
    "email": "test@example.com",
    "avatarUrl": "/uploads/avatar-1234567890.jpg"
  }
}
```

#### 3. 用户登录

```http
POST /api/auth/login
Content-Type: application/json
```

**请求体**:
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "status": "success",
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "avatarUrl": "/uploads/avatar-1234567890.jpg"
    }
  }
}
```

#### 4. 验证令牌

```http
POST /api/auth/validate-token
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "status": "success",
  "message": "令牌有效",
  "data": {
    "user": {
      "userId": 1,
      "username": "testuser",
      "email": "test@example.com"
    }
  }
}
```

#### 5. 获取用户信息

```http
GET /api/user/profile
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "avatar_url": "/uploads/avatar-1234567890.jpg",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## 错误处理

所有错误响应都遵循以下格式：

```json
{
  "status": "error",
  "message": "错误描述"
}
```

### 常见错误码

- `400` - 请求参数错误
- `401` - 未授权（令牌缺失或无效）
- `403` - 禁止访问
- `404` - 资源不存在
- `409` - 冲突（用户名或邮箱已存在）
- `413` - 文件过大
- `415` - 不支持的文件类型
- `500` - 服务器内部错误

## 数据库结构

### users 表

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### image_generations 表

```sql
CREATE TABLE image_generations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  prompt TEXT NOT NULL,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 安全注意事项

1. **JWT密钥**: 在生产环境中使用强密钥
2. **密码加密**: 使用bcrypt进行密码哈希
3. **文件上传**: 限制文件类型和大小
4. **CORS配置**: 仅允许信任的域名
5. **输入验证**: 对所有用户输入进行验证
6. **错误处理**: 不暴露敏感的系统信息

## 开发和调试

### 日志

服务器会在控制台输出详细的请求和错误日志，便于开发调试。

### 测试API

可以使用以下工具测试API：
- Postman
- curl
- Thunder Client (VS Code插件)
- Insomnia

### 示例curl命令

```bash
# 健康检查
curl http://localhost:5001/api/health

# 用户注册
curl -X POST http://localhost:5001/api/auth/register \
  -F "username=testuser" \
  -F "email=test@example.com" \
  -F "password=password123" \
  -F "avatar=@/path/to/avatar.jpg"

# 用户登录
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

## 部署

### 生产环境配置

1. 设置环境变量 `NODE_ENV=production`
2. 使用强JWT密钥
3. 配置HTTPS
4. 设置反向代理（如Nginx）
5. 配置进程管理器（如PM2）

### PM2部署示例

```bash
npm install -g pm2
pm2 start server.js --name "img-generator-api"
pm2 startup
pm2 save
```

## 许可证

MIT License
