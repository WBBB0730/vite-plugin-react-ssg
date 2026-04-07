## ADDED Requirements

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
