import { Link, Outlet } from 'react-router'

function Shell() {
  return (
    <div className="shell">
      <header className="hero">
        <span className="eyebrow">Hash Mode</span>
        <h1>vite-plugin-react-ssg Playground</h1>
        <p>
          这个示例使用 React Router 的
          {' '}
          <code>createHashRouter</code>
          {' '}
          来模拟插件的
          {' '}
          <code>history: 'hash'</code>
          {' '}
          场景。
        </p>
        <nav className="nav">
          <Link to="/">首页</Link>
          <Link to="/guide">Hash 说明</Link>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}

function HomePage() {
  return (
    <section className="panel">
      <h2>Hash 首页</h2>
      <p>在 hash history 下，预渲染只会输出默认首屏对应的 index.html。</p>
    </section>
  )
}

function GuidePage() {
  return (
    <section className="panel">
      <h2>Hash 子路由</h2>
      <p>客户端导航仍然可用，但不会为 hash 片段额外生成独立 HTML 文件。</p>
    </section>
  )
}

export const routes = [
  {
    path: '/',
    Component: Shell,
    children: [
      { index: true, Component: HomePage },
      { path: 'guide', Component: GuidePage },
    ],
  },
]
