# Admin Dashboard — Next.js 14

A production-ready admin dashboard for a cleaning/Airbnb services business.

**Stack:** Next.js 14 · TailwindCSS · TypeScript · `lucide-react`

---

## File structure

```
nextjs-dashboard/
├── types/
│   └── index.ts                        # Shared TypeScript types
├── components/
│   ├── ui/
│   │   └── modal.tsx                   # Reusable modal (ESC, scroll-lock, accessible)
│   └── quick-task/
│       └── quick-task-button.tsx       # Floating button + modal (Feature 3)
└── app/
    └── (admin)/
        ├── layout.tsx                  # Sidebar layout + QuickTaskButton
        ├── clients/
        │   └── page.tsx                # Feature 1 — Client Management
        └── employees/
            └── page.tsx                # Feature 2 — Employee Management
```

---

## Quick start

```bash
npx create-next-app@latest my-dashboard --typescript --tailwind --app
cd my-dashboard

npm install lucide-react

# Copy these files into src/ (or app/ depending on your setup)
```

### `tailwind.config.ts` — required content path

```ts
content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}']
```

### `tsconfig.json` — path alias

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./*"] }
  }
}
```

---

## Features

### Feature 1 — Client Management (`/clients`)

| Column | Detail |
|---|---|
| Color | Filled circle with client's brand color |
| Name | Client name |
| Rate/hr | Hourly billing rate |
| Linen combo | Invoice line price |
| Amenities combo | Invoice line price |
| Extra towel | Invoice line price |
| Status | Active / Inactive badge |
| Actions | Edit (pencil) + Delete (trash) |

- **Search** by client name (real-time)
- **Items per page** dropdown (10 / 25 / 50 / 100)
- **Add client** modal with color picker (10 presets + HEX input), rates, active toggle
- **Edit client** modal pre-populated with existing values
- **Delete** confirmation modal with warning banner
- Form validation with inline error messages

### Feature 2 — Employee Management (`/employees`)

| Column | Detail |
|---|---|
| Employee | Avatar initials + name + ABN |
| Contact | Email + phone |
| Weekday / Sunday / Holiday | Hourly rates |
| Role | Worker / Admin badge |
| Status | Active / Inactive badge |
| Actions | Edit + Delete |

- **Add / Edit employee** modal with 4 grouped sections:
  - **Basic Info** — name, email, password (toggle visibility)
  - **Contact** — phone, ABN, address
  - **Payment Rates** — weekday / sunday / holiday ($/hr)
  - **Role & Status** — role dropdown (locked in edit mode) + active toggle
- Form validation with inline error messages

### Feature 3 — Quick Task (floating button, every page)

A `⚡ Quick Task` floating button fixed at the bottom-right corner.

**Modal fields:**
- Property (dropdown)
- Client (auto-filled read-only from property)
- Date
- Start time
- Estimated duration (hours)
- Team selector (A / B / C)
- **End time** auto-computed in real time

---

## Design tokens

| Token | Value |
|---|---|
| Page background | `#060d1f` |
| Surface (cards/table) | `#0f1b35` |
| Input background | `#0a1628` |
| Primary gradient | `from-blue-500 to-blue-700` |
| Border | `white/[0.07]` |
| Muted text | `text-slate-400 / slate-500` |
| Active badge | `bg-emerald-500/10 text-emerald-400` |
| Inactive badge | `bg-slate-500/10 text-slate-400` |
| Error | `text-red-400 / border-red-500/40` |

---

## Integration notes

- Replace `MOCK_CLIENTS`, `MOCK_EMPLOYEES`, `MOCK_PROPERTIES` with your actual API/DB calls.
- The `onSubmit` handlers inside each page expect you to wire them to your backend (e.g. Supabase, tRPC, REST).
- `QuickTaskButton` logs to console by default — replace `console.log` in `handleSubmit` with your task creation call.
- The `Modal` component is fully accessible: ESC closes it, body scroll is locked, ARIA roles + labels are set.
