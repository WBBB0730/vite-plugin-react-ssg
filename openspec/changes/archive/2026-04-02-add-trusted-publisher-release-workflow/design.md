## Context

当前仓库已经有 `build`、`test`、`typecheck` 和本地 `release` 脚本，但缺少一条面向 npm 正式发版的自动化链路。用户希望在推送 Git 标签后，由 GitHub Actions 自动完成安装、校验、构建和发布，并使用 npm Trusted Publisher 方式鉴权，以避免长期保存 `NPM_TOKEN`。

这个改动同时涉及 OpenSpec、测试、脚本、`package.json` 元数据和 GitHub Actions 配置，属于跨模块的发布基线建设。另一个约束是仓库要求遵循 TDD，因此 workflow 中最容易出错的标签识别与版本一致性检查不能只写在 YAML 内联 shell 里，而应抽成可用 Vitest 覆盖的独立脚本。

## Goals / Non-Goals

**Goals:**

- 基于 Git 标签触发 npm 自动发布，支持正式版本 `v1.2.3` 与 beta 版本 `v1.2.3-beta.1`。
- 在发布前稳定执行依赖安装、单元测试、类型检查与构建。
- 在真正发布前校验标签版本与 `package.json` 的 `version` 完全一致。
- 对 beta 版本自动落到 npm `beta` dist-tag，对正式版本保持默认 dist-tag。
- 使用 GitHub OIDC + npm Trusted Publisher 所需的最小权限配置。
- 让关键发布判定逻辑可以通过 Vitest 单测回归验证。

**Non-Goals:**

- 不负责自动创建 Git 标签、GitHub Release 或修改版本号。
- 不负责在 npm 后台自动注册 Trusted Publisher，该步骤仍需人工在 npm 控制台完成。
- 不引入 changesets、semantic-release 等新的版本管理系统。
- 不处理 alpha、rc 等除 `beta` 之外的其它预发布通道。

## Decisions

### 1. 使用单独的发布校验脚本，而不是把逻辑内联到 workflow

决策：新增一个 Node 脚本负责解析 Git ref、识别版本类型、校验 `package.json` 版本并输出发布参数，workflow 只负责串联执行。

原因：

- 能用 Vitest 对标签格式、beta 分流和版本不一致等场景做 TDD。
- 比把逻辑堆在 YAML 的 shell 片段里更容易维护，也更贴近仓库现有 TypeScript/测试风格。
- 失败信息可以保持清晰，便于在 Actions 日志中快速定位问题。

备选方案：

- 直接在 workflow 的 shell 步骤里用正则判断：实现快，但可测试性和可维护性都较差。

### 2. workflow 监听标签推送，而不是 GitHub Release 事件

决策：使用 `push.tags: ['v*']` 作为触发条件。

原因：

- 用户明确要求“根据标签自动发布”。
- 标签本身就是版本源，更适合在发布前直接做版本一致性校验。
- 不依赖额外创建 GitHub Release 的人工步骤。

备选方案：

- 监听 `release.published`：可行，但会把“先打标签”变成“先建 release”，与当前需求不一致。

### 3. 使用 Node 24 运行发布流程

决策：workflow 中使用 Node 24，并通过 `actions/setup-node` 配置 npm registry。

原因：

- npm Trusted Publisher 官方要求使用较新的 npm CLI；Node 24 自带的 npm 版本满足该前提。
- 仓库当前依赖和构建链路均基于现代 Node 环境，没有兼容旧版本 Node 的要求。

备选方案：

- 使用 Node 22：也可能满足最低要求，但 Node 24 更接近当前官方示例与长期维护窗口。

### 4. 正式版与 beta 版使用同一 workflow，通过脚本分流 dist-tag

决策：统一由一个 workflow 处理正式版与 beta 版；当版本包含 `-beta.` 时，发布命令附加 `--tag beta`，否则使用默认 tag。

原因：

- 两类流程的前置校验和构建步骤完全相同，没有必要拆成两个 workflow。
- 把差异收敛到脚本输出，可以减少 YAML 分支复杂度。

备选方案：

- 为 beta 单独建 workflow：职责分散，维护成本更高。

### 5. 补齐 `package.json.repository` 元数据

决策：在 `package.json` 中补上当前 GitHub 仓库地址。

原因：

- 有助于 npm provenance 和包页面正确关联源码仓库。
- 与发布工作流一同落地，能补齐包元数据基线。

备选方案：

- 仅新增 workflow，不补元数据：可以发布，但来源信息不完整。

## Risks / Trade-offs

- [npm 后台未正确登记 Trusted Publisher] → workflow 会在 `npm publish` 阶段失败；在文档与交付说明中明确这是上线前必做的人工配置。
- [标签格式合法但 `package.json` 版本未同步] → 通过独立脚本在发布前显式失败，避免发布错误版本。
- [未来增加 `alpha`、`rc` 等通道] → 现有脚本需要扩展规则；当前先把需求收敛到正式版和 beta。
- [GitHub Actions 依赖版本后续更新] → 采用主流官方 action 组合，并把业务逻辑放在仓库内脚本，降低 workflow 本身的变动面。
