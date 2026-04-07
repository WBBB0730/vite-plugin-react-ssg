import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { createHead, UnheadProvider } from '@unhead/react/client'
import { createBrowserRouter, RouterProvider, type HydrationState } from 'react-router'
import { routes } from './routes'
import '../../_shared/style.css'

const head = createHead()
const hydrationData = (window as Window & {
  __staticRouterHydrationData?: HydrationState
}).__staticRouterHydrationData
const router = createBrowserRouter(routes, {
  ...(hydrationData ? { hydrationData } : {}),
})

hydrateRoot(document.querySelector('#app')!,
  <StrictMode>
    <UnheadProvider head={head}>
      <RouterProvider router={router} />
    </UnheadProvider>
  </StrictMode>,
)
