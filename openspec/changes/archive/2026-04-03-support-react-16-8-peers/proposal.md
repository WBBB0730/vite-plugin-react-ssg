## Why

当前库的运行时代码只依赖 `createElement`、`renderToString` 等长期稳定的 React 基础 API，但 `package.json` 却把 `react` 与 `react-dom` 的 peer 版本直接限制在 React 19。这个声明会错误拦住仍可正常工作的旧版本 React 项目，导致对外兼容承诺比真实实现更窄。

## What Changes

- 放宽包的 `react` 与 `react-dom` peerDependencies，下限调整为 `>=16.8`。
- 保持 `react-router` 的 peer 范围不变，继续由用户选择的 React Router 版本自行约束更高的 React 下限。
- 新增一个 Vitest 回归测试，固定包元数据中的 React peer 兼容范围，避免后续再次被无意收紧。

## Capabilities

### New Capabilities

### Modified Capabilities
- `react-spa-prerender`: 补充包发布元数据的 React peer 兼容范围要求，避免对真实可运行范围做不必要的收窄。

## Impact

- 影响 `package.json` 中的 `peerDependencies` 声明。
- 影响 `tests/`，需要新增针对发布包元数据的回归测试。
- 不影响现有预渲染运行时实现、路由能力边界和构建输出。
