import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { routes } from './routes.tsx'
import './style.css'

const router = createBrowserRouter(routes)

createRoot(document.querySelector('#app')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
