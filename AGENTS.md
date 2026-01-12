# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router pages, layouts, and route handlers.
- `components/`: Shared React UI components.
- `convex/`: Backend schema, auth, and server functions. `convex/_generated/` is
  generated; do not edit by hand.
- `public/`: Static assets.
- Config: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`,
  `postcss.config.mjs`.

## Build, Test, and Development Commands

- `npm install`: Install dependencies.
- `npm run dev`: Runs Convex setup (predev) and starts Next.js + Convex dev
  servers.
- `npm run dev:frontend`: Starts only the Next.js dev server.
- `npm run dev:backend`: Starts only the Convex dev server.
- `npm run build`: Creates a production build.
- `npm run start`: Serves the production build.
- `npm run lint`: Runs ESLint (Next.js + TypeScript + Convex rules; generated
  files are ignored).
- `npm run format`: Formats the codebase with Prettier.

## Checklist (Before Finishing Any Coding Task)

- [ ] Run `npx convex codegen` and verify it completes without errors.
- [ ] Run `npm run format` and verify it completes without errors.
- [ ] Run `npm run lint` and fix any reported issues.

## Coding Style & Naming Conventions

- TypeScript with `strict` enabled; keep types explicit when behavior is
  unclear.
- Formatting follows existing file style; use `npm run format` (Prettier) and
  `npm run lint` (ESLint) before pushing changes.
- Naming: React components use PascalCase (`RiskChart.tsx`), hooks use `useX`,
  Convex functions are camelCase (`listNumbers`), DTO is always uppercase in
  types and variables (`PatientDTO`, `patientDTO`).

## Testing Guidelines

- No automated test runner is configured yet. Use `npm run lint` plus manual UI
  smoke tests.
- If you add tests, document the runner and add a script to `package.json`.

## Commit & Pull Request Guidelines

- Use Conventional Commits (example: `feat(dx): added openai codex`).
- PRs should include a clear description, note new env vars, and add
  screenshots/GIFs for UI changes.
- Keep changes focused; update docs when behavior changes.

## Configuration & Secrets

- Store local environment overrides in `.env.local` and keep secrets out of git.
- Convex environment configuration lives in the Convex dashboard; keep
  `convex/auth.config.ts` aligned with provider settings.
- Additional Convex guidance is documented in `.cursor/rules/convex_rules.mdc`.
