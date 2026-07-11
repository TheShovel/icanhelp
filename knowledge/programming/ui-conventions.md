# UI Element Identification & Conventions

## Overview
This guide covers standard UI conventions across major platforms (Windows, macOS, Linux, Web, Mobile) for identifying and locating interface elements. These patterns help users and automation reliably find menus, buttons, controls, and navigation elements.

## Universal UI Element Types

### Menu Bars
| Platform | Location | Access Method |
|----------|----------|---------------|
| **Windows** | Top of application window (below title bar) | Alt key reveals accelerators |
| **macOS** | Top of screen (global menu bar) | Always visible, app-specific |
| **Linux (GNOME/KDE)** | Top of application window or top panel | Varies by DE |
| **Web Apps** | Top of viewport or hamburger menu | Hamburger ☰ or kebab ⋮ |

### Common Menu Bar Items (Left to Right)
```
File → Edit → View → Insert → Format → Tools → Window → Help
```

### Context Menus (Right-Click)
- **Trigger**: Right-click (or Ctrl+click on macOS, long-press on touch)
- **Location**: Appears at cursor position
- **Common Items**: Cut/Copy/Paste, Delete, Rename, Properties, Open With, Share

### Toolbars
- **Primary Toolbar**: Below menu bar, common actions (Save, Print, Undo/Redo)
- **Secondary/Contextual Toolbars**: Appear based on selection/mode
- **Customizable**: Users can add/remove/reorder buttons
- **Overflow**: Chevron » or double-arrow ⋯ for hidden items

## Platform-Specific Conventions

### Windows (Win32, UWP, WinUI 3)

#### Window Structure
```
┌─────────────────────────────────────────────┐
│  ● App Icon  Title Bar Text          ─ □ ✕ │  ← Title Bar (draggable)
├─────────────────────────────────────────────┤
│ File  Edit  View  Tools  Help               │  ← Menu Bar (Alt activates)
├─────────────────────────────────────────────┤
│ [Toolbar buttons...]              [Search]  │  ← Toolbar
├─────────────────────────────────────────────┤
│ Sidebar │ Main Content Area                 │  ← Body
│         │                                   │
├─────────────────────────────────────────────┤
│ Status Bar: Ready | Line 1, Col 1 | 100%    │  ← Status Bar
└─────────────────────────────────────────────┘
```

#### Standard Controls Locations
| Element | Typical Location |
|---------|------------------|
| **Minimize/Maximize/Close** | Top-right (● ─ ✕) |
| **Window Icon/System Menu** | Top-left (right-click for Move/Size/Min/Max/Close) |
| **Ribbon Tabs** | Below menu bar (File, Home, Insert, etc.) |
| **Quick Access Toolbar** | Above or below ribbon (customizable) |
| **Address/Path Bar** | Top of Explorer windows |
| **Search Box** | Top-right of window |
| **Status Bar** | Bottom of window |
| **Scroll Bars** | Right edge (vertical), bottom (horizontal) |

#### Keyboard Conventions
- **Alt**: Activates menu bar accelerators (underlined letters)
- **Alt+F4**: Close window
- **Alt+Space**: System menu
- **F10**: Activates menu bar
- **Ctrl+Tab / Ctrl+Shift+Tab**: Cycle tabs
- **Win+Up/Down/Left/Right**: Window snap

### macOS (Cocoa/AppKit)

#### Window Structure
```
┌─────────────────────────────────────────────┐
│ ◉ ● ●  Window Title                    │  ← Title Bar (traffic lights left)
├─────────────────────────────────────────────┤
│ File  Edit  View  Window  Help              │  ← Global Menu Bar (top of SCREEN)
├─────────────────────────────────────────────┤
│ [Toolbar: Back Forward ▼  Share  ⋮]         │  ← Toolbar (customizable)
├─────────────────────────────────────────────┤
│ Sidebar │ Main Content                      │
│         │                                   │
├─────────────────────────────────────────────┤
│ Status / Path Bar                           │
└─────────────────────────────────────────────┘
```

#### Standard Controls Locations
| Element | Location |
|---------|----------|
| **Close/Minimize/Zoom** | Top-left (red/yellow/green) |
| **Menu Bar** | **Top of screen** (not window) - changes per app |
| **Toolbar** | Below title bar, customizable (View → Customize Toolbar) |
| **Sidebar** | Left side (View → Show Sidebar) |
| **Inspector/Panel** | Right side (View → Show Inspector) |
| **Tab Bar** | Below toolbar or above content |
| **Touch Bar** | On supported MacBooks (contextual) |

#### macOS-Specific Conventions
- **Menu Bar is Global**: Always at top of screen, belongs to frontmost app
- **Window Controls**: Red=Close, Yellow=Minimize (to Dock), Green=Zoom/Fullscreen
- **Proxy Icon**: Document icon in title bar (drag to move/copy, ⌘-click for path)
- **Services Menu**: App → Services (system-wide actions)
- **Window Menu**: Window → Minimize, Zoom, Bring All to Front

#### Keyboard Conventions
- **⌘ (Command)**: Primary modifier (like Ctrl on Windows)
- **⌥ (Option)**: Alternate actions, special characters
- **⌃ (Control)**: Right-click equivalent, some shortcuts
- **Fn**: Hardware functions, Globe key on newer keyboards
- **⌘+Space**: Spotlight
- **⌘+Tab**: App switcher
- **⌘+`**: Cycle windows of same app
- **⌘+Q**: Quit app (not close window)

### Linux Desktop Environments

#### GNOME (GTK)
```
┌─────────────────────────────────────────────┐
│  Activities  App Title              ○ □ ✕  │  ← Top Bar (system)
├─────────────────────────────────────────────┤
│  [Header Bar: Title | Controls | Menu ⋮]   │  ← Header Bar (CSD)
├─────────────────────────────────────────────┤
│ Sidebar │ Content                           │
├─────────────────────────────────────────────┤
│ Status/Notifications                        │
└─────────────────────────────────────────────┘
```
- **Client-Side Decorations (CSD)**: App draws own title bar
- **Header Bar**: Combines title, controls, and menu (hamburger ⋮)
- **Application Menu**: In top bar (Activities) or header bar ⋮
- **No traditional menu bar** by default

#### KDE Plasma (Qt)
- Traditional menu bar in window (configurable)
- Global menu bar option (like macOS)
- Highly customizable panels

#### Common Linux Shortcuts
- **Alt+F2**: Run command
- **Super (Win)**: Open launcher/overview
- **Ctrl+Alt+T**: Terminal (often)
- **Ctrl+Alt+Del**: Logout dialog

### Web Applications

#### Standard Layout Patterns
```
┌─────────────────────────────────────────────┐
│ Logo  Navigation Links          User ▼  ☰  │  ← Header/Navbar
├─────────────────────────────────────────────┤
│ Sidebar │ Main Content                      │  ← Body
│         │                                   │
├─────────────────────────────────────────────┤
│ Footer: Links, Copyright, Social            │  ← Footer
└─────────────────────────────────────────────┘
```

#### Common Web UI Patterns

##### Navigation
| Pattern | Location | Trigger |
|---------|----------|---------|
| **Top Nav Bar** | Top of viewport | Always visible |
| **Hamburger Menu** | Top-left or top-right | Click ☰ |
| **Sidebar** | Left (or right) | Persistent or collapsible |
| **Tabs** | Below header or in content | Click to switch |
| **Breadcrumbs** | Below header, above content | Shows hierarchy |
| **Pagination** | Bottom of lists | Page numbers, prev/next |

##### User Account/Profile
- **Location**: Top-right corner
- **Trigger**: Avatar/initials, username, or chevron ▼
- **Dropdown Contents**: Profile, Settings, Billing, Sign Out, Switch Account

##### Search
- **Global Search**: Top-center or top-right (often ⌘+K / Ctrl+K)
- **Contextual Search**: Within specific section
- **Command Palette**: ⌘+K / Ctrl+K (Linear, GitHub, VS Code style)

##### Notifications
- **Bell Icon**: Top-right (🔔 with badge count)
- **Toast/ Snackbar**: Bottom-left, bottom-center, or top-right
- **In-app Notification Center**: Dropdown from bell or sidebar item

##### Help/Support
- **Question Mark ?**: Top-right or in user menu
- **Chat Widget**: Bottom-right floating button
- **Documentation Link**: Footer or help menu

### Mobile (iOS/Android)

#### iOS (Human Interface Guidelines)
```
┌─────────────────────┐
│ ← Back    Title    │  ← Navigation Bar
├─────────────────────┤
│                     │
│    Content          │
│                     │
├─────────────────────┤
│ ⋮ ⋮ ⋮  Tab Bar     │  ← Tab Bar (3-5 items)
└─────────────────────┘
```

| Element | Location |
|---------|----------|
| **Back Button** | Top-left (swipe from left edge also works) |
| **Title** | Center of navigation bar |
| **Primary Actions** | Top-right (single) or trailing |
| **Tab Bar** | Bottom (3-5 destinations) |
| **Toolbar** | Bottom (actions for current screen) |
| **Search** | Top of list (pull down) or tab bar |
| **Share/Action** | Bottom-center (square with arrow ↑) |
| **Settings** | Usually in profile tab or gear ⚙️ |

#### Android (Material Design)
```
┌─────────────────────────────┐
│ ←  Title              ⋮   │  ← Top App Bar
├─────────────────────────────┤
│                             │
│        Content              │
│                             │
├─────────────────────────────┤
│ ◉  ●  ●  Bottom Navigation  │  ← Bottom Nav (3-5 items)
└─────────────────────────────┘
```

| Element | Location |
|---------|----------|
| **Back** | System gesture (swipe from edge) or ← in app bar |
| **App Bar** | Top (title, actions, overflow ⋮) |
| **Bottom Navigation** | Bottom (3-5 primary destinations) |
| **Navigation Drawer** | Swipe from left edge or hamburger ☰ |
| **Bottom Sheet** | Slides up from bottom |
| **FAB (Floating Action Button)** | Bottom-right, above bottom nav |
| **Search** | In app bar or dedicated search screen |
| **Overflow Menu** | ⋮ in app bar |

## Standard Control Positions by Function

### File Operations
| Action | Windows | macOS | Web |
|--------|---------|-------|-----|
| **New** | File → New (Ctrl+N) | File → New (⌘N) | + button, Ctrl+N |
| **Open** | File → Open (Ctrl+O) | File → Open (⌘O) | Upload, Ctrl+O |
| **Save** | File → Save (Ctrl+S) | File → Save (⌘S) | Auto-save or ⌘S |
| **Save As** | File → Save As | File → Save As (⌘⇧S) | Export/Download |
| **Print** | File → Print (Ctrl+P) | File → Print (⌘P) | Print button, Ctrl+P |
| **Close Window** | File → Close (Ctrl+W) | File → Close Window (⌘W) | × or Close |
| **Quit App** | File → Exit (Alt+F4) | App → Quit (⌘Q) | Sign Out / Close tab |

### Edit Operations
| Action | Standard Location | Shortcut (Win) | Shortcut (Mac) |
|--------|-------------------|----------------|----------------|
| **Undo** | Edit → Undo | Ctrl+Z | ⌘Z |
| **Redo** | Edit → Redo | Ctrl+Y / Ctrl+Shift+Z | ⌘⇧Z |
| **Cut** | Edit → Cut | Ctrl+X | ⌘X |
| **Copy** | Edit → Copy | Ctrl+C | ⌘C |
| **Paste** | Edit → Paste | Ctrl+V | ⌘V |
| **Select All** | Edit → Select All | Ctrl+A | ⌘A |
| **Find** | Edit → Find | Ctrl+F | ⌘F |
| **Replace** | Edit → Replace | Ctrl+H | ⌘⌥F |

### View/Window Controls
| Action | Windows | macOS | Web |
|--------|---------|-------|-----|
| **Zoom In/Out** | View → Zoom (Ctrl+/-) | View → Zoom (⌘+/-) | Ctrl+/- |
| **Full Screen** | F11 / View → Full Screen | View → Full Screen (⌃⌘F) | F11 / Button |
| **Split View** | Win+Left/Right | Hover green button | Layout options |
| **Minimize** | Title bar _ or Win+Down | Yellow button / ⌘M | - |
| **Maximize** | Title bar □ or Win+Up | Green button / ⌃⌘F | - |
| **Close** | Title bar ✕ or Alt+F4 | Red button / ⌘W | × or Close |

### Help Menu
| Platform | Location | Contents |
|----------|----------|----------|
| **Windows** | Menu Bar → Help | Help Topics, About, Check Updates |
| **macOS** | Menu Bar → Help (searchable) | Search, Documentation, Shortcuts |
| **Web** | User menu → Help / Footer | Docs, Support, Feedback, Status |
| **Mobile** | Profile/Settings → Help | FAQ, Contact, Chat |

## Finding Hidden/Advanced UI Elements

### Developer/Debug Menus
| App Type | Access Method |
|----------|---------------|
| **Browsers** | F12 (DevTools), Ctrl+Shift+I |
| **VS Code** | Ctrl+Shift+P (Command Palette) → "Developer: Toggle Developer Tools" |
| **Electron Apps** | Ctrl+Shift+I (if enabled) |
| **Windows** | Win+X (Power User Menu) |
| **macOS** | ⌘⌥I (Web Inspector in WebViews) |

### Accessibility Features (Reveal Hidden UI)
| Feature | Windows | macOS | Purpose |
|---------|---------|-------|---------|
| **Screen Reader** | Narrator (Win+Ctrl+Enter) | VoiceOver (⌘F5) | Announces all elements |
| **Magnifier** | Win++ | ⌥⌘8 | Enlarges UI |
| **High Contrast** | Win+U → Contrast | System Settings → Accessibility | Visual clarity |
| **Show Keyboard Focus** | Settings → Accessibility | System Settings → Accessibility | Visibility |
| **Voice Control** | Win+H | ⌘F5 (VoiceOver) | Voice navigation |

### Hidden Power User UI
| Feature | Access |
|---------|--------|
| **Windows God Mode** | Folder named `GodMode.{ED7BA470-8E54-465E-825C-99712043E01C}` |
| **macOS Hidden Files** | ⌘⇧. in Finder |
| **Chrome Flags** | chrome://flags |
| **Firefox about:config** | about:config |
| **VS Code Settings** | Ctrl+, (JSON) or UI |
| **Firefox Developer Edition** | Separate install |

## Identifying UI Elements in Screenshots

### Visual Hierarchy Clues
1. **Title Bar**: Top-most, has window controls, app/icon + title
2. **Menu Bar**: Horizontal text labels, often with underlined accelerators
3. **Toolbar**: Icon buttons, often with tooltips on hover
4. **Tab Bar**: Horizontal segments, one highlighted/active
5. **Sidebar**: Vertical panel, often with navigation tree
6. **Status Bar**: Bottom, small text, read-only info
7. **Footer**: Bottom of web page, links, copyright

### State Indicators
| Visual Cue | Meaning |
|------------|---------|
| **Blue/Accent highlight** | Active/selected tab, button, row |
| **Grayed/disabled** | Unavailable action |
| **Loading spinner** | Background operation |
| **Red badge/count** | Notifications, errors, unread |
| **Green dot** | Online, connected, success |
| **Yellow/orange warning** | Attention needed |
| **Asterisk * or dot ●** | Unsaved changes |
| **Lock icon 🔒** | Secure/readonly/encrypted |

### Responsive Breakpoints (Web)
| Breakpoint | Typical Layout Change |
|------------|----------------------|
| **> 1200px** | Full desktop: sidebar + content + right panel |
| **992-1199px** | Tablet landscape: collapsible sidebar |
| **768-991px** | Tablet portrait: hamburger menu, stacked |
| **576-767px** | Mobile large: bottom nav, simplified |
| **< 576px** | Mobile small: single column, bottom sheets |

## Common Anti-Patterns to Recognize
- **Mystery Meat Navigation**: Icons without labels/tooltips
- **Hidden Scrollbars**: Content appears cut off
- **Modal Dialogs Without Escape**: Can't dismiss with Esc/click-outside
- **Invisible Focus States**: Can't see keyboard navigation
- **Buttons as Links / Links as Buttons**: Wrong affordance
- **Inconsistent Placement**: Save bottom-right on one page, top-left on another

## Quick Reference Card

```
WINDOWS          MACOS              WEB                  MOBILE
────────────────────────────────────────────────────────────────
Menu Bar      →  Top of Window     Top of Screen      Header/☰      ☰/Tab Bar
Close         →  Top-Right ✕       Top-Left 🔴        Tab ×         Swipe/Back
Minimize      →  Top-Right _       Top-Left 🟡        -             Home/Back
Maximize      →  Top-Right □       Top-Left 🟢        Fullscreen    -
File Menu     →  Alt+F             File (menu bar)    Header/☰      ☰/Profile
Edit Menu     →  Alt+E             Edit (menu bar)    Header/☰      ☰/Profile
Settings      →  File/Tools/☰      App Menu/☰         Profile/☰     Profile/⚙️
Help          →  F1 / Help menu    Help (menu bar)    Footer/Profile Settings/?
Search        →  Ctrl+F / Top-Right ⌘F / Top-Right    Header/⌘K     Top/Tab
New Window    →  Ctrl+N            ⌘N                 Ctrl+N        Tab+
Close Tab     →  Ctrl+W            ⌘W                 Ctrl+W        Swipe/×
Quit App      →  Alt+F4            ⌘Q                 Close Tab     Swipe Up
────────────────────────────────────────────────────────────────
```