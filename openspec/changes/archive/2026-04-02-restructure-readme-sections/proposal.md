## Why

当前 `README.md` 与 `README.zh-CN.md` 虽然已经覆盖安装、示例、配置项与限制，但章节层次偏平，且 Vite 插件接入示例放在文档开头，与“快速开始”的阅读路径不一致；同时安装方式不够通用，API 配置项也没有明确挂到 `defineReactSsgConfig(...)` 上。

本次变更希望统一中英文 README 的信息架构，让首次接入路径更清晰，并把用户最先需要的安装与使用内容集中到“快速开始 / Getting started”下，同时保持中文文档使用中文标题。

## What Changes

- 重新组织中英文 README 的章节结构，使英文 README 使用英文标题，中文 README 使用对应的中文标题。
- 将安装说明移动到“快速开始 / Getting started”下，并补充 `npm` 安装方式。
- 将 Vite 插件接入示例与 `react-ssg.config.ts` 示例移动到“使用 / Usage”。
- 将当前 `Options` 内容重命名并整理到 `API Reference / API 参考`，并明确这些配置项属于 `defineReactSsgConfig(...)`。
- 将输出行为与回退行为合并整理到 `Notes / 注意事项`。
- 为 `Development / 开发` 中的每条命令补充用途说明，帮助读者快速理解本地开发流程。

## Capabilities

### New Capabilities

- `readme-information-architecture`: 规范项目 README 的章节结构与新手接入路径，保证中英文文档层次一致且各自使用对应语言标题。

### Modified Capabilities

- 无

## Impact

- 影响文档：`README.md`、`README.zh-CN.md`
- 影响 OpenSpec：新增 `readme-information-architecture` 能力说明
- 不改变插件运行时行为、API 语义和测试基线
