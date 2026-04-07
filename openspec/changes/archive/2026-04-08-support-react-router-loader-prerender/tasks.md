## 1. 测试基线

- [x] 1.1 先盘点本次需要直接调用的 React Router 官方 API 与可能需要 vendoring 的内部 helper，确认能复用现成实现的地方不自行手写，并为 vendored 文件记录 upstream 来源
- [x] 1.2 先为路由模式补充失败测试，覆盖 matched loader 数据进入最终 HTML、`window.__staticRouterHydrationData` 注入，以及短路 `Response` 触发按目标跳过
- [x] 1.3 为配置加载补充测试，覆盖 route mode 新增 `origin` 配置的合法值、默认值与非法值回退语义
- [x] 1.4 扩展 playground 相关测试，验证 loader-enabled routes app 连接本地 `dist` 包后仍能完成真实预渲染构建

## 2. 核心实现

- [x] 2.1 扩展 route mode 配置类型与校验逻辑，加入可选 `origin` 并在加载阶段完成规范化
- [x] 2.2 改造路由模式预渲染主链路，改用 `createStaticHandler`、`createStaticRouter` 与 `StaticRouterProvider` 执行官方 data-router SSR 流程
- [x] 2.3 为每个目标路径构造稳定的构建期 `Request`，并将 matched `loader` 结果用于最终 HTML 渲染
- [x] 2.4 将 hydration data 从 React 根节点分离出来，改为独立注入 `window.__staticRouterHydrationData`
- [x] 2.5 明确短路 `Response`、错误边界和现有 warning / summary 日志之间的回退语义，保持按目标粒度容错

## 3. 文档与示例

- [x] 3.1 更新 `README.md` 与 `README.zh-CN.md`，补充 loader 路由模式、`origin` 配置以及 `hydrateRoot(...) + hydrationData` 的客户端接入说明
- [x] 3.2 更新 `playgrounds/routes-browser`，演示构建期执行 `loader`、客户端复用 hydration data，以及最终 HTML 中的数据结果

## 4. 验证

- [x] 4.1 让新增与受影响的 Vitest 用例通过
- [x] 4.2 运行相关类型检查与至少一个真实 loader playground 构建，确认输出 HTML、hydration data 与 README 示例一致
