## 1. 规格与测试基线

- [x] 1.1 为页面级 head 管理与包元数据变更补充 OpenSpec delta 与 Vitest 用例草案
- [x] 1.2 先新增失败测试，覆盖模板 head 参与 `transformHtmlTemplate()`、页面级 `useHead()` / `useSeoMeta()` 输出，以及 React peer 下限调整

## 2. Unhead 集成

- [x] 2.1 调整 `package.json`，将 `@unhead/react` 声明为 peerDependency，并把 `react` / `react-dom` 下限提升到 `>=18.3.1`
- [x] 2.2 改造预渲染主链路，在单页模式与路由模式下都创建 Unhead 实例并用 `UnheadProvider` 包裹 SSR 渲染
- [x] 2.3 在应用 HTML 注入模板后调用 `transformHtmlTemplate()`，并直接使用其返回值作为最终写盘内容

## 3. 示例与文档

- [x] 3.1 更新 README 与中文 README，说明 `@unhead/react` 的安装方式、客户端 `UnheadProvider` 接入方式，以及页面内官方 Hook 用法
- [x] 3.2 更新至少一个 playground / fixture，演示 `useHead()` / `useSeoMeta()` 与模板 head 共存时的预渲染结果

## 4. 验证

- [x] 4.1 让新增与受影响的 Vitest 用例通过
- [x] 4.2 运行相关类型检查与至少一个真实 playground 构建，确认最终 HTML 以 `transformHtmlTemplate()` 输出为准
