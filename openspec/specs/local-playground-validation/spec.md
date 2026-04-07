# local-playground-validation Specification

## Purpose
定义仓库内本地 playgrounds 联调与验证基线，确保多个独立示例应用可以消费本地 `dist` 包产物，并通过统一入口执行真实的 Vite 开发、构建与预渲染验证流程。
## Requirements
### Requirement: 仓库必须提供连接本地 dist 产物的多个独立 playground 应用
系统 MUST 提供一个 `playgrounds/` 目录，并在其中放置多个拥有独立 Vite 配置和独立 `react-ssg.config.ts` 的示例应用，让它们消费仓库根目录构建出的本地包产物，而不是直接导入源码入口。

#### Scenario: playgrounds 中的每个 app 都以独立配置运行
- **WHEN** 开发者执行某个 playground app 专用的 Vite 命令
- **THEN** 系统必须使用目标 app 自身的 `vite.config.ts`
- **THEN** 仓库根 `vite.config.ts` 不得承担任何 playground app 的应用根配置职责

#### Scenario: playgrounds 中的 app 连接本地 dist 包入口
- **WHEN** 开发者在任一 playground app 中导入 `vite-plugin-react-ssg` 或 `vite-plugin-react-ssg/config`
- **THEN** 系统必须解析到仓库根目录下的本地 `dist` 产物
- **THEN** 系统不得依赖直接导入仓库源码入口来完成该联调链路

### Requirement: 仓库必须提供参数化的 playgrounds 运行入口
系统 MUST 为开发者提供参数化脚本，使其能够在本地包构建完成后针对指定 app 执行 `playgrounds` 的开发、构建和预览流程，并在参数缺失时通过交互式终端补齐缺失项。

#### Scenario: 开发者针对指定 app 执行 playground 构建脚本
- **WHEN** 开发者先完成本地包构建，再执行带有 app 名称参数的 playground 构建脚本
- **THEN** 系统必须对目标 playground app 执行真实的 `vite build`
- **THEN** 插件必须从目标 app 的 `react-ssg.config.ts` 加载预渲染配置
- **THEN** 构建输出中必须包含预渲染生成的静态 HTML

#### Scenario: 未传任何位置参数时进入交互式补全
- **WHEN** 开发者执行 `pnpm play` 且未传入任何位置参数
- **THEN** 系统必须通过交互式终端提示开发者选择 `action`
- **THEN** 系统必须继续提示开发者选择目标 playground app
- **THEN** 在选择完成后系统必须执行对应的 playground 命令

#### Scenario: 只传入单个合法 action 时补全 app
- **WHEN** 开发者执行 `pnpm play <action>` 且该 `action` 是合法值
- **THEN** 系统不得要求开发者重新选择 `action`
- **THEN** 系统必须通过交互式终端补齐缺失的 playground app
- **THEN** 在选择完成后系统必须执行对应的 playground 命令

#### Scenario: 只传入单个合法 app 时补全 action
- **WHEN** 开发者执行 `pnpm play <app-name>` 且该 app 名称在 `playgrounds/` 中存在
- **THEN** 系统不得要求开发者重新选择 app
- **THEN** 系统必须通过交互式终端补齐缺失的 `action`
- **THEN** 在选择完成后系统必须执行对应的 playground 命令

#### Scenario: 已传入完整合法参数时保持直通执行
- **WHEN** 开发者执行 `pnpm play <action> <app-name> [-- <vite-args>]` 且位置参数都合法
- **THEN** 系统必须直接执行对应的 playground 命令
- **THEN** 系统不得弹出交互式终端提示

#### Scenario: 参数化入口在任意阶段仅输出英文用户文案
- **WHEN** 开发者在执行参数化 playground 入口的任意阶段触发提示、报错、取消或其它面向用户的终端输出
- **THEN** 系统必须仅输出英文文本
- **THEN** 系统不得输出中文或中英混合的用户可见终端文案

#### Scenario: 自动化测试覆盖多个 playground app 的联调链路
- **WHEN** 仓库执行与 playgrounds 联调相关的 Vitest 测试
- **THEN** 测试必须覆盖“先生成本地 `dist`，再构建至少三个不同 playground app”的完整链路
- **THEN** 测试必须分别验证这些 app 的预渲染 HTML 产物存在

#### Scenario: routes-hash app 仅生成默认首屏 HTML
- **WHEN** 开发者构建 `routes-hash` playground app
- **THEN** 插件必须从该 app 的 `react-ssg.config.ts` 读取 `history: 'hash'` 路由模式配置
- **THEN** 构建输出必须包含根路径对应的 `dist/index.html`
- **THEN** 构建输出不得包含其它 hash 子路径对应的独立 HTML 文件

### Requirement: 仓库必须提供覆盖 loader 预渲染链路的 routes playground
系统 MUST 让至少一个本地 routes playground 真实演示“构建期执行 React Router loader 并将结果写入静态 HTML”的完整链路，以便开发者验证发布包对 loader 预渲染的支持。

#### Scenario: loader-enabled routes playground 连接本地 dist 产物并完成真实构建
- **WHEN** 开发者先构建仓库根目录的本地 `dist` 包，再构建启用了 loader 的 routes playground
- **THEN** playground 必须通过自身的 `react-ssg.config.ts` 触发路由模式预渲染
- **THEN** 最终产物 HTML 必须包含由 `loader` 提供的数据渲染结果

#### Scenario: loader-enabled routes playground 产物暴露 hydration data
- **WHEN** 开发者构建启用了 loader 的 routes playground
- **THEN** 根路径或其它被预渲染的目标路径 HTML 必须包含 `window.__staticRouterHydrationData`
- **THEN** 该 playground 的客户端入口必须能够按文档使用这些 hydration data 初始化 browser router
