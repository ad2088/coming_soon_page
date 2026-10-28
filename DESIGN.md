# Design

The page uses a bright, quiet composition: large left-aligned Manrope typography opposite three floating, lightly beveled sheets. The reference is the [Clay design analysis in awesome-design-md](https://github.com/voltagent/awesome-design-md/blob/main/design-md/clay/DESIGN.md), adapted for a generic coming soon page: warm canvas, rounded display type, and restrained pastel 3D forms. No Clay branding or product claims are used.

Palette: near-white paper #faf9f6, ink #242328, muted text #68656d, plum #6e568f, lavender #b8a4ed, and peach #ffb084. Manrope is self-hosted with its SIL Open Font License. The headline uses weight 500 and a single consistent sans serif voice. Hairlines and small controls use the same plum-neutral palette.

Native WebGL renders flat geometric sheets with narrow bevels and soft studio lighting. Motion follows an eight-second sequence: rest, fan open, hold, and restack, using smooth acceleration and deceleration. Bounded pointer response adds slight perspective. Avoid organic tubes, knots, bulging forms, and continuous spinning: the user explicitly disliked their appearance and motion, but requested a clearly visible geometric animation. The pause/play control has a 44px minimum target; reduced-motion preferences start paused. Rendering stops offscreen or in a hidden tab. A static CSS horizon remains as the non-WebGL fallback.

On mobile, the sheets stack below the introduction and the footer reflows. Copy stays generic and reusable, with no invented brand, launch date, contact address, or signup form. Build output remains lowercase dist for Cloudflare Pages. The connected domain is https://www.sudarshanstationery.com/.
