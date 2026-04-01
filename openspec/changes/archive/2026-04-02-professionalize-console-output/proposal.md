## Why

当前插件的控制台输出分散在多个模块中，且文案仍然包含中文，难以在英文项目或 CI 日志中快速识别问题。与此同时，现有输出只有零散警告，缺少清晰的阶段感和总结信息，也没有办法根据场景控制输出粒度，整体专业度不够。

本次变更希望在不改变预渲染功能语义的前提下，统一所有控制台输出为英文，并参考 `next build` 的阶段化风格，让构建日志更清晰、更稳定、更适合排查问题，同时通过 `logLevel` 让用户控制输出粒度。

## What Changes

- 将插件相关的控制台输出统一为英文。
- 为预渲染流程引入统一的日志输出层，集中管理标题、阶段提示、警告提示、完成摘要和详细结果列表。
- 调整构建期输出格式，使其具备更明确的阶段感、留白和单行完成摘要。
- 新增 `logLevel` 配置项，支持根据场景切换 `silent`、`normal` 与 `verbose` 三档输出粒度。
- 增加或调整测试，验证新的英文日志和输出格式。

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- `react-spa-prerender`: 补充构建期日志必须使用英文、支持 `logLevel` 控制输出粒度，并以统一格式输出阶段信息、完成摘要与可选的详细结果列表。

## Impact

- 影响代码：`src/config.ts`、`src/load-config.ts`、`src/react-ssg-plugin.ts`、`src/prerender.tsx`，以及统一日志输出模块。
- 影响测试：`tests/react-ssg.test.ts` 需要覆盖 `silent` / `normal` / `verbose` 三档行为。
- 不影响路径发现策略和预渲染产物语义。
