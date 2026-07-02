---
name: clean-code
description: Enforces clean, minimal code by prohibiting unnecessary comments and decorative styling. Use when writing or reviewing any code in this project.
---

# Clean Code Guidelines

Apply these rules to all code written in this project.

## Comments

- **Do not write comments that restate the code.** If the code is self-explanatory, leave it bare.
- Only add a comment when it explains **non-obvious intent**, **constraints**, or **tradeoffs** that aren't visible from the code itself.
- Remove section-header banners like `// ======` or `/* ------ */`. They're visual noise.
- Remove obvious labels like `// DOM references`, `// State`, `// Toggle chat panel` if the code structure already makes them clear.
- Keep comments short and surgical when they are needed.

## Styling / CSS

- Write only the styles needed for the feature to function correctly.
- Do not add decorative flourishes, elaborate animations, or visual effects that serve no functional purpose.
- Avoid overly specific or nested selectors when simpler ones suffice.
- Do not add comments that describe what a CSS rule does unless the rule is genuinely non-obvious.
- Gradients, shadows, blur effects, and animations are allowed only when they serve a clear functional or UX purpose (e.g., indicating interactivity, providing visual feedback, showing state changes).

## General

- Prefer self-documenting code: clear variable names, simple logic, obvious structure.
- A file with fewer lines is better than a file with more lines, all else being equal.
- If a comment could be replaced by a better variable or function name, do that instead.
