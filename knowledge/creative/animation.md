# Animation (2D)

## 12 Principles of Animation (Disney / Ollie Johnston & Frank Thomas)
- **Squash & stretch**: deform to show weight/flexibility — squash on impact, stretch on acceleration. Maintain volume (wide + short = same area as tall + thin)
- **Anticipation**: small opposite motion before main action — crouch before jump, pull back before punch. Prepares viewer, makes action read clearly
- **Staging**: present idea so it's unmistakable — silhouette, composition, camera angle. One action at a time, clear shapes, avoid visual clutter
- **Straight-ahead vs pose-to-pose**: straight-ahead (draw frame by frame — fluid, unpredictable) vs pose-to-pose (draw keyframes first, fill later — controlled, planned). Most professionals use pose-to-pose for action, straight-ahead for effects (fire, water)
- **Follow-through & overlapping**: parts continue moving after main action stops (hair, coat, tail) and different parts move at different rates
- **Slow-in & slow-out**: more frames near key poses (ease-in/ease-out) — fewer frames = snappier, more = smoother. Spacing determines speed perception
- **Arcs**: most natural motion follows curved paths, not straight lines. Head turns, arm swings, bouncing ball — check arcs in cleanup
- **Secondary action**: small supporting motions that add life (juggler's face while juggling, bird's tail bob while walking). Don't overshadow main action
- **Timing**: number of frames determines speed and weight. 2 frames for a fast blink, 12 frames for a slow, heavy object falling. More frames = heavier/slower
- **Exaggeration**: push poses, expressions, and actions beyond reality but stay believable. Cartoony = more exaggeration, realistic = subtle
- **Solid drawing**: understand 3D form, weight, volume, perspective. Good anatomy and construction fundamentals essential
- **Appeal**: character is interesting to watch — clear design, pleasing proportions, charismatic movement. Not just "cute" — villains need appeal too

## Software
- **Blender (free)**: Grease Pencil for 2D animation within 3D space. Powerful but steep learning curve. Onion skinning, bone rigging, camera moves
- **Toon Boom Harmony**: industry standard for TV/feature (Rick and Morty, SpongeBob, Cuphead). Rigging + frame-by-frame. Expensive (~$600+)
- **Adobe After Effects**: primarily motion graphics and compositing. Puppet Pin tool for rigging, shape layers for vector animation. Not for hand-drawn
- **Procreate (iPad)**: excellent frame-by-frame with intuitive onion skin, recording, export. $10 one-time. Limited to simple projects (no rigging, no lip-sync tools)
- **Pencil2D (free)**: open-source, lightweight. Raster + vector. Good for beginners learning traditional animation. No rigging
- **Other**: TVPaint (hand-drawn focus, used in French animation), CelAction2D (cut-out rigging for TV), OpenToonz (free, Studio Ghibli used older version), Krita (free, decent frame-by-frame)
- **Asset pipeline**: draw → scan/cleanup → color → composite → sound → export. Line art separate from color layers

## Frame Rates
- **24 fps**: cinematic standard. 1 second = 24 frames. "On twos" (one drawing every 2 frames = 12 drawings/sec) saves labor — common in TV. "On ones" (24 drawings/sec) for smooth motion — used in film, action scenes
- **30 fps**: TV broadcast standard (NTSC). Common in web animation, some anime. 30 fps sometimes looks "smoother" but less cinematic
- **60 fps**: high frame rate for games, web animation, some streaming. Rarely used in hand-drawn (too labor-intensive). Usually tweened/rigged animation
- **FPS decisions**: 24 fps on 2s = 12 unique drawings/sec (standard). 24 fps on 1s = 24 drawings (high quality). 12 fps on 2s = 6 drawings (limited animation — anime budget style)
- **PAL/SECAM** regions: 25 fps standard. Convert: 24→25 speeds up slightly (4%), pitch correction needed for audio

## Keyframes vs In-Betweens
- **Keyframes**: extreme poses that define the action — start, end, major positions. Drawn by lead animator. Marked on exposure sheet (X-sheet) with frame numbers
- **Breakdowns**: drawings between keys that define the path of action (the extreme in-between). Often drawn by assistant animator
- **In-betweens**: frames that complete the motion between keys/breakdowns. Drawn by in-betweener (junior role). Can be automated in digital (interpolation/tweening)
- **Timing chart**: notes on keyframe specifying spacing of in-betweens — even (linear), slow-in, slow-out, or custom. Written as numbers on edge of drawing
- **Straight ahead**: no keyframes — draw sequentially. Organic, fluid, but proportions drift. Good for effects, wild motion
- **Exposure sheets (dope sheets)**: frame-by-frame breakdown of action, dialogue, camera instructions. Essential for team coordination

## Rigging vs Frame-by-Frame
- **Frame-by-frame (traditional)**: each frame drawn individually. More expressive, organic motion. Labor-intensive (24 drawings/sec at 24fps). Used for feature films, expressive character animation, effects
- **Rigging (cut-out animation)**: character built from separate parts (head, torso, arms, legs) with pivot points. Manipulate like a puppet. Faster and cheaper. Used for TV (South Park, Family Guy, many web series). Software: Toon Boom Harmony, Adobe Animate, Spine, DragonBones
- **Hybrid**: rigged characters with frame-by-frame elements (hand shapes, face replacements, effects). Common in modern TV animation to balance budget + quality
- **Pros/cons**: rigging = consistent proportions, faster, easier lip-sync, reusable assets. Frame-by-frame = more fluid motion, expressive, organic, but time-consuming and expensive. Rigging struggles with extreme angles, squash/stretch naturally

## Export Formats
- **Video**: MP4 (H.264 — universal, compressed), MOV (ProRes — high quality, for editing), AVI (uncompressed, huge), WebM (web, transparent alpha support), GIF (legacy, 256 colors, large file, no audio)
- **Image sequences**: PNG sequence (lossless, alpha channel — used for compositing in post-production). EXR (high color depth, HDR, for VFX). TGA (older standard). Import sequence into video editor at correct frame rate
- **Vector**: SWF (Flash legacy), SVG (web vector animation). Vector keeps sharp at any resolution, small file for simple shapes
- **Delivery specs**: check platform requirements — YouTube: H.264, 24/30/60fps, up to 4K. Broadcast: specific codec/frame rate/color space. Web: optimized MP4, reduce bitrate (5-15 Mbps for 1080p)
