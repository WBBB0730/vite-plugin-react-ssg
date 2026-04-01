export function App() {
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
