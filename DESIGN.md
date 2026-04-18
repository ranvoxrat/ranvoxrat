# Design Brief

## Direction

Editorial Dark Academic — A refined, dark-mode-first platform designed for serious educational work. Clean grid, high information density, indigo precision.

## Tone

Minimalist institutional with tech precision—inspired by Linear and Vercel's editorial approach. No playfulness; professional clarity throughout.

## Differentiation

Indigo accent on charcoal elevates this above generic dark SaaS. Sophisticated data visualization combined with clean table hierarchy creates distinctive academic aesthetic.

## Color Palette

| Token         | OKLCH            | Role                              |
| ------------- | ---------------- | --------------------------------- |
| background    | 0.145 0.014 260  | Primary surface, deep charcoal    |
| foreground    | 0.95 0.01 260    | Primary text, almost white        |
| card          | 0.18 0.014 260   | Elevated surfaces, slightly lighter |
| primary       | 0.52 0.16 270    | Interactive, indigo foundation    |
| accent        | 0.65 0.18 270    | Highlights, active states, indigo |
| destructive   | 0.55 0.2 25      | Error/destructive actions, red    |
| border        | 0.28 0.02 260    | Subtle dividers                   |
| chart-1       | 0.65 0.18 270    | Primary chart series, indigo      |
| chart-2       | 0.55 0.2 40      | Secondary series, warm orange     |
| chart-3       | 0.6 0.18 150     | Tertiary series, teal             |

## Typography

- Display: Space Grotesk — large headings, dashboard titles, data labels
- Body: Satoshi — UI labels, form text, list content, body copy
- Mono: JetBrains Mono — code snippets, IDs, technical values
- Scale: h1 `text-4xl font-bold tracking-tight`, h2 `text-2xl font-semibold tracking-tight`, body `text-sm/base`, label `text-xs font-semibold uppercase tracking-wider`

## Elevation & Depth

Minimal shadow hierarchy using opacity only: cards elevated 1px with subtle shadow, popovers/modals elevated 2px. No glow or blur effects. Depth through layering and surface tone shifts, not dramatic shadows.

## Structural Zones

| Zone       | Background        | Border        | Notes                                          |
| ---------- | ----------------- | ------------- | ---------------------------------------------- |
| Header     | card with border  | border-subtle | App header with navigation, search, user menu  |
| Sidebar    | sidebar           | sidebar-border | Role-based navigation; primary/accent accents  |
| Content    | background        | —             | Main dashboard grid; alternating card zones   |
| Data Zone  | card + shadow     | border-subtle | Tables, charts, form sections with elevation  |
| Footer     | background + border | border-subtle | Copyright, help links, secondary actions      |

## Spacing & Rhythm

Spacious grid with 24px section gaps, 16px component gaps, 8px micro-spacing. Generous white space emphasizes information hierarchy. Cards use 20px internal padding; data tables use 16px cell padding for comfortable scanning.

## Component Patterns

- Buttons: `bg-primary hover:bg-accent text-foreground` (filled), `border-border hover:bg-card` (outline), compact 8px–12px radius
- Cards: `bg-card border-border rounded-lg shadow-subtle` with 20px padding, 1px border
- Badges: `bg-muted text-foreground` (neutral) or `bg-accent text-foreground` (status), 4px radius
- Input: `bg-input border-border focus:ring-ring` with focus-ring utility

## Motion

- Entrance: Fade-in 200ms on page load (list items cascade 50ms stagger)
- Hover: Instant background shift + 200ms transition-smooth on all interactive elements
- Decorative: None; clarity over animation in academic context

## Constraints

- No vibrant gradients; use solid OKLCH tokens only
- No blur or glow effects on surfaces
- Data tables prioritize scan-ability; minimal hover states except selections
- All interactive elements must satisfy AA+ contrast in both light and dark mode

## Signature Detail

Charcoal-to-indigo card elevation pattern: subtle gradient in border opacity combined with chart color coherence (indigo as primary data color) creates distinctive, intellectually refined aesthetic unmistakably tied to academic rigor.
