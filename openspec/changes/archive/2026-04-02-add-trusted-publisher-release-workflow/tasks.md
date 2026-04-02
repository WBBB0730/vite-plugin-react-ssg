## 1. OpenSpec 与测试基线

- [x] 1.1 为标签版本解析与发布参数选择补充 Vitest 用例
- [x] 1.2 为标签版本与 `package.json` 版本一致性校验补充 Vitest 用例

## 2. 发布脚本与包元数据

- [x] 2.1 实现可复用的发布校验脚本，并输出 workflow 所需的发布参数
- [x] 2.2 更新 `package.json`，补充仓库元数据与脚本入口

## 3. GitHub Actions 发布流程

- [x] 3.1 新增基于 `v*` 标签触发的 npm 发布 workflow
- [x] 3.2 在 workflow 中串联安装、单元测试、类型检查、构建与 Trusted Publisher 发布
- [x] 3.3 验证正式版与 beta 版发布参数符合预期
