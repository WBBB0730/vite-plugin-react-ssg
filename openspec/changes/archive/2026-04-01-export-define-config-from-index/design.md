## Context

上一轮重构已经让 `src/index.ts` 恢复为薄入口，只负责把默认插件工厂从内部模块转发出来。现在新增需求是让 `defineReactSsgConfig` 也能从包入口获取，但不能把入口再次变成实现聚合点。

现有 `src/config.ts` 已经单独导出了 `defineReactSsgConfig`，因此最小实现是继续使用 re-export，把该符号从入口透出，而不是复制定义或重组模块结构。

## Goals / Non-Goals

**Goals:**

- 让包入口同时提供默认插件工厂和 `defineReactSsgConfig`
- 保持 `src/index.ts` 继续是薄封装文件
- 用测试锁定入口导出行为

**Non-Goals:**

- 不移除现有 `./config` 子路径导出
- 不修改 `defineReactSsgConfig` 的实现或类型
- 不调整插件运行时逻辑

## Decisions

1. 通过 re-export 在入口暴露 `defineReactSsgConfig`。
原因：这是最小改动，且与当前入口文件“只做转发”的结构一致。

2. 使用现有入口测试文件补充命名导出断言。
原因：测试关注点仍然是“入口行为”，放在同一测试文件最连贯。

## Risks / Trade-offs

- [风险] 如果入口文件未来引入更多命名导出，可能再次膨胀。
  → 缓解：继续限制入口只做 re-export，不承载实现逻辑。
- [权衡] 同一能力同时支持根入口和 `./config` 子路径访问，会有两个导入方式。
  → 缓解：保留兼容性，同时让主入口具备更直观的默认用法。
