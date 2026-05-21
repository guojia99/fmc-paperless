<div align="center">

# FMC Paperless

**魔方最少步无纸化练习工具**

[![Live Demo](https://img.shields.io/badge/🚀_在线体验-fmc--paperless.cubing.pro-863bff?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTAgMTNhNSA1IDAgMCAwIDcuNTQuNmwzLTNhNSA1IDAgMCAwLTcuMDgtNy4yMWwtMyAzeiIvPjwvc3ZnPg==)](https://fmc-paperless.cubing.pro/)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-0d8a3e?style=flat-square)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

**一个纯前端的 3×3 魔方最少步 (FMC) 无纸化练习工具，告别纸笔，随时随地训练。**

[快速开始](#-快速开始) · [功能特性](#-功能特性) · [在线体验](https://fmc-paperless.cubing.pro/)

</div>

---

## 截图预览

<!-- 请替换为实际截图：桌面端主界面，展示打乱、虚拟键盘、解法链 -->
<p align="center">
  <img src="docs/screenshots/main.png" alt="桌面端主界面" />
</p>
---

## 功能特性

### 🎲 打乱与计时

- **自动打乱** — 通过 csTimer 模块生成 3×3 随机打乱，附带可隐藏的打乱预览图
- **FMC 计时器** — 默认 60 分钟正计时，剩余 15 分钟琥珀色预警、5 分钟红色警告；超时后仍可继续编辑解法
- **会话历史** — 本地缓存最近 50 把，自动恢复最新一把，右上角下拉快速切换

### ⌨️ 虚拟键盘

- **灵活布局** — 4 行默认布局，最多可扩充至 6 行
- **快捷输入** — 连续点击自动轮替（`R → R2 → R' → 清空`），长按弹出变体选择
- **自由定位** — 键盘位置可切换为底部 / 左侧 / 右侧 / 悬浮 / 隐藏

### 🔗 解法链

- **树状分支** — 所见即所得的分支结构，每一步显示累计步数、注释、优先级和颜色标记
- **即时编译** — 分支末端实时显示编译后的最终解法与步数
- **括号（反向）步骤** — 每个节点可切换正向 / 反向，编译时自动逆序、求逆并消步
- **影子解法** — 一键翻转最后一步（`A ↔ A'`），快速生成兄弟分支
- **插入公式** — 会话级公式库，支持普通替换与宽转动（wide move）插入

### 📝 整理与导出

- **手动整理板** — 独立编辑整理稿，或一键从任意分支导入
- **导入 / 导出** — 以时间戳命名的 JSON 文件，方便备份和跨设备迁移
- **智能消步** — 同面及同轴对面（U/D、F/B、L/R）自动模 4 合并，宽转动（`Rw`）独立处理

### 📱 多端适配

- **响应式设计** — 桌面、平板、手机自适应布局

---

## 快速开始

### 在线使用

无需安装，直接访问：**[fmc-paperless.cubing.pro](https://fmc-paperless.cubing.pro/)**

### 本地安装

```bash
# 克隆项目
git clone https://github.com/YOUR_USERNAME/fmc-paperless.git
cd fmc-paperless

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开浏览器访问 `http://localhost:5173` 即可开始使用。

### 构建部署

```bash
# 类型检查 + 生产构建
npm run build

# 预览构建产物
npm run preview
```

构建产物位于 `dist/` 目录，可部署到任意静态托管服务。

---

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | [React](https://react.dev/) 19 + [TypeScript](https://www.typescriptlang.org/) 6 |
| 构建 | [Vite](https://vite.dev/) 8 |
| 样式 | [Tailwind CSS](https://tailwindcss.com/) 4 |
| 状态管理 | [Zustand](https://zustand.docs.pmnd.rs/)（persist 中间件） |
| 打乱生成 | [cstimer_module](https://github.com/cs0x7f/cstimer) |
| 测试 | [Vitest](https://vitest.dev/) + jsdom |

---

## 项目结构

```
src/
├── core/                       # 纯函数核心（与 UI 解耦，便于单元测试）
│   ├── moves/                  #   动作解析 / 序列化 / 求逆 / 消步
│   ├── solution/               #   解法节点树 / 影子 / 插入 / 编译
│   └── keyboard/               #   键盘布局 + 连续点击逻辑
├── store/                      # 全局状态
│   ├── sessionStore.ts         #   会话状态（sessions 列表 + 当前会话）
│   ├── uiStore.ts              #   UI 临时状态（抽屉等）
│   └── keyboardStore.ts        #   键盘配置（位置 / 布局，持久化）
├── components/                 # UI 组件
│   ├── layout/                 #   AppShell / Header / SideDrawer
│   ├── scramble/               #   打乱条
│   ├── timer/                  #   计时器
│   ├── sessions/               #   会话菜单
│   ├── solution-chain/         #   解法链 + 树节点 + 分支
│   ├── virtual-keyboard/       #   虚拟键盘 + 长按弹层
│   ├── arrangement-board/      #   手动整理板
│   ├── import-export/          #   导入 / 导出
│   └── common/                 #   通用组件（Icons 等）
├── hooks/                      # 自定义 Hooks
├── lib/                        # 工具库（cstimer-shim / persistence / cn）
└── __tests__/core/             # 核心逻辑单元测试
```

---

## 开发

```bash
# 运行测试
npm run test

# 监听模式
npm run test:watch

# 代码检查
npm run lint
```

---

## 使用开源项目

本项目在开发过程中参考和使用了以下优秀的开源项目：

- **[csTimer](https://github.com/cs0x7f/cstimer)** — 提供打乱生成算法和魔方状态图片渲染
- **[Commutator](https://github.com/nbwzx/commutator)** — 交换子转换工具

---

## 许可证

本项目基于 [GPL-3.0](LICENSE) 许可证开源。
