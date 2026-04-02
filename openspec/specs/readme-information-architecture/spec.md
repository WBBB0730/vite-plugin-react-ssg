## Purpose

定义项目 README 的信息架构约束，确保中英文文档都能以清晰、面向首次接入的方式说明功能概览、安装使用路径、API 归属、注意事项、限制和开发命令。

## Requirements

### Requirement: 项目 README 必须提供一致且面向首次接入的章节结构
系统 MUST 让 `README.md` 与 `README.zh-CN.md` 使用一致的信息架构，以便读者按“功能概览、接入、API、注意事项、限制、开发”顺序理解插件。

#### Scenario: 中英文 README 使用一致的一级标题结构
- **WHEN** 读者查看英文或中文 README
- **THEN** 英文 README 必须包含 `Features`、`Getting started`、`API Reference`、`Notes`、`Limitations`、`Development` 对应的章节层级
- **THEN** 中文 README 必须包含“特性”“快速开始”“API 参考”“注意事项”“限制”“开发”对应的章节层级
- **THEN** “快速开始 / Getting started” 下必须包含“安装 / Installation”和“使用 / Usage”两个子章节

#### Scenario: 安装段落覆盖常见包管理器
- **WHEN** 读者查看安装说明
- **THEN** 文档必须至少提供 `pnpm` 与 `npm` 两种安装命令

#### Scenario: 快速开始集中呈现最小接入步骤
- **WHEN** 读者阅读“使用 / Usage”
- **THEN** 文档必须先说明如何在 Vite 配置中注册 `vite-plugin-react-ssg`
- **THEN** 文档必须继续说明如何创建 `react-ssg.config.ts` 并展示路由模式、单页模式和函数形式示例

#### Scenario: API 与补充说明按职责分区
- **WHEN** 读者查阅配置项与运行语义
- **THEN** 配置项说明必须归入 `API Reference / API 参考`
- **THEN** 文档必须明确这些配置项属于 `defineReactSsgConfig(...)`
- **THEN** 输出行为与失败回退语义必须归入 `Notes / 注意事项`

#### Scenario: 开发命令附带用途说明
- **WHEN** 读者查看 `Development / 开发` 段落
- **THEN** 文档必须保留现有开发命令
- **THEN** 文档必须为每条命令说明其作用
