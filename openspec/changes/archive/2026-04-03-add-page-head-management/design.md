## Context

当前预渲染实现只负责：

- 读取构建后的 `dist/index.html`
- 将 `renderToString()` 得到的应用 HTML 注入 `#app`
- 为每个目标路径写出对应的 `index.html`

这条链路没有任何页面级 head 收集能力，因此即使用户在组件内声明标题、描述或 Open Graph 标签，最终静态 HTML 也不会反映这些内容。与此同时，用户已经明确要求：

- 对外 API 直接使用 `@unhead/react` 官方 `useHead()` / `useSeoMeta()`
- 模板 head 与页面 head 的最终合并完全委托给 Unhead
- 不在插件内部再发明额外的 head 合并、覆盖或“族级”语义

另一个关键约束来自客户端运行时。根据 Unhead React 官方接入方式，客户端入口同样需要创建 `head` 实例并包裹 `UnheadProvider`。如果只在预渲染阶段临时包裹服务端 Provider，而不要求客户端入口同步接入，那么首屏静态 HTML 与客户端后续导航的 head 更新语义会分裂。

## Goals / Non-Goals

**Goals:**

- 让用户能够在 React 组件中直接使用 `@unhead/react` 官方 `useHead()` / `useSeoMeta()` 管理页面 head。
- 让预渲染阶段为每个目标页面创建 Unhead 实例，并把最终 HTML 输出完全交给 `transformHtmlTemplate()` 决定。
- 保留 `index.html` 作为模板输入来源，不单独重建或手动裁剪其原有 `<head>`。
- 让文档、示例与测试统一体现官方 Unhead Provider 接入方式。
- 调整 React / React DOM peer 下限，与 `@unhead/react` 当前最低支持版本保持一致。

**Non-Goals:**

- 不实现任何插件私有的 head Hook、SEO DSL 或模板 head 合并算法。
- 不增加用于控制模板标签保留/清理策略的专有配置项。
- 不改变现有静态路径发现、单页/路由模式切换、日志输出与失败回退语义。

## Decisions

### 1. 直接采用 `@unhead/react` 作为官方集成层

决策：将 `@unhead/react` 作为发布包的必需 peerDependency，对外只推荐官方 `UnheadProvider`、`useHead()` 与 `useSeoMeta()`。

原因：

- 这与用户希望“像 `@unhead/react` 一样使用官方 Hook”完全一致。
- 直接采用官方包可以避免插件维护另一套平行 API，也能复用 Unhead 既有的 SSR 与模板转换能力。
- 统一使用官方 Provider / Hook，能够让预渲染输出与客户端导航时的 head 更新保持一致。

备选方案：

- 将 `@unhead/react` 作为可选 peer 或普通 dependency：前者会让功能启用条件变得模糊，后者则可能引入与用户项目不同版本的双份 Unhead 实例。
- 在插件中封装自定义 Hook：会偏离用户明确提出的官方 API 诉求。

### 2. 预渲染阶段始终通过 `transformHtmlTemplate()` 产出最终 HTML

决策：对每个目标页面，插件在收集完应用 HTML 与 Unhead head 实例后，直接调用 `transformHtmlTemplate(head, html)`，并把返回值作为最终写盘内容。

原因：

- 这样模板 head 与页面 head 的保留、覆盖与去重语义全部由 Unhead 决定，边界清晰。
- 可以避免插件自己再实现模板解析、标签裁剪、级联覆盖等额外逻辑。
- 这与 Unhead React 官方 SSR 推荐流程保持一致，降低后续维护成本。

备选方案：

- 手动解析 `index.html` 并在调用前后增加自定义合并步骤：虽然可控性更高，但已经被用户明确排除。

### 3. 将客户端 `UnheadProvider` 接入视为功能契约的一部分

决策：在文档、示例与测试中明确要求用户在客户端入口创建 `head` 实例并包裹 `UnheadProvider`，而不是只在插件内部进行服务端临时包裹。

原因：

- 页面级 head 管理不仅影响首屏预渲染，还应影响客户端后续路由切换。
- 只做服务端接入会让用户误以为官方 Hook 已完全生效，但实际客户端导航无法获得同样的 head 更新能力。
- 通过示例与 README 明确这一步骤，可以让使用方式与 Unhead 官方文档保持一致。

备选方案：

- 插件只在服务端内部包裹 Provider，不约束客户端入口：实现看似更轻，但会造成能力不完整。

### 4. React / React DOM peer 下限直接对齐 `@unhead/react`

决策：将 `react` 与 `react-dom` peerDependencies 下限提升到 `>=18.3.1`。

原因：

- `@unhead/react` 当前 `peerDependencies.react` 的最低版本就是 `>=18.3.1`，新增能力已经真实依赖这条约束。
- 继续声明 `>=16.8` 会制造“包元数据看似兼容，但核心能力无法安装或运行”的错误预期。
- 同步提升 `react-dom` 下限可以保持 React / React DOM 的版本配对关系清晰一致。

备选方案：

- 保留 `>=16.8`：与新增依赖的真实要求不一致。
- 只提升 `react` 不提升 `react-dom`：会让对外兼容表述变得不对称。

## Risks / Trade-offs

- [引入 `@unhead/react` 会收紧 React 最低版本，构成 breaking change] → 在 proposal、spec、README 与发布说明中明确列出升级要求。
- [模板 head 与页面 head 的最终结果完全依赖 Unhead 默认行为，用户可能看到某些模板标签被保留] → 在文档中明确插件不额外处理模板 head 合并，所有结果以 `transformHtmlTemplate()` 输出为准。
- [用户只完成服务端接入而遗漏客户端 `UnheadProvider`] → 在示例、README 与测试中把客户端入口接入写成标准用法，降低漏配概率。
- [预渲染主链路引入新依赖后可能影响现有构建稳定性] → 通过 Vitest 回归测试覆盖单页模式、路由模式、模板 head 注入与依赖元数据校验。

## Migration Plan

1. 用户升级到包含该能力的版本后，先安装 `@unhead/react`。
2. 用户确认项目的 `react` 与 `react-dom` 已满足 `>=18.3.1`。
3. 用户在客户端入口创建 `head` 实例并使用 `UnheadProvider` 包裹应用。
4. 用户在页面或布局组件中逐步迁移到 `useHead()` / `useSeoMeta()`。
5. 如需回滚，可移除相关 Hook 与 Provider，并退回不包含该变更的包版本。

## Open Questions

- 无。当前方案已明确以 Unhead 官方行为作为最终合并边界，不再额外引入插件侧策略配置。
