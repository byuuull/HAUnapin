# HAUnapin Natin 'Yan!

Campus lost & found for Holy Angel University.
Jimenez, Samson, Tabinas · CYB-201 · 6INTROWEB/6WEBCS · Dr. Raquel B. Rivera

Pure HTML5, CSS3 and vanilla JavaScript. No frameworks, no build step, no server.

## Running it
1. Open `index.html` in a browser. It works straight from the folder (`file://`).
2. Optional: run `get-hau-images.bat` (Windows) or `sh get-hau-images.sh` (Mac/Linux) once to save HAU's official campus map and history photos (1933, 1981, 2004, 2008, 2013, 2014) into `images/hau/`. Without them, the site loads those images from hau.edu.ph when online and hides them when offline. The HAU seal is bundled in `images/hau-seal.png`.

Demo account: **maria.santos@hau.edu.ph** / **angelite123** (or sign up with any @hau.edu.ph email).

## Pages (all from the Figma mockup)
| Page | What it does |
|---|---|
| `index.html` | Home: hero, quick search, latest reports, map preview, four-step return |
| `browse.html` | All reports with search, filters (status, category, building, date), sort, load more. Filters are kept in the URL |
| `map.html` | Interactive campus map with pins synced to the list. **Map / Street** toggle: Street View shows real campus photos with item pins. Also opens HAU's official campus map |
| `item.html?id=…` | Photo gallery, details, mini map, save (heart), share, "I have information", "Report a possible match", claim requests |
| `report.html` | 4-step report: category → details & photo → map pin, date, time, notes → review & submit |
| `how.html` | How It Works: lost and found guides, FAQ, call to action |
| `about.html` | Mission & vision, the team, HAU history, contact form |
| `stories.html` | Success stories carousel and a "share your story" form |
| `safety.html` | Safety guidelines and contacts |
| `legal.html` | Privacy Policy and Terms of Service with a section menu |
| `help.html` | Help Centre: searchable guides and FAQs, message form |
| `login.html`, `signup.html`, `forgot.html` | Accounts (HAU emails only). "Keep me logged in" off = this tab only. Password reset needs a 6-digit code (shown on screen in the demo, 10-minute expiry, 5 tries) |
| `profile.html` | My reported items, found items, saved items, messages, settings. Mark items returned or delete them |

## Code layout
```
css/styles.css        Design system (CSS variables) + every component and page
js/icons.js           Inline SVG icons
js/data.js            Buildings, categories, sample reports, HAU facts, team, stories, FAQ, help, Street View spots
js/store.js           State: localStorage, filters/queries, pub/sub, claims, messages, stories, saved items
js/auth.js            Accounts: sign up, log in, reset, profile (salted SHA-256 hashes)
js/ui.js              DOM helpers, cards, header account menu, modal, bottom sheet, focus trap, toast
js/map.js             SVG map engine: pan/zoom maths, pinch, keyboard, pins, popups, pick mode
js/pages/*.js         One controller per page (content.js covers the information pages)
images/               Photos taken from the Figma mockup, logo, favicon; images/hau/ for official HAU images
get-hau-images.*      Downloads official images from hau.edu.ph
```

## Data
- Everything is saved in the browser's localStorage. Nothing is sent anywhere.
- Starting reports, stories and the demo account are **sample data**. Reset from Profile → Settings → Reset demo data.
- University facts (founding, founders, motto, address, trunkline) come from hau.edu.ph. The Security Office location and hours follow the mockup and should be confirmed with HAU.
- The campus map follows the campus plan layout: building footprints, drive lanes and boulevards, walkways, lawns, the plaza, trees and the perimeter fence with its gates. Only the grounds inside the fence are drawn, and there's no parking (none inside campus). Names come from HAU's official numbered and lettered maps. To move or rename a building, edit `BUILDINGS` in `js/data.js`; the grounds are in `CAMPUS`.

## Rules the site enforces
- You can't claim or send a lead on your own report; owners get a "Manage in My Profile" card instead.
- Only open *found* items can be claimed, once per person; returned items can't be claimed.
- Report dates must be within the last 90 days, and a time today can't be later than now.
- Marking an item returned or deleting it asks for confirmation.
- Stories can only be shared about returned items.

## Accessibility & layout
- Semantic landmarks, skip link, one `h1` per view, labelled fields with inline errors.
- Visible focus everywhere, focus trapped in modals and sheets, Escape closes them.
- Text contrast at least 4.5:1 (3:1 for large headings), tap targets at least 44×44px.
- Map: arrows pan, `+`/`-` zoom, `0` resets, Enter opens a pin. Street View: left/right arrows change location.
- Checked at 320, 390, 768 and 1366px: no sideways scrolling or clipped controls.
- Respects reduced motion. No text caret shows on regular text (only in fields you can type in).
- Built to WCAG 2.2 AA: every button and link has a name and a real destination, fields have labels, and focus returns to a sensible place after dialogs.

## Notes
- Google/Apple sign-in buttons explain they need a live server; HAU email sign-in works.
- Fonts load from Google Fonts; offline it falls back to system fonts.
- Not officially affiliated with HAU Administration.
