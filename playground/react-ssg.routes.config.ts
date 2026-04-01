import { defineReactSsgConfig } from '../src/config'
import { routes } from './src/routes'

export default defineReactSsgConfig({
  history: 'browser',
  routes,
  paths: ['/posts/hello-world'],
})
