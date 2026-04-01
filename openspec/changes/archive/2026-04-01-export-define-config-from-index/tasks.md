## 1. OpenSpec 与入口导出调整

- [x] 1.1 为入口补导出 `defineReactSsgConfig` 补齐 proposal、design、specs 制品
- [x] 1.2 更新 `src/index.ts`，从入口 re-export `defineReactSsgConfig`

## 2. 回归验证

- [x] 2.1 调整入口测试，验证默认导出和 `defineReactSsgConfig` 命名导出
- [x] 2.2 运行相关测试与类型检查并确认通过
