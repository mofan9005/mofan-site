# Public example site

A sanitized example of the original Vite/React site. The component structure, hash routes, styles and motion system are retained. Every supplied article, issue, book and image is clearly labeled 示例内容 / Example. These examples describe no real person. No original creative media, recordings or font files are included; geometric SVG placeholders and system fonts are used. Audio intentionally displays the existing unavailable state. Contact links are disabled.

## Local development

Requires Node.js 20.19+ (or 22.12+) and npm.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

`npm run check` validates example content. `npm run fonts` uses system fonts. Build retains the original check → Vite → media stage; private review, import and publication commands are omitted. Routes: `#home`, `#courses`, `#brief`, `#gallery`, `#about`, `#courses/<topic>`, `#courses/<topic>/<article>`, `#brief/<date>`. Five original topic slugs remain; two contain two example articles each, three show the existing empty state.

## Environment

Optional `.env.local` is ignored. `.env.example` contains only blank identifiers and analytics OFF. Analytics additionally requires explicit `VITE_ANALYTICS_ENABLED=true`, a user-supplied ID and HTTPS script URL, a deliberately configured domain allowlist in `src/analytics.mjs`, and the production gate. There is no production configuration. Subscription is disabled until deliberately configured in `src/config.js`.

## Public and private boundary

Keep private content and secrets in a separate private workspace. Do not copy its asset directories, exports, source documents, histories, contact data, account files, generated builds or dependency folders here. Add only reviewed example files individually; an ignore rule cannot sanitize tracked files. Review both text and media before every export. `.gitignore` covers environment files, generated output, dependencies, caches, logs, staging and review directories. Install dependencies from the lockfile instead of copying an existing dependency tree.

## Licensing

No project-wide open-source license has been granted. All rights reserved for the project's own code and content, pending the owner's choice. Third-party components retain their own licenses; see `THIRD_PARTY_NOTICES.md` (note: GSAP uses its own Standard No Charge license, not MIT). Generated placeholder assets are examples only and carry no separate license grant.

## Known limitation

On the home page, the small "Example" hotspot on the rotating disc centre may not navigate to About in some browsers. The visible "阅读最新课程文章" label/tonearm and the footer/menu About links work normally.
