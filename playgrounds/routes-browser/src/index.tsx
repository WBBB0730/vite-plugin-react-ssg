import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHead, UnheadProvider } from '@unhead/react/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { routes } from './routes'
import '../../_shared/style.css'

const head = createHead()
const router = createBrowserRouter(routes)

createRoot(document.querySelector('#app')!).render(
  <StrictMode>
    <UnheadProvider head={head}>
      <RouterProvider router={router} />
    </UnheadProvider>
  </StrictMode>,
)
