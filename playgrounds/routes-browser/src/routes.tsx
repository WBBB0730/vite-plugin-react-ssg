import { Link, Outlet, useParams } from 'react-router'
import { useHead, useSeoMeta } from '@unhead/react'

function Shell() {
  useHead({
    meta: [
      { name: 'robots', content: 'index,follow' },
    ],
  })

  return (
    <div className="shell">
      <header className="hero">
        <span className="eyebrow">Route Mode</span>
        <h1>vite-plugin-react-ssg Playground</h1>
        <p>
          这个示例使用 React Router 的
          {' '}
          <code>routes</code>
          {' '}
          配置来模拟插件的预渲染输入。
        </p>
        <nav className="nav">
          <Link to="/">首页</Link>
          <Link to="/guide">接入说明</Link>
          <Link to="/posts/hello-world">动态示例</Link>
        </nav>
      </header>
      <Outlet />
    </div>
  )
}

function HomePage() {
  useSeoMeta({
    title: 'Routes Browser - 首页',
  })

  return (
    <section className="panel">
      <h2>自动发现静态路由</h2>
      <p>在 browser history 下，插件会自动收集静态 path 与 index 路由。</p>
    </section>
  )
}

function GuidePage() {
  useSeoMeta({
    title: 'Routes Browser - 接入说明',
    description: '这个页面演示模板 head 与页面级 useSeoMeta 共同参与最终输出。',
  })

  return (
    <section className="panel">
      <h2>动态路径由 paths 补充</h2>
      <p>
        对于
        {' '}
        <code>/posts/:slug</code>
        {' '}
        这样的动态路由，需要在
        {' '}
        <code>react-ssg.config.ts</code>
        {' '}
        中显式提供
        {' '}
        <code>paths</code>
        。
      </p>
    </section>
  )
}

function PostPage() {
  const params = useParams()

  useHead({
    title: `Routes Browser - ${params['slug']}`,
    meta: [
      {
        property: 'og:image',
        content: `https://example.com/og/${params['slug']}.png`,
      },
    ],
  })

  return (
    <section className="panel">
      <h2>动态文章</h2>
      <p>
        当前 slug：
        {' '}
        <strong>{params['slug']}</strong>
      </p>
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
      { path: 'posts/:slug', Component: PostPage },
    ],
  },
]
