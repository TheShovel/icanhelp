# Digital Art

## Hardware
- **Drawing tablets (pen tablets)**: Wacom (Intuos, One by Wacom), Huion, XP-Pen, Gaomon. Screenless — draw on tablet, look at monitor. Cheaper, ergonomic (head up). Sizes: small (~6x4") for portability, medium (~10x6") best all-around, large for broad strokes. Report rate (≥200 RPS), pressure levels (≥4096), pen tilt support
- **Pen displays (screen tablets)**: Wacom Cintiq, Huion Kamvas, XP-Pen Artist. Draw directly on screen — more intuitive, better hand-eye coordination. More expensive. Screen quality: resolution (2K/4K), color accuracy (sRGB 100%+), matte vs glossy (matte reduces glare, wears nibs faster)
- **iPad + Apple Pencil**: Procreate ecosystem. Excellent portability, pencil feel, screen quality. iPadOS limits (file management, software options). Apple Pencil 1 (lightning charge, older iPad) vs 2 (magnetic charge, better grip, newer iPad Pro/Air) vs USB-C (budget, no pressure). Procreate, Fresco, Clip Studio for iPad
- **Stylus tech**: EMR (electromagnetic resonance — Wacom, Huion, XP-Pen — no battery, hover works, active digitizer layer) vs capacitive (dumb stylus, rubber tip, no pressure — like iPad first-gen). Battery styli need charging. Nibs: felt (paper feel, wear fast), plastic (slick, durable), textured screen protectors change feel
- **Computer specs**: RAM (16GB+ for large canvases), GPU (dedicated helps for heavy brushes, 3D), processor (Intel i7/AMD Ryzen 7 or better). Screen: color-calibrated (Spyder/ColorMunkey), sRGB/AdobeRGB coverage, IPS panel for wide viewing angle. SSD for fast save/load

## Software
- **Procreate (iPad, $10)**: best-in-class UX, 250 max layers (varies by canvas size), Apple Pencil optimization, powerful brush engine, animation assist, auto-save, time-lapse recording. Limited: no CMYK, no advanced selection tools, iPad-only, no text tool
- **Clip Studio Paint (Win/Mac/iPad/Android)**: industry standard for manga/comic. Best inking tools (stabilization), vector layers, 3D reference models, panel tools, animation. One-time purchase ($50-220) or subscription ($11/mo). Massive brush library on Clip Studio Assets
- **Photoshop (Win/Mac, sub $23/mo)**: industry standard for general digital painting/photo editing. Best selection tools, adjustment layers, filters, color modes (RGB/CMYK/Lab), smart objects, text tool. Heavy, subscription, not optimized for art (laggy with large brushes)
- **Krita (free, Win/Mac/Linux)**: open-source, built for artists. Excellent brush engine (brush stabilizer, color smudge, wrap-around mode, popup palette). Animation tools, HDR support, vector. Best free option for digital painting. Slightly quirky UI, occasional instability
- **Affinity Photo (Win/Mac/iPad, $55 one-time)**: Photoshop competitor, no subscription. Similar features: layers, masks, adjustments, raw processing. Good performance, no brush stabilizer, smaller plugin ecosystem. Affinity suite (Photo + Designer + Publisher) covers Adobe trinity
- **Other**: Paint Tool SAI (legacy, lightweight, great lineart — Windows only, no updates since 2018), ArtRage (simulates real media — oil, watercolor, pastel realistically), Infinite Painter (Android best), Fresco (free iPad, Adobe — vector + raster + live brushes)

## Layers & Blending Modes
- **Layer types**: Raster (pixel-based), Vector (resolution-independent), Adjustment (curves, levels, hue/saturation — non-destructive), Mask (hide/reveal, grayscale — black = hidden, white = visible), Clip group (paint only within shape of layer below), Fill layers (solid color, gradient, pattern)
- **Organization**: name layers, group into folders (background, character, foreground, effects), color-code, lock transparent pixels (paint only existing pixels — great for shading). Use layer comps for alternate versions
- **Blending modes**: Normal (default, pixel replaces), Multiply (darkens — shadows, ink lines, color overlays), Screen (lightens — glow, highlights, light effects), Overlay (contrast boost — combines multiply + screen), Soft Light (gentle contrast, colorizing), Color Burn (strong darken), Linear Dodge (additive bright — glow), Difference (inverts colors where layers overlap — alignment check)
- **Other modes**: Luminosity (applies brightness only, preserves hue/saturation), Hue (applies color hue, keeps brightness/saturation), Saturation (applies color intensity, keeps hue/brightness), Color (hue + saturation, ignores brightness — great for coloring line art), Divide (lighten by inverse), Exclusion (softer difference)
- **Practical combos**: Multiply + gray for shadows → erase to lighten. Screen + color for lighting. Overlay + gradient map for color grading. Luminosity layer for texture overlay without affecting color

## Brushes
- **Brush properties**: Size, opacity, flow, shape, scatter, texture, dual brush, wet edges, smoothing/stabilization (amount of delay — critical for clean lineart). Pressure sensitivity controls: size, opacity, flow, scatter, rotation
- **Brush types**:
  - Round (default, all-purpose — hard/soft edge variants)
  - Flat (chiseled edge, angle responsive — houses, fabric folds, block-in)
  - Airbrush (soft, feathery — gradients, soft shading, atmosphere)
  - Charcoal/pencil (textured, grain — sketching, rough rendering)
  - Ink pen/liner (clean, sharp — lineart, comic inking)
  - Smudge/blender (blend colors on canvas — oil paint effect in Krita)
  - Texture/stamp (repeatable pattern — scales, leaves, fabric)
  - Dry brush (streaky, bristly — painterly edges, texture)
- **Customization**: brush tip shape (circle, square, imported texture), scattering (multiple tip instances), texture overlay (paper grain, canvas), dual brush (combine two brushes), transfer (opacity/flow jitter controlled by pen pressure), color dynamics (hue jitter per stroke)
- **Brush libraries**: download from (DeviantArt, Gumroad, ArtStation, Clip Studio Assets). Import as .abr (Photoshop), .sut (Clip Studio), .brushset (Procreate). Make your own from scans of real media (ink splatter, watercolor wash)

## Color Theory
- **HSV (Hue, Saturation, Value)**: most intuitive color model for digital painting. Hue = color family (0-360°), Saturation = intensity/grayness (0-100%), Value = brightness (0-100%). RGB/HSL sliders in all software
- **Color harmonies**:
  - Complementary: opposite on color wheel (red/cyan, blue/yellow, green/magenta). High contrast, vibrant. Use one dominant, other as accent
  - Analogous: adjacent colors (blue, blue-green, green). Harmonious, calm. Lacks contrast — add a complementary accent
  - Triadic: three evenly spaced (120° apart — red, yellow, blue). Balanced, vibrant. Hard to handle — let one dominate
  - Split-complementary: base color + two adjacent to its complement. High contrast but less tense than direct complementary
  - Tetradic/double-complementary: two complementary pairs (rectangle on wheel). Rich, complex. Hard to balance
  - Monochromatic: single hue + variations in value/saturation. Clean, cohesive. Low contrast, can be boring
- **Color temperature**: warm (reds, oranges, yellows — advance, feel energetic) vs cool (blues, greens, purples — recede, feel calm). Warm light = cool shadows (and vice versa). Ambient occlusion in shadows = warm light fills from bounce
- **Color in practice**: limit palette (3-5 main colors). Use color script for storytelling (warm for happy, cool for sad). Avoid pure black (use dark blue/brown/purple instead — more natural). Skin tones: not just pink — green/purple/blue in shadows adds life

## DPI & Resolution
- **DPI (dots per inch) / PPI (pixels per inch)**: determines physical print size and detail. 72 DPI = screen standard (1 pixel = 1 dot). 300 DPI = print standard (magazine, art prints). 600+ DPI = high-end print (gallery, archival)
- **Canvas size examples (at 300 DPI)**: A4 = 2480 × 3508 px. A3 = 3508 × 4961 px. Letter = 2550 × 3300 px. Tabloid = 5100 × 6600 px. 16×20" print = 4800 × 6000 px
- **Screen resolution**: 1920×1080 (1080p), 2560×1440 (2K), 3840×2160 (4K). Web art: 72 DPI, ~1500-2500 px longest side for portfolio sites
- **Raster vs vector**: raster = pixel grid (photos, painting — quality limited by resolution, can't scale up without blur). Vector = mathematical curves (logo, illustration — infinite scaling, sharp at any size, small file). Software: Illustrator (vector), Inkscape (free vector)
- **Canvas strategy**: work at intended resolution (scaling down = fine, scaling up = lossy). Start at final DPI, not higher (unnecessary file bloat). Print: 300 DPI minimum, CMYK color mode. Web: 72 DPI, RGB color mode. Convert CMYK proof before submitting to print (soft proof in Photoshop)
