## Next.js Code Conventions

### Project structure

Use the app/ router by default. Keep feature folders self-contained.

```
app/
	(marketing)/            // route groups
		layout.tsx
		page.tsx
	dashboard/
		@charts/…             // parallel routes
		[id]/
			page.tsx
	api/
		users/route.ts        // Route Handlers
src/
	components/
	lib/                    // shared utils (server-safe)
	hooks/
	styles/
```

Co-locate styles (.module.css), tests (.test.tsx), and small helpers next to their component.

### Naming

- Files & routes: kebab-case for folders & route segments (`user-profile/page.tsx`).
- Components & Types: PascalCase (`UserCard.tsx`, `User.ts`), hooks: `useCamelCase`.
- Server utils: suffix `*.server.ts` when they must never run client-side; client-only helpers: `*.client.ts`.

### Components: server vs client

- Default to Server Components.
- Add `"use client"` only when you need state, effects, refs, event handlers, or browser APIs.
- Keep client components leafy and small; pass plain data props into them.

### Data fetching & caching (App Router)

Use `fetch` with Request Options; prefer Route Handlers (`app/api/.../route.ts`) for server boundaries.

Cache rules:

```
// Static
fetch(url, { next: { revalidate: 3600 }})

// Dynamic
fetch(url, { cache: 'no-store' })

// Page-level
export const revalidate = 0 // or seconds
```

Use `generateStaticParams` for SSG dynamic routes.

Never fetch in client components unless truly needed; instead pass data from server parent.

### Layout, metadata & SEO

- One `layout.tsx` per route tree; keep providers closest to where needed.
- Use the `metadata` export (or `generateMetadata`) instead of manual `<Head>` tags.

### Styling

- Prefer CSS Modules or Tailwind. Avoid global CSS except `app/globals.css`.
- Co-locate `Component.module.css` next to `Component.tsx`. Don’t nest selectors deeply.

### Images & fonts

- Use `next/image` and `next/font` (local or Google) instead of raw `<img>` and external font links.
- Always provide alt text; avoid layout shift by setting `sizes` or `fill`.

### API routes / Route Handlers

Use `app/api/**/route.ts` with named HTTP methods:

```ts
export async function GET(req: Request) {
	/* ... */
}
export async function POST(req: Request) {
	/* ... */
}
```

Validate input (zod / valibot) at the edge.

### State & hooks

- Use React Query or Server Actions for mutations; don’t overuse global state.
- Custom hooks start with `use`, have a single responsibility, and don’t run server-only code.

### Imports & module boundaries

- Absolute imports from `src/*` via `tsconfig.json` paths.
- Import order: react/next, third-party, internal `@/lib`, `@/components`, then relative. No circular deps.

### TypeScript

- Required. Types in `@/types/*` or near usage. Use zod schemas to infer types from validators.
- Prefer `unknown` over `any`. Narrow early, return precise types.

### Env vars

- Server-only vars: `process.env.SECRET_*`
- Client-exposed: prefix `NEXT_PUBLIC_`.
- Never import `process.env` in client components.

### Accessibility

- Semantic HTML, ARIA only when needed.
- Keyboard focus states visible; trap focus in modals; use `<Link>` from `next/link` for nav.

### Performance

- Split client components; lazy-load rarely used ones with `next/dynamic`.
- Prefer Edge Runtime (`export const runtime = 'edge'`) for small, stateless handlers.
- Avoid `useEffect` for data—fetch on server.

### Testing & linting

- Use ESLint with `next/core-web-vitals` + TypeScript + import rules.
- Unit test with Vitest/Jest, component test with Testing Library, E2E with Playwright.

### Quick checklist (“am I doing it right?”)

- Server by default, `"use client"` only when necessary.
- Data fetched on the server; cache rules declared explicitly.
- Routes = folder names; `page.tsx`/`layout.tsx` used consistently.
- Components small, pure, typed; props are serializable.
- Tailwind/CSS Modules, `next/image`, `next/font`, and `Link`.
- No env secrets on the client; client-only code stays in client files.
- ESLint + Prettier clean; tests for logic and UI.
