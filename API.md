# Image Generator Backend

这是一个基于 Flask 的后端 API 服务，为 Vue3 前端提供用户注册、登录和图像生成功能。

## 功能特性

- 用户注册（支持头像上传）
- 用户登录
- JWT 令牌认证
- 用户信息管理
- 头像文件服务
- MySQL 数据库存储
- 用户图像生成历史记录

## 生产环境部署

后端服务已成功部署，API地址为：`https://huanst.cn/api`

### 前端调试与接入指南

前端开发者接入后端API时，需要进行以下配置：

1. **设置API基础URL**

```javascript
// 在前端配置文件中设置基础URL
const API_BASE_URL = 'https://huanst.cn/api';

// 例如使用axios发送请求
import axios from 'axios';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 添加请求拦截器处理Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
```

2. **处理CORS问题**

后端已配置CORS，允许以下域名的请求：
- http://huanst.cn
- https://huanst.cn
- http://www.huanst.cn
- https://www.huanst.cn

如需添加其他开发域名，请联系后端开发者更新`.env`文件中的`CORS_ORIGINS`配置。

3. **API调试工具**

建议使用以下工具进行API调试：
- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)
- 浏览器开发者工具的网络面板

4. **接口测试**

可通过访问以下URL检查API是否正常工作：
```
https://huanst.cn/api/health
```

应返回类似以下内容：
```json
{
  "message": "API服务运行正常",
  "status": "success",
  "version": "1.0.0"
}
```

## 安装和运行

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 启动服务

使用更新后的启动脚本：

```bash
chmod +x start.sh
./start.sh
```

启动脚本将：
- 创建虚拟环境（如果不存在）
- 安装所需依赖
- 从`.env`文件或环境变量读取配置
- 使用Gunicorn启动服务（端口8000）

### 3. 环境变量配置

您可以通过创建`.env`文件或设置环境变量来配置服务：

```bash
# 数据库配置
MYSQL_HOST=your_mysql_host
MYSQL_PORT=your_mysql_port
MYSQL_USER=your_mysql_username
MYSQL_PASSWORD=your_mysql_password
MYSQL_DB=your_mysql_database

# 应用配置
SECRET_KEY=your_secret_key
FLASK_ENV=production

# CORS配置
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

## API 接口

所有API接口使用基础URL：`https://huanst.cn/api`

### 用户注册

- **URL**: `POST /api/auth/register`
- **Content-Type**: `multipart/form-data`
- **参数**:
  - `username`: 用户名（必填，3-20 字符）
  - `email`: 邮箱（必填）
  - `password`: 密码（必填，6-20 字符）
  - `avatar`: 头像文件（可选，支持 png/jpg/jpeg/gif/webp，最大 5MB）
- **响应示例**:
  ```json
  {
    "status": "success",
    "message": "注册成功",
    "data": {
      "avatarUrl": "/api/uploads/avatars/abc123.jpg"
    }
  }
  ```

### 用户登录

- **URL**: `POST /api/auth/login`
- **Content-Type**: `application/json`
- **参数**:
  ```json
  {
    "username": "用户名",
    "password": "密码"
  }
  ```
- **响应示例**:
  ```json
  {
    "status": "success",
    "message": "登录成功",
    "data": {
      "token": "eyJ0eXAiOiJKV...",
      "user": {
        "username": "test_user",
        "email": "test@example.com",
        "avatarUrl": "/api/uploads/avatars/abc123.jpg"
      }
    }
  }
  ```

### 获取用户信息

- **URL**: `GET /api/auth/profile`
- **Headers**: `Authorization: Bearer <token>`
- **响应示例**:
  ```json
  {
    "status": "success",
    "data": {
      "id": 1,
      "username": "test_user",
      "email": "test@example.com",
      "avatarUrl": "/api/uploads/avatars/abc123.jpg",
      "created_at": "2023-05-30T12:34:56Z"
    }
  }
  ```

### 头像访问

- **URL**: `GET /api/uploads/avatars/<filename>`

### 健康检查

- **URL**: `GET /api/health`
- **响应示例**:
  ```json
  {
    "message": "API服务运行正常",
    "status": "success",
    "version": "1.0.0"
  }
  ```

### 获取用户图像生成历史

- **URL**: `GET /api/v1/images/history`
- **Headers**: `Authorization: Bearer <token>`
- **查询参数 (可选)**:
  - `page` (integer, 默认: 1): 页码。
  - `per_page` (integer, 默认: 10, 最大: 50): 每页数量。
- **成功响应示例 (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "records": [
        {
          "id": 1,
          "prompt": "A beautiful sunset",
          "imageUrl": "/api/uploads/generated_images/1/abcdef123456.png",
          "thumbnailUrl": "/api/uploads/generated_images/1/abcdef123456.png",
          "status": "completed",
          "createdAt": "2023-10-28T12:00:00Z",
          "updatedAt": "2023-10-28T12:00:00Z",
          "params": {
            "model_used": "test_model_v1",
            "seed": 12345,
            "steps": 50
          },
          "errorMessage": null
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "perPage": 10,
        "totalPages": 1
      }
    }
  }
  ```

### 测试图像生成

- **URL**: `POST /api/v1/images/generate-test`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `application/json`
- **请求体**:
  ```json
  {
    "prompt": "你的图像提示词",
    "params": {
      "model": "test_model",
      "steps": 50,
      "seed": 12345
    }
  }
  ```
- **成功响应示例 (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "图像生成成功",
    "data": {
      "id": 1,
      "imageUrl": "/api/uploads/generated_images/1/test_image.jpg",
      "status": "completed"
    }
  }
  ```

### 访问生成的图像

- **URL**: `GET /api/uploads/generated_images/<user_id>/<filename>`
- **Headers**: `Authorization: Bearer <token>` (用户只能访问自己的图像)

## 错误处理

API使用统一的错误响应格式：

```json
{
  "status": "error",
  "message": "错误信息描述"
}
```

常见HTTP状态码：
- 200: 请求成功
- 400: 请求参数错误
- 401: 未授权（Token无效或过期）
- 403: 禁止访问（权限不足）
- 404: 资源不存在
- 409: 冲突（如用户名已存在）
- 500: 服务器内部错误

## 数据库结构

### MySQL 数据库结构

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    avatar_url VARCHAR(256),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE image_generations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    prompt_text TEXT NOT NULL,
    image_filename VARCHAR(256),
    image_url VARCHAR(256),
    thumbnail_url VARCHAR(256),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    generation_params_json TEXT,
    error_message TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## 目录结构

```
backend/
├── app.py              # 主应用文件
├── config.py           # 配置文件
├── db.py               # 数据库连接模块
├── requirements.txt    # Python依赖
├── start.sh            # 启动脚本
├── .env                # 环境变量配置（需自行创建）
├── README.md           # 说明文档
├── DEPLOYMENT_GUIDE.md # 部署指南
└── uploads/            # 上传文件目录
    └── avatars/        # 头像文件存储
    └── generated_images/ # 用户生成的图像存储 (按 user_id 分子目录)
```

## 安全注意事项

1. **生产环境配置**：

   - 使用安全的随机字符串作为 `SECRET_KEY`
   - 设置 `FLASK_ENV=production`
   - 使用 HTTPS

2. **文件上传安全**：

   - 限制文件类型和大小
   - 使用 UUID 生成唯一文件名
   - 文件存储在安全目录

3. **数据库安全**：
   - 密码使用 Werkzeug 进行哈希加密
   - SQL 查询使用参数化防止注入
   - 数据库连接信息存储在 `.env` 文件中，不要直接硬编码

## 联系与支持

如有任何问题或需要支持，请联系后端开发团队。
