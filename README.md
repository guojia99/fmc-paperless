# FMC Paperless · 魔方最少步无纸化练习

> 一个纯前端 (React + TypeScript) 的魔方最少步 (FMC) 无纸化练习工具。

完整需求见 [docs/v1.0.0.md](docs/v1.0.0.md)。

## 功能一览

- **自动打乱**：通过 `cstimer_module` 生成 3×3 打乱与可隐藏的打乱预览图。
- **虚拟键盘**：4 行默认布局，最多可扩充至 6 行；支持连续点击轮替（`R → R2 → R' → 空`）和长按弹出变体选择；位置可切换为底部 / 左 / 右 / 悬浮 / 隐藏。
- **最少步链**：树状分支结构，所见即所得地展示每一步、累计步数、注释、优先级、颜色，并在分支末尾即时显示编译结果。
- **括号 (反向) 步骤**：每个节点可切换正向 / 反向；编译时反向段会被逆序、求逆后并入末尾，并按 FMC 规则消步。
- **消步**：同面 + 同轴对面（U/D、F/B、L/R）通过模 4 求和合并，宽 (`Rw`) 与非宽 (`R`) 独立。
- **影子解法**：只翻转最后一步 (`A ↔ A'`、`A2` 不变)，作为兄弟节点。
- **插入公式**：会话级公式库；普通 `# = M` 直接替换文本，宽插入 `# = w` 把 `F#'` 变为 `Fw'`。
- **计时器**：默认正计时 60 分钟；不足 15 分钟琥珀色、不足 5 分钟红底；可在超时后继续编辑。
- **会话历史**：本地缓存最多 50 把；自动恢复最新一把；可在右上角下拉切换。
- **导入 / 导出**：时间戳 (秒级) 命名的 JSON 文件。
- **手动整理板**：可单独编辑 / 一键导入任意分支的整理稿。
- **响应式**：桌面 / 平板 / 手机自适应。

## 技术栈

- React 19 + TypeScript 6
- Vite 8 + Tailwind CSS 4 (`@theme` token + 自定义工具类)
- Zustand (`persist` 中间件) 作为状态管理
- `cstimer_module` 生成打乱与图片
- `nanoid` 生成 ID
- Vitest + jsdom 跑核心单元测试

## 项目结构

```
src/
├── core/                       # 纯函数核心（与 UI 无关，可单测）
│   ├── moves/                  # 解析 / 序列化 / 逆 / 消步
│   ├── solution/               # 节点树 / 影子 / 插入 / 编译
│   └── keyboard/               # 键盘布局 + 连续点击逻辑
├── store/
│   ├── sessionStore.ts         # 统一的会话状态 (sessions 列表 + 当前 ID)
│   ├── uiStore.ts              # 抽屉等临时 UI 标志
│   └── keyboardStore.ts        # 键盘位置 / 布局，持久化
├── components/
│   ├── layout/                 # AppShell / Header / SideDrawer
│   ├── scramble/               # ScrambleStrip
│   ├── timer/                  # Timer
│   ├── sessions/               # SessionsMenu
│   ├── solution-chain/         # SolutionChain + TreeNode + BranchFooter ...
│   ├── virtual-keyboard/       # 虚拟键盘 + 配置 + 长按弹层
│   ├── arrangement-board/      # 手动整理板
│   ├── import-export/          # 导入 / 导出按钮
│   └── common/                 # Icons 等
├── hooks/                      # useKeyboardInput / useTimer / useScramble / useLongPress
├── lib/                        # cstimer-shim / persistence / cn
└── __tests__/core/             # 单元测试
```

## 脚本

```bash
npm install      # 安装依赖
npm run dev      # 开发服务器
npm run build    # 类型检查 + 生产构建
npm run test     # 单元测试 (vitest 一次性运行)
npm run lint     # eslint
```

## 核心算法笔记

### 消步 (simplifier)

把序列按「轴对 + 宽性」分成最长的可交换段：
- `{U, D}`、`{F, B}`、`{L, R}` 各为一个轴对；
- 宽与非宽不同段（即 `Uw` 不与 `U` 同段）。

段内所有动作可交换，按面分组求模 4 之和。若结果只是顺序变化而无真实合并，则保留用户原顺序；否则按规范顺序输出。

### 编译 (compiler)

```
final = simplify(
  (所有非括号节点，正序拼接)
  ++ (所有括号节点的逆，按出现顺序逆序拼接)
)
```

每个节点在解析前会按会话级 `Insertion` 库做字符串替换：
- 普通插入 `# = M` → 将 `#` 替换为 `M`，前后留空格；
- 宽插入 `# = w` / `# = w2` / `# = '` → 直接替换 `#`，让其变成同 token 的后缀。

### 影子 (shadow)

只翻转最后一个 token 的 modifier：`A ↔ A'`，`A2` 不变。新节点作为源节点的兄弟。

## 数据格式

导出文件示例（`fmc-YYYYMMDD-HHMMSS.json`）：

```json
{
  "version": 1,
  "exportedAt": 1700000000000,
  "session": { "id": "...", "scramble": { ... }, "tree": { ... }, ... }
}
```

`session` 字段保留可拓展性：未来字段如训练标签、统计等可平滑追加。
