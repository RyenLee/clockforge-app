# ClockForge

一个功能强大的桌面定时应用，基于 Tauri 2 + React + Rust 构建。

## 功能特性

### 秒表
- 精确的毫秒级计时
- 记录单圈时间
- 暂停/继续/重置功能

### 定时通知
- 设置倒计时提醒
- 系统通知推送
- 自定义通知标题和内容

### 定时关机
- 支持关机、重启、睡眠操作
- 跨平台支持（Windows/macOS/Linux）
- 倒计时结束自动执行系统命令

### 任务管理
- 查看所有定时任务
- 取消正在运行的任务
- 任务状态追踪

### 仪表盘
- 任务统计概览
- 今日完成任务数
- 近期任务列表

## 技术栈

- **前端**: React 19 + TypeScript + Vite
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand
- **图标**: Lucide React
- **后端**: Rust + Tauri 2
- **数据库**: SQLite (rusqlite)
- **通知**: tauri-plugin-notification

## 开发环境

### 前置依赖

- Node.js >= 18
- Rust >= 1.77
- pnpm

#### 平台特定依赖

**Windows**
- WebView2 运行时（Windows 10/11 默认包含）

**macOS**
- Xcode Command Line Tools
```bash
xcode-select --install
```

**Linux**
```bash
# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

# Fedora/RHEL
sudo dnf install webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel patchelf

# Arch Linux
sudo pacman -S webkit2gtk-4.1 libappindicator-gtk3 librsvg patchelf
```

### 安装步骤

```bash
# 安装前端依赖
pnpm install

# 开发模式（完整 Tauri 环境）
pnpm tauri dev

# 构建生产版本
pnpm tauri build
```

### 浏览器开发模式

项目支持纯前端开发，无需完整 Tauri 环境：

```bash
# 启动前端开发服务器
pnpm dev
```

浏览器模式下会使用 Mock API 模拟后端行为，方便快速调试前端功能。

## 项目结构

```
clockforge-app/
├── src/                    # 前端源码
│   ├── components/         # 通用组件
│   ├── pages/              # 页面组件
│   ├── stores/             # Zustand 状态管理
│   ├── api/                # API 调用封装
│   ├── styles/             # 全局样式
│   └── types/              # TypeScript 类型定义
├── src-tauri/              # Rust 后端
│   ├── src/                # Rust 源码
│   │   ├── commands/       # Tauri 命令
│   │   ├── db.rs           # 数据库操作
│   │   ├── scheduler.rs    # 任务调度器
│   │   └── stopwatch.rs    # 秒表逻辑
│   └── icons/              # 应用图标
├── public/                 # 静态资源
└── docs/                   # 文档
```

## 许可证

MIT License - 详见 [LICENSE](LICENSE)
