## Why

当前仓库已经具备基础构建、测试与发版脚本，但还没有一条可复用、可审计的自动发布链路。为了降低手工发布出错风险，并满足 npm Trusted Publisher 的供应链安全要求，需要补齐一个基于 Git 标签触发的官方推荐发布流程。

## What Changes

- 新增一条 GitHub Actions workflow，在推送版本标签时自动执行安装、单元测试、类型检查、构建与 npm 发布。
- 发布流程统一约定正式版本标签为 `v1.2.3`，预发布标签为 `v1.2.3-beta.1`。
- 发布前新增版本校验逻辑，确保 Git 标签中的版本号与 `package.json` 的 `version` 完全一致。
- 正式版本发布到 npm 默认 dist-tag，beta 版本发布到 npm `beta` dist-tag。
- 使用 GitHub Actions OIDC + npm Trusted Publisher 方式鉴权，不再依赖 `NPM_TOKEN`。
- 补充仓库元数据，使 provenance 与包来源信息能够正确关联到 GitHub 仓库。

## Capabilities

### New Capabilities
- `package-release-automation`: 定义基于 Git 标签触发的 npm 自动发布流程，包括版本校验、预发布分流与 Trusted Publisher 鉴权要求。

### Modified Capabilities

## Impact

- 影响 `.github/workflows/` 下的 CI/CD 配置。
- 影响 `package.json` 的仓库元数据与发布前校验入口。
- 影响 `tests/` 与 `scripts/`，需要新增可用 Vitest 回归验证的发布版本校验逻辑。
- 影响 npm 后台配置，需要手动将当前 GitHub 仓库与 workflow 文件登记为 Trusted Publisher。
