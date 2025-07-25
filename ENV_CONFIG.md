# 环境配置说明

## 环境文件说明

### 1. `.env.development` - 开发环境配置
- 用于本地开发
- 包含开发服务器配置
- 启用调试模式
- API 指向本地后端服务

### 2. `.env.production` - 生产环境配置
- 用于生产部署
- 优化性能配置
- 关闭调试模式
- API 指向生产服务器

### 3. `.env.local` - 本地环境配置（可选）
- 不会被提交到版本控制
- 用于覆盖其他环境配置
- 适合个人开发设置

## 使用方法

### 开发模式
```bash
# 启动开发服务器
npm run dev

# 启动开发服务器（允许外部访问）
npm run dev:local
```

### 生产模式
```bash
# 构建生产版本
npm run build

# 构建开发版本（用于测试）
npm run build:dev

# 预览生产版本
npm run preview:prod
```

## 环境变量说明

### API 配置
- `VITE_API_BASE_URL`: API 基础 URL
- `VITE_API_SERVER_URL`: 服务器 URL

### 应用配置
- `VITE_APP_TITLE`: 应用标题
- `VITE_APP_VERSION`: 应用版本

### 调试配置
- `VITE_DEBUG`: 是否启用调试模式
- `VITE_LOG_LEVEL`: 日志级别

### 开发服务器配置
- `VITE_DEV_SERVER_HOST`: 开发服务器主机
- `VITE_DEV_SERVER_PORT`: 开发服务器端口

## 注意事项

1. **环境文件优先级**：
   - `.env.local` > `.env.[mode]` > `.env`

2. **版本控制**：
   - `.env.development` 和 `.env.production` 会被提交到版本控制
   - `.env.local` 不会被提交到版本控制

3. **生产部署**：
   - 部署前请确保 `.env.production` 中的 API 地址正确
   - 建议在生产环境中使用环境变量覆盖敏感配置

4. **本地开发**：
   - 如需自定义配置，请使用 `.env.local` 文件
   - 不要直接修改 `.env.development` 文件
