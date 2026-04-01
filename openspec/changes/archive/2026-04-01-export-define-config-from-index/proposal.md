## Why

当前包入口 `src/index.ts` 只导出了默认插件工厂，而 `defineReactSsgConfig` 仍需要用户通过子路径 `./config` 访问，入口体验不够统一。

本次变更希望在保持入口文件干净的前提下，让使用者可以直接从包入口同时获取插件工厂和 `defineReactSsgConfig`。

## What Changes

- 在 `src/index.ts` 中补充导出 `defineReactSsgConfig`。
- 保持入口文件继续采用薄封装写法，不内联实现逻辑。
- 增加入口导出的回归测试，验证默认导出和命名导出都可用。

## Capabilities

### New Capabilities

- 无

### Modified Capabilities

- `react-spa-prerender`: 补充包入口必须同时暴露默认插件工厂和 `defineReactSsgConfig` 的约束。

## Impact

- 影响代码：`src/index.ts`
- 影响测试：`tests/index-entry.test.ts`
- 不改变现有插件实现、配置解析逻辑和子路径导出
