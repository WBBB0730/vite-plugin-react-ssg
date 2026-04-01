## 1. OpenSpec 与测试准备

- [x] 1.1 为控制台输出专业化补齐 proposal、design、specs 制品
- [x] 1.2 调整 `vitest` 用例，定义英文日志、阶段输出和 summary 的预期

## 2. 日志改造实现

- [x] 2.1 新增统一 reporter，收口插件标题、阶段提示、警告和总结输出
- [x] 2.2 调整配置加载与预渲染流程，统一改为英文日志并返回构建 summary

## 3. 回归验证

- [x] 3.1 运行相关 `vitest` 测试并确认通过
- [x] 3.2 检查改动未改变预渲染产物与失败回退语义

## 4. 日志粒度与详细结果

- [x] 4.1 在配置层新增 `logLevel`，支持 `silent`、`normal`、`verbose` 并默认使用 `normal`
- [x] 4.2 将内部输出能力统一命名为 `logger`，并让 completed 摘要收敛为单行输出
- [x] 4.3 让 `verbose` 仅在 completed 摘要后追加逐路由结果列表，且不重复失败原因
- [x] 4.4 调整 `vitest` 测试，覆盖不同 `logLevel` 的输出结构、空行与结果列表行为
