## MODIFIED Requirements

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

#### Scenario: 任意阶段的用户可见终端文本都使用英文
- **WHEN** 开发者在执行 `pnpm play` 的任意阶段触发提示、报错、取消或其它面向用户的终端输出
- **THEN** 系统必须仅输出英文文本
- **THEN** 系统不得输出中文或中英混合的用户可见终端文案

#### Scenario: routes-hash app 仅生成默认首屏 HTML
- **WHEN** 开发者构建 `routes-hash` playground app
- **THEN** 插件必须从该 app 的 `react-ssg.config.ts` 读取 `history: 'hash'` 路由模式配置
- **THEN** 构建输出必须包含根路径对应的 `dist/index.html`
- **THEN** 构建输出不得包含其它 hash 子路径对应的独立 HTML 文件
