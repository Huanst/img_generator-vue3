# AI图片生成器 - Vue3前端应用

> 🎨 基于Vue3 + Element Plus构建的现代化AI图片生成平台，提供直观易用的界面和强大的图片创作功能

## 后端项目暂未公开,功能继续完善中
### 访问地址 huanst.cn

## 📋 项目概述

这是一个完整的AI图片生成Web应用的前端部分，采用现代化的Vue3技术栈构建。用户可以通过自然语言描述生成高质量的AI图片，支持用户注册登录、历史记录管理、个性化设置等完整功能。

### 🌟 核心特性

- **🤖 AI图片生成** - 支持文本到图片的AI生成，多种尺寸和数量选择
- **👤 用户系统** - 完整的用户注册、登录、个人资料管理
- **📚 历史记录** - 保存和管理用户的图片生成历史
- **🎨 主题切换** - 支持深色/浅色主题，跟随系统设置
- **🌍 国际化** - 支持中文/英文双语界面
- **📱 响应式设计** - 适配桌面端和移动端设备
- **⚙️ 个性化设置** - 丰富的用户偏好设置选项
- **🔔 通知系统** - 智能的消息通知和状态提醒

## 🛠️ 技术栈

### 核心框架
- **Vue 3** - 渐进式JavaScript框架，使用Composition API
- **Vite** - 下一代前端构建工具，快速的开发体验
- **Element Plus** - 基于Vue3的企业级UI组件库

### 开发工具
- **TypeScript** - 类型安全的JavaScript超集
- **ESLint** - 代码质量检查工具
- **Prettier** - 代码格式化工具

### 核心依赖
- **Axios** - HTTP客户端，用于API通信
- **Vue I18n** - 国际化解决方案
- **Element Plus Icons** - 图标组件库

## 📁 项目结构

```
img_generator-vue3/
├── .github/                    # GitHub Actions配置
│   └── workflows/
│       └── deploy-cloud.yml    # 自动化部署配置
├── public/                     # 静态资源
├── src/                        # 源代码目录
│   ├── components/             # Vue组件
│   │   ├── ImageGenerator.vue  # 图片生成主组件
│   │   ├── ResultDisplay.vue   # 结果展示组件
│   │   ├── LoginPage.vue       # 登录页面
│   │   ├── RegisterPage.vue    # 注册页面
│   │   ├── ProfilePage.vue     # 个人资料页面
│   │   ├── SettingsPage.vue    # 设置页面
│   │   ├── HistoryModal.vue    # 历史记录模态框
│   │   ├── GlassmorphicCard.vue # 玻璃态卡片组件
│   │   ├── HealthCheck.vue     # 健康检查组件
│   │   └── ImageLoadTest.vue   # 图片加载测试组件
│   ├── locales/                # 国际化语言包
│   │   ├── zh-CN.js           # 中文语言包
│   │   └── en-US.js           # 英文语言包
│   ├── utils/                  # 工具函数
│   │   ├── apiClient.js        # API客户端配置
│   │   ├── apiService.js       # API服务封装
│   │   ├── userStore.js        # 用户状态管理
│   │   ├── settingsStore.js    # 设置状态管理
│   │   ├── i18nService.js      # 国际化服务
│   │   ├── notificationService.js # 通知服务
│   │   ├── errorHandler.js     # 错误处理
│   │   ├── logger.js           # 日志工具
│   │   ├── urlUtils.js         # URL工具
│   │   └── envUtils.js         # 环境变量工具
│   ├── App.vue                 # 根组件
│   ├── main.js                 # 应用入口
│   └── style.css               # 全局样式
├── .env                        # 环境变量配置
├── .env.development            # 开发环境配置
├── .env.production             # 生产环境配置
├── package.json                # 项目配置和依赖
├── vite.config.js              # Vite构建配置
└── README.md                   # 项目文档
```

## 🚀 快速开始

### 环境要求

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0 或 **pnpm** >= 7.0.0

### 安装依赖

```bash
# 使用npm
npm install

# 或使用pnpm（推荐）
pnpm install
```

### 环境配置

1. 复制环境变量配置文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，配置后端API地址：
```env
# 开发环境API地址
VITE_API_BASE_URL=http://localhost:5004

# 生产环境API地址（部署时使用）
VITE_PROD_API_BASE_URL=https://your-domain.com
```

### 开发模式

```bash
# 启动开发服务器
npm run dev

# 或使用pnpm
pnpm dev
```


### 生产构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 🎯 主要功能模块

### 1. 用户认证系统
- **用户注册** - 支持用户名、邮箱、密码注册，可选头像上传
- **用户登录** - 安全的JWT认证机制
- **个人资料** - 用户信息管理，头像更新，密码修改
- **会话管理** - 自动登录状态保持和安全退出

### 2. AI图片生成
- **文本描述** - 支持详细的图片描述输入，最多1000字符
- **随机提示词** - 智能生成创意提示词
- **尺寸选择** - 支持多种预设尺寸和自定义尺寸
- **批量生成** - 一次生成1-4张图片
- **高级参数** - 负向提示词、风格强度、采样步数等专业参数

### 3. 历史记录管理
- **生成历史** - 保存用户所有的图片生成记录
- **图片预览** - 快速浏览历史生成的图片
- **重新生成** - 基于历史参数重新生成图片
- **删除管理** - 清理不需要的历史记录

### 4. 个性化设置
- **主题设置** - 深色/浅色主题切换，跟随系统设置
- **语言设置** - 中文/英文界面切换
- **生成偏好** - 默认尺寸、数量、模型等设置
- **通知设置** - 生成完成通知、系统消息等
- **隐私设置** - 历史记录保存、数据清理等

### 5. 响应式界面
- **玻璃态设计** - 现代化的毛玻璃效果界面
- **动态效果** - 鼠标跟随光效、平滑过渡动画
- **移动适配** - 完美适配手机和平板设备
- **无障碍支持** - 键盘导航、屏幕阅读器支持



### 自动化部署

项目配置了完整的GitHub Actions自动化部署流程：

1. **配置Repository Secrets**：
   - `SERVER_HOST` - 服务器地址
   - `SERVER_USER` - SSH用户名
   - `SSH_PRIVATE_KEY` - SSH私钥
   - `DEPLOY_PATH` - 部署路径

2. **推送代码自动部署**：
   ```bash
   git push origin main
   ```

3. **手动触发部署**：
   在GitHub Actions页面手动触发工作流



## 🔗 相关项目

- **后端API** - `../backend/` - Node.js + Express + MySQL
- **管理后台** - `../admin-dashboard/` - Vue3管理系统



## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。


---

<div align="center">
  <p>⭐ 如果这个项目对你有帮助，请给它一个星标！</p>
  <p>Made with ❤️ by Your Team</p>
</div>