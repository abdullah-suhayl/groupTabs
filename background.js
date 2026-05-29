// TabAlign Background Service Worker

// Chrome supported colors for tab groups
const CHROME_COLORS = ["blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange", "grey"];

// Default settings
const DEFAULT_SETTINGS = {
  minTabs: 2,
  autoGroup: false,
  collapseInactive: false,
  ignoredDomains: []
};

// Hash function to consistently map a domain to a color
function getDomainColor(domain) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % CHROME_COLORS.length;
  return CHROME_COLORS[index];
}

// Clean and extract domain from URL
function getDomain(url) {
  try {
    if (!url) return null;
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    let host = parsed.hostname;
    if (host.startsWith("www.")) {
      host = host.substring(4);
    }
    return host.toLowerCase();
  } catch (e) {
    return null;
  }
}

// Initialize settings and context menus on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS), (settings) => {
    const updatedSettings = {};
    for (const key in DEFAULT_SETTINGS) {
      if (settings[key] === undefined) {
        updatedSettings[key] = DEFAULT_SETTINGS[key];
      }
    }
    if (Object.keys(updatedSettings).length > 0) {
      chrome.storage.local.set(updatedSettings);
    }
  });

  // Create context menus
  chrome.contextMenus.create({
    id: "group-tabs-domain",
    title: "Group Tabs by Domain",
    contexts: ["action"]
  });

  chrome.contextMenus.create({
    id: "ungroup-tabs-all",
    title: "Ungroup All Tabs",
    contexts: ["action"]
  });
});

// Context menu click listener
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "group-tabs-domain") {
    const windowId = tab ? tab.windowId : chrome.windows.WINDOW_ID_CURRENT;
    groupTabsInWindow(windowId);
  } else if (info.menuItemId === "ungroup-tabs-all") {
    const windowId = tab ? tab.windowId : chrome.windows.WINDOW_ID_CURRENT;
    ungroupAllTabsInWindow(windowId);
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "groupTabs") {
    chrome.windows.getCurrent((win) => {
      groupTabsInWindow(win.id).then((result) => {
        sendResponse({ success: true, ...result });
      });
    });
    return true; // Keep message channel open for async response
  } else if (message.action === "ungroupAll") {
    chrome.windows.getCurrent((win) => {
      ungroupAllTabsInWindow(win.id).then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});

// Auto-grouping triggers
let groupDebounceTimeout = null;
function triggerAutoGroup() {
  chrome.storage.local.get("autoGroup", (data) => {
    if (data.autoGroup) {
      if (groupDebounceTimeout) clearTimeout(groupDebounceTimeout);
      groupDebounceTimeout = setTimeout(() => {
        chrome.windows.getCurrent((win) => {
          if (win && win.id) {
            groupTabsInWindow(win.id);
          }
        });
      }, 1000); // Debounce to prevent rapid multiple groupings
    }
  });
}

// Listen to tab updates and creations
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    triggerAutoGroup();
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  triggerAutoGroup();
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  triggerAutoGroup();
});

// CORE GROUPING LOGIC
async function groupTabsInWindow(windowId) {
  try {
    // Get settings
    const settings = await new Promise((resolve) => {
      chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS), resolve);
    });

    const minTabs = settings.minTabs || 2;
    const ignored = settings.ignoredDomains || [];
    const collapseInactive = settings.collapseInactive || false;

    // Fetch all tabs in the specific window
    const tabs = await chrome.tabs.query({ windowId, pinned: false });
    
    // Group tabs by domain in memory
    const domainMap = {};
    for (const tab of tabs) {
      const domain = getDomain(tab.url);
      if (!domain) continue;
      
      // Check if domain is ignored
      if (ignored.includes(domain)) continue;

      if (!domainMap[domain]) {
        domainMap[domain] = [];
      }
      domainMap[domain].push(tab);
    }

    // Filter groups meeting minTabs requirement, and collect single/orphan tabs for the Misc group
    const validGroups = {};
    const miscTabIds = [];
    for (const domain in domainMap) {
      if (domainMap[domain].length >= minTabs) {
        validGroups[domain] = domainMap[domain];
      } else {
        domainMap[domain].forEach(tab => {
          miscTabIds.push(tab.id);
        });
      }
    }

    // Get existing groups in the window
    const existingGroups = await chrome.tabGroups.query({ windowId });
    const existingGroupMap = {}; // Title -> TabGroup
    for (const group of existingGroups) {
      if (group.title) {
        existingGroupMap[group.title.toLowerCase()] = group;
      }
    }

    let groupsCreated = 0;
    let groupsUpdated = 0;

    // Perform grouping operations
    for (const domain in validGroups) {
      const tabIds = validGroups[domain].map(t => t.id);
      
      // Check if a group already exists for this domain
      const existingGroup = existingGroupMap[domain];
      if (existingGroup) {
        // Add tabs to existing group
        await chrome.tabs.group({ groupId: existingGroup.id, tabIds });
        groupsUpdated++;
      } else {
        // Create new group
        const groupId = await chrome.tabs.group({ tabIds });
        const color = getDomainColor(domain);
        
        // Pretty name (e.g. google.com -> Google.com)
        const displayName = domain.charAt(0).toUpperCase() + domain.slice(1);
        
        await chrome.tabGroups.update(groupId, {
          title: displayName,
          color: color,
          collapsed: true
        });
        groupsCreated++;
      }
    }

    // Group the remaining single/orphan tabs into a "Misc" group
    if (miscTabIds.length > 0) {
      const existingMiscGroup = existingGroups.find(g => g.title && g.title.toLowerCase() === "misc");
      if (existingMiscGroup) {
        await chrome.tabs.group({ groupId: existingMiscGroup.id, tabIds: miscTabIds });
        groupsUpdated++;
      } else {
        const groupId = await chrome.tabs.group({ tabIds: miscTabIds });
        await chrome.tabGroups.update(groupId, {
          title: "Misc",
          color: "grey",
          collapsed: true
        });
        groupsCreated++;
      }
    }

    // Collapse all groups in the window to keep the tab bar perfectly clean
    const allGroups = await chrome.tabGroups.query({ windowId });
    for (const group of allGroups) {
      try {
        await chrome.tabGroups.update(group.id, { collapsed: true });
      } catch (err) {
        console.error("Failed to collapse group", group.id, err);
      }
    }

    return { groupsCreated, groupsUpdated };
  } catch (error) {
    console.error("Error in groupTabsInWindow:", error);
    return { error: error.message };
  }
}

// UNGROUP LOGIC
async function ungroupAllTabsInWindow(windowId) {
  try {
    const tabs = await chrome.tabs.query({ windowId, pinned: false });
    const tabIdsToUngroup = [];
    
    for (const tab of tabs) {
      if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
        tabIdsToUngroup.push(tab.id);
      }
    }

    if (tabIdsToUngroup.length > 0) {
      await chrome.tabs.ungroup(tabIdsToUngroup);
    }
  } catch (error) {
    console.error("Error in ungroupAllTabsInWindow:", error);
  }
}
