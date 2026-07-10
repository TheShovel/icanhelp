---
name: webapp-testing
description: Test and debug local web applications — verify frontend functionality, inspect UI behavior, capture screenshots, check console logs. Use when the user is building or debugging a local web app and needs to verify it works correctly.
---

# Web Application Testing

Test local web applications systematically. Use Playwright to automate browser interaction and verify behavior.

## Approach

### Decision Tree

```
Is it static HTML?
  ├─ Yes → Read the HTML directly to identify selectors, then write a Playwright script
  └─ No (dynamic/JS-rendered) → Is the server already running?
       ├─ Yes → Navigate, wait for networkidle, inspect DOM, identify selectors, act
       └─ No → Start the server, then test
```

### Basic Playwright Script Template

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:PORT');
  await page.waitForLoadState('networkidle');
  // Your test logic here
  await page.screenshot({ path: '/tmp/test.png', fullPage: true });
  await browser.close();
})();
```

### Key Practices

- **Always wait for `networkidle`** before inspecting DOM on dynamic apps — JS may not have finished rendering
- **Use screenshots** to verify visual output
- **Check console logs** for errors and warnings
- **Use descriptive selectors**: `text=`, `role=`, CSS selectors, or IDs
- **Add appropriate waits**: `waitForSelector`, `waitForTimeout`
- **Always close the browser** when done

### Testing Checklist

- Does the page load without errors?
- Are all interactive elements functional (buttons, forms, links)?
- Does the UI respond correctly to user input?
- Are error states handled gracefully?
- Does the layout work at different viewport sizes?
- Are there console errors or warnings?
- Do async operations (API calls, data loading) complete successfully?

## App-Specific Testing

When testing the icanhelp Electron app itself, note:
- The app uses Electron's IPC for most operations
- The renderer communicates with the main process via `window.electronAPI`
- The app has overlay behavior (transparent, always-on-top)
- Themes are applied via CSS variables sent through IPC
- Screenshots can be taken with the app's built-in screenshot tools

Use `run_bash` to start dev servers and `run_bash` with Node for testing scripts when Playwright isn't available.
