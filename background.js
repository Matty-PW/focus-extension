// activates everytime a user switches tabs
chrome.tabs.onActivated.addListener((activeInfo) => {

    // checks if focus mode is already on
    chrome.storage.local.get(["focusActive", "focusPhrase", "allowedSites"], (data) => {
        // only act if focus mode is on AND a phrase has been set
        if (!data.focusActive || !data.focusPhrase) return

        // look up the tab's url so we can skip allowed sites
        chrome.tabs.get(activeInfo.tabId, (tab) => {
            if (chrome.runtime.lastError || !tab || !tab.url) return
            if (isAllowedSite(tab.url, data.allowedSites)) return

            // wait a moment for the tab to load, then send the message
            setTimeout(() => {
                chrome.tabs.sendMessage(activeInfo.tabId, {
                    action: "showOverlay",
                    phrase: data.focusPhrase
                }).catch(() =>{
                    // some tabs (new tab page, chrome:// pages) cant receive message - ignore the error
                })
            }, 300)
        })
    })
})

// checks the tab's hostname against the saved allowlist (matches subdomains too)
function isAllowedSite(url, allowedSites) {
    if (!allowedSites || allowedSites.length === 0) return false

    let hostname
    try {
        hostname = new URL(url).hostname
    } catch {
        return false
    }

    return allowedSites.some((site) => hostname === site || hostname.endsWith("." + site))
}
