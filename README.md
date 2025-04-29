# 文字生成图片

一个基于 Vue 3 和 Element Plus 的现代化 AI 图像生成 Web 应用，采用响应式设计和优雅的磨砂玻璃风格 UI。支持暗色/亮色模式，跟随系统主题自动切换。
项目预览：www.huanst.cn

## 功能特点

- 科技感磨砂玻璃风格 UI
- 暗色/亮色模式支持，可跟随系统设置
- 移动端优先的响应式设计
- 支持自定义图像尺寸和生成数量
- 支持上传参考图片，转换为 WebP 格式
- 图像预览和批量打开功能
- 一键复制图片链接
- 图片尺寸智能检测
- 自动部署支持

## 环境要求

- Node.js 16.0+
- NPM 7.0+

## 安装与运行

1. 克隆项目

```bash
git clone https://github.com/Huanst/img_generator-vue3.git
cd img_generator-vue3
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量
   创建`.env.local`文件并添加您的 API 密钥：
   项目使用的是硅基流动siliconflow的API，模型是免费的Kwai-Kolors/Kolors生图模型
   API KEY申请地址：https://cloud.siliconflow.cn/i/ub4Y8OWs

```
VITE_SILICONFLOW_API_KEY=your_api_key_here
```

4. 启动开发服务器

```bash
npm run dev
```

5. 构建生产版本

```bash
npm run build
```

## 技术栈

- Vue 3 - 渐进式 JavaScript 框架
- Vite - 前端构建工具
- Element Plus - 基于 Vue 3 的组件库
- Axios - 基于 Promise 的 HTTP 客户端

## 新增功能

### 暗色/亮色模式

- 自动跟随系统主题设置
- 支持手动切换主题模式
- 针对不同主题优化的组件样式

### 图片上传功能

- 支持上传参考图片
- 自动转换为 WebP 格式以符合 API 要求
- 上传状态实时显示
- 文件大小限制检查

### 优化的图片预览

- 全屏预览支持
- 图片尺寸智能检测
- 批量打开图片功能
- 复制图片链接

## 项目结构

```
src/
├── assets/           # 静态资源
├── components/       # 组件
│   ├── GlassmorphicCard.vue  # 磨砂玻璃效果组件
│   ├── ImageGenerator.vue    # 图像生成表单组件
│   └── ResultDisplay.vue     # 结果展示组件
├── App.vue           # 应用主组件
└── main.js           # 应用入口
```

## 许可证

MIT