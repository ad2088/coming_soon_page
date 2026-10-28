# Coming soon

A generic, responsive coming soon page with a bright neutral palette, self-hosted Manrope typography, and three floating 3D sheets in lavender, ivory, and peach. No package dependencies, external services, or tracking.

## Cloudflare Pages

Use these settings when connecting this repository:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Leave blank |
| Environment variables | None required |

The output directory is lowercase `dist`, matching the Cloudflare Pages dashboard. Directory names are case-sensitive on Cloudflare. Enter `npm run build`, not just `build`: Cloudflare executes a shell command and must invoke the npm script.

Build with Node.js 22 or newer:

```sh
npm run build
npm run preview
```

Open http://127.0.0.1:4173. For source development use `npm run dev`. No installation step is necessary because the project has no dependencies. The generated `dist` folder is ignored by Git; Cloudflare creates it during each build.

## Reuse

The default page works for any brand. Edit the title, description, heading, and body copy in `index.html`; adjust the palette using the custom properties at the top of `styles.css`. There is no invented launch date, countdown, or inactive signup form.

The 3D sculpture uses native WebGL with studio lighting and lightly beveled sheets that fan open, hold, and restack over an eight-second sequence. Pointer movement adds slight perspective. A pause/play button controls animation. Reduced-motion preferences start the sculpture paused, and rendering stops when the tab or sculpture is out of view. A static CSS horizon remains available when WebGL is unsupported. All assets are served from this repository. `_headers` adds Cloudflare Pages security headers, including a same-origin font policy.

The design adapts the warm canvas, typography discipline, and pastel 3D direction from the [Clay analysis in awesome-design-md](https://github.com/voltagent/awesome-design-md/blob/main/design-md/clay/DESIGN.md). The Manrope variable font comes from [Google Fonts](https://github.com/google/fonts/tree/main/ofl/manrope); its SIL Open Font License is included in `assets/OFL-Manrope.txt`.
