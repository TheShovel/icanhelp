---
name: frontend-design
description: Create distinctive, intentional UI designs. Use when building new interfaces, redesigning existing ones, choosing colors and typography, or making layout decisions. Helps create visual designs that don't look like templates.
---

# Frontend Design

Design with intention. Every choice about color, type, spacing, and layout should serve the content and the user.

## Design Principles

**Ground it in the subject** — if the brief doesn't pin down what the product is about, name the subject, its audience, and the page's single job first. Let the subject's world inform the design choices.

**Typography carries personality** — pair display and body faces deliberately. Set a clear type scale with intentional weights, widths, and spacing. Make the type treatment a memorable part of the design, not a neutral delivery vehicle.

**Structure is information** — structural devices (dividers, labels, sections) should encode something true about the content, not decorate it. Numbered markers (01/02/03) only make sense if the content is actually a sequence.

**Leverage motion deliberately** — animation should serve the content and intent. An orchestrated landing moment usually beats scattered effects. Sometimes less is more — extra animation can make a design feel generic.

**Match complexity to the vision** — maximalist directions need elaborate execution; minimal directions need precision in spacing, type, and detail.

## Process

1. **Brainstorm a design plan** — create a compact token system with color palette (4-6 hex values), typefaces (2+ roles), layout concept, and the signature element this design will be remembered by.
2. **Review against the brief** — if any part reads like a generic default for any similar page, revise it.
3. **Build** — derive every color and type decision from the plan. CSS: avoid selector specificity conflicts. Build responsive down to mobile, respect reduced motion, maintain keyboard focus.
4. **Critique** — before calling it done, ask: does every element serve the purpose? Could anything be removed?

## App-Specific Context

When designing for this icanhelp app, work within these constraints:
- **Theme system**: CSS variables control all colors (`--bg-panel`, `--bg-header`, `--bg-body`, `--bg-input`, `--bg-code`, `--bg-tool`, `--border`, `--border-strong`, `--fg`, `--fg-dim`, `--fg-muted`, `--accent`, `--accent-hover`, `--user-bubble-bg`, `--user-bubble-fg`, `--danger`)
- **Transparent overlay**: the app runs as a semi-transparent window on the Linux desktop
- **Font**: the app uses system fonts for the UI; use `font-family` with fallbacks
- **Render**: the UI is rendered in Electron with standard HTML/CSS/JS

## Restraint

Spend boldness in one place. Let one element be the memorable signature. Keep everything else quiet and disciplined. Cut any decoration that doesn't serve the purpose. Before finishing, remove one accessory.
