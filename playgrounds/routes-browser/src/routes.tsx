import { Link, Outlet, useLoaderData, type LoaderFunctionArgs } from 'react-router'
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
          和
          {' '}
          <code>loader</code>
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

async function loadHomePageData() {
  return {
    source: '来自 loader 的首页内容',
    summary: '在 browser history 下，插件会自动收集静态 path 与 index 路由。',
  }
}

function HomePage() {
  const data = useLoaderData() as {
    source: string
    summary: string
  }

  useSeoMeta({
    title: 'Routes Browser - 首页',
  })

  return (
    <section className="panel">
      <h2>自动发现静态路由</h2>
      <p>{data.summary}</p>
      <p>{data.source}</p>
    </section>
  )
}

async function loadGuidePageData({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)

  return {
    origin: url.origin,
    pathname: url.pathname,
  }
}

function GuidePage() {
  const data = useLoaderData() as {
    origin: string
    pathname: string
  }

  useSeoMeta({
    title: 'Routes Browser - 接入说明',
    description: '这个页面演示模板 head 与页面级 useSeoMeta 共同参与最终输出。',
  })

  return (
    <section className="panel">
      <h2>构建期执行 loader</h2>
      <p>
        当前页面在预渲染前已经执行
        {' '}
        <code>loader</code>
        ，因此静态 HTML 中会直接包含下面这些值。
      </p>
      <p>
        请求源：
        {' '}
        <strong>{data.origin}</strong>
      </p>
      <p>
        请求路径：
        {' '}
        <code>{data.pathname}</code>
      </p>
    </section>
  )
}

async function loadPostPageData({ params, request }: LoaderFunctionArgs) {
  const slug = params['slug'] ?? 'unknown'
  const origin = new URL(request.url).origin

  return {
    slug,
    origin,
    ogImage: `https://example.com/og/${slug}.png`,
  }
}

function PostPage() {
  const data = useLoaderData() as {
    slug: string
    origin: string
    ogImage: string
  }

  useHead({
    title: `Routes Browser - ${data.slug}`,
    meta: [
      {
        property: 'og:image',
        content: data.ogImage,
      },
    ],
  })

  return (
    <section className="panel">
      <h2>动态文章</h2>
      <p>
        当前 slug：
        {' '}
        <strong>{data.slug}</strong>
      </p>
      <p>
        构建期请求源：
        {' '}
        <code>{data.origin}</code>
      </p>
    </section>
  )
}

export const routes = [
  {
    path: '/',
    Component: Shell,
    children: [
      { index: true, loader: loadHomePageData, Component: HomePage },
      { path: 'guide', loader: loadGuidePageData, Component: GuidePage },
      { path: 'posts/:slug', loader: loadPostPageData, Component: PostPage },
    ],
  },
]
