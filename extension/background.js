// CIVIX Pocket Device Chrome Extension Service Worker

// Open the side panel whenever the user clicks the CIVIX toolbar action icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Error setting panel behavior:", error));

// Optional: check unread count periodically and update toolbar badge
async function checkUnreadNotifications() {
  try {
    const res = await fetch("https://civix-plum.vercel.app/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    if (data.authenticated && data.unreadCount > 0) {
      chrome.action.setBadgeText({ text: String(data.unreadCount) });
      chrome.action.setBadgeBackgroundColor({ color: "#06b6d4" }); // Cyan
    } else {
      chrome.action.setBadgeText({ text: "" });
    }
  } catch (err) {
    // Ignore network errors when offline
  }
}

// Check every 5 minutes
chrome.alarms.create("civix-badge-check", { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "civix-badge-check") {
    checkUnreadNotifications();
  }
});

// Run initial check
checkUnreadNotifications();
