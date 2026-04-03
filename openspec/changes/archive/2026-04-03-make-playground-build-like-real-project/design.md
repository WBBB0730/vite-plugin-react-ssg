## Context

当前仓库已经把 `playground` 修正为一个能独立消费本地 `dist` 产物的示例应用，但它仍然面临两个新问题：

- 单页模式与路由模式通过环境变量共存于一个应用中，示例边界不自然，也不利于继续扩展更多真实场景。
- 根 `package.json` 中为不同模式显式铺开了多条脚本，场景一多就会迅速膨胀。

本次变更的目标不是再增强插件终端能力，而是继续优化仓库内部的验证基建，把单一示例应用升级为多个独立小应用组成的 `playgrounds/`，让每个场景都更像一个真实用户项目。

## Goals / Non-Goals

**Goals:**

- 让仓库拥有 `playgrounds/` 目录，并在其中放置多个彼此独立的示例应用。
- 先拆出 `app-basic`、`routes-browser` 与 `routes-hash` 三个场景，分别承载当前单页模式、`browser` 路由模式与 `hash` 路由模式示例。
- 让每个示例应用继续通过 Vite `resolve.alias` 连接仓库根目录的本地 `dist/index.mjs` 与 `dist/config.mjs`。
- 为开发者提供一个参数化 playground 入口，而不是随场景数量增长的平铺脚本。
- 使用 Vitest 验证多个示例应用在消费本地 `dist` 时都能够完成真实的 `vite build` 与预渲染输出。

**Non-Goals:**

- 不修改插件已有的预渲染规则、配置语义、日志语义或输出路径规则。
- 不引入新的包管理工作区结构，也不把 `playgrounds` 下的示例应用发布为独立 npm 包。
- 不新增 README 或发布流程改造，除非实现过程中出现阻塞本次目标的问题。

## Decisions

### 1. 用 `playgrounds/<app>/` 表达多个独立示例应用

决策：将现有单一 `playground` 迁移为 `playgrounds/routes-browser`，并新增 `playgrounds/app-basic` 与 `playgrounds/routes-hash`；每个示例应用各自拥有独立的 `index.html`、`vite.config.ts`、`react-ssg.config.ts` 与 `src/`。

原因：

- Vite 官方天然以单个 app root 作为构建与开发单位，把每个场景做成独立 app 更符合框架心智模型。[Vite 官方文档](https://vite.dev/config/shared-options.html)
- 拆成多个小应用后，每个场景都能独立拥有入口、配置和输出，不再依赖环境变量切换。
- 后续若增加 `hash`、更复杂动态路径等场景，只需要新增目录，不需要继续把逻辑塞回同一个示例应用。

备选方案：

- 继续维持单一 `playground` 并靠 `mode` / 环境变量切换场景：短期可行，但场景越多，应用内部条件分支和脚本数量都会继续增长。

### 2. 通过共享工厂复用本地包 alias 与 Vite 基建

决策：在 `playgrounds/_shared/` 中提供一个 `create-playground-vite-config.ts` 工厂，由各示例应用的 `vite.config.ts` 调用；该工厂统一设置 app root、本地 `dist` alias、`resolve.dedupe` 与构建输出目录。

原因：

- Vite 官方要求文件系统路径 alias 使用绝对路径，统一工厂可以避免每个 app 重复处理路径计算。[Vite Shared Options](https://vite.dev/config/shared-options.html)
- Vite 官方建议在 monorepo 或 linked package 场景下通过 `resolve.dedupe` 强制同一依赖解析到项目根同一份副本，从而避免重复 React 实例问题。[Vite Shared Options](https://vite.dev/config/shared-options.html)
- 共享工厂可以把“本地已构建包接入”的约束放在一处维护，降低多 app 结构下的重复和漂移。

备选方案：

- 每个 app 单独复制一份 `vite.config.ts`：实现简单，但共享配置一旦调整就容易漏改。

### 3. 用参数化脚本替代脚本平铺

决策：新增一个脚本入口，例如 `scripts/playground.mjs`，统一解析 `dev/build/preview <app-name>` 参数；根 `package.json` 只保留少量薄入口。

原因：

- 用户已经明确感受到脚本数量膨胀不够优雅，参数化脚本更适合多场景入口。
- `pnpm playground build routes-browser` 这类形式可以自然表达“动作 + 场景”，不需要为每个组合都声明一条脚本。
- 后续新增 app 时通常无需继续修改 `package.json` 的脚本矩阵。

备选方案：

- 继续在 `package.json` 中新增 `playground:*:*` 组合脚本：易懂但扩展性差。

### 4. 用 Vitest 驱动本地包联调回归验证

决策：新增围绕 `playgrounds/routes-browser`、`playgrounds/app-basic` 与 `playgrounds/routes-hash` 的集成测试；测试中先执行根目录 `pnpm build` 生成 `dist`，再调用 Vite 对目标 app 的 `vite.config.ts` 执行构建，并断言预渲染 HTML 输出存在。

原因：

- 这样可以覆盖“本地包已构建产物 + 多个独立示例应用 + `vite build`”这条新的目标链路，并显式验证 `hash` 模式只产出首屏 HTML 的语义。
- 继续沿用现有仓库以 Vitest 为核心的 TDD 实践，不新增额外测试框架。

备选方案：

- 只保留一个 app 的集成测试，其它场景仅做手动验证：成本更低，但无法保证多 app 结构不会逐步漂移。

## Risks / Trade-offs

- [playgrounds 依赖 `dist`，未先执行库构建时会构建失败] → 通过参数化脚本输出明确提示，要求先执行 `pnpm build` 或 `pnpm dev`。
- [多 app 结构容易引入配置重复和路径计算偏差] → 用 `_shared` 工厂统一 alias、dedupe 和输出目录策略。
- [场景拆分后 TypeScript 工程边界再次变复杂] → 为 `playgrounds/` 提供统一的 tsconfig，让编辑器稳定识别共享文件和各 app 文件。
- [集成测试先构建本地包会增加测试耗时] → 仅为核心正向场景保留高价值集成测试，其它异常场景继续留在 fixture 测试中。
