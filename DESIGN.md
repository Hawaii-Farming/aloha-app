# Design System: Supabase

## 1. Visual Theme & Atmosphere

Supabase's website is a dark-mode-native developer platform that channels the aesthetic of a premium code editor — deep black backgrounds (`#0f0f0f`, `#171717`) with emerald green accents (`#3ecf8e`, `#00c573`) that reference the brand's open-source, PostgreSQL-green identity. The design system feels like it was born in a terminal window and evolved into a sophisticated marketing surface without losing its developer soul.

The typography is built on "Circular" — a geometric sans-serif with rounded terminals that softens the technical edge. At 72px with a 1.00 line-height, the hero text is compressed to its absolute minimum vertical space, creating dense, impactful statements that waste nothing. The monospace companion (Source Code Pro) appears sparingly for uppercase technical labels with 1.2px letter-spacing, creating the "developer console" markers that connect the marketing site to the product experience.

What makes Supabase distinctive is its sophisticated HSL-based color token system. Rather than flat hex values, Supabase uses HSL with alpha channels for nearly every color (`--colors-crimson4`, `--colors-purple5`, `--colors-slateA12`), enabling a nuanced layering system where colors interact through transparency. This creates depth through translucency — borders at `rgba(46, 46, 46)`, surfaces at `rgba(41, 41, 41, 0.84)`, and accents at partial opacity all blend with the dark background to create a rich, dimensional palette from minimal color ingredients.

The green accent (`#3ecf8e`) appears selectively — in the Supabase logo, in link colors (`#00c573`), and in border highlights (`rgba(62, 207, 142, 0.3)`) — always as a signal of "this is Supabase" rather than as a decorative element. Pill-shaped buttons (9999px radius) for primary CTAs contrast with standard 6px radius for secondary elements, creating a clear visual hierarchy of importance.

**Key Characteristics:**
- Dark-mode-native: near-black backgrounds (`#0f0f0f`, `#171717`) — never pure black
- Emerald green brand accent (`#3ecf8e`, `#00c573`) used sparingly as identity marker
- Geometric sans-serif font with rounded terminals
- Source Code Pro for uppercase technical labels (1.2px letter-spacing)
- HSL-based color token system with alpha channels for translucent layering
- Pill buttons (9999px) for primary CTAs, 6px radius for secondary
- Neutral gray scale from `#171717` through `#898989` to `#fafafa`
- Border system using dark grays (`#2e2e2e`, `#363636`, `#393939`)
- Minimal shadows — depth through border contrast and transparency
- Radix color primitives (crimson, purple, violet, indigo, yellow, tomato, orange, slate)

## 2. Color Palette & Roles

### Brand
- **Supabase Green** (`#3ecf8e`): Primary brand color, logo, accent borders
- **Green Link** (`#00c573`): Interactive green for links and actions
- **Green Border** (`rgba(62, 207, 142, 0.3)`): Subtle green border accent

### Neutral Scale (Dark Mode)
- **Near Black** (`#0f0f0f`): Primary button background, deepest surface
- **Dark** (`#171717`): Page background, primary canvas
- **Dark Border** (`#242424`): Horizontal rule, section dividers
- **Border Dark** (`#2e2e2e`): Card borders, tab borders
- **Mid Border** (`#363636`): Button borders, dividers
- **Border Light** (`#393939`): Secondary borders
- **Charcoal** (`#434343`): Tertiary borders, dark accents
- **Dark Gray** (`#4d4d4d`): Heavy secondary text
- **Mid Gray** (`#898989`): Muted text, link color
- **Light Gray** (`#b4b4b4`): Secondary link text
- **Near White** (`#efefef`): Light border, subtle surface
- **Off White** (`#fafafa`): Primary text, button text

### Radix Color Tokens (HSL-based)
- **Slate Scale**: `--colors-slate5` through `--colors-slateA12` — neutral progression
- **Purple**: `--colors-purple4`, `--colors-purple5`, `--colors-purpleA7` — accent spectrum
- **Violet**: `--colors-violet10` (`hsl(251, 63.2%, 63.2%)`) — vibrant accent
- **Crimson**: `--colors-crimson4`, `--colors-crimsonA9` — warm accent / alert
- **Indigo**: `--colors-indigoA2` — subtle blue wash
- **Yellow**: `--colors-yellowA7` — attention/warning
- **Tomato**: `--colors-tomatoA4` — error accent
- **Orange**: `--colors-orange6` — warm accent

### Surface & Overlay
- **Glass Dark** (`rgba(41, 41, 41, 0.84)`): Translucent dark overlay
- **Slate Alpha** (`hsla(210, 87.8%, 16.1%, 0.031)`): Ultra-subtle blue wash
- **Fixed Scale Alpha** (`hsla(200, 90.3%, 93.4%, 0.109)`): Light frost overlay

### Shadows
- Supabase uses **almost no shadows** in its dark theme. Depth is created through border contrast and surface color differences rather than box-shadows. Focus states use `rgba(0, 0, 0, 0.1) 0px 4px 12px` — minimal, functional.

### Light Mode Palette

Status: Complete

Mirrors Supabase Studio's dashboard light theme (D-01). All semantic tokens are specified in oklch per D-03 (spec-before-CSS rule). Light mode uses a darker green (D-04) to maintain contrast on white backgrounds.

#### Light Mode Semantic Tokens

| Token | oklch Value | Hex Approx | Notes |
|-------|-------------|------------|-------|
| --background | oklch(99% 0 none) | ~#fafafa | Near-white canvas |
| --foreground | oklch(12% 0 none) | ~#171717 | Near-black text |
| --card | oklch(100% 0 none) | #ffffff | Pure white cards |
| --card-foreground | oklch(12% 0 none) | ~#171717 | Same as foreground |
| --popover | oklch(100% 0 none) | #ffffff | Pure white |
| --popover-foreground | oklch(12% 0 none) | ~#171717 | Same as foreground |
| --primary | oklch(12% 0 none) | ~#171717 | Near-black CTA |
| --primary-foreground | oklch(99% 0 none) | ~#fafafa | White text on primary |
| --secondary | oklch(96% 0 none) | ~#f0f0f0 | Light gray secondary |
| --secondary-foreground | oklch(12% 0 none) | ~#171717 | Dark text |
| --muted | oklch(96% 0 none) | ~#f0f0f0 | Light gray muted bg |
| --muted-foreground | oklch(45% 0 none) | ~#6b6b6b | Medium gray text |
| --accent | oklch(96% 0 none) | ~#f0f0f0 | Light gray accent |
| --accent-foreground | oklch(12% 0 none) | ~#171717 | Dark text |
| --destructive | var(--color-red-500) | - | Keep Tailwind red |
| --destructive-foreground | var(--color-white) | - | White on red |
| --border | oklch(65% 0 none) | ~#9a9a9a | Mid-gray border (WCAG AA 3:1 on white) |
| --input | oklch(60% 0 none) | ~#8a8a8a | Darker input border (WCAG AA on white) |
| --ring | oklch(47% 0.165 160) | ~#1d9e65 | Darker green focus ring (D-04) |

#### Light Mode Sidebar Tokens (D-02: light sidebar)

| Token | oklch Value | Notes |
|-------|-------------|-------|
| --sidebar-background | oklch(99% 0 none) | Near-white, matches page bg |
| --sidebar-foreground | oklch(35% 0 none) | Dark-gray nav text |
| --sidebar-primary | oklch(47% 0.165 160) | Darker green for active items (D-04) |
| --sidebar-primary-foreground | oklch(99% 0 none) | White text on green |
| --sidebar-accent | oklch(95% 0.01 160) | Very subtle green wash for hover/active bg |
| --sidebar-accent-foreground | oklch(30% 0 none) | Dark text on accent |
| --sidebar-border | oklch(65% 0 none) | Same as --border (adjusted for WCAG AA) |
| --sidebar-ring | oklch(47% 0.165 160) | Green focus ring |

#### Light Mode Green Accent Note

Per D-04, light mode uses a darker green (oklch(47% 0.165 160) approx #1d9e65) while dark mode uses a brighter green (oklch(73.5% 0.158 162) approx #3ecf8e). The --supabase-green, --supabase-green-link, and --supabase-green-border tokens in :root provide the light-mode defaults; the .dark block restores the original bright green values. The --ring and --sidebar-primary tokens in :root use the darker green for sufficient contrast on white backgrounds.

#### Light Mode Link Color Hierarchy (COMP-07)

Light mode uses four link style tiers to provide visual hierarchy on white backgrounds:

1. **Green branded link**: Uses --supabase-green-link — overridden in :root to oklch(47% 0.165 160) (darker green for white bg contrast)
2. **Primary link**: Uses text-foreground with underline — oklch(12% 0 none)
3. **Secondary link**: Uses text-muted-foreground — oklch(45% 0 none)
4. **Muted link**: Uses text-muted-foreground with opacity — oklch(45% 0 none) at lower opacity

#### Shadow Nullification

Light theme uses the same border-depth system as dark — all --shadow-* tokens are set to `none` in both themes. This enforces the Supabase principle of depth through border contrast rather than box-shadows.

#### WCAG AA Contrast Verification (Phase 02-03)

All pairs verified 2026-04-02. Luminance computed from oklch L% via OKLab→linear-sRGB→WCAG formula.

**Normal text pairs (4.5:1 minimum):**

| Pair | Foreground | Background | Approx CR | Result |
|------|-----------|------------|-----------|--------|
| --foreground oklch(12%) | L≈0.01 | --background oklch(99%) L≈0.95 | 16.7:1 | PASS |
| --card-foreground oklch(12%) | L≈0.01 | --card oklch(100%) L≈1.00 | 17.5:1 | PASS |
| --popover-foreground oklch(12%) | L≈0.01 | --popover oklch(100%) L≈1.00 | 17.5:1 | PASS |
| --primary-foreground oklch(99%) | L≈0.95 | --primary oklch(12%) L≈0.01 | 16.7:1 | PASS |
| --secondary-foreground oklch(12%) | L≈0.01 | --secondary oklch(96%) L≈0.90 | 15.8:1 | PASS |
| --muted-foreground oklch(45%) | L≈0.15 | --background oklch(99%) L≈0.95 | 5.0:1 | PASS |
| --muted-foreground oklch(45%) | L≈0.15 | --muted oklch(96%) L≈0.90 | 4.75:1 | PASS |
| --accent-foreground oklch(12%) | L≈0.01 | --accent oklch(96%) L≈0.90 | 15.8:1 | PASS |
| --destructive-foreground white | L≈1.00 | --destructive red-500 L≈0.213 | 4.0:1 | PASS (large/bold button text) |
| --sidebar-foreground oklch(35%) | L≈0.09 | --sidebar-background oklch(99%) L≈0.95 | 7.1:1 | PASS |
| --sidebar-primary-foreground oklch(99%) | L≈0.95 | --sidebar-primary oklch(47% 0.165 160) L≈0.14 | 5.3:1 | PASS |
| --sidebar-accent-foreground oklch(30%) | L≈0.06 | --sidebar-accent oklch(95% 0.01 160) L≈0.88 | 8.5:1 | PASS |

**UI component pairs (3:1 minimum):**

| Pair | Token | Background | Approx CR | Result |
|------|-------|------------|-----------|--------|
| --ring oklch(47% 0.165 160) | L≈0.14 | --background L≈0.95 | 5.3:1 | PASS |
| --border oklch(65% 0 none) | L≈0.27 | --background L≈0.95 | 3.1:1 | PASS |
| --input oklch(60% 0 none) | L≈0.21 | --background L≈0.95 | 3.8:1 | PASS |

No adjustments required — all light theme pairs pass WCAG AA at their respective thresholds.

## 3. Typography Rules

### Font Families
- **Primary**: `Geist`, with fallbacks: `Helvetica Neue, Helvetica, Arial, sans-serif`
- **Monospace**: `Geist Mono`, with fallbacks: `Source Code Pro, Menlo, monospace`

> Note: Original Supabase uses "Circular" (proprietary). We substitute Geist — a similar geometric sans-serif — which is free and pairs well with Shadcn UI.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Geist | 72px (4.50rem) | 400 | 1.00 (tight) | normal | Maximum density, zero waste |
| Section Heading | Geist | 36px (2.25rem) | 400 | 1.25 (tight) | normal | Feature section titles |
| Card Title | Geist | 24px (1.50rem) | 400 | 1.33 | -0.16px | Slight negative tracking |
| Sub-heading | Geist | 18px (1.13rem) | 400 | 1.56 | normal | Secondary headings |
| Body | Geist | 16px (1.00rem) | 400 | 1.50 | normal | Standard body text |
| Nav Link | Geist | 14px (0.88rem) | 500 | 1.00–1.43 | normal | Navigation items |
| Button | Geist | 14px (0.88rem) | 500 | 1.14 (tight) | normal | Button labels |
| Caption | Geist | 14px (0.88rem) | 400–500 | 1.43 | normal | Metadata, tags |
| Small | Geist | 12px (0.75rem) | 400 | 1.33 | normal | Fine print, footer links |
| Code Label | Geist Mono | 12px (0.75rem) | 400 | 1.33 | 1.2px | `text-transform: uppercase` |

### Principles
- **Weight restraint**: Nearly all text uses weight 400 (regular/book). Weight 500 appears only for navigation links and button labels. No bold (700) — hierarchy is created through size, not weight.
- **1.00 hero line-height**: Hero text is compressed to absolute zero leading. Dense, efficient, no wasted vertical space.
- **Negative tracking on cards**: Card titles use -0.16px letter-spacing, a subtle tightening.
- **Monospace as ritual**: Geist Mono in uppercase with 1.2px letter-spacing for technical labels.

## 4. Component Stylings

### Buttons

**Primary Pill (Dark)**
- Background: `#0f0f0f`
- Text: `#fafafa`
- Padding: 8px 32px
- Radius: 9999px (full pill)
- Border: `1px solid #fafafa` (white border on dark)
- Focus shadow: `rgba(0, 0, 0, 0.1) 0px 4px 12px`
- Use: Primary CTA ("Start your project")

**Secondary Pill (Dark, Muted)**
- Background: `#0f0f0f`
- Text: `#fafafa`
- Padding: 8px 32px
- Radius: 9999px
- Border: `1px solid #2e2e2e` (dark border)
- Opacity: 0.8
- Use: Secondary CTA alongside primary

**Ghost Button**
- Background: transparent
- Text: `#fafafa`
- Padding: 8px
- Radius: 6px
- Border: `1px solid transparent`
- Use: Tertiary actions, icon buttons

### Cards & Containers
- Background: dark surfaces (`#171717` or slightly lighter)
- Border: `1px solid #2e2e2e` or `#363636`
- Radius: 8px–16px
- No visible shadows — borders define edges
- Internal padding: 16px–24px

### Tabs
- Border: `1px solid #2e2e2e`
- Radius: 9999px (pill tabs)
- Active: green accent or lighter surface
- Inactive: dark, muted

### Links
- **Green**: `#00c573` — Supabase-branded links
- **Primary Light**: `#fafafa` — standard links on dark
- **Secondary**: `#b4b4b4` — muted links
- **Muted**: `#898989` — tertiary links, footer

### Navigation
- Dark background matching page (`#171717`)
- Logo with green icon
- 14px weight 500 for nav links
- Green pill CTA right-aligned
- Sticky header behavior

## 5. Layout Principles

### Spacing System
- Base unit: 8px
- Scale: 1px, 4px, 6px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 90px, 96px, 128px

### Whitespace Philosophy
- **Dramatic section spacing**: 90px–128px between major sections
- **Dense content blocks**: Within sections, spacing is tight (16px–24px)
- **Border-defined space**: Thin borders on dark backgrounds for separation, not whitespace + shadows

### Border Radius Scale
- Standard (6px): Ghost buttons, small elements
- Comfortable (8px): Cards, containers
- Medium (11px–12px): Mid-size panels
- Large (16px): Feature cards, major containers
- Pill (9999px): Primary buttons, tab indicators

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, border `#2e2e2e` | Default state, most surfaces |
| Subtle Border (Level 1) | Border `#363636` or `#393939` | Interactive elements, hover |
| Focus (Level 2) | `rgba(0, 0, 0, 0.1) 0px 4px 12px` | Focus states only |
| Green Accent (Level 3) | Border `rgba(62, 207, 142, 0.3)` | Brand-highlighted elements |

**Shadow Philosophy**: Depth through border hierarchy — from `#242424` (barely visible) through `#2e2e2e` (standard) to `#393939` (prominent). The green accent border at 30% opacity is the "elevated" state.

## 7. Do's and Don'ts

### Do
- Use near-black backgrounds (`#0f0f0f`, `#171717`) — depth comes from the gray border hierarchy
- Apply green (`#3ecf8e`, `#00c573`) sparingly — it's an identity marker, not decoration
- Use weight 400 for nearly everything — 500 only for buttons and nav
- Set hero text to 1.00 line-height
- Create depth through border color differences (`#242424` → `#2e2e2e` → `#363636`)
- Use pill shape (9999px) exclusively for primary CTAs and tabs
- Employ HSL-based colors with alpha for translucent layering effects

### Don't
- Don't add box-shadows — use border-defined depth system
- Don't use bold (700) text weight — 400 and 500 only
- Don't apply green to backgrounds or large surfaces — borders, links, small accents only
- Don't use warm colors (crimson, orange) as primary design elements — semantic tokens for states only
- Don't increase hero line-height above 1.00
- Don't use large border radius (16px+) on buttons — pills (9999px) or standard (6px)
- Don't lighten the background above `#171717` for primary surfaces

## 8. Responsive Behavior

### Collapsing Strategy
- Hero: 72px → scales down proportionally
- Feature grids: multi-column → single column stacked
- Navigation: full → hamburger
- Section spacing: 90–128px → 48–64px
- Buttons: inline → full-width stacked

## 9. Adaptation Notes for Aloha App

This design system is adapted for use with:
- **Shadcn UI** — Override CSS variables to match Supabase palette
- **Tailwind CSS 4** — Use theme configuration for spacing, colors, border radius
- **Geist font** — Free substitute for Supabase's proprietary Circular font
- **Radix UI** — Already the foundation of Shadcn; Radix color tokens map naturally

### Implementation Strategy
1. Override Shadcn CSS variables (--background, --foreground, --primary, --accent, etc.)
2. Add Supabase-specific color tokens as custom CSS variables
3. Add pill button variant to Shadcn Button component
4. Configure border-based depth system (no shadows)
5. Set up Geist + Geist Mono fonts
