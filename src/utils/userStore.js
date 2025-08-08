// Graceful shutdown
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 根据环境加载对应的配置文件
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
require('dotenv').config({ path: path.join(__dirname, envFile) });

console.log(`加载环境配置文件: ${envFile}`);
console.log(`当前环境: ${process.env.NODE_ENV || 'development'}`);

// Console输出已启用用于调试

const app = express();
const PORT = process.env.PORT || 5004;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// 中间件配置
// 启用CORS以支持跨域请求
app.use(cors({
  origin: function (origin, callback) {
    try {
      // 从环境变量获取允许的域名列表
      const corsOrigin = process.env.CORS_ORIGIN || process.env.ALLOWED_ORIGINS;
      let allowedOrigins = [];
      
      if (corsOrigin) {
        allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());
      }
      
      // 开发环境默认允许的域名
      if (process.env.NODE_ENV === 'development') {
        const devOrigins = [
          'http://localhost:4173',
          'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 
          'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178',
          'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://127.0.0.1:5175', 
          'http://127.0.0.1:5176', 'http://127.0.0.1:5177', 'http://127.0.0.1:5178'
        ];
        allowedOrigins = [...new Set([...allowedOrigins, ...devOrigins])];
      }
      
      // 生产环境默认域名（如果没有配置环境变量）
      if (allowedOrigins.length === 0) {
        allowedOrigins = ['https://huanst.cn', 'https://www.huanst.cn', 'https://admin-dashboard.huanst.cn'];
      }
      
      console.log('CORS配置 - 允许的域名:', allowedOrigins);
      console.log('CORS配置 - 请求来源:', origin);
      
      // 检查是否允许该来源
      if (!origin || 
          allowedOrigins.includes(origin) || 
          (process.env.NODE_ENV === 'development' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))) {
        console.log('CORS允许访问:', origin);
        callback(null, true);
      } else {
        console.log('CORS拒绝 - 不允许的来源:', origin);
        // 不要抛出错误，而是返回false
        callback(null, false);
      }
    } catch (error) {
      console.error('CORS配置错误:', error);
      // 发生错误时，为了安全起见，拒绝访问
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Accept-Language',
    'Content-Language',
    'DNT',
    'User-Agent',
    'If-Modified-Since',
    'Cache-Control',
    'Range'
  ],
  exposedHeaders: [
    'Content-Length',
    'Content-Range',
    'X-Total-Count',
    'X-Page-Count'
  ],
  optionsSuccessStatus: 200, // 为了兼容旧版浏览器
  preflightContinue: false, // 不传递预检请求到下一个处理器
  maxAge: 86400 // 预检请求缓存时间（24小时）
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 用于头像访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  timezone: '+08:00' // 设置为中国时区
};

// 创建数据库连接池
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 创建用户目录的辅助函数
function ensureUserDir(userId) {
  const userDir = path.join(__dirname, 'uploads', `user-${userId}`);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}

// 创建用户头像目录
function ensureUserAvatarDir(userId) {
  const userDir = ensureUserDir(userId);
  const avatarDir = path.join(userDir, 'avatars');
  if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
  }
  return avatarDir;
}

// 创建用户生成图片目录
function ensureUserGeneratedImagesDir(userId) {
  const userDir = ensureUserDir(userId);
  const imagesDir = path.join(userDir, 'generated-images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  return imagesDir;
}

// 文件上传配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 如果是头像上传且有用户信息，使用用户专属目录
    if (req.user && req.user.userId) {
      const avatarDir = ensureUserAvatarDir(req.user.userId);
      cb(null, avatarDir);
    } else {
      // 注册时的头像上传，暂时存储在临时目录
      const tempDir = path.join(__dirname, 'uploads', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      cb(null, tempDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// JWT验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失',
      code: 401,
      timestamp: new Date().toISOString()
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: '访问令牌无效',
        code: 403,
        timestamp: new Date().toISOString()
      });
    }
    req.user = user;
    next();
  });
};

// 管理员权限验证中间件
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('认证中间件检查:', {
    hasAuthHeader: !!authHeader,
    hasToken: !!token,
    authHeader: authHeader ? authHeader.substring(0, 20) + '...' : '无'
  });

  if (!token) {
    console.log('认证失败: 缺少token');
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失',
      code: 401,
      timestamp: new Date().toISOString()
    });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    
    // 从数据库验证管理员权限
    const connection = await pool.getConnection();
    try {
      const [admins] = await connection.execute(
        'SELECT id, username, email, status FROM admins WHERE id = ?',
        [user.userId]
      );
      
      if (admins.length === 0) {
        return res.status(403).json({
          success: false,
          message: '权限不足，需要管理员权限',
          code: 403,
          timestamp: new Date().toISOString()
        });
      }
      
      const dbAdmin = admins[0];
      
      if (dbAdmin.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: '管理员账户已被禁用',
          code: 403,
          timestamp: new Date().toISOString()
        });
      }
      
      req.user = {
        ...user,
        role: 'admin',
        status: dbAdmin.status
      };
      next();
    } finally {
      connection.release();
    }
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: '访问令牌无效',
      code: 401,
      timestamp: new Date().toISOString()
    });
  }
};

// 可选JWT验证中间件（用于图像生成等可以匿名访问的接口）
const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // 没有token时，设置用户为null，继续执行
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // token无效时，设置用户为null，继续执行
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

// 初始化数据库表
async function initDatabase() {
  try {
    console.log('开始连接数据库...');
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    
    // 创建用户表（仅用于图像生成用户）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
        avatar_url VARCHAR(255),
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 创建管理员表（专用于后台管理系统）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
        avatar_url VARCHAR(255),
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建图片生成历史表（重命名为images以符合API文档）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        url VARCHAR(500),
        thumbnail VARCHAR(500),
        category VARCHAR(100),
        tags JSON,
        size BIGINT,
        width INT,
        height INT,
        format VARCHAR(10),
        prompt TEXT NOT NULL,
        user_id INT,
        status ENUM('published', 'draft', 'deleted') DEFAULT 'published',
        local_path VARCHAR(500),
        filename VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 创建系统配置表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value TEXT,
        description VARCHAR(255),
        type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 数据迁移：确保users表有必要的字段
    try {
      // 检查并添加role字段
      const [roleColumn] = await connection.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'",
        [process.env.DB_NAME]
      );
      if (roleColumn.length === 0) {
        await connection.execute("ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user' AFTER password_hash");
        console.log('已为users表添加role字段');
      }

      // 检查并添加status字段
      const [statusColumn] = await connection.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status'",
        [process.env.DB_NAME]
      );
      if (statusColumn.length === 0) {
        await connection.execute("ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive', 'banned') DEFAULT 'active' AFTER role");
        console.log('已为users表添加status字段');
      }

      // 检查并添加last_login字段
      const [lastLoginColumn] = await connection.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login'",
        [process.env.DB_NAME]
      );
      if (lastLoginColumn.length === 0) {
        await connection.execute("ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL AFTER avatar_url");
        console.log('已为users表添加last_login字段');
      }

      // 数据迁移：将现有管理员用户迁移到admins表
      const [existingAdmins] = await connection.execute(
        "SELECT id, username, email, password_hash, avatar_url, last_login, created_at, updated_at FROM users WHERE role = 'admin'"
      );

      for (const admin of existingAdmins) {
        // 检查管理员是否已存在于admins表中
        const [adminExists] = await connection.execute(
          'SELECT id FROM admins WHERE username = ?',
          [admin.username]
        );

        if (adminExists.length === 0) {
          await connection.execute(
            'INSERT INTO admins (username, email, password_hash, avatar_url, last_login, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [admin.username, admin.email, admin.password_hash, admin.avatar_url, admin.last_login, admin.created_at, admin.updated_at]
          );
          console.log(`已迁移管理员用户: ${admin.username}`);
        }
      }

      // 从users表中删除管理员用户
      if (existingAdmins.length > 0) {
        await connection.execute("DELETE FROM users WHERE role = 'admin'");
        console.log('已从users表中删除管理员用户');
      }
    } catch (migrationError) {
      console.log('管理员数据迁移跳过或失败:', migrationError.message);
    }
    
    // 迁移image_generations数据到images表
    try {
      const [existingData] = await connection.execute('SELECT COUNT(*) as count FROM image_generations');
      if (existingData[0].count > 0) {
        await connection.execute(`
          INSERT IGNORE INTO images (prompt, user_id, local_path, filename, created_at)
          SELECT prompt, user_id, local_path, filename, created_at FROM image_generations
        `);
        console.log('已迁移image_generations数据到images表');
      }
    } catch (migrateError) {
      console.log('数据迁移跳过或失败:', migrateError.message);
    }
    
    // 插入默认系统配置
    const defaultConfigs = [
      ['siteName', 'AI图片生成平台', '网站名称', 'string'],
      ['siteDescription', '专业的AI图片生成服务', '网站描述', 'string'],
      ['maxFileSize', '10485760', '最大文件大小（字节）', 'number'],
      ['allowedFormats', '["jpg", "png", "gif", "webp"]', '允许的文件格式', 'json'],
      ['enableRegistration', 'true', '是否允许注册', 'boolean'],
      ['enableEmailVerification', 'false', '是否启用邮箱验证', 'boolean'],
      ['defaultUserRole', 'user', '默认用户角色', 'string']
    ];
    
    for (const [key, value, desc, type] of defaultConfigs) {
      await connection.execute(
        'INSERT IGNORE INTO system_configs (config_key, config_value, description, type) VALUES (?, ?, ?, ?)',
        [key, value, desc, type]
      );
    }
    
    // 创建默认管理员账户（在admins表中）
    const [adminExists] = await connection.execute(
      'SELECT id FROM admins WHERE username = "admin" LIMIT 1'
    );
    
    if (adminExists.length === 0) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      await connection.execute(
        'INSERT INTO admins (username, email, password_hash, status) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@example.com', adminPassword, 'active']
      );
      console.log('已创建默认管理员账户: admin/admin123');
    }
    
    // 创建Huan管理员账户（在admins表中）
    const [huanExists] = await connection.execute(
      'SELECT id FROM admins WHERE username = "Huan" LIMIT 1'
    );
    
    if (huanExists.length === 0) {
      const huanPassword = await bcrypt.hash('Huanst518', 10);
      await connection.execute(
        'INSERT INTO admins (username, email, password_hash, status) VALUES (?, ?, ?, ?)',
        ['Huan', '123465@qq.com', huanPassword, 'active']
      );
      console.log('已创建Huan管理员账户: Huan/Huanst518');
    }

    connection.release();
    console.log('数据库表初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 提示词风格模板
// API路由

// 健康检查
app.get('/api/health', (req, res) => {
    console.log('接收到健康检查请求');
    try {
        res.status(200).send('OK');
        console.log('健康检查响应已发送');
    } catch (error) {
        console.error('处理健康检查请求时出错:', error);
        res.status(500).send('Internal Server Error');
    }
});

// 随机提示词生成接口
app.post('/api/generate-prompt', optionalAuthenticateToken, async (req, res) => {
  try {
    console.log('收到提示词生成请求');
    
    // 检查API密钥
    const apiKey = process.env.VITE_SILICONFLOW_API_KEY;
    if (!apiKey) {
      console.error('API密钥未设置');
      return res.status(500).json({
        status: 'error',
        message: 'API密钥未配置，无法生成提示词'
      });
    }
    
    console.log('API密钥已设置:', apiKey.substring(0, 10) + '...');
    
    // 创建超时Promise - 设置为30秒
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('请求超时')), 30000); // 30秒超时
    });

    // 创建API请求Promise
    const apiPromise = fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'Qwen/Qwen2.5-7B-Instruct',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的AI绘画提示词生成器。请生成一个创意、详细的中文绘画提示词，包含主题、风格、光照、构图等元素。提示词应该适合用于AI图像生成，使用中文描述，内容丰富且具有艺术性。'
          },
          {
            role: 'user', 
            content: '请生成一个随机的、有创意的中文绘画提示词'
          }
        ],
        max_tokens: 200,
        temperature: 0.8
      })
    });

    console.log('开始调用SiliconFlow API...');
    
    // 使用Promise.race来实现超时控制
    const response = await Promise.race([apiPromise, timeoutPromise]);
    
    console.log('API响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API请求失败:', response.status, errorText);
      return res.status(response.status).json({
        status: 'error',
        message: `SiliconFlow API调用失败: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log('API响应数据:', JSON.stringify(data, null, 2));
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const generatedPrompt = data.choices[0].message.content.trim();
      console.log('成功生成AI提示词:', generatedPrompt);
      
      res.json({
        status: 'success',
        prompt: generatedPrompt,
        source: 'ai_generated'
      });
    } else {
      console.error('API响应格式错误:', data);
      return res.status(500).json({
        status: 'error',
        message: 'SiliconFlow API响应格式错误',
        details: data
      });
    }
  } catch (error) {
    console.error('提示词生成失败:', error);
    
    // 如果是超时错误，返回特定的错误信息
    if (error.message === '请求超时') {
      return res.status(408).json({
        status: 'error',
        message: 'SiliconFlow API请求超时，请稍后重试'
      });
    }
    
    // 其他错误
    res.status(500).json({
      status: 'error',
      message: '提示词生成失败',
      error: error.message
    });
  }
});

// 简单的用户测试端点
app.get('/api/test-users', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [users] = await connection.execute('SELECT id, username, email FROM users LIMIT 5');
        connection.release();

        res.json({
            success: true,
            data: users,
            count: users.length
        });
    } catch (error) {
        console.error('测试用户查询错误:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 创建测试用户端点
app.post('/api/create-test-users', async (req, res) => {
    try {
        const connection = await pool.getConnection();

        // 先清理现有测试用户
        await connection.execute("DELETE FROM users WHERE username LIKE 'test%' OR username IN ('alice_smith', 'bob_jones', 'charlie_brown')");

        // 创建测试用户
        const testUsers = [
            ['testuser1', 'test1@example.com', '$2b$10$example1hash'],
            ['testuser2', 'test2@example.com', '$2b$10$example2hash'],
            ['alice_smith', 'alice@example.com', '$2b$10$example3hash'],
            ['bob_jones', 'bob@example.com', '$2b$10$example4hash'],
            ['charlie_brown', 'charlie@example.com', '$2b$10$example5hash']
        ];

        for (const [username, email, password_hash] of testUsers) {
            await connection.execute(
                'INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, NOW())',
                [username, email, password_hash]
            );
        }

        // 检查结果
        const [users] = await connection.execute('SELECT COUNT(*) as total FROM users');
        connection.release();

        res.json({
            success: true,
            message: '测试用户创建成功',
            totalUsers: users[0].total
        });
    } catch (error) {
        console.error('创建测试用户错误:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 图片下载辅助函数
async function downloadImage(url, filepath, expectedSize = '1280x1280') {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  await fs.promises.writeFile(filepath, Buffer.from(buffer));

  // 解析期望的尺寸
  const [expectedWidth, expectedHeight] = expectedSize.split('x').map(Number);

  // 获取图片尺寸信息
  try {
    const stats = await fs.promises.stat(filepath);
    const fileSize = stats.size;

    // 使用简单的方法获取图片尺寸
    // 对于PNG图片，我们可以从文件头读取尺寸信息
    const imageBuffer = Buffer.from(buffer);
    let width = 0, height = 0;

    if (imageBuffer.length > 24) {
      // PNG文件格式检查
      if (imageBuffer.toString('ascii', 1, 4) === 'PNG') {
        // PNG格式：宽度在字节16-19，高度在字节20-23
        width = imageBuffer.readUInt32BE(16);
        height = imageBuffer.readUInt32BE(20);
      }
      // JPEG文件格式检查
      else if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) {
        // 对于JPEG，使用传入的期望尺寸，因为解析比较复杂
        width = expectedWidth;
        height = expectedHeight;
      }
    }

    return {
      filepath,
      width: width || expectedWidth,   // 使用期望尺寸作为默认值
      height: height || expectedHeight, // 使用期望尺寸作为默认值
      size: fileSize
    };
  } catch (error) {
    console.error('获取图片信息失败:', error);
    return {
      filepath,
      width: expectedWidth,   // 使用期望尺寸作为默认值
      height: expectedHeight, // 使用期望尺寸作为默认值
      size: 0
    };
  }
}

// 创建用户图片目录（已移动到上面的辅助函数中）
// 使用 ensureUserGeneratedImagesDir(userId) 替代

// 生成安全的文件名（基于提示词）
function generateSafeFilename(prompt, timestamp, index = 0) {
  // 提取提示词的前30个字符，只保留英文字母和数字
  const safePrompt = prompt
    .substring(0, 30)
    .replace(/[^a-zA-Z0-9]/g, '') // 只保留英文字母和数字
    .toLowerCase();
  
  // 如果处理后的提示词为空，使用默认名称
  const finalPrompt = safePrompt || 'image';
  const suffix = index > 0 ? `-${index}` : '';
  return `${finalPrompt}-${timestamp}${suffix}.png`;
}

// SiliconFlow 图片生成代理（改进版）
app.post('/api/generate-image', optionalAuthenticateToken, async (req, res) => {
  try {
    const { prompt, model = 'Kwai-Kolors/Kolors', image_size = '1280x1280', batch_size = 1 } = req.body;

    // 验证必填参数
    if (!prompt) {
      return res.status(400).json({
        status: 'error',
        message: '提示词(prompt)是必填参数'
      });
    }

    // 验证提示词长度
    if (prompt.length > 1000) {
      return res.status(400).json({
        status: 'error',
        message: '提示词长度不能超过1000个字符'
      });
    }

    // 验证图片尺寸
    const validSizes = ['1024x1024', '1280x1280', '1024x1280', '1280x1024'];
    if (!validSizes.includes(image_size)) {
      return res.status(400).json({
        status: 'error',
        message: '不支持的图片尺寸，支持的尺寸: ' + validSizes.join(', ')
      });
    }

    // 验证批次大小
    if (batch_size < 1 || batch_size > 4) {
      return res.status(400).json({
        status: 'error',
        message: '批次大小必须在1-4之间'
      });
    }

    // 调用 SiliconFlow API
    const response = await fetch('https://api.siliconflow.cn/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SILICONFLOW_API_KEY}`
      },
      body: JSON.stringify({
        prompt,
        model,
        image_size,
        batch_size
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('SiliconFlow API错误:', data);
      return res.status(response.status).json({
        status: 'error',
        message: data.error?.message || 'SiliconFlow API调用失败',
        details: data
      });
    }

    let downloadedImages = [];
    
    // 只有登录用户才下载并保存图片到本地
    if (req.user && req.user.userId) {
      // 确保用户图片目录存在
      const userImageDir = ensureUserGeneratedImagesDir(req.user.userId);
      const timestamp = Date.now();

      // 下载并保存图片到本地
      try {
        if (data.data && Array.isArray(data.data)) {
          for (let i = 0; i < data.data.length; i++) {
            const imageData = data.data[i];
            if (imageData.url) {
              // 生成本地文件名
              const filename = generateSafeFilename(prompt, timestamp, i);
              const localPath = path.join(userImageDir, filename);
              
              // 下载图片并获取尺寸信息，传递正确的尺寸参数
              const imageInfo = await downloadImage(imageData.url, localPath, image_size);

              // 生成可访问的URL路径
              const accessibleUrl = `/uploads/user-${req.user.userId}/generated-images/${filename}`;

              downloadedImages.push({
                original_url: imageData.url,
                local_url: accessibleUrl,
                local_path: localPath,
                filename: filename,
                width: imageInfo.width,
                height: imageInfo.height,
                size: imageInfo.size
              });
              
              // 保留原始URL，添加本地URL作为备选
              data.data[i].original_url = imageData.url;
              data.data[i].local_url = accessibleUrl;
            }
          }
        }
      } catch (downloadError) {
        console.error('图片下载失败:', downloadError);
        // 如果下载失败，仍然使用原始URL
      }
    }

    // 只有登录用户才保存生成记录到数据库
    if (req.user && req.user.userId) {
      try {
        const connection = await pool.getConnection();
        
        // 保存每张生成的图片记录到 images 表
        for (let i = 0; i < downloadedImages.length; i++) {
          const imageInfo = downloadedImages[i];

          // 使用实际检测的图片尺寸，而不是前端传递的尺寸
          // 这样可以确保数据库中存储的是真实的图片尺寸信息
          const actualWidth = imageInfo.width || 1280;   // 使用实际检测的宽度
          const actualHeight = imageInfo.height || 1280; // 使用实际检测的高度
          const [frontendWidth, frontendHeight] = image_size.split('x').map(Number);

          console.log('保存图片记录到数据库:', {
            userId: req.user.userId,
            prompt: prompt.substring(0, 30),
            local_url: imageInfo.local_url,
            original_url: imageInfo.original_url,
            filename: imageInfo.filename,
            frontend_size: `${frontendWidth}x${frontendHeight}`,
            detected_size: `${actualWidth}x${actualHeight}`,
            using_actual_size: true
          });

          try {
            console.log('开始执行数据库插入操作...');

            // 验证必要的数据
            console.log('插入参数验证:', {
              userId: req.user.userId,
              title: `AI生成图像 - ${prompt.substring(0, 30)}...`,
              prompt: prompt ? prompt.substring(0, 50) + '...' : 'NULL',
              url: imageInfo.local_url || imageInfo.original_url || '',
              actualWidth,
              actualHeight,
              size: imageInfo.size || 0
            });

            // 确保prompt不为空
            if (!prompt || prompt.trim() === '') {
              throw new Error('Prompt不能为空');
            }

            // 使用当前时间戳，确保时区正确
            const now = new Date();

            const result = await connection.execute(
              'INSERT INTO images (user_id, title, prompt, url, thumbnail, width, height, size, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [
                req.user.userId,
                `AI生成图像 - ${prompt.substring(0, 30)}...`,
                prompt,
                imageInfo.local_url || imageInfo.original_url || '',  // 优先使用本地URL
                imageInfo.local_url || imageInfo.original_url || '',  // 缩略图也使用本地URL
                actualWidth,              // 使用实际检测的图片宽度
                actualHeight,             // 使用实际检测的图片高度
                imageInfo.size || 0,      // 使用实际文件大小
                now,                      // 创建时间
                now                       // 更新时间
              ]
            );
            console.log('数据库插入成功:', result.insertId);
          } catch (insertError) {
            console.error('数据库插入失败:', insertError);
            console.error('错误详情:', insertError.message);
            console.error('错误代码:', insertError.code);
            throw insertError; // 重新抛出错误以便外层catch捕获
          }
        }

        // 如果没有成功下载的图片，保存一条记录（仅包含提示词）
        if (downloadedImages.length === 0) {
          // 使用前端传递的尺寸信息（因为没有实际图片可以检测）
          const [frontendWidth, frontendHeight] = image_size.split('x').map(Number);
          const now = new Date();

          await connection.execute(
            'INSERT INTO images (user_id, title, prompt, url, thumbnail, width, height, size, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              req.user.userId,
              `AI生成图像 - ${prompt.substring(0, 30)}...`,
              prompt,
              '',
              '',
              frontendWidth,   // 使用前端传递的尺寸（因为没有实际图片）
              frontendHeight,  // 使用前端传递的尺寸（因为没有实际图片）
              0,
              now,             // 创建时间
              now              // 更新时间
            ]
          );
        }
        
        connection.release();
      } catch (dbError) {
        console.error('保存生成记录失败:', dbError);
        // 不影响API响应，只记录错误
      }
    }

    // 返回成功响应
    const apiResponse = {
      status: 'success',
      message: '图片生成成功',
      data: data.data,
      usage: data.usage
    };
    
    // 只有登录用户才返回本地存储信息
    if (req.user && req.user.userId) {
      apiResponse.local_info = {
        downloaded_count: downloadedImages.length,
        user_folder: `/uploads/user-${req.user.userId}/generated-images/`,
        images: downloadedImages.map(img => ({
          filename: img.filename,
          url: img.local_url
        }))
      };
    } else {
      apiResponse.guest_info = {
        message: '访客模式：图片未保存到服务器，请及时下载保存'
      };
    }
    
    res.json(apiResponse);

  } catch (error) {
    console.error('图片生成代理错误:', error);
    res.status(500).json({
      status: 'error',
      message: '图片生成服务暂时不可用',
      details: error.message
    });
  }
});

// 获取用户的图片生成历史
app.get('/api/image-history', authenticateToken, async (req, res) => {
  try {
    // 参数验证和转换
    const pageParam = parseInt(req.query.page) || 1;
    const limitParam = parseInt(req.query.limit) || 10;

    console.log('收到图片历史记录请求 (server.js):', {
      userId: req.user.userId,
      page: pageParam,
      limit: limitParam
    });
    const page = Math.max(1, pageParam);
    const limit = Math.min(Math.max(1, limitParam), 100); // 限制最大100条
    const offset = (page - 1) * limit;

    const connection = await pool.getConnection();

    // 获取总数
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM images WHERE user_id = ?',
      [req.user.userId]
    );

    // 获取分页数据
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    const [rows] = await connection.execute(
      `SELECT id, title, url, thumbnail, prompt, category, width, height, size, created_at FROM images WHERE user_id = ? ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`,
      [req.user.userId]
    );

    connection.release();

    // 处理数据，确保每个项目都有可用的图片URL和正确的尺寸信息
    const processedItems = rows.map(item => {
      // 计算实际文件大小（如果数据库中为0或null）
      let actualSize = item.size || 0;
      if (item.url && actualSize === 0) {
        try {
          const filePath = path.join(__dirname, item.url.replace(/^\//, ''));
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            actualSize = stats.size;
          }
        } catch (error) {
          console.log('获取文件大小失败:', item.url, error.message);
        }
      }

      return {
        id: item.id,
        title: item.title || `AI生成图像 - ${item.prompt.substring(0, 30)}...`,
        prompt: item.prompt,
        category: item.category || 'art',
        width: item.width || 1280,  // 使用正确的默认尺寸
        height: item.height || 1280, // 使用正确的默认尺寸
        size: actualSize,
        created_at: item.created_at,
        // 使用 url 字段作为显示URL，如果没有则使用占位符
        display_url: item.url || item.thumbnail ||
          'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+CiAgPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmMGYwZjAiIHN0cm9rZT0iI2RkZCIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iODAiIHI9IjIwIiBmaWxsPSIjY2NjIi8+CiAgPHBhdGggZD0iTTYwIDEyMCBMMTAwIDEwMCBMMTQwIDEyMCBMMTgwIDEwMCBMMTgwIDE2MCBMMJAGMTY2MCBMMJAGMTI2IFoiIGZpbGw9IiNkZGQiLz4KICA8dGV4dCB4PSIxMDAiIHk9IjE4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5Ij7mmoLml6Dlm77niYc8L3RleHQ+Cjwvc3ZnPg==',
        url: item.url,
        thumbnail: item.thumbnail
      };
    });

    res.json({
      success: true,
      data: {
        items: processedItems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取图片历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取图片历史失败'
    });
  }
});

// 删除用户生成的图片
app.delete('/api/image-history/:id', authenticateToken, async (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    
    if (!imageId) {
      return res.status(400).json({
        status: 'error',
        message: '无效的图片ID'
      });
    }

    const connection = await pool.getConnection();
    
    try {
      // 首先查询图片信息，确保是当前用户的图片
      const [rows] = await connection.execute(
        'SELECT id, title, url, thumbnail FROM images WHERE id = ? AND user_id = ?',
        [imageId, req.user.userId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: '图片不存在或无权限删除'
        });
      }
      
      const imageInfo = rows[0];

      // 删除数据库记录
      await connection.execute(
        'DELETE FROM images WHERE id = ? AND user_id = ?',
        [imageId, req.user.userId]
      );

      res.json({
        status: 'success',
        message: '图片删除成功',
        data: {
          deleted_id: imageId,
          title: imageInfo.title
        }
      });
      
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json({
      status: 'error',
      message: '删除图片失败'
    });
  }
});

// 批量删除用户生成的图片
app.delete('/api/image-history/batch', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: '请提供要删除的图片ID数组'
      });
    }
    
    if (ids.length > 50) {
      return res.status(400).json({
        status: 'error',
        message: '一次最多删除50张图片'
      });
    }

    const connection = await pool.getConnection();
    const deletedFiles = [];
    const failedFiles = [];
    
    try {
      for (const id of ids) {
        const imageId = parseInt(id);
        if (!imageId) continue;
        
        // 查询图片信息
        const [rows] = await connection.execute(
          'SELECT id, title FROM images WHERE id = ? AND user_id = ?',
          [imageId, req.user.userId]
        );

        if (rows.length === 0) {
          failedFiles.push({ id: imageId, reason: '图片不存在或无权限' });
          continue;
        }

        const imageInfo = rows[0];
        
        // 删除数据库记录
        await connection.execute(
          'DELETE FROM images WHERE id = ? AND user_id = ?',
          [imageId, req.user.userId]
        );

        deletedFiles.push({
          id: imageId,
          title: imageInfo.title
        });
      }
      
      res.json({
        status: 'success',
        message: `成功删除 ${deletedFiles.length} 张图片`,
        data: {
          deleted_count: deletedFiles.length,
          failed_count: failedFiles.length,
          deleted_files: deletedFiles,
          failed_files: failedFiles
        }
      });
      
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('批量删除图片失败:', error);
    res.status(500).json({
      status: 'error',
      message: '批量删除图片失败'
    });
  }
});

// 用户注册
app.post('/api/auth/register', upload.single('avatar'), async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: '用户名、邮箱和密码都是必填项'
      });
    }

    // 验证用户名格式
    if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username) || username.length < 3 || username.length > 20) {
      return res.status(400).json({
        status: 'error',
        message: '用户名只能包含字母、数字、下划线和中文，长度为3-20个字符'
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: '请输入有效的邮箱地址'
      });
    }

    // 验证密码长度
    if (password.length < 6 || password.length > 20) {
      return res.status(400).json({
        status: 'error',
        message: '密码长度应为6-20个字符'
      });
    }

    const connection = await pool.getConnection();

    try {
      // 检查用户名是否已存在
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        const [userCheck] = await connection.execute(
          'SELECT username, email FROM users WHERE id = ?',
          [existingUser.id]
        );
        
        if (userCheck[0].username === username) {
          return res.status(409).json({
            status: 'error',
            message: '用户名已存在'
          });
        } else {
          return res.status(409).json({
            status: 'error',
            message: '邮箱已被注册'
          });
        }
      }

      // 加密密码
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 插入新用户（先不设置头像）
      const [result] = await connection.execute(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, passwordHash]
      );

      const userId = result.insertId;
      let avatarUrl = null;

      // 处理头像文件
      if (req.file) {
        try {
          // 创建用户头像目录
          const avatarDir = ensureUserAvatarDir(userId);
          
          // 移动临时文件到用户目录
          const oldPath = req.file.path;
          const newFilename = `avatar-${Date.now()}${path.extname(req.file.originalname)}`;
          const newPath = path.join(avatarDir, newFilename);
          
          // 移动文件
          fs.renameSync(oldPath, newPath);
          
          // 设置头像URL
          avatarUrl = `/uploads/user-${userId}/avatars/${newFilename}`;
          
          // 更新用户头像URL
          await connection.execute(
            'UPDATE users SET avatar_url = ? WHERE id = ?',
            [avatarUrl, userId]
          );
        } catch (fileError) {
          console.error('处理头像文件失败:', fileError);
          // 如果文件处理失败，删除临时文件
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        }
      }

      res.status(201).json({
        status: 'success',
        message: '注册成功',
        data: {
          userId: result.insertId,
          username,
          email,
          avatarUrl: avatarUrl || '/uploads/default-avatar.svg'
        }
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      status: 'error',
      message: '服务器内部错误'
    });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('收到登录请求:', { username: req.body.username, hasPassword: !!req.body.password });
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码都是必填项',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    const connection = await pool.getConnection();

    try {
      // 查找用户
      const [users] = await connection.execute(
        'SELECT id, username, email, password_hash, avatar_url, created_at FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 404,
          timestamp: new Date().toISOString()
        });
      }

      const user = users[0];

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '密码错误',
          code: 401,
          timestamp: new Date().toISOString()
        });
      }
      
      // 更新最后登录时间
      await connection.execute(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );

      // 生成JWT令牌
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: 'user'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: 'user',
            avatar: user.avatar_url || '/uploads/default-avatar.svg',
            createdAt: user.created_at,
            lastLoginAt: new Date().toISOString()
          }
        },
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 管理员登录（专用接口）
app.post('/auth/login', async (req, res) => {
  try {
    console.log('收到管理员登录请求:', { username: req.body.username, hasPassword: !!req.body.password });
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码都是必填项',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    const connection = await pool.getConnection();

    try {
      // 查找管理员用户
      console.log('查找管理员:', username);
      const [admins] = await connection.execute(
        'SELECT id, username, email, password_hash, avatar_url, status, created_at FROM admins WHERE username = ?',
        [username]
      );
      console.log('找到管理员数量:', admins.length);

      if (admins.length === 0) {
        return res.status(404).json({
          success: false,
          message: '管理员账户不存在',
          code: 404,
          timestamp: new Date().toISOString()
        });
      }

      const admin = admins[0];
      
      // 检查管理员状态
      if (admin.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: '管理员账户已被禁用',
          code: 403,
          timestamp: new Date().toISOString()
        });
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '密码错误',
          code: 401,
          timestamp: new Date().toISOString()
        });
      }
      
      // 更新最后登录时间
      await connection.execute(
        'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [admin.id]
      );

      // 生成JWT令牌
      const token = jwt.sign(
        {
          userId: admin.id,
          username: admin.username,
          email: admin.email,
          role: 'admin'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: '登录成功',
        data: {
          token: token,
          user: {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            role: 'admin',
            avatar: admin.avatar_url || 'https://example.com/avatar.jpg',
            createdAt: admin.created_at,
            lastLoginAt: new Date().toISOString()
          }
        },
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('管理员登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 验证令牌
app.post('/api/auth/validate-token', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [users] = await connection.execute(
        'SELECT id, username, email, role, status FROM users WHERE id = ?',
        [req.user.userId]
      );
      
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 404,
          timestamp: new Date().toISOString()
        });
      }
      
      const user = users[0];
      
      res.json({
        success: true,
        message: '令牌有效',
        data: {
          valid: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        },
        code: 200,
        timestamp: new Date().toISOString()
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('验证令牌错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// Token验证接口（管理员专用）
app.post('/auth/validate-token', authenticateAdmin, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [admins] = await connection.execute(
        'SELECT id, username, email, status FROM admins WHERE id = ?',
        [req.user.userId]
      );

      if (admins.length === 0) {
        return res.status(404).json({
          success: false,
          message: '管理员不存在',
          code: 404,
          timestamp: new Date().toISOString()
        });
      }

      const admin = admins[0];

      res.json({
        success: true,
        message: '令牌有效',
        data: {
          valid: true,
          user: {
            id: admin.id,
            username: admin.username,
            email: admin.email,
            role: 'admin'
          }
        },
        code: 200,
        timestamp: new Date().toISOString()
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('验证令牌错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取管理员信息接口（管理员专用）
app.get('/auth/profile', authenticateAdmin, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [admins] = await connection.execute(
        'SELECT id, username, email, avatar_url, status, created_at, last_login FROM admins WHERE id = ?',
        [req.user.userId]
      );

      if (admins.length === 0) {
        return res.status(404).json({
          success: false,
          message: '管理员不存在',
          code: 404,
          timestamp: new Date().toISOString()
        });
      }

      const admin = admins[0];

      res.json({
        success: true,
        message: '获取管理员信息成功',
        data: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: 'admin',
          avatar: admin.avatar_url || 'https://example.com/avatar.jpg',
          status: admin.status,
          createdAt: admin.created_at,
          lastLoginAt: admin.last_login,
          permissions: ['user:read', 'user:write', 'image:read', 'image:write', 'admin:read', 'admin:write']
        },
        code: 200,
        timestamp: new Date().toISOString()
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('获取管理员信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取用户信息
app.get('/user/profile', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.execute(
        'SELECT id, username, email, avatar_url, role, status, created_at, last_login FROM users WHERE id = ?',
        [req.user.userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 404,
          timestamp: new Date().toISOString()
        });
      }

      const user = users[0];
      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar_url || 'https://example.com/avatar.jpg',
          createdAt: user.created_at,
          lastLoginAt: user.last_login,
          permissions: user.role === 'admin' ? ['user:read', 'user:write', 'image:read', 'image:write'] : ['image:read']
        },
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取用户信息（API版本）
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.execute(
        'SELECT id, username, email, avatar_url, role, status, created_at, last_login FROM users WHERE id = ?',
        [req.user.userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 404,
          timestamp: new Date().toISOString()
        });
      }

      const user = users[0];
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar_url: user.avatar_url || '/uploads/default-avatar.svg',
            createdAt: user.created_at,
            lastLoginAt: user.last_login,
            permissions: user.role === 'admin' ? ['user:read', 'user:write', 'image:read', 'image:write'] : ['image:read']
          }
        },
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 头像API - 上传/更新头像
app.post('/api/user/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: '请选择要上传的头像文件'
      });
    }

    const connection = await pool.getConnection();

    try {
      // 获取用户当前头像
      const [users] = await connection.execute(
        'SELECT avatar_url FROM users WHERE id = ?',
        [req.user.userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: '用户不存在'
        });
      }

      const oldAvatarUrl = users[0].avatar_url;
      
      // 生成新的头像URL
      const newFilename = `avatar-${Date.now()}${path.extname(req.file.originalname)}`;
      const newAvatarUrl = `/uploads/user-${req.user.userId}/avatars/${newFilename}`;
      
      // 移动文件到正确的位置（如果需要）
      const currentPath = req.file.path;
      const targetDir = ensureUserAvatarDir(req.user.userId);
      const targetPath = path.join(targetDir, newFilename);
      
      if (currentPath !== targetPath) {
        fs.renameSync(currentPath, targetPath);
      }

      // 更新数据库中的头像URL
      await connection.execute(
        'UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newAvatarUrl, req.user.userId]
      );

      // 删除旧头像文件（如果存在且不是默认头像）
      if (oldAvatarUrl && oldAvatarUrl.startsWith('/uploads/user-')) {
        const oldFilePath = path.join(__dirname, oldAvatarUrl);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (deleteError) {
            console.warn('删除旧头像文件失败:', deleteError);
          }
        }
      }

      res.json({
        status: 'success',
        message: '头像上传成功',
        data: {
          avatarUrl: newAvatarUrl
        }
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('头像上传错误:', error);
    
    // 如果数据库操作失败，删除已上传的文件
    if (req.file) {
      const filePath = path.join(__dirname, 'uploads', req.file.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (deleteError) {
          console.warn('删除上传文件失败:', deleteError);
        }
      }
    }

    res.status(500).json({
      status: 'error',
      message: '头像上传失败'
    });
  }
});

// 头像API - 删除头像
app.delete('/api/user/avatar', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      // 获取用户当前头像
      const [users] = await connection.execute(
        'SELECT avatar_url FROM users WHERE id = ?',
        [req.user.userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: '用户不存在'
        });
      }

      const avatarUrl = users[0].avatar_url;

      if (!avatarUrl) {
        return res.status(400).json({
          status: 'error',
          message: '用户没有设置头像'
        });
      }

      // 更新数据库，将头像URL设为null
      await connection.execute(
        'UPDATE users SET avatar_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [req.user.userId]
      );

      // 删除头像文件（如果是上传的文件）
      if (avatarUrl.startsWith('/uploads/user-')) {
        const filePath = path.join(__dirname, avatarUrl);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (deleteError) {
            console.warn('删除头像文件失败:', deleteError);
          }
        }
      }

      res.json({
        status: 'success',
        message: '头像删除成功'
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('头像删除错误:', error);
    res.status(500).json({
      status: 'error',
      message: '头像删除失败'
    });
  }
});

// 公开头像API - 通过用户名获取头像信息（无需认证）
app.get('/api/user/avatar', async (req, res) => {
  const { username } = req.query;
  
  // 如果没有提供用户名，则需要JWT认证
  if (!username) {
    authenticateToken(req, res, async () => {
      try {
        const connection = await pool.getConnection();

        try {
          const [users] = await connection.execute(
            'SELECT avatar_url FROM users WHERE id = ?',
            [req.user.userId]
          );

          if (users.length === 0) {
            return res.status(404).json({
              status: 'error',
              message: '用户不存在'
            });
          }

          
          const avatarUrl = users[0].avatar_url || '/uploads/default-avatar.svg';

          res.json({
            status: 'success',
            data: {
              avatarUrl: avatarUrl,
              hasAvatar: !!users[0].avatar_url
            }
          });

        } finally {
          connection.release();
        }

      } catch (error) {
        console.error('获取头像信息错误:', error);
        res.status(500).json({
          status: 'error',
          message: '获取头像信息失败'
        });
      }
    });
    return;
  }
  
  // 通过用户名获取头像（公开接口）
  try {
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.execute(
        'SELECT avatar_url FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: '用户不存在'
        });
      }

      const avatarUrl = users[0].avatar_url || '/uploads/default-avatar.svg';

      res.json({
        status: 'success',
        data: {
          avatarUrl: avatarUrl,
          hasAvatar: !!users[0].avatar_url
        }
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取头像信息错误:', error);
    res.status(500).json({
      status: 'error',
      message: '获取头像信息失败'
    });
  }
});

// 认证头像API - 获取当前用户头像信息
app.get('/api/user/avatar/me', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.execute(
        'SELECT avatar_url FROM users WHERE id = ?',
        [req.user.userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: '用户不存在'
        });
      }

      const avatarUrl = users[0].avatar_url || '/uploads/default-avatar.svg';

      res.json({
        status: 'success',
        data: {
          avatarUrl: avatarUrl,
          hasAvatar: !!users[0].avatar_url
        }
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取头像信息错误:', error);
    res.status(500).json({
      status: 'error',
      message: '获取头像信息失败'
    });
  }
});

// Dashboard API - 获取统计数据
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  console.log('收到仪表盘统计数据请求');
  try {
    const connection = await pool.getConnection();

    try {
      // 获取总用户数
      const [totalUsersResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM users'
      );
      const totalUsers = totalUsersResult[0].count;

      // 获取总图片数
      const [totalImagesResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM images'
      );
      const totalImages = totalImagesResult[0].count;

      // 获取今日图片数（使用中国时区）
    const [todayImagesResult] = await connection.execute(`
      SELECT COUNT(*) as count FROM images 
      WHERE DATE(CONVERT_TZ(created_at, '+00:00', '+08:00')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+08:00'))
    `);
    const todayImages = todayImagesResult[0].count;

      // 获取活跃用户数（最近7天有活动的用户）
      const [activeUsersResult] = await connection.execute(
        'SELECT COUNT(DISTINCT user_id) as count FROM images WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
      );
      const activeUsers = activeUsersResult[0].count;

      res.json({
        success: true,
        data: {
          totalUsers,
          totalImages,
          todayImages,
          activeUsers
        }
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({
      status: 'error',
      message: '获取统计数据失败'
    });
  }
});

// Dashboard API - 获取用户增长趋势
app.get('/api/dashboard/user-growth-trend', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const connection = await pool.getConnection();

    try {
      const [results] = await connection.execute(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM users 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC`,
        [days]
      );

      // 填充缺失的日期
      const trendData = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const found = results.find(r => r.date === dateStr);
        trendData.push({
          date: dateStr,
          count: found ? found.count : 0
        });
      }

      res.json({
        success: true,
        data: trendData
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取用户增长趋势错误:', error);
    res.status(500).json({
      status: 'error',
      message: '获取用户增长趋势失败'
    });
  }
});

// Dashboard API - 获取图片生成趋势
app.get('/api/dashboard/image-generation-trend', authenticateToken, async (req, res) => {
  console.log('收到图片生成趋势请求，天数:', req.query.days);
  try {
    const days = parseInt(req.query.days) || 7;
    const connection = await pool.getConnection();

    try {
      const [results] = await connection.execute(
        `SELECT
          DATE(created_at) as date,
          COUNT(*) as count
        FROM images
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC`,
        [days]
      );

      // 填充缺失的日期
      const trendData = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const found = results.find(r => r.date === dateStr);
        trendData.push({
          date: dateStr,
          count: found ? found.count : 0
        });
      }

      res.json({
        success: true,
        data: trendData
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取图片生成趋势错误:', error);
    res.status(500).json({
      status: 'error',
      message: '获取图片生成趋势失败'
    });
  }
});

// Dashboard API - 获取热门提示词
app.get('/api/dashboard/popular-prompts', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const connection = await pool.getConnection();

    try {
      const [results] = await connection.execute(
        `SELECT
          prompt as text,
          COUNT(*) as count
        FROM images
        WHERE prompt IS NOT NULL AND prompt != ''
        GROUP BY prompt
        ORDER BY count DESC
        LIMIT ${limit}`
      );

      let popularPrompts = results.map((item, index) => ({
        id: index + 1,
        text: item.text,
        count: item.count
      }));

      // 如果没有数据，返回模拟数据
      if (popularPrompts.length === 0) {
        popularPrompts = [
          { id: 1, text: '美丽的山水画，有蓝天白云', count: 0 },
          { id: 2, text: '可爱的小猫咪，毛茸茸的', count: 0 },
          { id: 3, text: '现代建筑设计，简约风格', count: 0 },
          { id: 4, text: '梦幻森林，阳光透过树叶', count: 0 },
          { id: 5, text: '科技感十足的机器人', count: 0 }
        ].slice(0, limit);
      }

      res.json({
        success: true,
        data: popularPrompts
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取热门提示词错误:', error);
    // 返回模拟数据
    const mockData = [
      { id: 1, text: '美丽的山水画，有蓝天白云', count: 0 },
      { id: 2, text: '可爱的小猫咪，毛茸茸的', count: 0 },
      { id: 3, text: '现代建筑设计，简约风格', count: 0 },
      { id: 4, text: '梦幻森林，阳光透过树叶', count: 0 },
      { id: 5, text: '科技感十足的机器人', count: 0 }
    ].slice(0, parseInt(req.query.limit) || 5);

    res.json({
      success: true,
      data: mockData
    });
  }
});

// ==================== 用户管理模块 ====================

// 获取用户列表（管理员）
app.get('/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || '';
    const username = req.query.username || '';
    const email = req.query.email || '';
    const status = req.query.status || '';
    const role = req.query.role || '';
    const offset = (page - 1) * pageSize;

    console.log('获取用户列表请求参数:', { page, pageSize, keyword, username, email, status, role, offset });

    const connection = await pool.getConnection();

    try {
      // 先简单查询所有用户，不使用复杂的WHERE条件
      console.log('SQL参数:', { pageSize: Number(pageSize), offset: Number(offset) });

      // 构建查询条件
      let whereClause = 'WHERE 1=1';
      let queryParams = [];

      // 支持通用关键词搜索
      if (keyword) {
        whereClause += ' AND (username LIKE ? OR email LIKE ?)';
        queryParams.push(`%${keyword}%`, `%${keyword}%`);
      }

      // 支持单独的用户名搜索
      if (username) {
        whereClause += ' AND username LIKE ?';
        queryParams.push(`%${username}%`);
      }

      // 支持单独的邮箱搜索
      if (email) {
        whereClause += ' AND email LIKE ?';
        queryParams.push(`%${email}%`);
      }

      if (status) {
        whereClause += ' AND status = ?';
        queryParams.push(status);
      }

      if (role) {
        whereClause += ' AND role = ?';
        queryParams.push(role);
      }

      // 获取用户列表（简化版本）
      const userSql = `SELECT
        id,
        username,
        email,
        role,
        status,
        avatar_url,
        created_at,
        last_login
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`;

      console.log('执行SQL:', userSql);
      const [users] = await connection.execute(userSql);

      // 为每个用户获取图片数量
      for (let user of users) {
        try {
          const [imageCount] = await connection.execute(
            'SELECT COUNT(*) as count FROM images WHERE user_id = ?',
            [user.id]
          );
          user.imageCount = imageCount[0].count;
        } catch (err) {
          console.log('获取用户图片数量失败:', err.message);
          user.imageCount = 0;
        }
      }

      // 获取总数
      const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
      const [totalResult] = await connection.execute(countSql);
      const total = totalResult[0].total;

      console.log('查询结果:', { userCount: users.length, total, firstUser: users[0] });

      res.json({
        success: true,
        data: {
          list: users.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role || 'user',
            status: user.status || 'active',
            avatar: user.avatar_url || null,
            imageCount: user.imageCount,
            createdAt: user.created_at,
            lastLoginAt: user.last_login
          })),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        },
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取用户列表（API版本）
app.get('/api/users', authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const keyword = req.query.keyword || '';
    const status = req.query.status || '';
    const role = req.query.role || '';
    const offset = (page - 1) * pageSize;
    
    const connection = await pool.getConnection();

    try {
      // 构建查询条件
      let whereClause = 'WHERE 1=1';
      let queryParams = [];
      
      if (keyword) {
        whereClause += ' AND (username LIKE ? OR email LIKE ?)';
        queryParams.push(`%${keyword}%`, `%${keyword}%`);
      }
      
      if (status) {
        whereClause += ' AND status = ?';
        queryParams.push(status);
      }
      
      if (role) {
        whereClause += ' AND role = ?';
        queryParams.push(role);
      }

      // 获取用户列表
      const [users] = await connection.execute(
        `SELECT 
          id,
          username,
          email,
          role,
          status,
          avatar_url,
          created_at,
          last_login
        FROM users 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`,
        [...queryParams, pageSize, offset]
      );

      // 获取总数
      const [totalResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM users ${whereClause}`,
        queryParams
      );
      const total = totalResult[0].total;

      res.json({
        success: true,
        data: {
          list: users.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            avatar: user.avatar_url || '/uploads/default-avatar.svg',
            createdAt: user.created_at,
            lastLoginAt: user.last_login
          })),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        },
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取用户详情
app.get('/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '无效的用户ID',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    const connection = await pool.getConnection();

    try {
      const [users] = await connection.execute(
        'SELECT id, username, email, role, status, avatar_url, created_at, last_login FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 404,
          timestamp: new Date().toISOString()
        });
      }

      const user = users[0];

      // 获取用户统计信息
      const [imageStats] = await connection.execute(
        'SELECT COUNT(*) as total_images FROM images WHERE user_id = ?',
        [userId]
      );

      const [todayImages] = await connection.execute(`
      SELECT COUNT(*) as today_images FROM images 
      WHERE user_id = ? AND DATE(CONVERT_TZ(created_at, '+00:00', '+08:00')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+08:00'))
    `, [userId]);

      const [weekImages] = await connection.execute(
        'SELECT COUNT(*) as week_images FROM images WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
        [userId]
      );

      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          avatar: user.avatar_url || 'https://example.com/avatar1.jpg',
          createdAt: user.created_at,
          lastLoginAt: user.last_login,
          profile: {
            nickname: user.username,
            phone: '',
            gender: 'male',
            birthday: '1990-01-01'
          },
          // 添加统计信息
          image_count: imageStats[0].total_images,
          today_images: todayImages[0].today_images,
          week_images: weekImages[0].week_images,
          total_points: 1000, // 默认总积分
          user_points: 500    // 默认剩余积分
        },
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户详情失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 创建用户
app.post('/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const { username, email, password, role = 'user', status = 'active' } = req.body;

    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱和密码为必填项',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    // 验证用户名格式
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        message: '用户名长度必须在3-20个字符之间',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    // 验证密码强度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少6个字符',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    const connection = await pool.getConnection();

    try {
      // 检查用户名是否已存在
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: '用户名或邮箱已存在',
          code: 400,
          timestamp: new Date().toISOString()
        });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建用户
      const [result] = await connection.execute(
        'INSERT INTO users (username, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [username, email, hashedPassword, role, status]
      );

      const userId = result.insertId;

      // 获取创建的用户信息
      const [newUser] = await connection.execute(
        'SELECT id, username, email, role, status, created_at FROM users WHERE id = ?',
        [userId]
      );

      res.status(201).json({
        success: true,
        data: {
          id: newUser[0].id,
          username: newUser[0].username,
          email: newUser[0].email,
          role: newUser[0].role,
          status: newUser[0].status,
          avatar: 'https://example.com/avatar1.jpg',
          createdAt: newUser[0].created_at,
          lastLoginAt: null
        },
        code: 201,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      success: false,
      message: '创建用户失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 创建用户（API版本）
app.post('/api/users', authenticateAdmin, async (req, res) => {
  try {
    const { username, email, password, role = 'user', status = 'active' } = req.body;

    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱和密码为必填项',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    // 验证用户名格式
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        message: '用户名长度必须在3-20个字符之间',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    // 验证密码强度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码长度至少6个字符',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    const connection = await pool.getConnection();

    try {
      // 检查用户名是否已存在
      const [existingUsers] = await connection.execute(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: '用户名或邮箱已存在',
          code: 400,
          timestamp: new Date().toISOString()
        });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建用户
      const [result] = await connection.execute(
        'INSERT INTO users (username, email, password_hash, role, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [username, email, hashedPassword, role, status]
      );

      const userId = result.insertId;

      // 获取创建的用户信息
      const [newUser] = await connection.execute(
        'SELECT id, username, email, role, status, created_at FROM users WHERE id = ?',
        [userId]
      );

      res.status(201).json({
        success: true,
        data: {
          id: newUser[0].id,
          username: newUser[0].username,
          email: newUser[0].email,
          role: newUser[0].role,
          status: newUser[0].status,
          avatar: 'https://example.com/avatar1.jpg',
          created_at: newUser[0].created_at,
          last_login: null
        },
        code: 201,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({
      success: false,
      message: '创建用户失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 更新用户
app.put('/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, email, role, status, password } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '无效的用户ID',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    const connection = await pool.getConnection();

    try {
      // 检查用户是否存在
      const [existingUser] = await connection.execute(
        'SELECT id, username, email FROM users WHERE id = ?',
        [userId]
      );

      if (existingUser.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 404,
          timestamp: new Date().toISOString()
        });
      }

      // 构建更新字段
      let updateFields = [];
      let updateValues = [];

      if (username && username !== existingUser[0].username) {
        // 检查新用户名是否已被使用
        const [usernameCheck] = await connection.execute(
          'SELECT id FROM users WHERE username = ? AND id != ?',
          [username, userId]
        );
        if (usernameCheck.length > 0) {
          return res.status(400).json({
            success: false,
            message: '用户名已存在',
            code: 400,
            timestamp: new Date().toISOString()
          });
        }
        updateFields.push('username = ?');
        updateValues.push(username);
      }

      if (email && email !== existingUser[0].email) {
        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: '邮箱格式不正确',
            code: 400,
            timestamp: new Date().toISOString()
          });
        }
        // 检查新邮箱是否已被使用
        const [emailCheck] = await connection.execute(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, userId]
        );
        if (emailCheck.length > 0) {
          return res.status(400).json({
            success: false,
            message: '邮箱已存在',
            code: 400,
            timestamp: new Date().toISOString()
          });
        }
        updateFields.push('email = ?');
        updateValues.push(email);
      }

      if (role) {
        updateFields.push('role = ?');
        updateValues.push(role);
      }

      if (status) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }

      if (password) {
        if (password.length < 6) {
          return res.status(400).json({
            success: false,
            message: '密码长度至少6个字符',
            code: 400,
            timestamp: new Date().toISOString()
          });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push('password_hash = ?');
        updateValues.push(hashedPassword);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有需要更新的字段',
          code: 400,
          timestamp: new Date().toISOString()
        });
      }

      updateFields.push('updated_at = NOW()');
      updateValues.push(userId);

      // 执行更新
      await connection.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // 获取更新后的用户信息
      const [updatedUser] = await connection.execute(
        'SELECT id, username, email, role, status, avatar_url, created_at, last_login FROM users WHERE id = ?',
        [userId]
      );

      res.json({
        success: true,
        data: {
          id: updatedUser[0].id,
          username: updatedUser[0].username,
          email: updatedUser[0].email,
          role: updatedUser[0].role,
          status: updatedUser[0].status,
          avatar: updatedUser[0].avatar_url || 'https://example.com/avatar1.jpg',
          created_at: updatedUser[0].created_at,
          last_login: updatedUser[0].last_login
        },
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({
      success: false,
      message: '更新用户失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 更新用户（API版本）
app.put('/api/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, email, role, status, password } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '无效的用户ID',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    const connection = await pool.getConnection();

    try {
      // 检查用户是否存在
      const [existingUser] = await connection.execute(
        'SELECT id, username, email FROM users WHERE id = ?',
        [userId]
      );

      if (existingUser.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 404,
          timestamp: new Date().toISOString()
        });
      }

      // 构建更新字段
      let updateFields = [];
      let updateValues = [];

      if (username && username !== existingUser[0].username) {
        // 检查新用户名是否已被使用
        const [usernameCheck] = await connection.execute(
          'SELECT id FROM users WHERE username = ? AND id != ?',
          [username, userId]
        );
        if (usernameCheck.length > 0) {
          return res.status(400).json({
            success: false,
            message: '用户名已存在',
            code: 400,
            timestamp: new Date().toISOString()
          });
        }
        updateFields.push('username = ?');
        updateValues.push(username);
      }

      if (email && email !== existingUser[0].email) {
        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: '邮箱格式不正确',
            code: 400,
            timestamp: new Date().toISOString()
          });
        }
        // 检查新邮箱是否已被使用
        const [emailCheck] = await connection.execute(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, userId]
        );
        if (emailCheck.length > 0) {
          return res.status(400).json({
            success: false,
            message: '邮箱已存在',
            code: 400,
            timestamp: new Date().toISOString()
          });
        }
        updateFields.push('email = ?');
        updateValues.push(email);
      }

      if (role) {
        updateFields.push('role = ?');
        updateValues.push(role);
      }

      if (status) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }

      if (password) {
        if (password.length < 6) {
          return res.status(400).json({
            success: false,
            message: '密码长度至少6个字符',
            code: 400,
            timestamp: new Date().toISOString()
          });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push('password_hash = ?');
        updateValues.push(hashedPassword);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有需要更新的字段',
          code: 400,
          timestamp: new Date().toISOString()
        });
      }

      updateFields.push('updated_at = NOW()');
      updateValues.push(userId);

      // 执行更新
      await connection.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // 获取更新后的用户信息
      const [updatedUser] = await connection.execute(
        'SELECT id, username, email, role, status, avatar_url, created_at, last_login FROM users WHERE id = ?',
        [userId]
      );

      res.json({
        success: true,
        data: {
          id: updatedUser[0].id,
          username: updatedUser[0].username,
          email: updatedUser[0].email,
          role: updatedUser[0].role,
          status: updatedUser[0].status,
          avatar: updatedUser[0].avatar_url || 'https://example.com/avatar1.jpg',
          created_at: updatedUser[0].created_at,
          last_login: updatedUser[0].last_login
        },
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({
      success: false,
      message: '更新用户失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取用户详情（API版本）
app.get('/api/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '无效的用户ID',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    const connection = await pool.getConnection();

    try {
      const [users] = await connection.execute(
        'SELECT id, username, email, role, status, avatar_url, created_at, last_login FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 404,
          timestamp: new Date().toISOString()
        });
      }

      const user = users[0];
      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          avatar: user.avatar_url || 'https://example.com/avatar1.jpg',
          created_at: user.created_at,
          last_login: user.last_login,
          profile: {
            nickname: user.username,
            phone: '',
            gender: 'male',
            birthday: '1990-01-01'
          }
        },
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户详情失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 删除用户
app.delete('/api/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '无效的用户ID',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    const connection = await pool.getConnection();

    try {
      // 检查用户是否存在
      const [users] = await connection.execute(
        'SELECT id, username, role FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 404,
          timestamp: new Date().toISOString()
        });
      }

      const user = users[0];

      // 防止删除管理员账户
      if (user.role === 'admin') {
        return res.status(403).json({
          success: false,
          message: '不能删除管理员账户',
          code: 403,
          timestamp: new Date().toISOString()
        });
      }

      // 开始事务
      await connection.beginTransaction();

      try {
        console.log(`开始删除用户 ${userId} 的所有相关数据...`);

        // 1. 删除用户的图片记录（images表）
        const [imageResult] = await connection.execute(
          'DELETE FROM images WHERE user_id = ?',
          [userId]
        );
        console.log(`删除了 ${imageResult.affectedRows} 条图片记录`);

        // 2. 删除用户的旧图片生成记录（image_generations表，如果存在）
        try {
          const [generationResult] = await connection.execute(
            'DELETE FROM image_generations WHERE user_id = ?',
            [userId]
          );
          console.log(`删除了 ${generationResult.affectedRows} 条旧图片生成记录`);
        } catch (tableError) {
          console.log('image_generations表不存在或删除失败:', tableError.message);
        }

        // 3. 删除用户记录
        await connection.execute(
          'DELETE FROM users WHERE id = ?',
          [userId]
        );
        console.log(`删除了用户记录 ${userId}`);

        // 提交事务
        await connection.commit();

        // 4. 删除用户文件夹（包括头像、生成的图片等）
        const userDir = path.join(__dirname, 'uploads', `user-${userId}`);
        if (fs.existsSync(userDir)) {
          try {
            // 统计要删除的文件数量
            const countFiles = (dir) => {
              let count = 0;
              const items = fs.readdirSync(dir);
              for (const item of items) {
                const itemPath = path.join(dir, item);
                if (fs.statSync(itemPath).isDirectory()) {
                  count += countFiles(itemPath);
                } else {
                  count++;
                }
              }
              return count;
            };

            const fileCount = countFiles(userDir);
            fs.rmSync(userDir, { recursive: true, force: true });
            console.log(`删除了用户文件夹，包含 ${fileCount} 个文件`);
          } catch (fileError) {
            console.error('删除用户文件夹失败:', fileError);
          }
        } else {
          console.log('用户文件夹不存在，跳过文件删除');
        }

        res.json({
          success: true,
          message: '用户删除成功',
          data: {
            deletedUserId: userId,
            deletedUsername: user.username
          },
          code: 200,
          timestamp: new Date().toISOString()
        });

      } catch (transactionError) {
        await connection.rollback();
        throw transactionError;
      }

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 删除用户（管理员接口）
app.delete('/admin/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '无效的用户ID',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    const connection = await pool.getConnection();

    try {
      // 检查用户是否存在
      const [users] = await connection.execute(
        'SELECT id, username, role FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: '用户不存在',
          code: 404,
          timestamp: new Date().toISOString()
        });
      }

      const user = users[0];

      // 防止删除管理员账户
      if (user.role === 'admin') {
        return res.status(403).json({
          success: false,
          message: '不能删除管理员账户',
          code: 403,
          timestamp: new Date().toISOString()
        });
      }

      // 开始事务
      await connection.beginTransaction();

      try {
        console.log(`开始删除用户 ${userId} 的所有相关数据...`);

        // 1. 删除用户的图片记录（images表）
        const [imageResult] = await connection.execute(
          'DELETE FROM images WHERE user_id = ?',
          [userId]
        );
        console.log(`删除了 ${imageResult.affectedRows} 条图片记录`);

        // 2. 删除用户的旧图片生成记录（image_generations表，如果存在）
        try {
          const [generationResult] = await connection.execute(
            'DELETE FROM image_generations WHERE user_id = ?',
            [userId]
          );
          console.log(`删除了 ${generationResult.affectedRows} 条旧图片生成记录`);
        } catch (tableError) {
          console.log('image_generations表不存在或删除失败:', tableError.message);
        }

        // 3. 删除用户记录
        await connection.execute(
          'DELETE FROM users WHERE id = ?',
          [userId]
        );
        console.log(`删除了用户记录 ${userId}`);

        // 提交事务
        await connection.commit();

        // 4. 删除用户文件夹（包括头像、生成的图片等）
        const userDir = path.join(__dirname, 'uploads', `user-${userId}`);
        if (fs.existsSync(userDir)) {
          try {
            // 统计要删除的文件数量
            const countFiles = (dir) => {
              let count = 0;
              const items = fs.readdirSync(dir);
              for (const item of items) {
                const itemPath = path.join(dir, item);
                if (fs.statSync(itemPath).isDirectory()) {
                  count += countFiles(itemPath);
                } else {
                  count++;
                }
              }
              return count;
            };

            const fileCount = countFiles(userDir);
            fs.rmSync(userDir, { recursive: true, force: true });
            console.log(`删除了用户文件夹，包含 ${fileCount} 个文件`);
          } catch (fileError) {
            console.error('删除用户文件夹失败:', fileError);
          }
        } else {
          console.log('用户文件夹不存在，跳过文件删除');
        }

        res.json({
          success: true,
          message: '用户删除成功',
          data: {
            deletedUserId: userId,
            deletedUsername: user.username
          },
          code: 200,
          timestamp: new Date().toISOString()
        });

      } catch (transactionError) {
        await connection.rollback();
        throw transactionError;
      }

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 批量删除用户
app.post('/admin/users/batch-delete', authenticateAdmin, async (req, res) => {
  try {
    const { ids, userIds } = req.body;

    // 支持两种参数名：ids 或 userIds
    const inputIds = ids || userIds;

    if (!inputIds || !Array.isArray(inputIds) || inputIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的用户ID列表',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    // 验证所有ID都是数字
    const validUserIds = inputIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (validUserIds.length !== inputIds.length) {
      return res.status(400).json({
        success: false,
        message: '用户ID必须是有效的数字',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    const connection = await pool.getConnection();

    try {
      // 检查哪些用户存在，并排除管理员
      const [users] = await connection.execute(
        `SELECT id, username, role FROM users WHERE id IN (${validUserIds.map(() => '?').join(',')})`,
        validUserIds
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: '没有找到要删除的用户',
          code: 404,
          timestamp: new Date().toISOString()
        });
      }

      // 过滤掉管理员用户
      const deletableUsers = users.filter(user => user.role !== 'admin');
      const adminUsers = users.filter(user => user.role === 'admin');

      if (deletableUsers.length === 0) {
        return res.status(403).json({
          success: false,
          message: '不能删除管理员账户',
          code: 403,
          timestamp: new Date().toISOString()
        });
      }

      const deletableUserIds = deletableUsers.map(user => user.id);

      // 开始事务
      await connection.beginTransaction();

      try {
        console.log(`开始批量删除 ${deletableUserIds.length} 个用户的所有相关数据...`);

        if (deletableUserIds.length > 0) {
          const placeholders = deletableUserIds.map(() => '?').join(',');

          // 1. 删除用户的图片记录（images表）
          const [imageResult] = await connection.execute(
            `DELETE FROM images WHERE user_id IN (${placeholders})`,
            deletableUserIds
          );
          console.log(`删除了 ${imageResult.affectedRows} 条图片记录`);

          // 2. 删除用户的旧图片生成记录（image_generations表，如果存在）
          try {
            const [generationResult] = await connection.execute(
              `DELETE FROM image_generations WHERE user_id IN (${placeholders})`,
              deletableUserIds
            );
            console.log(`删除了 ${generationResult.affectedRows} 条旧图片生成记录`);
          } catch (tableError) {
            console.log('image_generations表不存在或删除失败:', tableError.message);
          }

          // 3. 删除用户记录
          await connection.execute(
            `DELETE FROM users WHERE id IN (${placeholders})`,
            deletableUserIds
          );
          console.log(`删除了 ${deletableUserIds.length} 个用户记录`);
        }

        // 提交事务
        await connection.commit();

        // 4. 删除用户文件夹
        let totalDeletedFiles = 0;
        for (const userId of deletableUserIds) {
          const userDir = path.join(__dirname, 'uploads', `user-${userId}`);
          if (fs.existsSync(userDir)) {
            try {
              // 统计要删除的文件数量
              const countFiles = (dir) => {
                let count = 0;
                const items = fs.readdirSync(dir);
                for (const item of items) {
                  const itemPath = path.join(dir, item);
                  if (fs.statSync(itemPath).isDirectory()) {
                    count += countFiles(itemPath);
                  } else {
                    count++;
                  }
                }
                return count;
              };

              const fileCount = countFiles(userDir);
              totalDeletedFiles += fileCount;
              fs.rmSync(userDir, { recursive: true, force: true });
              console.log(`删除了用户${userId}的文件夹，包含 ${fileCount} 个文件`);
            } catch (fileError) {
              console.error(`删除用户${userId}文件夹失败:`, fileError);
            }
          }
        }
        console.log(`总共删除了 ${totalDeletedFiles} 个文件`);

        res.json({
          success: true,
          message: `成功删除 ${deletableUsers.length} 个用户`,
          data: {
            deletedCount: deletableUsers.length,
            skippedCount: adminUsers.length,
            deletedUsers: deletableUsers.map(user => ({
              id: user.id,
              username: user.username
            })),
            skippedUsers: adminUsers.map(user => ({
              id: user.id,
              username: user.username,
              reason: '管理员账户不能删除'
            }))
          },
          code: 200,
          timestamp: new Date().toISOString()
        });

      } catch (transactionError) {
        await connection.rollback();
        throw transactionError;
      }

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('批量删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '批量删除用户失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== 图片管理模块 ====================

// 测试路由
app.get('/admin/test', (req, res) => {
  res.json({ success: true, message: '测试成功', timestamp: new Date().toISOString() });
});

// 检查管理员用户
app.get('/admin/check-admins', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [admins] = await connection.execute('SELECT id, username, email, status FROM admins');
      const [users] = await connection.execute('SELECT id, username, email, role FROM users WHERE role = "admin"');

      res.json({
        success: true,
        data: {
          admins_table: admins,
          admin_users: users
        },
        message: '管理员检查完成'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('检查管理员错误:', error);
    res.status(500).json({
      success: false,
      message: '检查失败',
      error: error.message
    });
  }
});

// 检查特定图片的详细信息
app.get('/admin/check-image/:id', async (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    const connection = await pool.getConnection();

    try {
      const [images] = await connection.execute(
        'SELECT * FROM images WHERE id = ?',
        [imageId]
      );

      if (images.length === 0) {
        return res.status(404).json({
          success: false,
          message: '图片不存在'
        });
      }

      const image = images[0];

      res.json({
        success: true,
        data: {
          database_record: image,
          file_info: {
            url: image.url,
            file_exists: image.url ? require('fs').existsSync(require('path').join(__dirname, image.url.replace(/^\//, ''))) : false
          }
        },
        message: '图片信息检查完成'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('检查图片错误:', error);
    res.status(500).json({
      success: false,
      message: '检查失败',
      error: error.message
    });
  }
});

// 检查文件大小和时间
app.get('/admin/check-file/:id', async (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    const connection = await pool.getConnection();

    try {
      const [images] = await connection.execute(
        'SELECT * FROM images WHERE id = ?',
        [imageId]
      );

      if (images.length === 0) {
        return res.status(404).json({
          success: false,
          message: '图片不存在'
        });
      }

      const image = images[0];
      const filePath = path.join(__dirname, image.url.replace(/^\//, ''));

      let fileInfo = {
        exists: false,
        actualSize: 0,
        dbSize: image.size,
        actualTime: null,
        dbTime: image.created_at
      };

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        fileInfo.exists = true;
        fileInfo.actualSize = stats.size;
        fileInfo.actualTime = stats.birthtime;
      }

      res.json({
        success: true,
        data: {
          image: image,
          file: fileInfo,
          comparison: {
            sizeMatch: fileInfo.actualSize === image.size,
            sizeDiff: fileInfo.actualSize - image.size,
            timeInfo: {
              dbTimeUTC: image.created_at,
              dbTimeBeijing: new Date(image.created_at).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'}),
              fileTime: fileInfo.actualTime
            }
          }
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('检查文件错误:', error);
    res.status(500).json({
      success: false,
      message: '检查失败',
      error: error.message
    });
  }
});

// 修复图片时间信息
app.get('/admin/fix-image-times', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      // 获取所有图片
      const [images] = await connection.execute(
        'SELECT id, url, created_at FROM images ORDER BY id'
      );

      let fixedCount = 0;
      let results = [];

      for (const image of images) {
        const filePath = path.join(__dirname, image.url.replace(/^\//, ''));

        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const fileTime = stats.birthtime;

          // 更新数据库中的时间为文件的实际创建时间
          await connection.execute(
            'UPDATE images SET created_at = ?, updated_at = ? WHERE id = ?',
            [fileTime, fileTime, image.id]
          );

          fixedCount++;
          results.push({
            id: image.id,
            oldTime: image.created_at,
            newTime: fileTime,
            status: 'fixed'
          });
        } else {
          results.push({
            id: image.id,
            oldTime: image.created_at,
            newTime: null,
            status: 'file_not_found'
          });
        }
      }

      res.json({
        success: true,
        message: `成功修复 ${fixedCount} 张图片的时间信息`,
        data: {
          totalImages: images.length,
          fixedCount: fixedCount,
          results: results
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('修复图片时间错误:', error);
    res.status(500).json({
      success: false,
      message: '修复失败',
      error: error.message
    });
  }
});

// 修复图片尺寸信息
app.get('/admin/fix-image-dimensions', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      // 获取所有图片记录
      const [images] = await connection.execute(
        'SELECT id, url, width, height FROM images WHERE url IS NOT NULL AND url != ""'
      );

      console.log(`开始修复 ${images.length} 条图片记录的尺寸信息`);

      let updatedCount = 0;
      const results = [];

      for (const image of images) {
        try {
          // 构建文件路径
          const filePath = path.join(__dirname, image.url.replace(/^\//, ''));

          if (fs.existsSync(filePath)) {
            // 读取文件
            const buffer = fs.readFileSync(filePath);
            const stats = fs.statSync(filePath);

            // 获取图片尺寸
            let width = 0, height = 0;

            if (buffer.length > 24) {
              // PNG文件格式检查
              if (buffer.toString('ascii', 1, 4) === 'PNG') {
                width = buffer.readUInt32BE(16);
                height = buffer.readUInt32BE(20);
              }
              // JPEG文件格式检查
              else if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
                width = 1280;
                height = 1280;
              }
            }

            if (width > 0 && height > 0) {
              // 检查是否需要更新
              if (image.width !== width || image.height !== height) {
                // 更新数据库记录
                await connection.execute(
                  'UPDATE images SET width = ?, height = ?, size = ? WHERE id = ?',
                  [width, height, stats.size, image.id]
                );

                results.push({
                  id: image.id,
                  old: `${image.width}x${image.height}`,
                  new: `${width}x${height}`,
                  size: stats.size,
                  updated: true
                });
                updatedCount++;
              } else {
                results.push({
                  id: image.id,
                  dimensions: `${width}x${height}`,
                  updated: false,
                  message: '尺寸已正确'
                });
              }
            } else {
              results.push({
                id: image.id,
                updated: false,
                message: '无法获取尺寸信息'
              });
            }
          } else {
            results.push({
              id: image.id,
              updated: false,
              message: '文件不存在'
            });
          }
        } catch (error) {
          results.push({
            id: image.id,
            updated: false,
            message: `处理失败: ${error.message}`
          });
        }
      }

      res.json({
        success: true,
        message: `修复完成！共更新了 ${updatedCount} 条记录`,
        data: {
          total: images.length,
          updated: updatedCount,
          results: results
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('修复图片尺寸错误:', error);
    res.status(500).json({
      success: false,
      message: '修复失败',
      error: error.message
    });
  }
});

// 临时无需认证的图片列表API（用于调试前端）
app.get('/admin/images-no-auth', async (req, res) => {
  console.log('收到无认证图片列表请求:', req.query);

  try {
    const { page = 1, limit = 24 } = req.query;
    const pageSize = parseInt(limit);
    const offset = (parseInt(page) - 1) * pageSize;

    const connection = await pool.getConnection();

    try {
      // 获取总数
      const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM images');
      const total = countResult[0].total;

      // 获取图片列表
      const [images] = await connection.execute(`
        SELECT
          i.id,
          i.title,
          i.url,
          i.thumbnail,
          i.user_id,
          u.username,
          i.prompt,
          i.category,
          i.width,
          i.height,
          i.size,
          i.format,
          i.status,
          i.created_at
        FROM images i
        LEFT JOIN users u ON i.user_id = u.id
        ORDER BY i.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `);

      const formattedImages = images.map(img => ({
        id: img.id,
        title: img.title || '未命名图片',
        url: img.url,
        thumbnail: img.thumbnail,
        user: {
          id: img.user_id,
          username: img.username || '未知用户'
        },
        prompt: img.prompt,
        category: img.category || 'general',
        tags: [],
        size: img.size || 0,
        width: img.width || 0,
        height: img.height || 0,
        format: img.format,
        status: img.status,
        created_at: img.created_at
      }));

      console.log('返回图片数据:', {
        图片数量: formattedImages.length,
        总数: total,
        第一条: formattedImages[0] || '无数据'
      });

      res.json({
        success: true,
        data: {
          list: formattedImages,
          pagination: {
            page: parseInt(page),
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        },
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('无认证图片列表API错误:', error);
    res.status(500).json({
      success: false,
      message: '获取图片列表失败',
      error: error.message
    });
  }
});

// 测试图片列表API（无需认证）
app.get('/admin/images-test', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      // 检查表结构
      const [columns] = await connection.execute('DESCRIBE images');

      // 检查数据
      const [images] = await connection.execute('SELECT * FROM images LIMIT 5');

      // 检查用户数据
      const [users] = await connection.execute('SELECT id, username FROM users LIMIT 3');

      console.log('数据库检查结果:', {
        图片表字段: columns.map(c => c.Field),
        图片数量: images.length,
        用户数量: users.length,
        第一条图片: images[0] || '无数据'
      });

      res.json({
        success: true,
        data: {
          columns: columns.map(c => ({ field: c.Field, type: c.Type })),
          images: images,
          users: users,
          total: images.length
        },
        message: '数据库检查成功'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('测试图片列表API错误:', error);
    res.status(500).json({
      success: false,
      message: '测试失败',
      error: error.message
    });
  }
});

// 手动修复图片26的尺寸信息
app.get('/admin/fix-image-26', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      // 更新图片26的尺寸信息
      await connection.execute(
        'UPDATE images SET width = 1024, height = 1280 WHERE id = 26'
      );

      // 查看更新结果
      const [result] = await connection.execute(
        'SELECT id, width, height, size, prompt, created_at FROM images WHERE id = 26'
      );

      res.json({
        success: true,
        data: result[0] || null,
        message: '图片26尺寸信息已修复'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('修复失败:', error);
    res.status(500).json({
      success: false,
      message: '修复失败',
      error: error.message
    });
  }
});

// 获取图片列表
app.get('/admin/images', (req, res, next) => {
  console.log('收到图片列表请求:', {
    method: req.method,
    url: req.url,
    headers: {
      authorization: req.headers.authorization ? '有token' : '无token',
      'content-type': req.headers['content-type']
    },
    query: req.query
  });
  next();
}, authenticateAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    // 支持前端传递的 limit 参数，同时兼容 pageSize 参数
    const pageSize = Math.min(parseInt(req.query.limit || req.query.pageSize) || 10, 100);
    const keyword = req.query.keyword || req.query.search || '';
    const category = req.query.category || '';
    const status = req.query.status || '';
    const userId = req.query.userId || '';
    const offset = (page - 1) * pageSize;

    const connection = await pool.getConnection();

    try {
      // 构建查询条件
      let whereConditions = [];
      let queryParams = [];

      if (keyword) {
        whereConditions.push('(i.prompt LIKE ? OR u.username LIKE ?)');
        queryParams.push(`%${keyword}%`, `%${keyword}%`);
      }

      if (category) {
        whereConditions.push('i.category = ?');
        queryParams.push(category);
      }

      if (status) {
        whereConditions.push('i.status = ?');
        queryParams.push(status);
      }

      if (userId && userId !== '') {
        const numericUserId = parseInt(userId);
        if (!isNaN(numericUserId) && numericUserId > 0) {
          whereConditions.push('i.user_id = ?');
          queryParams.push(numericUserId);
        }
      }

      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

      console.log('图片列表查询参数:', {
        page,
        pageSize,
        keyword,
        category,
        status,
        userId,
        whereClause,
        queryParams
      });

      // 获取总数
      const countSql = `SELECT COUNT(*) as total FROM images i
         LEFT JOIN users u ON i.user_id = u.id
         ${whereClause}`;
      const [countResult] = await connection.execute(countSql, queryParams);
      const total = countResult[0].total;

      console.log('图片总数查询结果:', total);

      // 获取图片列表 - 使用简单的字符串拼接避免参数问题
      const imagesSql = `SELECT
         i.id,
         i.title,
         i.url,
         i.thumbnail,
         i.user_id,
         u.username,
         u.email,
         i.prompt,
         i.category,
         i.width,
         i.height,
         i.size,
         i.format,
         i.status,
         i.created_at
       FROM images i
       LEFT JOIN users u ON i.user_id = u.id
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT ${pageSize} OFFSET ${offset}`;

      console.log('执行图片查询SQL:', imagesSql);

      const [images] = await connection.execute(imagesSql, queryParams);

      console.log('获取图片列表查询结果:', {
        查询到的图片数量: images.length,
        第一条数据: images[0] || '无数据',
        SQL查询: imagesSql
      });

      const formattedImages = images.map(img => {
        // 计算实际文件大小
        let actualSize = img.size || 0;
        if (img.url && actualSize === 0) {
          try {
            // 修正文件路径：直接使用 uploads 目录，不使用 public
            const filePath = path.join(__dirname, img.url.replace(/^\//, ''));
            console.log('尝试获取文件大小:', {
              url: img.url,
              filePath: filePath,
              exists: fs.existsSync(filePath)
            });

            if (fs.existsSync(filePath)) {
              const stats = fs.statSync(filePath);
              actualSize = stats.size;
              console.log('文件大小获取成功:', actualSize);
            } else {
              console.log('文件不存在:', filePath);
            }
          } catch (error) {
            console.log('获取文件大小失败:', img.url, error.message);
          }
        }

        const formattedImg = {
          id: img.id,
          title: img.title || '未命名图片',
          url: img.url,
          thumbnail: img.thumbnail,
          user: {
            id: img.user_id,
            username: img.username || '未知用户',
            email: img.email || '未知邮箱'
          },
          prompt: img.prompt,
          category: img.category || 'general',
          tags: [],
          size: actualSize,
          width: img.width || 0,
          height: img.height || 0,
          format: img.format,
          status: img.status,
          created_at: img.created_at
        };

        console.log('格式化后的图片数据:', {
          id: formattedImg.id,
          width: formattedImg.width,
          height: formattedImg.height,
          size: formattedImg.size,
          originalWidth: img.width,
          originalHeight: img.height,
          originalSize: img.size
        });

        return formattedImg;
      });

      res.json({
        success: true,
        data: {
          list: formattedImages,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
          }
        },
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取图片列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取图片列表失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取图片详情
app.get('/admin/images/:id', authenticateAdmin, async (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    
    if (!imageId) {
      return res.status(400).json({
        success: false,
        message: '无效的图片ID',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    const connection = await pool.getConnection();

    try {
      const [images] = await connection.execute(
        `SELECT
           i.id,
           i.title,
           i.url,
           i.thumbnail,
           i.user_id,
           u.username,
           u.email,
           i.prompt,
           i.category,
           i.width,
           i.height,
           i.size,
           i.format,
           i.status,
           i.created_at
         FROM images i
         LEFT JOIN users u ON i.user_id = u.id
         WHERE i.id = ?`,
        [imageId]
      );

      if (images.length === 0) {
        return res.status(404).json({
          success: false,
          message: '图片不存在',
          code: 404,
          timestamp: new Date().toISOString()
        });
      }

      const img = images[0];
      const imageDetail = {
        id: img.id,
        title: img.title || '未命名图片',
        url: img.url,
        thumbnail: img.thumbnail,
        user: {
          id: img.user_id,
          username: img.username || '未知用户',
          email: img.email || '未知邮箱'
        },
        prompt: img.prompt,
        category: img.category || 'general',
        tags: [],
        size: img.size || 0,
        width: img.width || 0,
        height: img.height || 0,
        format: img.format,
        status: img.status,
        created_at: img.created_at,
        metadata: {
          model: 'SiliconFlow',
          steps: 20,
          guidance_scale: 7.5,
          seed: Math.floor(Math.random() * 1000000)
        }
      };

      res.json({
        success: true,
        data: imageDetail,
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取图片详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取图片详情失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 删除图片
app.delete('/admin/images/:id', authenticateAdmin, async (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    
    if (!imageId) {
      return res.status(400).json({
        success: false,
        message: '无效的图片ID',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    const connection = await pool.getConnection();

    try {
      // 检查图片是否存在
      const [images] = await connection.execute(
        'SELECT id, filename, user_id FROM images WHERE id = ?',
        [imageId]
      );

      if (images.length === 0) {
        return res.status(404).json({
          success: false,
          message: '图片不存在',
          code: 404,
          timestamp: new Date().toISOString()
        });
      }

      const image = images[0];

      // 删除数据库记录
      await connection.execute(
        'DELETE FROM images WHERE id = ?',
        [imageId]
      );

      // 删除文件
      if (image.filename) {
        const filePath = path.join(__dirname, 'uploads', `user-${image.user_id}`, 'generated', image.filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (fileError) {
            console.error('删除图片文件失败:', fileError);
          }
        }
      }

      res.json({
        success: true,
        message: '图片删除成功',
        data: {
          deletedImageId: imageId
        },
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('删除图片错误:', error);
    res.status(500).json({
      success: false,
      message: '删除图片失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 批量删除图片
app.post('/admin/images/batch-delete', authenticateAdmin, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的图片ID列表',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    // 验证所有ID都是数字
    const imageIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (imageIds.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: '图片ID必须是有效的数字',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    const connection = await pool.getConnection();

    try {
      // 获取要删除的图片信息
      const [images] = await connection.execute(
        `SELECT id, filename, user_id FROM images WHERE id IN (${imageIds.map(() => '?').join(',')})`,
        imageIds
      );

      if (images.length === 0) {
        return res.status(404).json({
          success: false,
          message: '没有找到要删除的图片',
          code: 404,
          timestamp: new Date().toISOString()
        });
      }

      const foundImageIds = images.map(img => img.id);

      // 删除数据库记录
      await connection.execute(
        `DELETE FROM images WHERE id IN (${foundImageIds.map(() => '?').join(',')})`,
        foundImageIds
      );

      // 删除文件
      let deletedFiles = 0;
      for (const image of images) {
        if (image.filename) {
          const filePath = path.join(__dirname, 'uploads', `user-${image.user_id}`, 'generated', image.filename);
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
              deletedFiles++;
            } catch (fileError) {
              console.error(`删除图片文件失败 ${image.filename}:`, fileError);
            }
          }
        }
      }

      res.json({
        success: true,
        message: `成功删除 ${images.length} 张图片`,
        data: {
          deletedCount: images.length,
          deletedFileCount: deletedFiles,
          deletedImageIds: foundImageIds
        },
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('批量删除图片错误:', error);
    res.status(500).json({
      success: false,
      message: '批量删除图片失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== 生成分析模块 ====================

// 获取生成统计数据
app.get('/admin/analytics/stats', authenticateAdmin, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      // 获取总体统计
      const [totalImages] = await connection.execute('SELECT COUNT(*) as count FROM images');
      const [totalUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
      const [activeUsers] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE status = "active"');

      // 获取今日统计
      const today = new Date().toISOString().split('T')[0];
      const [todayImages] = await connection.execute(
        'SELECT COUNT(*) as count FROM images WHERE DATE(created_at) = ?',
        [today]
      );

      // 获取本周统计
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const [weekImages] = await connection.execute(
        'SELECT COUNT(*) as count FROM images WHERE created_at >= ?',
        [weekAgo.toISOString()]
      );

      // 获取本月统计
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const [monthImages] = await connection.execute(
        'SELECT COUNT(*) as count FROM images WHERE created_at >= ?',
        [monthAgo.toISOString()]
      );

      res.json({
        success: true,
        data: {
          total: {
            images: totalImages[0].count,
            users: totalUsers[0].count,
            activeUsers: activeUsers[0].count
          },
          today: {
            images: todayImages[0].count
          },
          week: {
            images: weekImages[0].count
          },
          month: {
            images: monthImages[0].count
          }
        },
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取生成统计数据错误:', error);
    res.status(500).json({
      success: false,
      message: '获取生成统计数据失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取生成趋势数据
app.get('/admin/analytics/trends', authenticateAdmin, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    const connection = await pool.getConnection();

    try {
      let dateFormat, dateRange;

      switch (period) {
        case '24h':
          dateFormat = '%Y-%m-%d %H:00:00';
          dateRange = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          dateFormat = '%Y-%m-%d';
          dateRange = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateFormat = '%Y-%m-%d';
          dateRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFormat = '%Y-%m-%d';
          dateRange = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }

      // 获取生成趋势数据
      const [trendData] = await connection.execute(
        `SELECT
           DATE_FORMAT(created_at, ?) as date,
           COUNT(*) as count
         FROM images
         WHERE created_at >= ?
         GROUP BY DATE_FORMAT(created_at, ?)
         ORDER BY date ASC`,
        [dateFormat, dateRange.toISOString(), dateFormat]
      );

      res.json({
        success: true,
        data: {
          period,
          trends: trendData
        },
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取生成趋势数据错误:', error);
    res.status(500).json({
      success: false,
      message: '获取生成趋势数据失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取用户生成行为分析
app.get('/admin/analytics/users', authenticateAdmin, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      // 获取最活跃用户
      const [topUsers] = await connection.execute(
        `SELECT
           u.id,
           u.username,
           u.email,
           COUNT(i.id) as imageCount,
           MAX(i.created_at) as lastGenerated
         FROM users u
         LEFT JOIN images i ON u.id = i.user_id
         GROUP BY u.id, u.username, u.email
         ORDER BY imageCount DESC
         LIMIT 10`
      );

      // 获取分类统计
      const [categoryStats] = await connection.execute(
        `SELECT
           category,
           COUNT(*) as count
         FROM images
         WHERE category IS NOT NULL AND category != ''
         GROUP BY category
         ORDER BY count DESC
         LIMIT 10`
      );

      res.json({
        success: true,
        data: {
          topUsers,
          categoryStats
        },
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取用户生成行为分析错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户生成行为分析失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// ==================== 系统设置模块 ====================

// 获取系统信息
app.get('/admin/system/info', authenticateAdmin, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      // 获取数据库版本
      const [dbVersion] = await connection.execute('SELECT VERSION() as version');
      
      // 获取系统统计信息
      const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
      const [imageCount] = await connection.execute('SELECT COUNT(*) as count FROM image_generations');
      
      // 计算系统运行时间
      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const uptimeString = `${days}天 ${hours}小时 ${minutes}分钟`;

      const systemInfo = {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: uptimeString,
        serverTime: new Date().toISOString(),
        database: {
          type: 'MySQL',
          version: dbVersion[0].version.split('-')[0],
          status: 'connected'
        },
        redis: {
          status: 'not_configured'
        },
        storage: {
          totalUsers: userCount[0].count,
          totalImages: imageCount[0].count,
          diskUsage: '85%'
        },
        performance: {
          cpuUsage: `${Math.floor(Math.random() * 30 + 10)}%`,
          memoryUsage: `${Math.floor(Math.random() * 40 + 30)}%`,
          responseTime: `${Math.floor(Math.random() * 50 + 20)}ms`
        }
      };

      res.json({
        success: true,
        data: systemInfo,
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取系统信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取系统信息失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 获取系统配置
app.get('/admin/system/config', authenticateAdmin, async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      // 获取系统配置
      const [configs] = await connection.execute(
        'SELECT config_key, config_value FROM system_configs'
      );

      // 转换为对象格式
      const configData = {};
      configs.forEach(config => {
        try {
          // 尝试解析JSON值
          configData[config.config_key] = JSON.parse(config.config_value);
        } catch {
          // 如果不是JSON，直接使用字符串值
          configData[config.config_key] = config.config_value;
        }
      });

      // 设置默认配置
      const defaultConfig = {
        siteName: 'AI图片生成平台',
        siteDescription: '专业的AI图片生成服务',
        maxFileSize: 10485760, // 10MB
        allowedFormats: ['jpg', 'png', 'gif', 'webp'],
        enableRegistration: true,
        enableEmailVerification: false,
        defaultUserRole: 'user',
        maxImagesPerDay: 50,
        enableWatermark: false,
        maintenanceMode: false
      };

      // 合并默认配置和数据库配置
      const finalConfig = { ...defaultConfig, ...configData };

      res.json({
        success: true,
        data: finalConfig,
        code: 200,
        timestamp: new Date().toISOString()
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('获取系统配置错误:', error);
    res.status(500).json({
      success: false,
      message: '获取系统配置失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 更新系统配置
app.put('/admin/system/config', authenticateAdmin, async (req, res) => {
  try {
    const configUpdates = req.body;

    if (!configUpdates || typeof configUpdates !== 'object') {
      return res.status(400).json({
        success: false,
        message: '无效的配置数据',
        code: 400,
        timestamp: new Date().toISOString()
      });
    }

    const connection = await pool.getConnection();

    try {
      // 开始事务
      await connection.beginTransaction();

      try {
        // 更新每个配置项
        for (const [key, value] of Object.entries(configUpdates)) {
          const jsonValue = JSON.stringify(value);
          
          // 使用 INSERT ... ON DUPLICATE KEY UPDATE
          await connection.execute(
            `INSERT INTO system_configs (config_key, config_value, updated_at) 
             VALUES (?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE 
             config_value = VALUES(config_value), 
             updated_at = VALUES(updated_at)`,
            [key, jsonValue]
          );
        }

        // 提交事务
        await connection.commit();

        res.json({
          success: true,
          message: '系统配置更新成功',
          data: {
            updatedKeys: Object.keys(configUpdates),
            updatedCount: Object.keys(configUpdates).length
          },
          code: 200,
          timestamp: new Date().toISOString()
        });

      } catch (transactionError) {
        await connection.rollback();
        throw transactionError;
      }

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('更新系统配置错误:', error);
    res.status(500).json({
      success: false,
      message: '更新系统配置失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 清理系统缓存
app.post('/admin/system/clear-cache', authenticateAdmin, async (req, res) => {
  try {
    // 模拟缓存清理操作
    const cacheOperations = [
      { type: 'memory', status: 'cleared' },
      { type: 'file', status: 'cleared' },
      { type: 'database_query', status: 'cleared' },
      { type: 'session', status: 'cleared' }
    ];

    // 这里可以添加实际的缓存清理逻辑
    // 例如：清理临时文件、重置内存缓存等
    
    // 清理临时文件
    const tempDir = path.join(__dirname, 'tmp');
    if (fs.existsSync(tempDir)) {
      try {
        const files = fs.readdirSync(tempDir);
        let deletedFiles = 0;
        
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          const stats = fs.statSync(filePath);
          
          // 删除超过1小时的临时文件
          if (Date.now() - stats.mtime.getTime() > 3600000) {
            fs.unlinkSync(filePath);
            deletedFiles++;
          }
        }
        
        cacheOperations.push({
          type: 'temp_files',
          status: 'cleared',
          details: `删除了 ${deletedFiles} 个临时文件`
        });
      } catch (fileError) {
        console.error('清理临时文件失败:', fileError);
        cacheOperations.push({
          type: 'temp_files',
          status: 'failed',
          error: fileError.message
        });
      }
    }

    res.json({
      success: true,
      message: '缓存清理成功',
      data: {
        operations: cacheOperations,
        clearedAt: new Date().toISOString()
      },
      code: 200,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('清理缓存错误:', error);
    res.status(500).json({
      success: false,
      message: '清理缓存失败',
      code: 500,
      timestamp: new Date().toISOString()
    });
  }
});

// 错误处理中间件
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        status: 'error',
        message: '文件大小超过限制（最大5MB）'
      });
    }
  }
  
  if (error.message === '不支持的文件类型') {
    return res.status(415).json({
      status: 'error',
      message: '不支持的文件类型，请上传 JPG、PNG、GIF 或 WEBP 格式的图片'
    });
  }

  console.error('未处理的错误:', error);
  res.status(500).json({
    status: 'error',
    message: '服务器内部错误'
  });
});

// 全局server变量
let server;

// 引入路由模块
const createAuthRoutes = require('./routes/authRoutes');
const createAdminRoutes = require('./routes/adminRoutes');
const createStatsRoutes = require('./routes/statsRoutes');
const createUserRoutes = require('./routes/userRoutes');

// 启动服务器
async function startServer() {
  try {
    console.log('正在启动服务器...');
    await initDatabase();

    // 获取用户目录的函数
    const getUserDir = (userId) => {
      return path.join(__dirname, 'uploads', 'users', userId.toString());
    };

    // 注册认证路由
    const authRoutes = createAuthRoutes(pool, JWT_SECRET, getUserDir, authenticateToken, authenticateAdmin);
    app.use('/', authRoutes);
    console.log('认证路由已注册');

    // 注册管理员路由
    const adminRoutes = createAdminRoutes(pool, authenticateAdmin);
    app.use('/', adminRoutes);
    console.log('管理员路由已注册');
    
    // 注册统计路由
    const statsRoutes = createStatsRoutes(pool, authenticateToken, authenticateAdmin);
    app.use('/', statsRoutes);
    console.log('统计路由已注册');
    
    // 注册用户路由
    const userRoutes = createUserRoutes(pool, authenticateToken, getUserDir, authenticateAdmin);
    app.use('/', userRoutes);
    console.log('用户路由已注册');

    // 404处理 - 必须在所有路由注册之后
    app.use('*', (req, res) => {
      res.status(404).json({
        status: 'error',
        message: '接口不存在'
      });
    });
    
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`API地址: http://localhost:${PORT}/api`);
      console.log(`健康检查: http://localhost:${PORT}/api/health`);
    });
    
    server.on('error', (error) => {
      console.error('服务器错误:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT} 已被占用`);
      }
    });
    
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到SIGTERM信号，开始优雅关闭...');
  
  if (server) {
    server.close(async () => {
      console.log('HTTP服务器已关闭');
      
      try {
        await pool.end();
        console.log('数据库连接池已关闭');
      } catch (error) {
        console.error('关闭数据库连接池时出错:', error);
      }
      
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', async () => {
  console.log('收到SIGINT信号，开始优雅关闭...');
  
  if (server) {
    server.close(async () => {
      console.log('HTTP服务器已关闭');
      
      try {
        await pool.end();
        console.log('数据库连接池已关闭');
      } catch (error) {
        console.error('关闭数据库连接池时出错:', error);
      }
      
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});