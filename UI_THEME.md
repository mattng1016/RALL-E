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
