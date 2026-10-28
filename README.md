# Coming soon

A generic, responsive coming soon page with a warm neutral palette, large typography, and a moving 3D sculpture. No dependencies, external services, or tracking.

## Cloudflare Pages

Use these settings when connecting this repository:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `npm run build` |
| Build output directory | `DIST` |
| Root directory | Leave blank |
| Environment variables | None required |

`DIST` is uppercase and case-sensitive. Enter `npm run build`, not just `build`: Cloudflare executes a shell command and must invoke the npm script. If a previous setup used `dist`, update the dashboard field to `DIST`.

Build with Node.js 22 or newer:

```sh
npm run build
npm run preview
```

Open http://127.0.0.1:4173. For source development use `npm run dev`. No installation step is necessary because the project has no dependencies. The generated `DIST` folder is ignored by Git; Cloudflare creates it during each build.

## Reuse

The default page works for any brand. Edit the title, description, heading, and body copy in `index.html`; adjust the palette using the custom properties at the top of `styles.css`. There is no invented launch date, countdown, or inactive signup form.

The 3D sculpture uses native WebGL with studio lighting, three rotating metallic rings, an orange core, and subtle pointer response. A pause/play button controls animation. Reduced-motion preferences start the sculpture paused, and rendering stops when the tab or sculpture is out of view. A CSS sunrise remains available when WebGL is unsupported. All assets are served from this repository. `_headers` adds Cloudflare Pages security headers.
