# Chrome fonts (§19.1, §25.4)

The chrome font stack is one token, defined per era in `src/chrome/tokens.css`:

```
--font-chrome: 'W95FA', Tahoma, 'MS Sans Serif', Geneva, Verdana, sans-serif;
```

`W95FA` ("W95FA — Windows 95 Font A") is the free, open-licence bitmap
recreation of MS Sans Serif 11px this project ships. It is **not** a
Microsoft font — it is a third-party clone built specifically to be
redistributable, which is the whole reason it exists.

## Where it drops in

This directory does not contain the font file yet. When it is added:

1. Place the webfont files here, e.g.:
   ```
   src/assets/fonts/w95fa.woff2
   src/assets/fonts/w95fa.woff
   ```
2. Add a `@font-face` block to `src/chrome/tokens.css` (the one file allowed
   to reference asset paths and the one place a hex value or asset path for
   chrome is permitted to live), e.g.:
   ```css
   @font-face {
     font-family: 'W95FA';
     src:
       url('/src/assets/fonts/w95fa.woff2') format('woff2'),
       url('/src/assets/fonts/w95fa.woff') format('woff');
     font-weight: 400;
     font-style: normal;
     font-display: block; /* §23: everything snaps — no FOIT-to-FOUT fade */
   }
   ```
3. Do not add a `<link>` to Google Fonts, a CDN, or any network font source.
   §25.4 is explicit: the build must run fully offline. If `W95FA` is not
   bundled, the stack falls back to system Tahoma / MS Sans Serif / Geneva /
   Verdana — never to a network fetch, and never to a required Microsoft
   asset (§5.1 rule 4: no shipped Microsoft assets, fonts, icons or sounds).

## Licensing rule

Microsoft's own fonts (MS Sans Serif, Tahoma as a shipped binary, etc.) must
**never** be committed to this repository, in this directory or anywhere
else. Only redistributable clones (W95FA or an equivalent open-licence
MS-Sans-Serif-alike) may be bundled. System Tahoma is referenced only as an
optional fallback in the font stack — the game never requires the player to
have it installed, and never fetches it.

## Body and monospace fonts (§19.1)

Times New Roman, Arial/Helvetica, Verdana and Courier New are referenced as
plain CSS font-stacks (`src/chrome/tokens.css`, `--font-body-*` /
`--font-mono`) with generic fallbacks. These are standard OS/web-safe fonts,
not bundled assets — the same "safe stack" approach every real 1998–2006
page used, and exactly what §19.1's notes column calls for.
