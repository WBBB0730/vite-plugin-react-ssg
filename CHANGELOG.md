# Changelog

All notable changes to this project are documented in this file.

## [0.2.0]

### Added

- Added build-time execution for matched React Router `loader` functions in route mode, along with serialized hydration data injected into prerendered HTML for client reuse.
- Added a route-mode `origin` option to control the absolute request origin passed to build-time React Router loader requests.

### Changed

- Updated the README and `routes-browser` playground to document and demonstrate loader-driven prerendering and hydration.

### Fixed

- When React Router static queries return redirect-like `Response` values, the plugin now skips only the affected route and continues prerendering the remaining targets.

## [0.1.0]

### Added

- Added page-level head management support through `@unhead/react`, including prerender-time template merging for titles, meta tags, and social tags.
- Added an interactive `pnpm play` command to validate local playgrounds more easily during development.
- Added a trusted publisher release workflow and release preparation script for automated package publishing.

### Changed

- Reorganized the local playgrounds into clearer app and router validation scenarios.
- Expanded the README examples and guidance to cover head management and local validation workflows.

### Fixed

- Relaxed the React peer dependency range so the package accepts a broader set of supported React versions.

## [0.0.1]

### Added

- Initial public release of `vite-plugin-react-ssg` for build-time prerendering in traditional Vite React SPAs.
- Added route path discovery aligned with React Router data router flattening behavior.
- Added configurable prerender log levels with `silent`, `normal`, and `verbose` modes.

### Changed

- Cleaned up package entry exports for the published package layout.
- Reworked the README structure and setup guidance for the first release.
