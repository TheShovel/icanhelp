---
name: theme-factory
description: Create, customize, and apply visual themes for the icanhelp app. Use when the user wants to change colors, create a new theme, apply a saved theme, or customize the app's appearance. Provides color palette guidance and theme management.
---

# Theme Factory

Create and manage visual themes for the icanhelp desktop app. The app uses CSS variables for theming — you set colors and the UI updates in real time.

## Available CSS Variables

| Variable | Purpose |
|----------|---------|
| `--bg-panel` | Main panel background |
| `--bg-header` | Title/header bar |
| `--bg-body` | Chat area background |
| `--bg-input` | Input field background |
| `--bg-code` | Code block background |
| `--bg-tool` | Tool result block background |
| `--border` | Subtle borders |
| `--border-strong` | Strong borders |
| `--fg` | Primary text color |
| `--fg-dim` | Secondary/dim text |
| `--fg-muted` | Muted/low-priority text |
| `--accent` | Accent color (buttons, links) |
| `--accent-hover` | Accent hover state |
| `--user-bubble-bg` | User message bubble background |
| `--user-bubble-fg` | User message bubble text |
| `--danger` | Destructive/danger color |

## Creating a Theme

### 1. Understand the user's request
Listen for keywords: "dark theme", "light theme", "blue theme", "green", "minimal", "warm", "cozy", etc. Fetch inspiration if needed.

### 2. Design the palette
Pick colors that work together. Use the `set_theme` tool with color values. Only use the variable names listed above. Values must be hex colors (e.g. `#1a1a2e`) or rgba().

### 3. Apply and iterate
Apply the theme using `set_theme`. The user can see the changes immediately. Iterate based on feedback.

### 4. Save the theme
Ask if the user wants to save the theme with a name. Use `save-theme` IPC to persist it.

## Theme Design Guidance

**Dark themes**: Start with `--bg-panel: #1a1b1e` or similar dark, `--fg: #e0e0e0` for text. Use muted accents that don't clash.

**Light themes**: Start with `--bg-panel: #ffffff` or warm off-white, `--fg: #1a1a1a` for text. Keep accents saturated enough to pop.

**Color-specific themes**: Use color theory. Blue themes: try `--accent: #5a9cf8`. Green themes: `--accent: #4caf50`. Warm themes: use oranges/ambers.

**Minimal themes**: Reduce contrast between surfaces. Use few accent colors. Keep borders subtle.

## Theme Management Tools

- `set_theme` — apply colors immediately and optionally save
- `list_themes` — see all saved themes
- `apply_theme` — load a saved theme
- `delete_theme` — remove a saved theme

## Example Theme: Dark Ocean

```json
{
  "--bg-panel": "#0d1117",
  "--bg-header": "#161b22",
  "--bg-body": "#0d1117",
  "--bg-input": "#21262d",
  "--bg-code": "#161b22",
  "--bg-tool": "#161b22",
  "--border": "#30363d",
  "--border-strong": "#484f58",
  "--fg": "#c9d1d9",
  "--fg-dim": "#8b949e",
  "--fg-muted": "#6e7681",
  "--accent": "#58a6ff",
  "--accent-hover": "#79c0ff",
  "--user-bubble-bg": "#1f6feb",
  "--user-bubble-fg": "#ffffff",
  "--danger": "#f85149"
}
```

Always use valid hex or rgba values. Apply the theme using `set_theme` with the `properties` parameter.
