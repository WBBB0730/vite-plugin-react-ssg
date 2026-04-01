## ADDED Requirements

### Requirement: 包入口必须同时暴露插件工厂与配置辅助函数
系统 MUST 让使用者可以从包入口同时获取默认插件工厂和 `defineReactSsgConfig`，且不得因此破坏入口模块的薄封装约束。

#### Scenario: 从入口获取默认插件工厂
- **WHEN** 使用者从包入口加载默认导出
- **THEN** 系统必须返回可用于 Vite `plugins` 的插件工厂

#### Scenario: 从入口获取 defineReactSsgConfig
- **WHEN** 使用者从包入口按命名导入 `defineReactSsgConfig`
- **THEN** 系统必须暴露与 `./config` 子路径一致的同一辅助函数
- **THEN** 入口模块仍不得内联配置辅助函数实现
