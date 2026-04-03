## 1. OpenSpec 与测试基线

- [x] 1.1 将 proposal、design、specs 更新为 `playgrounds/` 多应用方案
- [x] 1.2 先调整 Vitest 用例，覆盖“先构建本地 dist，再分别构建多个 playground app 并生成预渲染 HTML”的失败场景

## 2. Playgrounds 多应用迁移

- [x] 2.1 将现有 `playground` 迁移为 `playgrounds/routes-browser`，保留当前路由模式示例
- [x] 2.2 新增 `playgrounds/app-basic`，承载当前单页模式示例
- [x] 2.3 提取 `playgrounds/_shared/` 共享基建，复用 Vite 配置工厂、本地包 alias 和公共样式
- [x] 2.4 为 `playgrounds/` 补齐 TypeScript 工程配置，确保编辑器能稳定识别共享文件和各 app 文件

## 3. 脚本与验证

- [x] 3.1 将根 `package.json` 的 playground 命令收敛为参数化入口，避免脚本平铺
- [x] 3.2 让新的 Vitest 用例通过，并补齐必要的实现修正
- [x] 3.3 运行相关测试、类型检查与至少两个 playground app 的真实构建验证

## 4. Hash 场景扩展

- [x] 4.1 更新 proposal、design、specs 与测试，纳入 `routes-hash` playground app 的预期行为
- [x] 4.2 新增 `playgrounds/routes-hash`，使用 React Router `createHashRouter` 演示 `history: 'hash'` 场景
- [x] 4.3 运行类型检查、测试与 `routes-hash` 真实构建验证，确认只生成默认首屏 HTML

## 5. 命令入口收敛

- [x] 5.1 移除独立 `playground` script，将参数化入口统一收敛到 `play`
- [x] 5.2 将参数化入口脚本迁移为 `tsx + .ts` 实现，并纳入类型检查
