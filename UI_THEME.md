# RALL-E UI palette

Use this palette for all future UI work in this project.

| Color | Value | Role |
| --- | --- | --- |
| Deep navy | `#1A265A` | Text, selected controls, outlines |
| Electric lime | `#97FB57` | Primary actions, positive highlights |
| Active orange | `#FD6326` | Accent details, attention indicators |
| Warm cream | `#FEF6ED` | Page and form backgrounds |

Use the `brand-navy`, `brand-lime`, `brand-orange`, and `brand-cream` Tailwind tokens defined in `web/src/index.css`. Use navy text on lime and orange for readability. Selected navy controls use cream text. Keep keyboard focus visible. Preserve existing layouts and behavior when applying the palette.

The palette applies to onboarding, login/signup, navigation, discovery, session cards and details, creation forms, chat, and map controls/pop-ups. Geographic map tiles retain their source colors. Reuse SPORT_EMOJI from web/src/lib/constants.js for sport labels and map markers.

## Shared brand assets

The complete source kit is checked into `web/public/brand/`; its `BRAND-GUIDE.md` describes each asset and when to use it. Use `BrandLogo` from `web/src/components/BrandLogo.jsx` for the horizontal navy or reversed cream SVG logo. The primary horizontal mark already includes both the crossed-racket brandmark and the RALL-E wordmark. Keep its aspect ratio and use the standalone mark or the supplied favicon files only in compact placements.

Keep app colors in the `brand-navy`, `brand-lime`, `brand-orange`, and `brand-cream` Tailwind tokens in `web/src/index.css`. Reuse these tokens and the checked-in assets when editing pages or components; do not recreate logos with text or introduce competing brand colors. The browser tab icons, app name, and theme color are configured in `web/index.html`.
