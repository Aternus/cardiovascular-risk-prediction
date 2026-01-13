# API + DTO Conventions (Next.js App Router, TypeScript, Convex-friendly)

## Goals

- REST-ish resource design (nouns), versioned by path.
- Full symmetry: every endpoint has a `*Request` and `*Response` type.
- TypeScript uses `type` everywhere (no `interface`).
- Updates use HTTP `PATCH` only (no `PUT`), but naming uses `Update` (not
  `Patch`).
- Use `DTO` in uppercase in all type names.
- Compatible with Convex: keep contracts framework-agnostic; validate at the
  boundary (with `zod` or Convex `v.*`).

---

## URL + Folder Conventions (Next.js App Router)

- Version in path: `/api/v1/...`
- App Router folders:

```
src/app/api/v1/
  widgets/route.ts
  widgets/[widgetId]/route.ts
```

Routes:

- Collection:
  - `GET /api/v1/widgets`
  - `POST /api/v1/widgets`
- Item:
  - `GET /api/v1/widgets/{widgetId}`
  - `PATCH /api/v1/widgets/{widgetId}`
  - `DELETE /api/v1/widgets/{widgetId}`

---

## Contracts (DTOs) Location + Versioning

- Keep versioning in folders, not in type names:

```
src/contracts/v1/widgets.ts
```

- Public API payload shapes are defined in `contracts`.
- Internal domain models / DB schema are NOT versioned.

---

## DTO Naming Rules (Strict)

- Shared payload shapes:
  - `WidgetDTO` (read shape)
  - `WidgetCreateDTO` (create input)
  - `WidgetUpdateDTO` (update input; optional fields for PATCH)
- Symmetric request/response:
  - `{Operation}{Resource}RequestDTO`
  - `{Operation}{Resource}ResponseDTO`

Examples:

- `CreateWidgetRequestDTO`, `CreateWidgetResponseDTO`
- `UpdateWidgetRequestDTO`, `UpdateWidgetResponseDTO`
- `GetWidgetRequestDTO`, `GetWidgetResponseDTO`
- `ListWidgetsRequestDTO`, `ListWidgetsResponseDTO`
- `DeleteWidgetRequestDTO`, `DeleteWidgetResponseDTO`

---

## Minimal Generic DTO Templates (Examples)

```typescript
// src/contracts/v1/widgets.ts

// ---------- Shared DTOs ----------
export type WidgetDTO = {
  id: string;
  name: string;
  createdAt: string; // ISO timestamp
};

export type WidgetCreateDTO = {
  name: string;
};

export type WidgetUpdateDTO = {
  name?: string; // PATCH semantics
};

// ---------- Query DTOs ----------
export type ListWidgetsQueryDTO = {
  search?: string;
  limit?: number;
  cursor?: string;
  sort?: "createdAt" | "-createdAt";
};

// ---------- Symmetric Request/Response DTOs ----------
export type CreateWidgetRequestDTO = {
  body: WidgetCreateDTO;
};

export type CreateWidgetResponseDTO = {
  widget: WidgetDTO;
};

export type GetWidgetRequestDTO = {
  widgetId: string;
};

export type GetWidgetResponseDTO = {
  widget: WidgetDTO;
};

export type ListWidgetsRequestDTO = {
  query?: ListWidgetsQueryDTO;
};

export type ListWidgetsResponseDTO = {
  items: WidgetDTO[];
  nextCursor?: string;
};

export type UpdateWidgetRequestDTO = {
  widgetId: string;
  body: WidgetUpdateDTO;
};

export type UpdateWidgetResponseDTO = {
  widget: WidgetDTO;
};

export type DeleteWidgetRequestDTO = {
  widgetId: string;
};

export type DeleteWidgetResponseDTO = {
  // empty response
};
```

---

## HTTP Status Code Guidelines (Default)

- `GET` success: `200`
- `POST` created: `201` (do not set `Location`)
- `PATCH` success: `200` (with body) or `204` (without body)
- `DELETE` success: `204` (without body)
- Validation errors: `400`
- Not found: `404`
- Conflict (e.g., idempotency/version mismatch): `409`

---

## Convex-Friendly Notes

- Keep `contracts` pure TypeScript types (no runtime dependency).
- Validate at the boundary:
  - Next.js route handler: parse and validate `req.json()` / query params.
  - Convex function: validate args with Convex validators (`v.*`) and map
    to/from DTO shapes.
- Prefer modeling computations as resources you create (auditable):
  - Example: `POST /api/v1/widgets/{widgetId}/analysis` -> returns `AnalysisDTO`
  - Still follow symmetric `{Operation}{Resource}RequestDTO` /
    `{Operation}{Resource}ResponseDTO`.

---

## Consistency Checklist

- [ ] Resource paths are nouns, pluralized (`/widgets`)
- [ ] API is versioned by path (`/api/v1`)
- [ ] Every route has `RequestDTO` + `ResponseDTO`
- [ ] All DTO types use uppercase `DTO`
- [ ] Updates use HTTP `PATCH` and DTO naming uses `Update`
- [ ] Query parameters are represented as `*QueryDTO`
- [ ] Validation happens at the boundary (Next.js + Convex)
