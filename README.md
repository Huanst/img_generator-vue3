# Image Generator Vue3

基于 Vue3 + TypeScript + Element Plus 的图片生成工具

## 技术栈

- 🚀 前端框架: Vue 3
- 🎨 UI组件库: Element Plus
- ⚡ 构建工具: Vite
- � 开发语言: TypeScript
- 🔄 HTTP客户端: axios
- ✅ 代码规范: ESLint + Prettier

## 功能特性

- 图片生成和编辑
- 响应式布局
- 主题切换
- API数据交互
- 自动部署

## 项目结构

```
├── .github/
│   └── workflows/
│       └── depoly-cloud.yml    # GitHub Actions 部署配置
├── scripts/
│   └── setup-deployment.sh     # 自动化部署配置脚本
├── src/
│   ├── App.vue                 # 根组件
│   ├── main.js                 # 应用入口
│   ├── assets/                 # 静态资源
│   ├── components/             # 公共组件
│   │   ├── ImageGenerator.vue  # 图片生成组件
│   │   ├── HistoryModal.vue    # 历史记录模态框
│   │   ├── ImageLoadTest.vue   # 图片加载测试工具
│   │   └── ...                 # 其他组件
│   ├── utils/                  # 工具函数
│   │   ├── apiClient.js        # API 客户端
│   │   ├── apiservice.js       # API 服务
│   │   ├── urlutils.js         # URL 工具
│   │   └── userStore.js        # 用户状态管理
│   └── style.css               # 全局样式
├── DEPLOYMENT_GUIDE.md         # 详细部署指南
├── QUICK_START.md              # 快速开始指南
├── README.md                   # 项目说明
├── package.json                # 项目配置
├── pnpm-lock.yaml             # 依赖锁定文件
└── vite.config.js             # Vite 配置
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 生产构建

```bash
pnpm build
```

### 代码检查

```bash
pnpm lint
```

## 开发指南

### 添加新组件

1. 在`components/`目录下创建新的`.vue`文件
2. 使用TypeScript和Composition API编写组件
3. 在需要的地方导入使用

### API调用示例

```javascript
import axios from 'axios';

const generateImage = async (params) => {
  try {
    const response = await axios.post('/api/generate', params);
    return response.data;
  } catch (error) {
    console.error('API调用失败:', error);
    throw error;
  }
};
```

## 🚀 自动化部署

项目配置了完整的 GitHub Actions 自动化部署流程，支持一键部署到云服务器。

### 快速部署配置

```bash
# 运行自动配置脚本
./scripts/setup-deployment.sh
```

### 部署文档

- **📖 [快速开始指南](QUICK_START.md)** - 5分钟完成部署配置
- **📚 [详细部署指南](DEPLOYMENT_GUIDE.md)** - 完整的配置说明和故障排除
- **🔧 [自动配置脚本](scripts/setup-deployment.sh)** - 一键生成SSH密钥和配置

### 部署特性

- ✅ **自动触发**: 推送到 `main` 分支自动部署
- ✅ **智能缓存**: 依赖缓存，加速构建过程
- ✅ **安全传输**: SSH 密钥认证，压缩传输
- ✅ **自动备份**: 部署前备份当前版本
- ✅ **健康检查**: 部署后自动验证服务状态
- ✅ **错误处理**: 完善的错误处理和回滚机制
- ✅ **手动触发**: 支持手动触发和环境选择

### 部署流程

```
代码推送 → 环境准备 → 依赖安装 → 项目构建 → 文件压缩 → 上传服务器 → 备份旧版本 → 部署新版本 → 重启服务 → 健康检查 → 完成通知
```

### Repository Secrets 配置

在 GitHub 仓库设置中添加以下 Secrets：

| Secret 名称 | 描述 | 必需 |
|------------|------|------|
| `SERVER_HOST` | 服务器 IP 地址或域名 | ✅ |
| `SERVER_USER` | SSH 登录用户名 | ✅ |
| `SSH_PRIVATE_KEY` | SSH 私钥内容 | ✅ |
| `DEPLOY_PATH` | 网站部署目录 | ✅ |
| `SERVER_PORT` | SSH 端口号 (默认: 22) | ❌ |
| `BACKUP_PATH` | 备份存储目录 | ❌ |
| `HEALTH_CHECK_URL` | 健康检查 URL | ❌ |

## 更新记录

### 2024-12-01
- ✨ 新增完整的 GitHub Actions 自动化部署配置
- 🔧 添加自动化部署配置脚本 `setup-deployment.sh`
- 📚 完善部署文档和快速开始指南
- 🛠️ 优化图片加载测试工具
- 🔍 增强历史记录功能的错误处理

### 2024-04-29
- 🚀 优化部署流程

### 2024-03-17
- 🎉 项目初始化