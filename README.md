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
src/
├── App.vue         # 根组件
├── main.js         # 应用入口
├── assets/         # 静态资源
├── components/     # 公共组件
├── utils/          # 工具函数
└── style.css       # 全局样式
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

## 部署

项目使用GitHub Actions自动部署到服务器。部署流程包括：

1. 代码推送到main分支
2. 自动运行测试和构建
3. 将构建产物部署到服务器

## 更新记录

- 2024-04-29: 优化部署流程
- 2024-03-17: 项目初始