## ADDED Requirements

### Requirement: README 必须说明 loader 预渲染与客户端 hydrationData 接入
系统 MUST 在现有 README 章节结构下说明路由模式的 loader 预渲染行为，以及客户端如何复用预渲染阶段生成的 hydration data。

#### Scenario: 使用章节说明 loader 路由模式接入
- **WHEN** 读者阅读 README 的 “Usage / 使用” 段落
- **THEN** 文档必须说明路由模式会在构建期执行 matched `loader`
- **THEN** 文档必须提供至少一个包含 `loader` 的路由模式示例或等价说明

#### Scenario: API 与注意事项章节说明 origin 与 hydrationData
- **WHEN** 读者查阅 README 的 “API Reference / API 参考” 与 “Notes / 注意事项” 段落
- **THEN** 文档必须说明路由模式新增的 `origin` 配置项及其用途
- **THEN** 文档必须说明客户端应通过 `hydrateRoot(...)` 与 `createBrowserRouter(..., { hydrationData: window.__staticRouterHydrationData })` 复用预渲染数据
