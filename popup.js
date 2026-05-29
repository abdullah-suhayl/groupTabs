// TabAlign Popup Logic Controller

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const btnGroupNow = document.getElementById("btn-group-now");
  const btnUngroupAll = document.getElementById("btn-ungroup-all");
  const toggleAutoGroup = document.getElementById("auto-group-toggle");
  const btnThemeToggle = document.getElementById("btn-theme-toggle");
  
  const statGroups = document.getElementById("stat-groups");
  const statEfficiency = document.getElementById("stat-efficiency");
  const totalTabsBadge = document.getElementById("total-tabs-badge");
  const groupsList = document.getElementById("groups-list");
  
  const settingsTrigger = document.getElementById("settings-trigger");
  const settingsContent = document.getElementById("settings-content");
  const settingsAccordion = settingsTrigger.closest(".settings-accordion");
  
  const minTabsSlider = document.getElementById("min-tabs-slider");
  const minTabsValue = document.getElementById("min-tabs-value");
  const toggleCollapseInactive = document.getElementById("toggle-collapse-inactive");
  const ignoredDomainsInput = document.getElementById("ignored-domains-input");
  const btnSaveSettings = document.getElementById("btn-save-settings");

  // Theme Rotation Config
  const THEME_CLASSES = ["theme-light", "theme-dark", "theme-brutalist", "theme-glass"];
  const THEME_LABELS = ["Theme: A", "Theme: B", "Theme: C", "Theme: D"]; // A=Light, B=Dark, C=Brutalist, D=Glass

  // Global popup state
  let currentWindowId = null;

  // Initialize
  chrome.windows.getCurrent((win) => {
    currentWindowId = win.id;
    loadSettings();
    updateDashboard();
  });

  // Load and apply settings to UI
  function loadSettings() {
    chrome.storage.local.get({
      minTabs: 2,
      autoGroup: false,
      collapseInactive: false,
      ignoredDomains: [],
      themeIndex: 1 // Default to Vercel Dark (B)
    }, (settings) => {
      minTabsSlider.value = settings.minTabs;
      minTabsValue.textContent = settings.minTabs;
      toggleAutoGroup.checked = settings.autoGroup;
      toggleCollapseInactive.checked = settings.collapseInactive;
      ignoredDomainsInput.value = settings.ignoredDomains.join(", ");
      
      // Apply persisted theme
      applyTheme(settings.themeIndex);
    });
  }

  // Theme apply routine
  function applyTheme(index) {
    document.body.className = THEME_CLASSES[index];
    if (btnThemeToggle) {
      btnThemeToggle.textContent = THEME_LABELS[index];
    }
  }

  // Theme rotate listener
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener("click", () => {
      chrome.storage.local.get({ themeIndex: 1 }, (data) => {
        const nextIndex = (data.themeIndex + 1) % THEME_CLASSES.length;
        chrome.storage.local.set({ themeIndex: nextIndex }, () => {
          applyTheme(nextIndex);
        });
      });
    });
  }

  // Save Settings
  btnSaveSettings.addEventListener("click", () => {
    const minTabs = parseInt(minTabsSlider.value, 10);
    const autoGroup = toggleAutoGroup.checked;
    const collapseInactive = toggleCollapseInactive.checked;
    
    // Parse domains
    const ignored = ignoredDomainsInput.value
      .split(",")
      .map(d => d.trim().toLowerCase())
      .filter(d => d.length > 0);

    chrome.storage.local.set({
      minTabs,
      autoGroup,
      collapseInactive,
      ignoredDomains: ignored
    }, () => {
      // Show saved state feedback on button
      const originalText = btnSaveSettings.textContent;
      btnSaveSettings.textContent = "Saved Successfully!";
      btnSaveSettings.style.background = "rgba(16, 185, 129, 0.2)";
      btnSaveSettings.style.color = "#34d399";
      btnSaveSettings.style.borderColor = "rgba(16, 185, 129, 0.5)";
      
      setTimeout(() => {
        btnSaveSettings.textContent = originalText;
        btnSaveSettings.style.background = "";
        btnSaveSettings.style.color = "";
        btnSaveSettings.style.borderColor = "";
        
        // Collapse settings panel after save
        settingsContent.classList.add("hidden");
        settingsAccordion.classList.add("collapsed");
      }, 1000);

      // Trigger automatic regrouping if settings change
      chrome.runtime.sendMessage({ action: "groupTabs" }, () => {
        updateDashboard();
      });
    });
  });

  // Slider change listener
  minTabsSlider.addEventListener("input", (e) => {
    minTabsValue.textContent = e.target.value;
  });

  // Auto Group Quick Toggle Listener
  toggleAutoGroup.addEventListener("change", () => {
    chrome.storage.local.set({ autoGroup: toggleAutoGroup.checked }, () => {
      if (toggleAutoGroup.checked) {
        chrome.runtime.sendMessage({ action: "groupTabs" }, () => {
          updateDashboard();
        });
      }
    });
  });

  // Settings Panel Toggle
  settingsTrigger.addEventListener("click", () => {
    const isHidden = settingsContent.classList.contains("hidden");
    if (isHidden) {
      settingsContent.classList.remove("hidden");
      settingsAccordion.classList.remove("collapsed");
    } else {
      settingsContent.classList.add("hidden");
      settingsAccordion.classList.add("collapsed");
    }
  });

  // Core Quick Action Buttons
  btnGroupNow.addEventListener("click", () => {
    // Add active animation
    btnGroupNow.classList.add("loading");
    chrome.runtime.sendMessage({ action: "groupTabs" }, (response) => {
      btnGroupNow.classList.remove("loading");
      updateDashboard();
    });
  });

  btnUngroupAll.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "ungroupAll" }, () => {
      updateDashboard();
    });
  });

  // Fetch data and update UI Dashboard
  async function updateDashboard() {
    if (currentWindowId === null) return;

    try {
      // Get all unpinned tabs in the current window
      const tabs = await chrome.tabs.query({ windowId: currentWindowId, pinned: false });
      const pinnedTabs = await chrome.tabs.query({ windowId: currentWindowId, pinned: true });
      const allTabsCount = tabs.length + pinnedTabs.length;
      totalTabsBadge.textContent = `${allTabsCount} Tab${allTabsCount !== 1 ? 's' : ''}`;

      // Get all active tab groups in the window
      const groups = await chrome.tabGroups.query({ windowId: currentWindowId });
      statGroups.textContent = groups.length.toString();

      // Calculate Clutter Score
      // If no unpinned tabs, efficiency is 100%
      if (tabs.length === 0) {
        statEfficiency.textContent = "100%";
      } else {
        const groupedTabsCount = tabs.filter(t => t.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE).length;
        // Visual clutter saved represents how many tabs were compacted into groups.
        // e.g. 5 tabs in 1 group saved 4 slots on the tab bar.
        const originalSpace = tabs.length;
        const currentSpace = (tabs.length - groupedTabsCount) + groups.length;
        
        const spaceSaved = originalSpace - currentSpace;
        const reductionPct = originalSpace > 0 ? Math.round((spaceSaved / originalSpace) * 100) : 0;
        statEfficiency.textContent = `${reductionPct}%`;
      }

      // Populate Groups list explorer
      groupsList.innerHTML = "";

      if (groups.length === 0) {
        renderEmptyState();
        return;
      }

      // Build mapping of GroupId -> Tabs
      const groupTabMap = {};
      for (const group of groups) {
        groupTabMap[group.id] = [];
      }

      for (const tab of tabs) {
        if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE && groupTabMap[tab.groupId] !== undefined) {
          groupTabMap[tab.groupId].push(tab);
        }
      }

      // Render each group and its child tabs
      for (const group of groups) {
        const groupTabs = groupTabMap[group.id] || [];
        if (groupTabs.length === 0) continue; // Skip empty groups

        const groupItem = document.createElement("div");
        groupItem.className = "group-item collapsed"; // default collapsed
        groupItem.dataset.groupId = group.id;

        // Group Header Shell
        const header = document.createElement("div");
        header.className = "group-summary-header";

        // Left Section: Color pill + Group title + Badge
        const leftSec = document.createElement("div");
        leftSec.className = "group-title-side";
        
        const pill = document.createElement("span");
        pill.className = `color-pill ${group.color}`;
        
        const nameSpan = document.createElement("span");
        nameSpan.className = "group-name";
        nameSpan.textContent = group.title || "Grouped";
        nameSpan.title = group.title || "Grouped";

        const countBadge = document.createElement("span");
        countBadge.className = "group-count";
        countBadge.textContent = `${groupTabs.length}`;

        leftSec.appendChild(pill);
        leftSec.appendChild(nameSpan);
        leftSec.appendChild(countBadge);

        // Right Section: Group actions (Ungroup + Accordion Arrow)
        const rightSec = document.createElement("div");
        rightSec.className = "group-actions-side";

        const btnUngroupSingle = document.createElement("button");
        btnUngroupSingle.className = "btn-icon-sm";
        btnUngroupSingle.title = "Ungroup this domain";
        btnUngroupSingle.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 17v-4h6v4M12 9V5" />
          </svg>
        `;
        btnUngroupSingle.addEventListener("click", (e) => {
          e.stopPropagation(); // Prevent accordion toggle
          ungroupSingleGroup(group.id);
        });

        const chevron = document.createElement("div");
        chevron.className = "chevron-toggle btn-icon-sm";
        chevron.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        `;

        rightSec.appendChild(btnUngroupSingle);
        rightSec.appendChild(chevron);

        header.appendChild(leftSec);
        header.appendChild(rightSec);

        // Accordion functionality
        header.addEventListener("click", () => {
          const isCollapsed = groupItem.classList.contains("collapsed");
          if (isCollapsed) {
            // Expand
            groupItem.classList.remove("collapsed");
          } else {
            // Collapse
            groupItem.classList.add("collapsed");
          }
        });

        // Tabs List Shell
        const listContainer = document.createElement("div");
        listContainer.className = "group-tabs-list";

        groupTabs.forEach(tab => {
          const tabItem = document.createElement("div");
          tabItem.className = "tab-list-item";
          
          const mainInfo = document.createElement("div");
          mainInfo.className = "tab-main-info";

          // Favicon or default glob SVG
          let favEl;
          if (tab.favIconUrl && !tab.favIconUrl.startsWith("chrome://")) {
            favEl = document.createElement("img");
            favEl.className = "tab-fav";
            favEl.src = tab.favIconUrl;
            favEl.onerror = () => {
              favEl.replaceWith(createDefaultFavicon());
            };
          } else {
            favEl = createDefaultFavicon();
          }

          const titleSpan = document.createElement("span");
          titleSpan.className = "tab-title-text";
          titleSpan.textContent = tab.title || "Untitled Tab";
          titleSpan.title = tab.title || "Untitled Tab";

          mainInfo.appendChild(favEl);
          mainInfo.appendChild(titleSpan);

          // Tab actions (Close individual tab)
          const tabActions = document.createElement("div");
          tabActions.className = "tab-actions";

          const btnCloseTab = document.createElement("button");
          btnCloseTab.className = "btn-icon-sm";
          btnCloseTab.title = "Close tab";
          btnCloseTab.innerHTML = `
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          `;
          btnCloseTab.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent tab focus
            closeSingleTab(tab.id);
          });

          tabActions.appendChild(btnCloseTab);

          tabItem.appendChild(mainInfo);
          tabItem.appendChild(tabActions);

          // Focus tab on click
          tabItem.addEventListener("click", () => {
            chrome.tabs.update(tab.id, { active: true });
            chrome.windows.update(tab.windowId, { focused: true });
          });

          listContainer.appendChild(tabItem);
        });

        groupItem.appendChild(header);
        groupItem.appendChild(listContainer);
        groupsList.appendChild(groupItem);
      }
    } catch (err) {
      console.error("Dashboard render error:", err);
    }
  }

  // Create fallback standard globe SVG
  function createDefaultFavicon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "tab-fav default-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.innerHTML = `
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" />
    `;
    return svg;
  }

  // Render Empty State
  function renderEmptyState() {
    groupsList.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18"/>
        </svg>
        <p>No tab groups active in this window.</p>
        <span class="subtext">Click "Align Tabs" above to clear the clutter!</span>
      </div>
    `;
  }

  // Remove single tab
  async function closeSingleTab(tabId) {
    try {
      await chrome.tabs.remove(tabId);
      updateDashboard();
    } catch (e) {
      console.error(e);
    }
  }

  // Ungroup all tabs of a specific group
  async function ungroupSingleGroup(groupId) {
    try {
      const tabs = await chrome.tabs.query({ windowId: currentWindowId, groupId: groupId });
      const tabIds = tabs.map(t => t.id);
      if (tabIds.length > 0) {
        await chrome.tabs.ungroup(tabIds);
      }
      updateDashboard();
    } catch (e) {
      console.error(e);
    }
  }
});
