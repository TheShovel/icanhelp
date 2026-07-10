# Graphic Design Basics

## Design Principles
- **Contrast**: make elements visually distinct — size, color, shape, texture. Creates hierarchy, guides eye
- **Repetition**: repeat visual elements (colors, fonts, shapes, icons) — creates consistency, unity, brand recognition
- **Alignment**: every element should connect visually to something else — nothing placed arbitrarily
  - Grid: invisible structure that organizes content. 12-column grid is most flexible (Bootstrap, Material Design)
  - Centered = formal, conservative. Left-aligned = modern, clean. Right-aligned = unusual, purposeful
- **Proximity**: related items grouped together → perceived as one unit. Reduces clutter, improves readability
- **Hierarchy**: most important element should be most visually prominent (size, weight, color, position)
  - Users scan in F-pattern (top→left→right→down, web/text) or Z-pattern (visual/print)
  - Headline > subhead > body > caption — each should be visually distinct
- **Balance**: symmetrical (formal, stable) vs asymmetrical (dynamic, interesting). White space = breathing room
  - Negative space (empty area) is as important as positive space (elements) — don't fill every gap
- **Color harmony**: complementary (opposite wheel = high contrast), analogous (adjacent = harmonious), triadic (equally spaced = vibrant)
  - Limit palette: 2-3 main colors + neutrals (logo, primary, accent)
  - 60-30-10 rule: 60% dominant, 30% secondary, 10% accent

## Typography
- **Serif** (Times New Roman, Georgia, Merriweather): classic, formal, readable in print — serifs guide reading
  - Best for: long-form print, body text in print, traditional brands
- **Sans-serif** (Helvetica, Arial, Open Sans, Inter, Roboto): modern, clean, better for screens — lower resolution
  - Best for: web/UI, headings, modern brands, body text on screens
- **Display/decorative**: unique, attention-grabbing — use sparingly for headlines only (never body text)
- **Script**: handwriting-like — formal (weddings) or casual. Hard to read at small sizes, use sparingly
- **Font pairing**: combine serif + sans-serif, or different weights of same font family (safe)
  - Good combos: Playfair Display + Source Sans, Merriweather + Montserrat, headings sans-serif + body serif (or vice versa)
  - Rule: one font for headings, one for body, max 3 fonts per design
- **Leading** (line-height): body text 1.4-1.6x font size for readability
- **Tracking** (letter-spacing): increase for all-caps (headings, labels), decrease for large headlines
- **Kerning**: space between specific letter pairs (VA, To, AV) — adjust manually in logos/headlines
- **Measure** (line length): 45-75 characters per line for comfortable reading (web: 50-60 best)

## Color Theory
- **RGB**: additive color (red, green, blue) — screens, digital, web. 0-255 per channel
- **CMYK**: subtractive color (cyan, magenta, yellow, key/black) — print. Values as percentages
  - Always design in CMYK mode for print projects (colors look different on screen vs paper)
- **HSL/HSV**: hue (color), saturation (intensity), lightness/value (brightness) — more intuitive for humans
- **Color psychology** (varies by culture — these are Western associations):
  - Red: energy, passion, urgency, danger — stimulates appetite (used by food brands)
  - Blue: trust, calm, professional, corporate — most-used brand color worldwide (Facebook, LinkedIn, banks)
  - Green: nature, health, growth, money — eco, organic, finance
  - Yellow: optimism, warmth, attention — used for warnings, affordable brands (McDonald's, IKEA)
  - Purple: luxury, creativity, wisdom — royalty, beauty, spiritual
  - Orange: energetic, friendly, affordable — calls to action, younger brands (Home Depot, Nickelodeon)
  - Black: sophisticated, powerful, premium — luxury brands, minimalism
  - White: clean, simple, pure — health, minimalist, tech
- **Accessibility**: ensure contrast ratio between text and background — WCAG AA minimum 4.5:1 for normal text, 3:1 for large text
  - Contrast checkers (WebAIM, Stark plugin, Coolors) — designers must use these
  - Don't rely on color alone to convey information (red/green = invisible to colorblind users, 8% of men)

## Layout & Composition
- **Grid systems**: manuscript (single column), column (2-4 columns), modular (both rows + columns), baseline (align text)
  - 12-column grid is industry standard for web (Bootstrap, Material UI, Tailwind)
  - Print: check column width for comfortable reading (2-3 columns for newsletters, 1 for books)
- **Golden ratio** (1:1.618): naturally pleasing proportion — apply to layout dimensions, image cropping, typography scale
- **Rule of thirds**: divide canvas 3×3, place focal points on intersections or along lines
- **Z-pattern**: eyes scan from top-left → top-right → bottom-left → bottom-right — place logo top-left, CTA bottom-right
- **F-pattern**: reading on web — users scan horizontally across top, then down left, then across middle — put important content on left side

## File Types
- **JPEG**: photographs, complex images — lossy compression (small file, quality loss), no transparency
  - Best for photos. Avoid for text, logos (compression artifacts around edges)
  - Save at maximum quality first, export optimized version for web
- **PNG**: screenshots, UI, logos, images needing transparency — lossless (sharp text, no compression artifacts)
  - Larger file than JPEG. PNG-8 (256 colors, smaller) for simple graphics, PNG-24 (millions of colors) for complex
- **SVG**: vectors (logos, icons, illustrations) — XML-based, infinitely scalable, small file, editable in code
  - ALWAYS use SVG for logos, icons, and simple illustrations on web — not PNG
  - Can be animated, styled with CSS, manipulated with JavaScript
- **GIF**: simple animations — 256 colors, small file, limited color for photos
  - Better option for short animations: video (MP4) or APNG (more colors, smaller)
- **WEBP**: modern web format — smaller than JPEG/PNG, supports animation + transparency
- **AI/EPS** (Illustrator): vector source files — edit in Illustrator, don't use on web
- **PSD** (Photoshop): layered image files — edit in Photoshop
- **PDF**: print-ready, universal viewing — embed fonts for print. Export with trim marks + bleed for professional printing
- **Resolution**: 72 PPI (screen) vs 300 DPI (print). Print: high-res (300 DPI minimum). Web: 72 PPI is fine, but export at actual display size (2x for retina)

## Design Software
- **Figma**: industry standard for UI/UX design (web, app) — free, collaborative, browser-based, prototyping
  - Components (reusable elements), auto layout (responsive), variants, plugins
- **Adobe Photoshop**: raster/image editing, photo manipulation, digital painting — powerful but steep learning curve
- **Adobe Illustrator**: vector graphics — logos, icons, illustrations, typography
- **Canva**: beginner-friendly, templates, good for social media graphics, presentations — not enough control for professional design
- **Affinity Designer/Photo**: one-time purchase alternative to Adobe — professional quality, cheaper
- **Inkscape** (free vector) / **GIMP** (free raster) — open source alternatives

## Design Process
1. **Brief**: understand client/project goals, audience, deliverables, timeline, brand guidelines
2. **Research**: competitor analysis, mood boards, inspiration (Dribbble, Behance, Pinterest, Designspiration)
3. **Sketch**: low-fidelity ideas, multiple concepts, pen and paper — quick iteration, quantity over quality
4. **Wireframe**: layout structure, content placement, no styling — black and white, boxes for images
5. **Design**: apply visual style — colors, typography, spacing, imagery, final refinements
6. **Feedback**: share with client/stakeholders, explain rationale, iterate
7. **Deliver**: export final files in appropriate formats, organize assets, handoff to developer

## Getting Started
- Learn: design principles, typography, color theory, software basics
- Practice: recreate existing designs (pick great designs and try to recreate them), personal projects, design challenges (DailyUI, 100 Days of Design)
- Build portfolio: 3-5 strong projects > 20 mediocre ones. Curation matters
- Find a mentor or join design communities: Reddit (r/graphic_design), Dribbble, Behance
- Read: "The Non-Designer's Design Book" (Robin Williams — basic principles), "Don't Make Me Think" (Steve Krug — UX), "Thinking with Type" (Ellen Lupton)
