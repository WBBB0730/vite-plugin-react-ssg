## 1. 规格与测试基线

- [x] 1.1 更新路由模式相关 spec、README 与类型说明，明确仅支持 React Router v6.4+ data router
- [x] 1.2 使用 Vitest 补齐 `route-paths` 的单元测试，覆盖可选段、无路径布局路由、绝对子路由、动态段与 `paths` 合并场景

## 2. 路径展平实现替换

- [x] 2.1 新增 vendored React Router `flattenRoutes` 及其最小依赖文件，并标注来源 commit
- [x] 2.2 重构 `src/route-paths.ts`，改为基于 vendored `flattenRoutes` 收集静态路径
- [x] 2.3 调整现有集成测试夹具，确保路由模式描述统一为 v6.4+ data router

## 3. 验证与收尾

- [x] 3.1 运行并修复 `vitest`，确认新旧行为差异都被测试覆盖
- [x] 3.2 运行并修复 `tsc --noEmit` 与构建验证，确保 vendored 代码接入后仍可发布
