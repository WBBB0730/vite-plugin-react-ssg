## ADDED Requirements

### Requirement: 包元数据不得无谓收窄 React peer 兼容范围
系统 MUST 让发布包的 `react` 与 `react-dom` peerDependencies 至少覆盖 `>=16.8`，除非运行时实现确实引入了更高版本 React 才提供的必需能力。

#### Scenario: 发布包声明 React 16.8+ 作为基础兼容下限
- **WHEN** 用户读取发布包中的 `peerDependencies`
- **THEN** 系统必须将 `react` 声明为 `>=16.8`
- **THEN** 系统必须将 `react-dom` 声明为 `>=16.8`

#### Scenario: React Router 继续通过自身 peer 约束更高版本组合
- **WHEN** 用户读取发布包中的 `react-router` peerDependencies
- **THEN** 系统必须继续保留现有 `react-router` 版本范围
- **THEN** 系统不得为了对齐某个 React Router 大版本而额外收紧本包的 `react` 或 `react-dom` peer 下限
