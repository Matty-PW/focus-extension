let overlayActive = false

// listen for messages from background.js
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action === "showOverlay") {
            showOverlay(msg.phrase)
        }
    })
}
// function that shows the overlay
function showOverlay(phrase) {
    if (overlayActive) return
    overlayActive = true

    // host element: critical blocking styles live inline (with !important, so
    // aggressive host-page CSS can't hide it) - the page stays locked even if
    // the theme stylesheet fails to load
    const host = document.createElement("div")
    host.id = "focus-mode-overlay"
    host.style.cssText = `
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483647 !important;
        display: block !important;
        background: #0d110e !important;
    `

    // shadow root isolates the overlay from the page's CSS in both directions
    const shadow = host.attachShadow({mode: "open"})
    shadow.innerHTML = `
        <style>
            :host { all: initial; }
        </style>
        <div class="fm-overlay">
            <h2 class="fm-overlay-title">Are you sure you want to get distracted?</h2>
            <p class="fm-overlay-sub">Type your phrase to continue</p>
            <input
                id="focus-phrase-input"
                class="fm-input"
                type="text"
                placeholder="Type your phrase..."
                autocomplete="off"
            />
            <p id="focus-feedback" class="fm-feedback"></p>
        </div>
    `

    // pull the shared theme into the shadow root (popup links the same file)
    fetch(chrome.runtime.getURL("theme.css"))
        .then((res) => res.text())
        .then((css) => {
            const style = document.createElement("style")
            style.textContent = css
            shadow.prepend(style)
        })
        .catch(() => {
            // unstyled but still blocking via the host's inline styles
        })

    // appends the overlay to the body of the page you are on
    document.body.appendChild(host)

    const input = shadow.getElementById("focus-phrase-input")
    const feedback = shadow.getElementById("focus-feedback")
    input.focus()

    // correct phrase entered - turns focus mode off and closes the overlay
    function handleCorrectPhrase() {
        feedback.classList.remove("fm-feedback--err")
        feedback.classList.add("fm-feedback--ok")
        feedback.textContent = "Correct phrase - disabling focus mode"
        chrome.storage.local.set({focusActive: false})
        setTimeout(() => {
            host.remove()
            overlayActive = false
        }, 500)
    }

    // checks typing in real time
    input.addEventListener("input", () => {
        const typed = input.value
        const target = phrase.trim()

        if (typed === target) {
            handleCorrectPhrase()
        }
    })

    // allows pressing Enter to submit
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const typed = input.value
            const target = phrase.trim()
            if (typed === target) {
                handleCorrectPhrase()
            } else {
                feedback.classList.add("fm-feedback--err")
                feedback.textContent = "Phrase is not correct - try again"
                input.value = ""
            }
        }
    })
}
