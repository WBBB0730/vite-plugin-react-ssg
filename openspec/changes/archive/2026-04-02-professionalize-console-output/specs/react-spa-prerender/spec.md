## MODIFIED Requirements

### Requirement: 插件必须从独立配置文件加载预渲染规则
系统 MUST 从项目根目录的 `react-ssg.config.ts` 加载预渲染配置，并通过 `defineReactSsgConfig` 支持对象或函数两种导出形式。

#### Scenario: 缺少配置文件时回退到普通构建
- **WHEN** 用户启用了插件但项目根目录不存在 `react-ssg.config.ts`
- **THEN** 系统必须打印英文的非致命警告提示
- **THEN** 系统必须跳过预渲染阶段
- **THEN** 系统必须保留普通 CSR 构建结果

#### Scenario: 配置函数返回有效配置
- **WHEN** `react-ssg.config.ts` 默认导出为 `defineReactSsgConfig(() => ({ ... }))`
- **THEN** 系统必须执行该函数并使用其返回值作为最终配置

#### Scenario: 未声明 logLevel 时使用默认日志粒度
- **WHEN** 用户未在 `react-ssg.config.ts` 中声明 `logLevel`
- **THEN** 系统必须默认使用 `normal` 日志粒度

#### Scenario: 配置非法时整体回退
- **WHEN** 用户同时提供 `routes` 与 `app`，或在路由模式下缺少 `history`
- **THEN** 系统必须打印英文的非致命警告提示
- **THEN** 系统必须跳过预渲染阶段
- **THEN** 系统必须保留普通 CSR 构建结果

### Requirement: 页面级预渲染失败必须只影响当前目标
系统 MUST 在预渲染阶段区分配置级失败与页面级失败，并按目标粒度回退到 CSR。

#### Scenario: 单个目标路径渲染失败时继续其他路径
- **WHEN** 某个目标路径在预渲染过程中抛出异常
- **THEN** 系统必须记录该路径的英文失败提示
- **THEN** 系统必须跳过该路径的静态 HTML 输出
- **THEN** 系统必须继续处理其它目标路径

#### Scenario: 其它路径成功时仍输出预渲染结果
- **WHEN** 目标路径集合中部分路径成功、部分路径失败
- **THEN** 系统必须保留成功路径的静态 HTML 输出
- **THEN** 系统必须让失败路径继续依赖普通 CSR 入口运行
- **THEN** 系统必须在构建日志末尾输出包含目标总数、成功数和跳过数的英文单行 completed 摘要

## ADDED Requirements

### Requirement: 插件必须输出稳定且可回归验证的英文构建日志
系统 MUST 为每次预渲染流程输出统一结构的英文构建日志，使日志顺序、留白和摘要字段都可被稳定验证。

#### Scenario: normal 模式下输出固定结构的日志
- **WHEN** 插件完成配置加载并开始执行预渲染，且 `logLevel` 为 `normal`
- **THEN** 系统必须先输出唯一的插件标题行
- **THEN** 系统必须在标题行后插入空行
- **THEN** 系统必须输出英文的开始阶段日志
- **THEN** 若存在页面级失败，系统必须输出对应的英文 warning
- **THEN** 系统必须在完成摘要前插入空行
- **THEN** 系统必须输出单行 completed 摘要，且其中必须包含 `total`、`prerendered`、`skipped` 三个统计字段
- **THEN** 系统不得输出任何中文日志

#### Scenario: verbose 模式仅在完成摘要后追加结果列表
- **WHEN** 插件完成配置加载并开始执行预渲染，且 `logLevel` 为 `verbose`
- **THEN** 系统必须先输出与 `normal` 模式完全一致的标题、阶段、warning 与完成摘要
- **THEN** 系统必须仅在完成摘要之后追加一个逐路由结果列表
- **THEN** 系统必须在完成摘要与结果列表之间插入空行
- **THEN** 结果列表必须包含标题 `Route (prerender)`
- **THEN** 结果列表中的每一行必须仅包含状态标记与目标路径
- **THEN** 系统不得在结果列表中重复输出失败原因

#### Scenario: 配置级回退时输出非致命 warning
- **WHEN** `react-ssg.config.ts` 缺失或非法，导致本次构建跳过预渲染
- **THEN** 系统必须输出英文 warning
- **THEN** 系统不得输出预渲染开始阶段日志
- **THEN** 系统必须保留默认 CSR 构建结果

### Requirement: 插件必须为不同模式输出固定粒度的信息
系统 MUST 根据 `logLevel` 控制日志粒度，并保证不同模式之间的核心输出保持一致。

#### Scenario: normal 模式输出完成摘要但不输出逐路由结果列表
- **WHEN** `logLevel` 为 `normal`
- **THEN** 系统必须输出单行 completed 摘要
- **THEN** 系统必须为每个失败目标路径单独输出 warning
- **THEN** 系统不得为每个成功目标路径分别输出结果列表

#### Scenario: verbose 模式追加逐路由结果列表
- **WHEN** `logLevel` 为 `verbose`
- **THEN** 系统必须在单行 completed 摘要后输出逐路由结果列表
- **THEN** 成功目标路径必须使用 `○` 状态标记
- **THEN** 失败目标路径必须使用 `×` 状态标记
- **THEN** 逐路由结果列表必须同时包含成功目标路径与失败目标路径

#### Scenario: silent 模式抑制常规构建日志
- **WHEN** `logLevel` 为 `silent`
- **THEN** 系统不得输出标题行、开始阶段日志、单行 completed 摘要和逐路由结果列表
- **THEN** 系统的预渲染行为与产物不得因此改变
