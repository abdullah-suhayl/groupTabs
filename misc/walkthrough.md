# Walkthrough: TabAlign - Premium Tab Grouping Chrome Extension

Thank you for choosing **TabAlign**, a premium, gorgeous, and feature-rich Chrome extension built to declutter your browsing experience by grouping active tabs elegantly by their domains. 

Below is an overview of the features, how they work under the hood, and a step-by-step guide to loading the extension into your browser.

---

## 🌟 Feature Highlights

1. **Intelligent Domain Grouping**: One click organizes your chaotic tabs into neat, organized domain groups.
2. **Unified "Misc" Fallback**: Any domain that contains only a single tab (or fewer than your custom minimum grouping threshold) is gathered into a dedicated, grey-coded "Misc" group. This prevents orphans and leaves your tab bar completely ordered.
3. **Premium Visuals**: Calming Tech-Minimalist Dark theme (Vercel/Linear Dark style) design system featuring deep charcoal slate backgrounds (`#0c0c0e`), Zinc-900 container cards (`#18181b`), thin Zinc-800 borders (`#27272a`), stark off-white primary buttons, desaturated Linear color dots, and clean typographic layers.
4. **Consistently Beautiful Colors**: An integrated domain-hashing algorithm maps each domain to a specific color (e.g., Google is consistently blue, GitHub is purple).
5. **Real-time Metrics Dashboard**: Displays active group counts and a live "Clutter Reduction Index" showing exactly how much tab space you saved.
6. **Master Auto-Grouping**: A quick toggle switch that automates grouping on the fly as you browse, open, close, or update tabs.
7. **Detailed Tab Explorer**: An interactive, expandable accordion listing every active group and its member tabs. You can focus a tab, close individual tabs, or ungroup an entire domain directly from the popup.
8. **Advanced Customization**:
   - Set the minimum number of tabs required per domain before grouping occurs.
   - Automatically collapse inactive groups to maximize space.
   - Ignore specific domains (like `localhost` or search engines) entirely.

---

## 📁 Extension Directory Structure

All files have been set up and configured perfectly in your workspace at `/home/sushi/groupTabs`:

- `manifest.json`: Configuration using modern Manifest V3, asserting permission scopes (`tabs`, `tabGroups`, `storage`, `contextMenus`).
- `background.js`: Service worker governing context menus, automatic auto-grouping triggers, and debounced API requests.
- `popup.html`: The user dashboard interface.
- `popup.css`: Premium layout styles featuring glassmorphism cards and smooth custom transitions.
- `popup.js`: Responsive client-side controller managing live metrics, toggles, accordions, settings, and direct state management.
- `icons/`: Sleek gradient PNG assets generated dynamically in 16x16, 32x32, 48x48, and 128x128 sizes.

---

## 🚀 How to Install TabAlign in Chrome

Follow these simple steps to load your custom extension into Google Chrome:

1. Open your Google Chrome browser.
2. In the address bar, type `chrome://extensions/` and hit **Enter**.
3. In the top-right corner of the Extensions page, turn **ON** the **Developer mode** toggle switch.
4. In the top-left corner, click the **Load unpacked** button.
5. In the file selection dialog, navigate to the folder where the project is located:
   `[groupTabs](file:///home/sushi/groupTabs)`
6. Select this directory and click **Open** (or **Select Folder**).
7. 🎉 **TabAlign** will load instantly! You will see its beautiful gradient icon in your extension bar. Pin it for quick access!

---

## ⚙️ How to Use TabAlign

- **Manual Grouping**: Open multiple tabs (e.g., three Google tabs, four GitHub tabs), click the TabAlign extension icon, and click the **Align Tabs** button. Watch your tabs instantly snap into elegant colored groups.
- **Context Menus**: Right-click the extension icon in your browser toolbar to instantly run actions like "Group Tabs by Domain" or "Ungroup All Tabs" without even opening the popup.
- **Dynamic Controls**: Open the popup, toggle the "Auto" switch at the top, and watch tabs auto-align instantly in the background as you browse! Open the **Preference Panel** at the bottom to configure grouping limits or add ignored domains.
