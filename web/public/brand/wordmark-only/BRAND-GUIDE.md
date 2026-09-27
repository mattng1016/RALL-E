# RALL-E Wordmark Brand Kit

**Official logo for this kit:** the RALL-E wordmark only, set in Special Elite Regular and colored deep navy `#1A265A`. The logo has no racket symbol, initials, icon, or tagline. The SVG and PNG are the same single logo in two formats.

## Assets

- `RALL-E-wordmark.svg` — transparent vector; use in a website, app header, Figma, or print layout.
- `RALL-E-wordmark.png` — transparent raster, 1600 px wide; use where SVG is unavailable.
- `preview.png` — placement example, not the source logo.

## Colors

| Color | Hex | Suggested use |
| --- | --- | --- |
| Deep navy | `#1A265A` | Official wordmark and primary text |
| Electric lime | `#97FB57` | Discovery highlight |
| Active orange | `#FD6326` | Action accents |
| Teal | `#50A5B1` | Maps and secondary UI |
| Warm cream | `#FEF6ED` | Light background |

## Usage

- Keep the wordmark navy on a cream or other sufficiently light background. The source artwork has a transparent background.
- Preserve the aspect ratio, leave clear space at least the height of the hyphen on all sides, and avoid stretching, shadows, gradients, or individual letter recoloring.
- Prefer at least 120 CSS px width on screen; verify legibility in the actual header size and device.
- The tagline **“Find your game. Find your people.”** may sit as separate text below the logo. It is not part of the logo artwork.
- Special Elite is intentionally irregular. Use a clearer UI font for buttons, map labels, forms, lobby cards, and body copy.

## Web implementation

```html
<img src="/brand/RALL-E-wordmark.svg" alt="RALL-E" width="180" height="39">
```

Set `width` to fit the header and allow `height: auto` in CSS; the HTML dimensions above are an approximate aspect-ratio placeholder. The outlined SVG renders without loading a font. For live editable headings only, load `Special Elite` Regular from Google Fonts or your licensed self-hosted copy. Use `alt=""` when nearby visible text already names RALL-E.

## Hand-off checks

The vector was rendered to PNG and visually checked for complete lettering, including the E. SVG structure, transparent PNG, and ZIP integrity were verified. Test placement and contrast in the production interface before launch. This package does not include trademark clearance.
