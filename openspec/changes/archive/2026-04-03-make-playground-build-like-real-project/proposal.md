## Why

当前仓库虽然已经有一个可独立构建的 `playground`，但它仍然只能承载单一示例应用，导致不同接入场景只能通过模式切换或条件分支共存，示例边界不够清晰，脚本入口也开始膨胀。这使得仓库难以继续扩展更多真实使用场景，也不利于把“单页模式”和“路由模式”等示例当作彼此独立的小型用户项目来验证。

## What Changes

- 将单一 `playground` 升级为 `playgrounds/` 目录，并在其中放置多个独立的小型示例应用。
- 先将现有能力拆分为至少三个独立场景：单页模式示例应用、`browser` 路由模式示例应用与 `hash` 路由模式示例应用。
- 让每个示例应用都拥有自己的 `vite.config.ts`、`react-ssg.config.ts` 和 `src/`，并显式连接仓库根目录下的本地 `dist` 产物。
- 提取 `playgrounds/_shared/` 共享基建，复用本地包 alias、依赖去重和公共样式，避免复制粘贴。
- 将根 `package.json` 中的 playground 命令收敛为一个参数化入口，避免随场景数量增长而继续膨胀脚本数量。
- 新增围绕 `playgrounds/` 多应用结构的 Vitest 回归验证，确保这些核心示例应用都可以独立完成真实 Vite 构建与预渲染。

## Capabilities

### New Capabilities
- `local-playground-validation`: 提供一个在仓库内通过多个独立示例应用连接本地 `dist` 包产物并执行真实 Vite 构建的 playgrounds 验证能力。

### Modified Capabilities
- 无

## Impact

- 影响 `playgrounds/` 目录结构、共享基建与各示例应用的 `vite.config.ts` / `react-ssg.config.ts` 组织方式。
- 影响 `package.json` 与 `scripts/` 中的 playground 入口设计。
- 影响测试结构，需要新增对多个本地示例应用接入与构建输出的 Vitest 集成验证。
- 影响 TypeScript 工程组织，需要让 `playgrounds/` 下的文件被编辑器稳定识别。
