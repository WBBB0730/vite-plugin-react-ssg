## Context

当前实现中的 React 使用点集中在服务端预渲染链路与配置类型定义，未使用 React 19 独有 API。包层面的 React 19 peer 限制因此属于元数据过度收窄，而不是实现能力的真实边界。

另一个约束来自 `react-router`：仓库当前 peer 范围同时覆盖 `^6.4.0` 与 `^7.0.0`。其中 v6 可配合更早的 React 版本运行，而 v7 会自行声明更高的 React / React DOM 下限。因此本次设计需要放宽本包的 React peer，同时避免把 React Router 自身的版本约束错误地复制到本包声明里。

## Goals / Non-Goals

**Goals:**

- 让包的 React / React DOM peer 声明与当前实现真实依赖保持一致。
- 保持 `react-router` peer 范围不变，使不同 Router 版本继续通过自身 peer 规则约束最终可安装组合。
- 用 Vitest 固定这条发布元数据约束，避免后续回归。

**Non-Goals:**

- 不修改预渲染实现或新增任何 React 16/17 的专门兼容分支。
- 不调整开发依赖中的 React 类型包版本。
- 不扩展 React Router 的支持边界，仍只承诺现有的 v6.4+ data router 与 v7 范围。

## Decisions

### 1. 直接放宽本包的 React 与 React DOM peer 下限到 `>=16.8`

决策：将 `package.json` 中的 `react` 与 `react-dom` peerDependencies 改为 `>=16.8`。

原因：

- `16.8` 是 Hooks 与现代函数组件生态普遍成立的起点，也覆盖了当前实现实际使用的基础 API。
- 比 `^18 || ^19` 更贴近用户反馈中的“旧版本也应该兼容”目标。
- 即使用户选择 `react-router@7`，其自身 peer 也会继续要求 `react >=18` / `react-dom >=18`，不会因为本包放宽而丢失保护。

备选方案：

- 使用 `^18.0.0 || ^19.0.0`：更保守，但仍会无端排除可与 `react-router@6` 配合工作的旧版本 React 项目。

### 2. 用独立 Vitest 用例校验包元数据，而不是只改 `package.json`

决策：新增一个读取仓库根 `package.json` 的单元测试，断言 React / React DOM peer 范围以及 React Router peer 范围。

原因：

- 这是一次纯元数据修正，最容易在后续发版准备中被无意改回去。
- 通过测试固定约束，能满足仓库要求的 TDD 流程。
- 与现有仓库中针对入口导出、发布脚本的元数据测试风格一致。

备选方案：

- 只修改 `package.json`：实现最少，但缺少可回归验证的保护。

## Risks / Trade-offs

- [peer 范围放宽后被误解为完整承诺 React 16/17 + React Router 7 组合可用] → 保持 `react-router` peer 范围不变，让其自身依赖树继续表达更高下限。
- [未来实现引入更高版本 React API，但未同步更新 peer] → 用新增测试固定当前声明，并在后续引入新 API 时同步调整 spec 与测试。
