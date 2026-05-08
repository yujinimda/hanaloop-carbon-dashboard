# Design Tokens

`app/globals.css` defines the **only** source of truth for color, radius, and font.
Reviewers reject any hardcoded hex / rgb / arbitrary Tailwind values.
This file is the human-readable index — when you need a color, find it here first.

The CSS variables are mapped through `@theme inline` to Tailwind utility names.
For example `--color-primary` → `bg-primary`, `text-primary`, `border-primary`, etc.
Color values are in [oklch](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) so they tone-shift cleanly between light and dark.

---

## Surface colors

| Token                  | Tailwind                    | Use for                                        |
| ---------------------- | --------------------------- | ---------------------------------------------- |
| `--background`         | `bg-background`             | Page canvas                                    |
| `--foreground`         | `text-foreground`           | Body text on canvas                            |
| `--card`               | `bg-card`                   | Elevated surface (KPI card, panel)             |
| `--card-foreground`    | `text-card-foreground`      | Text on card                                   |
| `--popover`            | `bg-popover`                | Floating menu, tooltip surface                 |
| `--popover-foreground` | `text-popover-foreground`   | Text on popover                                |
| `--muted`              | `bg-muted`                  | Subtle background (disabled row, header strip) |
| `--muted-foreground`   | `text-muted-foreground`     | Secondary copy, captions, axis labels          |
| `--border`             | `border-border`             | Default 1px divider                            |
| `--input`              | `bg-input` / `border-input` | Form field surface and outline                 |

## Action colors

| Token                    | Tailwind                              | Use for                                |
| ------------------------ | ------------------------------------- | -------------------------------------- |
| `--primary`              | `bg-primary`                          | Primary CTA, key chart series          |
| `--primary-foreground`   | `text-primary-foreground`             | Text on primary                        |
| `--secondary`            | `bg-secondary`                        | Secondary button, less-emphasized chip |
| `--secondary-foreground` | `text-secondary-foreground`           | Text on secondary                      |
| `--accent`               | `bg-accent`                           | Hover background, highlight strip      |
| `--accent-foreground`    | `text-accent-foreground`              | Text on accent                         |
| `--destructive`          | `bg-destructive` / `text-destructive` | Delete confirm, error chip             |
| `--ring`                 | `ring-ring`                           | Focus outline (keyboard)               |

## Chart palette

`shared/constants/CHART_COLORS` already maps activity types to these. Don't reach into raw values.

| Token       | Tailwind                        | Mapped to                 |
| ----------- | ------------------------------- | ------------------------- |
| `--chart-1` | `text-chart-1` / `fill-chart-1` | 전기 (per `CHART_COLORS`) |
| `--chart-2` | `text-chart-2` / `fill-chart-2` | 원소재                    |
| `--chart-3` | `text-chart-3` / `fill-chart-3` | 운송                      |
| `--chart-4` | `text-chart-4` / `fill-chart-4` | reserved                  |
| `--chart-5` | `text-chart-5` / `fill-chart-5` | reserved                  |

## Sidebar

Reserved for future shell layout. Use only inside a sidebar component.

`--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`,
`--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`.

## Radius

`--radius` is the base (0.625rem). Multipliers are precomputed.

| Tailwind                    | Multiplier | Typical use                   |
| --------------------------- | ---------- | ----------------------------- |
| `rounded-sm`                | ×0.6       | Tight chips, inline tags      |
| `rounded-md`                | ×0.8       | Inputs, small buttons         |
| `rounded-lg`                | ×1.0       | Cards, dialogs                |
| `rounded-xl`                | ×1.4       | Hero cards                    |
| `rounded-2xl`–`rounded-4xl` | ×1.8–×2.6  | Marketing, illustration tiles |

## Typography

| Token            | Tailwind       | Use for                 |
| ---------------- | -------------- | ----------------------- |
| `--font-sans`    | `font-sans`    | Body, default           |
| `--font-mono`    | `font-mono`    | Numbers in tables, code |
| `--font-heading` | `font-heading` | Page / section titles   |

Sizes: stick to Tailwind scale (`text-xs`–`text-3xl`). Never `text-[14px]`.

---

## Authoring rules

- Always go through Tailwind utilities. If a token doesn't exist in `globals.css`, **add it there first**, do not inline a value.
- Light/dark parity is automatic when you use tokens. Hardcoded values break dark mode silently.
- For opacity variations use the slash syntax (`bg-primary/80`), not a new token.
- Charts: pull from `CHART_COLORS` constant, never reference `--chart-N` directly in feature code.
