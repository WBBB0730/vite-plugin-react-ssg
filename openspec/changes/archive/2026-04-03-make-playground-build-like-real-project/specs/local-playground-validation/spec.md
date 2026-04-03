## ADDED Requirements

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
系统 MUST 为开发者提供参数化脚本，使其能够在本地包构建完成后针对指定 app 执行 `playgrounds` 的开发、构建和预览流程，并验证预渲染结果。

#### Scenario: 开发者针对指定 app 执行 playground 构建脚本
- **WHEN** 开发者先完成本地包构建，再执行带有 app 名称参数的 playground 构建脚本
- **THEN** 系统必须对目标 playground app 执行真实的 `vite build`
- **THEN** 插件必须从目标 app 的 `react-ssg.config.ts` 加载预渲染配置
- **THEN** 构建输出中必须包含预渲染生成的静态 HTML

#### Scenario: 自动化测试覆盖多个 playground app 的联调链路
- **WHEN** 仓库执行与 playgrounds 联调相关的 Vitest 测试
- **THEN** 测试必须覆盖“先生成本地 `dist`，再构建至少三个不同 playground app”的完整链路
- **THEN** 测试必须分别验证这些 app 的预渲染 HTML 产物存在

#### Scenario: routes-hash app 仅生成默认首屏 HTML
- **WHEN** 开发者构建 `routes-hash` playground app
- **THEN** 插件必须从该 app 的 `react-ssg.config.ts` 读取 `history: 'hash'` 路由模式配置
- **THEN** 构建输出必须包含根路径对应的 `dist/index.html`
- **THEN** 构建输出不得包含其它 hash 子路径对应的独立 HTML 文件
