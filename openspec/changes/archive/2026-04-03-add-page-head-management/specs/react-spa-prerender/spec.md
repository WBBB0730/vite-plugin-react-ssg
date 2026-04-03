## MODIFIED Requirements

### Requirement: 包元数据不得无谓收窄 React peer 兼容范围
系统 MUST 让发布包的 `react` 与 `react-dom` peerDependencies 至少覆盖 `>=18.3.1`，因为页面级 head 管理能力将直接依赖 `@unhead/react` 当前最低支持的 React 版本。

#### Scenario: 发布包声明 React 18.3.1+ 作为基础兼容下限
- **WHEN** 用户读取发布包中的 `peerDependencies`
- **THEN** 系统必须将 `react` 声明为 `>=18.3.1`
- **THEN** 系统必须将 `react-dom` 声明为 `>=18.3.1`

#### Scenario: @unhead/react 的最低 React 要求成为本包兼容下限
- **WHEN** 用户按页面级 head 管理能力接入本包，并同时安装 `@unhead/react`
- **THEN** 系统必须让本包的 `react` 与 `react-dom` peer 下限与 `@unhead/react` 当前最低支持版本保持一致
- **THEN** 系统不得继续声明 `>=16.8` 作为对外兼容下限

#### Scenario: React Router 继续通过自身 peer 约束更高版本组合
- **WHEN** 用户读取发布包中的 `react-router` peerDependencies
- **THEN** 系统必须继续保留现有 `react-router` 版本范围
- **THEN** 系统不得为了引入页面级 head 管理能力而额外修改 `react-router` 的 peer 范围
