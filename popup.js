const toggleBtn = document.getElementById("toggle-btn")
const saveBtn = document.getElementById("save-btn")
const phraseInput = document.getElementById("phrase-input")
const status = document.getElementById("status")
const siteInput = document.getElementById("site-input")
const addSiteBtn = document.getElementById("add-site-btn")
const addCurrentBtn = document.getElementById("add-current-btn")
const allowedList = document.getElementById("allowed-list")
const allowedEmpty = document.getElementById("allowed-empty")

// when popup opens, load saved settings
chrome.storage.local.get(["focusActive", "focusPhrase", "allowedSites"], (data) => {
    if (data.focusPhrase) {
        phraseInput.value = data.focusPhrase
    }
    updateToggleUI(data.focusActive)
    renderAllowedSites(data.allowedSites || [])
})

// save the phrase
saveBtn.addEventListener("click", () => {
    const phrase = phraseInput.value.trim()
    if (!phrase) {
        status.textContent = "Please enter a phrase first"
        return
    }
    chrome.storage.local.set({focusPhrase: phrase}, () => {
        status.textContent = "Phrase saved"
        setTimeout(() => {status.textContent = ""}, 2000)
    })
})

// toggle focus mode on / off
toggleBtn.addEventListener("click", () => {
    chrome.storage.local.get("focusActive", (data) => {
        const newState = !data.focusActive
        chrome.storage.local.set({focusActive: newState}, () => {
            updateToggleUI(newState)
        })
    })
})

// update the button text and colour
function updateToggleUI(isActive) {
    if (isActive) {
        toggleBtn.textContent = "Focus Mode ON - click to disable"
        toggleBtn.classList.add("fm-btn--active")
    } else {
        toggleBtn.textContent = "Enable Focus Mode"
        toggleBtn.classList.remove("fm-btn--active")
    }
}

// strip protocol/path/www so the user can paste a full url or just a domain
function normalizeSite(raw) {
    let site = raw.trim().toLowerCase()
    site = site.replace(/^https?:\/\//, "")
    site = site.replace(/^www\./, "")
    site = site.split("/")[0]
    return site
}

// add a site to the allowlist (shared by the manual input and the current-tab button)
function addSite(site) {
    chrome.storage.local.get("allowedSites", (data) => {
        const allowedSites = data.allowedSites || []
        if (!allowedSites.includes(site)) {
            allowedSites.push(site)
            chrome.storage.local.set({allowedSites}, () => {
                renderAllowedSites(allowedSites)
            })
        }
    })
}

// add a manually typed site
addSiteBtn.addEventListener("click", () => {
    const site = normalizeSite(siteInput.value)
    if (!site) {
        status.textContent = "Please enter a site first"
        return
    }
    addSite(site)
    siteInput.value = ""
})

// allow the site open in the current tab
addCurrentBtn.addEventListener("click", () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        let url
        try {
            url = new URL(tabs[0].url)
        } catch {
            url = null
        }
        // only real websites can be allowed (not chrome:// pages etc)
        if (!url || (url.protocol !== "http:" && url.protocol !== "https:")) {
            status.textContent = "This page can't be added"
            setTimeout(() => {status.textContent = ""}, 2000)
            return
        }
        addSite(normalizeSite(url.hostname))
    })
})

siteInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addSiteBtn.click()
})

// remove a site from the allowlist
function removeSite(site) {
    chrome.storage.local.get("allowedSites", (data) => {
        const allowedSites = (data.allowedSites || []).filter((s) => s !== site)
        chrome.storage.local.set({allowedSites}, () => {
            renderAllowedSites(allowedSites)
        })
    })
}

// render the allowlist as a list of removable rows
function renderAllowedSites(allowedSites) {
    allowedList.innerHTML = ""
    allowedEmpty.style.display = allowedSites.length ? "none" : "block"

    allowedSites.forEach((site) => {
        const li = document.createElement("li")

        const label = document.createElement("span")
        label.textContent = site

        const removeBtn = document.createElement("button")
        removeBtn.className = "fm-remove"
        removeBtn.textContent = "✕"
        removeBtn.title = "Remove"
        removeBtn.addEventListener("click", () => removeSite(site))

        li.appendChild(label)
        li.appendChild(removeBtn)
        allowedList.appendChild(li)
    })
}