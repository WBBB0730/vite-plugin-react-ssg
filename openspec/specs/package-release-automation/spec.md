# package-release-automation Specification

## Purpose

定义项目基于 Git 标签触发的 npm 自动发布流程约束，包括版本识别、发布前质量门禁、beta dist-tag 分流以及 Trusted Publisher 鉴权要求。
## Requirements
### Requirement: 发布流程必须由版本标签自动触发
系统 MUST 在推送符合版本命名规则的 Git 标签时自动启动 npm 发布流程。

#### Scenario: 正式版本标签触发发布流程
- **WHEN** 仓库收到格式为 `v1.2.3` 的 Git 标签推送
- **THEN** 系统必须启动自动发布 workflow
- **THEN** 系统必须将该标签识别为正式版本发布

#### Scenario: beta 版本标签触发发布流程
- **WHEN** 仓库收到格式为 `v1.2.3-beta.1` 的 Git 标签推送
- **THEN** 系统必须启动自动发布 workflow
- **THEN** 系统必须将该标签识别为 beta 预发布

### Requirement: 发布前必须完成质量门禁与版本一致性校验
系统 MUST 在执行 `npm publish` 前完成依赖安装、单元测试、类型检查、构建以及标签版本一致性校验。

#### Scenario: 正常发布前通过所有校验
- **WHEN** workflow 由合法版本标签触发，且项目依赖安装、单元测试、类型检查、构建全部成功
- **THEN** 系统必须校验标签中的版本号与 `package.json` 的 `version` 完全一致
- **THEN** 仅当版本一致时，系统才可继续执行发布

#### Scenario: 标签版本与 package.json 不一致时中止发布
- **WHEN** workflow 由合法版本标签触发，但标签中的版本号与 `package.json` 的 `version` 不一致
- **THEN** 系统必须在执行 `npm publish` 前失败退出
- **THEN** 系统不得向 npm 发布任何包版本

### Requirement: 发布流程必须根据版本类型选择 npm dist-tag
系统 MUST 根据标签解析出的版本类型选择合适的 npm 发布参数。

#### Scenario: 正式版本发布到默认 dist-tag
- **WHEN** 当前版本标签为 `v1.2.3`
- **THEN** 系统必须执行不带额外预发布 dist-tag 的 npm 发布

#### Scenario: beta 版本发布到 beta dist-tag
- **WHEN** 当前版本标签为 `v1.2.3-beta.1`
- **THEN** 系统必须使用 npm `beta` dist-tag 发布该版本

### Requirement: 发布流程必须使用 Trusted Publisher 鉴权
系统 MUST 使用 GitHub Actions OIDC 与 npm Trusted Publisher 完成鉴权，不得依赖长期保存的 npm 发布令牌。

#### Scenario: workflow 具备 Trusted Publisher 所需最小权限
- **WHEN** 发布 workflow 在 GitHub Actions 中运行
- **THEN** 系统必须授予 `contents: read` 权限以拉取仓库代码
- **THEN** 系统必须授予 `id-token: write` 权限以请求 OIDC 身份令牌

#### Scenario: 发布步骤不依赖 NPM_TOKEN
- **WHEN** workflow 执行 npm 发布
- **THEN** 系统不得要求仓库配置 `NPM_TOKEN` 类型的长期密钥
- **THEN** 系统必须依赖 npm Trusted Publisher 对当前 workflow 进行身份校验
