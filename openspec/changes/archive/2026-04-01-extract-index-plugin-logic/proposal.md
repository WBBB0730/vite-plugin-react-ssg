## Why

当前 `src/index.ts` 同时承担插件入口导出、构建配置缓存、告警输出以及 `closeBundle` 阶段的预渲染编排，入口文件职责过重，不利于后续维护和扩展。

本次变更希望在不改变现有对外行为的前提下，将插件运行时编排逻辑下沉到内部模块，让入口文件只保留公开导出职责。

## What Changes

- 将 `src/index.ts` 中的插件编排逻辑抽离到独立内部模块。
- 让 `src/index.ts` 仅保留默认导出，作为干净的公共入口。
- 保持现有配置加载、告警输出、SSR 跳过和预渲染行为不变。
- 增加或调整测试，确保本次重构不引入行为回归。

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- `react-spa-prerender`: 补充插件入口模块必须保持薄封装、并将构建期编排委托给内部模块的约束。

## Impact

- 影响代码：`src/index.ts` 及新增的内部插件模块。
- 影响测试：`tests/react-ssg.test.ts` 需要覆盖入口重构后的回归验证。
- 不影响对外 API、配置格式和预渲染输出结果。
