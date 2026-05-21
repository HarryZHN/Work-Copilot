# Work Copilot

一个纯前端工作辅助工具，帮助用户提升工作效率。

## 功能特性

### 备忘录
- ✅ 创建、编辑、删除备忘录
- ✅ 详情页内容默认隐藏，点击显示
- ✅ 一键复制全部内容（标题 + 内容）
- ✅ 全文模糊搜索（标题 + 内容）
- ✅ 数据持久化存储（IndexedDB）

### 排期表
- ✅ 甘特图式月视图展示
- ✅ 月份切换（上一月/下一月/今天）
- ✅ 创建、编辑、删除任务
- ✅ 任务完成状态切换
- ✅ 贪心轨道布局算法（最小化轨道数）
- ✅ 任务颜色自动分配（相同任务始终同色）
- ✅ 完成任务浅色显示

## 技术栈

- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **路由**: Vue Router（Hash 模式）
- **数据库**: IndexedDB（Dexie.js）
- **样式**: SCSS

## 项目结构

```
src/
├── components/          # 公共组件
│   └── TaskBar.vue      # 任务条组件
├── db/                  # 数据库配置
│   └── index.ts         # Dexie.js 数据库定义
├── layouts/             # 布局组件
│   └── DefaultLayout.vue # 主布局（侧边栏 + 内容区）
├── router/              # 路由配置
│   └── index.ts
├── utils/               # 工具函数
│   ├── color.ts         # 颜色计算工具
│   └── date.ts          # 日期处理工具
├── views/               # 页面视图
│   ├── memo/            # 备忘录模块
│   │   ├── index.vue    # 列表页
│   │   ├── detail.vue   # 详情页
│   │   └── edit.vue     # 编辑页
│   └── ScheduleView.vue # 排期表页面
├── App.vue              # 根组件
├── main.ts              # 入口文件
└── style.scss           # 全局样式
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 部署

本项目为纯静态 SPA，可部署到任何静态文件托管服务：

- **GitHub Pages**: 直接部署 `dist` 目录
- **Vercel**: 自动检测并部署
- **Netlify**: 自动检测并部署
- **其他**: 上传 `dist` 目录到任意静态服务器

## 数据存储

所有数据存储在浏览器的 IndexedDB 中：

- **memos 表**: 备忘录数据
- **tasks 表**: 排期任务数据

数据仅存储在本地浏览器中，不会上传到服务器。

## License

MIT
