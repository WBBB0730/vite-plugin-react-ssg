import { useSeoMeta } from '@unhead/react'

export function App() {
  useSeoMeta({
    title: 'App Basic - 单页模式示例',
    description: '这个示例展示单页模式下与 @unhead/react 配合的页面级 head 声明。',
  })

  return (
    <section className="app-demo">
      <span className="eyebrow">App Mode</span>
      <h2>单页模式示例</h2>
      <p>
        当项目没有使用 React Router 时，可以直接把根组件传给
        {' '}
        <code>defineReactSsgConfig</code>
        。
      </p>
    </section>
  )
}
