# 更新日志

本文件记录了该项目的所有重要变更。

## [0.1.0]

### 新增

- 新增基于 `@unhead/react` 的页面级 head 管理支持，包括在预渲染阶段合并标题、meta 标签和社交分享标签。
- 新增交互式 `pnpm play` 命令，便于在本地更高效地验证 playground。
- 新增 trusted publisher 发布工作流和发布准备脚本，用于自动化包发布流程。

### 变更

- 重新组织本地 playground 结构，使单页模式和路由模式的验证场景更加清晰。
- 扩展 README 示例和说明，补充 head 管理与本地验证相关内容。

### 修复

- 放宽 React peer dependency 范围，使包可以兼容更广的受支持 React 版本。

## [0.0.1]

### 新增

- `vite-plugin-react-ssg` 首个公开版本发布，提供面向传统 Vite React SPA 的构建期预渲染能力。
- 新增与 React Router data router flattening 行为对齐的路由路径发现能力。
- 新增可配置的预渲染日志级别，支持 `silent`、`normal` 和 `verbose` 模式。

### 变更

- 清理并调整已发布包的入口导出结构。
- 重构首个版本的 README 结构与使用说明。
