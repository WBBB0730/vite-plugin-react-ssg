## Context

当前 [`scripts/play.ts`](/Users/wbbb/Projects/vite-plugin-react-ssg/scripts/play.ts) 是一个非常薄的参数转发脚本：它只接受 `<dev|build|preview> <app-name>` 两个位置参数，并把剩余参数原样转发给 `pnpm exec vite`。这满足了最初的参数化入口目标，但在 `playgrounds/` 数量增加后，本地联调入口仍然偏机械。

本次变更同时受到三个约束：

- 需要保持已有完整参数调用方式不变，避免破坏现有使用习惯。
- 需要遵循仓库的 TDD 约束，用 Vitest 先固化 CLI 行为再落实现。
- 需要为脚本引入一个适合 Node.js + TypeScript ESM 的轻量交互式终端库，而不是为了两个选择框接入过重的 CLI 框架。

## Goals / Non-Goals

**Goals:**

- 在 `pnpm play` 缺少全部或部分位置参数时，通过交互式终端补齐缺失项。
- 允许只传单个合法 `action` 或单个合法 `app-name`，并仅询问缺失项。
- 保持 `pnpm play <action> <app-name> [-- <vite-args>]` 的现有直通行为不变。
- 在用户取消交互时友好退出，而不是抛出未处理异常。
- 让参数解析与命令拼装逻辑可被 Vitest 单测覆盖。

**Non-Goals:**

- 不为非法参数做模糊纠错或自动猜测。
- 不改造 `playgrounds/` 目录结构、Vite 配置工厂或预渲染逻辑。
- 不为交互式入口增加搜索、分页或多选等更复杂的 CLI 交互能力。

## Decisions

### 1. 使用 `@clack/prompts` 作为交互式终端库

决策：引入 `@clack/prompts`，使用其 `select`、`isCancel` 与 `cancel` API 来完成缺失参数补全。

原因：

- Context7 文档显示它直接提供适合本场景的 `select` API 和取消处理能力，接入成本低。
- 依赖面比 `@inquirer/prompts` 更小，更适合当前仓库这种仅有一个轻量 CLI 脚本的场景。
- API 风格与 ESM/TypeScript 脚本兼容，便于在 `tsx` 运行环境中直接使用。

备选方案：

- `enquirer`：也足够轻量，但 API 更偏底层，本次场景不需要更强的自定义空间。
- `@inquirer/prompts`：生态成熟，但依赖数量明显更多，对当前需求偏重。

### 2. 先按位置参数与 `--` 分段解析，再决定是否进入交互式

决策：先把命令行参数拆成“位置参数”和“透传给 Vite 的额外参数”两段，再对位置参数做以下判定：

- 无位置参数：交互式选择 `action` 与 `app-name`
- 只有一个位置参数且能唯一识别为合法 `action`：只交互选择 `app-name`
- 只有一个位置参数且能唯一识别为合法 `app-name`：只交互选择 `action`
- 两个位置参数都合法：直接执行
- 其它情况：维持 usage / 错误提示

原因：

- 这样可以保留现有命令语义，同时避免 `--` 把“不完整参数”错误解析成 app 名称。
- “只补缺失项”比“全部重选”更贴近用户已经输入的意图。

备选方案：

- 只在完全无参数时进入交互式：不能覆盖“只传了 action”或“只传了 app”这类高频半完成输入。
- 只要参数不合法就一律进入交互式：会把本该显式暴露的问题静默吞掉，边界不清晰。

### 3. 将 CLI 逻辑拆成可测试的纯函数与薄运行时包装

决策：把脚本拆成“参数解析”“缺失参数补全”“Vite 命令拼装”三个可测试单元，运行时部分只负责读取文件系统、调用提示库和 `spawn` 子进程。

原因：

- 交互式脚本如果全部写在顶层流程里，Vitest 很难稳定验证。
- 纯函数拆分后，可以在不依赖真实 TTY 的情况下覆盖大部分核心行为。

备选方案：

- 继续维持单文件顶层 imperative 写法：实现快，但测试成本高，也不利于后续扩展更多入口规则。

## Risks / Trade-offs

- [新增交互式依赖会增加脚本维护面] → 选用依赖较轻、API 较稳定的 `@clack/prompts`，并把使用面限制在单个脚本中。
- [CLI 取消行为处理不当会导致堆栈输出] → 使用库提供的取消检测 API 统一退出路径。
- [未来若出现与 `dev/build/preview` 重名的 playground app，单参数解析会变得歧义] → 在实现里把这种情况视为显式错误，而不是自动猜测。

## Migration Plan

- 第一步：补齐 OpenSpec proposal、design、spec delta 与 tasks。
- 第二步：新增 Vitest 用例，先固化参数解析、交互补全和命令拼装行为。
- 第三步：引入 `@clack/prompts` 并重构 [`scripts/play.ts`](/Users/wbbb/Projects/vite-plugin-react-ssg/scripts/play.ts)。
- 第四步：运行相关测试与类型检查，确认脚本行为和仓库基线都通过。

## Open Questions

- 无
