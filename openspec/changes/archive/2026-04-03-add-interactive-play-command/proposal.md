## Why

当前 `pnpm play` 只有在同时传入完整的 `<action> <app-name>` 参数时才能工作。随着 `playgrounds/` 场景增加，这种纯位置参数入口会让本地联调成本变高，也不利于开发者快速切换和试跑示例应用。

## What Changes

- 为 `pnpm play` 增加交互式补全能力：当未传参数或参数不完整时，通过终端交互补齐缺失的 `action` 和 `app-name`。
- 保留完整参数直通能力：当开发者已经传入合法且完整的参数时，继续直接执行目标 playground 命令，不弹出交互式提示。
- 支持在只传入单个合法 `action` 或单个合法 `app-name` 时，自动识别已提供的部分，并仅对缺失部分进入交互式选择。
- 明确终端面向用户的输出语言规则：无论是 `pnpm play` 入口还是插件本身的运行期提示、警告、摘要与其它用户可见终端文案，都必须统一使用英文。
- 为交互式 CLI 引入轻量第三方终端提示库，并补齐对应的 Vitest 回归测试。

## Capabilities

### New Capabilities

无

### Modified Capabilities

- `local-playground-validation`: 参数化 playground 运行入口需要在参数缺失时支持交互式补全，而不再只接受完整位置参数。
- `react-spa-prerender`: 插件运行期所有面向用户的终端输出需要统一使用英文，而不仅限于当前已列出的构建日志片段。

## Impact

- 影响 [`scripts/play.ts`](/Users/wbbb/Projects/vite-plugin-react-ssg/scripts/play.ts) 的参数解析、提示交互与命令执行流程。
- 影响插件主 spec 中对运行期日志与用户可见终端输出语言的约束表述。
- 影响 [`package.json`](/Users/wbbb/Projects/vite-plugin-react-ssg/package.json) 与 [`pnpm-lock.yaml`](/Users/wbbb/Projects/vite-plugin-react-ssg/pnpm-lock.yaml)，需要增加交互式终端依赖。
- 影响 `tests/`，需要新增围绕 CLI 参数解析与交互补全行为的 Vitest 测试。
