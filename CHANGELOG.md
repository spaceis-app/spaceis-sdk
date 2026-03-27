# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-03-27

### Fixed
- Updated README with unpkg CDN link

## [0.1.0] - 2025-03-27

### Added

- `createSpaceIS()` factory and `SpaceISClient` class
- API modules: products, categories, cart, checkout, orders, content, sales, goals, packages, vouchers, daily rewards, rankings, shop, recaptcha
- `CartManager` with reactive state, localStorage persistence, and auto token management
- `SpaceISError` with field-level validation, status helpers (`isValidation`, `isNotFound`, `isRateLimited`)
- Utility functions: `formatPrice`, `centsToAmount`, `fromApiQty`, `toApiQty`, `getProductLimits`, `getCartItemImage`, `getItemQty`, `escapeHtml`
- ESM, CJS, and IIFE (browser global `window.SpaceIS`) builds
- Full TypeScript type definitions
