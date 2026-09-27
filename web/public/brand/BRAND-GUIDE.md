# RALL-E app brand kit

**Brand idea:** Two opposing rackets cross and touch at the shaft intersection: a shared game creates a connection. The mark has no initials or ball. The standalone brandmark uses lime and orange; the primary logo uses one color for restraint. The established Special Elite wordmark remains unchanged.

## Asset map

| Use | File | Notes |
| --- | --- | --- |
| Website/app header on light | `logo-horizontal-navy.svg` | Primary minimal logo, transparent background |
| Header on navy | `logo-horizontal-cream.svg` | Reverse, transparent |
| Campaign / hero | `logo-horizontal-color.svg` | Colored symbol with navy name |
| Compact placement | `logo-stacked-navy.svg` | For square-ish layouts, never for tiny controls |
| Standalone brandmark | `brandmark-color.svg` | Lime + orange, transparent |
| Single color symbol | `symbol-navy.svg`, `symbol-cream.svg` | Small UI and one-color production |
| Text only | `wordmark-navy.svg`, `wordmark-cream.svg` | Outlined Special Elite glyphs |
| App icon source | `app-icon-source.svg` | Navy tile, ample safety margin |
| App icon PNG | `app-icon-1024.png`, `app-icon-512.png`, `app-icon-192.png` | Raster sizes for app stores/PWA |
| Browser tab | `favicon-32.png`, `favicon-16.png` | Simplified solid navy mark on cream tile |
| Transparent source | `app-icon-transparent.svg` | Platform adaptive icon source; crop/mask per platform |

## Palette

| Token | Hex | Role |
| --- | --- | --- |
| Navy | `#1A265A` | Main logo and icon tile |
| Lime | `#97FB57` | First racket and discovery accents |
| Orange | `#FD6326` | Second racket and action accents |
| Teal | `#50A5B1` | Secondary UI/maps |
| Cream | `#FEF6ED` | Background and reversed logo |

## Production guidance

- Prefer the SVG logo in the web app; provide an accessible name: `<img src="/brand/logo-horizontal-navy.svg" alt="RALL-E">`. If the brand appears next to adjacent text naming it, use `alt=""` to avoid repetition.
- SVG wordmarks are font independent vector outlines. For editable headings, use Special Elite Regular, but keep navigation, forms, event details and map labels in a legible UI typeface.
- The icon should be tested in actual iOS/Android masks before launch. `app-icon-source.svg` is an illustration source, not a signed mobile asset catalog or final store submission.
- Use one logo at a time. Keep clear space around it of at least half a racket-head width; preserve aspect ratio. Do not recolor one side randomly or add a ball, pin, initials, gradients, shadows or outlines.
- Minimum web header logo width: about 160 CSS px. Minimum isolated symbol: 32 CSS px. Use the small favicon PNGs instead of shrinking the full two-color mark to 16 px.
- Special Elite is a display face with irregular edges; the exact outlined SVG is the reliable option for the brand name. Check the font license in your intended distribution and keep any copyright notice if you bundle the TTF separately.
- Sample CSS: `:root { --rall-e-navy: #1A265A; --rall-e-lime: #97FB57; --rall-e-orange: #FD6326; --rall-e-teal: #50A5B1; --rall-e-cream: #FEF6ED; }`
- For live text: `<link href="https://fonts.googleapis.com/css2?family=Special+Elite&display=swap" rel="stylesheet">` and `font-family: 'Special Elite', monospace; font-weight: 400;`.

## Figma import

Drag the SVGs into the existing RALL-E file. The shapes import as editable vectors; the wordmark is outlined, preserving its exact lettering even if Special Elite is not available in the Figma font menu. Organize the variants by name in a new **App brand kit** page.

## Approval checks before public launch

This package is a design and technical review, not consumer research or trademark clearance. Validate recognition with potential users, check brand-name and icon trademark availability, and review store rules and contrast in the actual interface.
