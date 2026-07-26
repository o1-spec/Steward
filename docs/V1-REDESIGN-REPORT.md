# Steward V1 Public Website, Authentication & Application Shell Redesign Report

**Date**: July 27, 2026  
**Status**: Redesign & UX Milestone Complete  
**Positioning**: *"See what your agents are doing. Control what they're allowed to do."*

---

## 1. Design Problems Found During Interface Audit

Prior to this milestone, Steward had a generic dark-purple/neon SaaS template aesthetic:
- **Generic Branding**: Purple-to-pink gradient square with an "S" letter mark.
- **Root Route Redirect**: `/` redirected directly to `/runs` (or `/login`), lacking a public landing page.
- **Inconsistent Color Variables**: Hard-coded hex values (`slate-950`, `purple-600`, `indigo-500`) scattered across pages without centralized design primitives.
- **Authentication Pages**: Single centered cards with heavy purple glows, generic CTAs ("Create Account & Continue"), and missing workflow previews.
- **Application Shell**: Oversized headings, dark gradient cards, and lack of visual distinction between observation and control states.

---

## 2. Visual Direction Implemented

We established a calm, technical, precise visual identity:
- **Public Site Palette**: Warm off-white background (`#FAF8F5`), ink-black primary text (`#0F172A`), muted stone-grey secondary text (`#57534E`), and restrained cobalt blue (`#2563EB`) primary brand accent.
- **Typography**:
  - `Instrument_Serif` for important public landing page display headings.
  - `Inter` for clean, highly readable UI text.
  - `JetBrains_Mono` for code snippets, telemetry events, and payload JSON.
- **Steward Logo Mark**: Replaced the gradient "S" square with a monochrome geometric SVG mark (`StewardLogo.tsx`) depicting an outer checkpoint boundary gate `[ ]` and an inner verified action node `■`.
- **Status Color System**:
  - Green (`#16A34A` / `emerald`) for completed/succeeded states.
  - Amber (`#D97706` / `amber`) for waiting/approval pending states.
  - Red (`#DC2626` / `rose`) for failed/rejected/destructive states.
- **Design Primitives (`src/components/ui/`)**: Built reusable, accessible primitives (`Button`, `Badge`, `AuthLayout`).

---

## 3. Routes Created & Updated

| Route | Type | Description / Changes |
| :--- | :---: | :--- |
| `/` | **Public** | Brand landing page featuring hero headline, interactive operational preview, 4-step workflow, product feature deep-dive, trust & security disclosures, Node.js `@steward/sdk` snippet, and footer. |
| `/login` | **Auth** | Two-column responsive layout (`AuthLayout`) with warm surface, inline validation, accessible password toggle, and workflow overview. |
| `/register` | **Auth** | Two-column layout with "Create account" CTA, validation, and password strength requirements. |
| `/forgot-password` | **Auth** | Two-column password reset request flow. |
| `/runs` | **Dashboard** | Dense operational shell with dark slate sidebar, project switcher dropdown, run status filter pills, and real-time SSE stream indicator. |
| `/approvals` | **Dashboard** | Human Approval Inbox with risk level badges, countdown timer, redacted argument viewer, and modal confirmation for high-risk actions. |
| `/projects/.../settings/api-keys` | **Dashboard** | Credential management page with single-view secret key reveal modal and immediate revocation controls. |

---

## 4. Components Consolidated & Design System Primitives

- `StewardLogo.tsx`: Accessible SVG mark + wordmark supporting `dark`, `light`, `monochrome` variants and `sm`, `md`, `lg` sizes.
- `Button.tsx`: Button primitive supporting `primary`, `secondary`, `outline`, `ghost`, `destructive`, `success`, `amber` variants and `isLoading` spinner state.
- `Badge.tsx`: Status indicator primitive supporting `completed`, `running`, `waiting`, `failed`, `cancelled`, `high`, `medium`, `low` risk levels.
- `AuthLayout.tsx`: Shared two-column responsive wrapper for authentication flows.

---

## 5. Accessibility Improvements (WCAG AA Compliance)

- **Focus Rings**: Added visible focus rings (`focus-visible:ring-2 focus-visible:ring-blue-600`) across all interactive buttons, inputs, links, and dialogs.
- **Accessible Names**: Added `aria-label` attributes to password toggle buttons, logo marks, and close buttons.
- **Semantic Structure**: Ensured single `<h1>` per page with valid heading hierarchy (`h1` -> `h2` -> `h3`).
- **Contrast Ratios**: Replaced muted low-contrast text with high-contrast stone-900 / stone-600 / slate-200.
- **Motion Controls**: Reduced motion compliance (`prefers-reduced-motion` supported via Tailwind transitions).

---

## 6. Verification & Test Results

```bash
# 1. Vitest Test Suite (including UI tests)
npm test
Result: PASSED (107 / 107 tests passed across 8 test files)

# 2. TypeScript Type-Check
npm run typecheck
Result: PASSED (0 errors)

# 3. ESLint Code Audit
npm run lint
Result: PASSED (0 errors, 0 warnings)

# 4. Build @steward/sdk Package
npm run build:sdk
Result: PASSED (CJS, ESM, .d.ts built)

# 5. Next.js Production Build
npm run build
Result: PASSED (Compiled in 6.7s, 21 static/dynamic routes generated)
```

---

## 7. Preserved Functionality

Zero backend logic or API contracts were modified:
- Database schema, Prisma Client queries, and PostgreSQL indexes remain unchanged.
- Password hashing (`bcryptjs`), session cookies (`stwd_session`), and project authorization (`ProjectMember`) remain intact.
- Agent API key hashing (`SHA-256`), event ingestion (`POST /api/v1/events`), SSE streaming (`/api/v1/runs/:runId/stream`), approval decisions (`/api/v1/approval-requests/:id/decision`), and command endpoints (`/api/v1/runs/:runId/commands`) operate without modification.
- Standalone `@steward/sdk` runtime logic and Vitest test suite remain 100% compatible.
