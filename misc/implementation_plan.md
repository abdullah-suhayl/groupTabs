# Implementation Plan: TabAlign - Premium Tab Grouping Chrome Extension

TabAlign is a state-of-the-art Chrome Extension that automatically and elegantly groups browser tabs by their domains. It features a calming, premium Dark Tech-Minimalist (Vercel/Linear style) popup dashboard, real-time statistics, customizable grouping parameters, auto-grouping capabilities, and robust group management controls.

## Design Aesthetics & UI Features
- **Aesthetic**: Premium Tech-Minimalist Dark theme (Vercel / Linear / GitHub Dark style) using deep charcoal slate (`#0c0c0e`), Zinc-900 card containers (`#18181b`), thin Zinc-800 borders (`#27272a`), stark off-white primary buttons, desaturated Linear color dots, and clean typographic layers.
- **Responsive Layout**: Designed to look stunning as a compact popup window.
- **Interactive Controls**: Rounded custom switches, thin border range sliders, custom group color assigners, and elegant divider accordion tab lists.
- **Statistics Widget**: Simplified inline text statistics showing active groups and clutter savings without heavy containers.

## Technical Architecture (Manifest V3)
- `manifest.json`: Manifest V3 configuration with appropriate permissions (`tabs`, `tabGroups`, `storage`, `contextMenus`).
- `background.js`: Service worker handling:
  - Context menu actions.
  - Auto-grouping triggers (optional toggle).
  - Background state synchronization.
- `popup.html`: The HTML5 shell of the dashboard.
- `popup.js`: Dashboard controller for user interaction, stats rendering, manual group triggers, and custom rules configuration.
- `popup.css`: Premium Vanilla CSS containing custom variables, animations, and the glassmorphic design system.

---

## Detailed Step-by-Step Implementation

### Step 1: Manifest V3 Configuration (`manifest.json`)
Create `manifest.json` with standard permissions and declare background script, popup, and keyboard shortcuts.

### Step 2: SVG Icons Creation
Create elegant, vector-based SVG icons for 16x16, 32x32, 48x48, and 128x128 sizes. SVG is modern, crisp, and fully supported in modern Chrome actions. We'll also provide a simple canvas script to output PNGs if needed.

### Step 3: Background Service Worker (`background.js`)
Implement:
- Listeners for `chrome.runtime.onInstalled` to set default settings in local storage.
- Context menu creation and event listeners.
- Tab creation/update listeners for auto-grouping (if enabled in settings).
- Centralized domain parsing logic.
- **Orphan/Single Tab Grouping (Misc)**: Any domain with exactly 1 tab (or fewer than `minTabs`) is gathered and grouped into a neutral grey "Misc" tab group, ensuring a completely clean and grouped tab bar.

### Step 4: Core CSS Styling & Theme (`popup.css`)
Design a stunning visual interface:
- Smooth dark/light gradient background.
- Glassmorphic card container with `backdrop-filter`.
- Fluid UI animations using keyframes.
- Custom styling for Chrome-style tab group colors (Blue, Red, Yellow, Green, Pink, Purple, Cyan, Orange, Grey).

### Step 5: Dashboard Popup Layout (`popup.html`)
Build a semantic HTML structure:
- **Header**: Logo, version, and master auto-grouping toggle.
- **Quick Action Panel**: "Group Now" button with ripple effect, "Ungroup All" clean-up button.
- **Statistics Panel**: Active groups, tab count, clutter index, top domains.
- **Interactive Tab List**: Accordion showing all created groups, their colors, their member tabs, and individual controls to rename/ungroup/close.
- **Settings Panel**: Configure minimum tabs per group, domain exclusion lists, and behavior customization.

### Step 6: Logic Controller (`popup.js`)
Implement UI wiring:
- Load current state, settings, and render real-time statistics.
- Perform core grouping algorithm using Chrome's `chrome.tabs.group` and `chrome.tabGroups` APIs.
- Bind event listeners for real-time manual renaming, color adjustment, and tab removal.
- Persist user configuration using `chrome.storage.local`.

### Step 7: Testing & Verification
Verify MV3 compatibility, check for lint errors, and test edge cases (like `chrome://` URLs, empty tabs, and pinning behavior).
