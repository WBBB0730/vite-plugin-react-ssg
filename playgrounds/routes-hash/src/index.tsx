import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router'
import { routes } from './routes'
import '../../_shared/style.css'

const router = createHashRouter(routes)

createRoot(document.querySelector('#app')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
