# Focus-extension

A Chrome extension that locks tab switching behind a typed passphrase, so you have to consciously "unlock" a distraction instead of tabbing over to it on autopilot.

## How it works

- Turn on Focus Mode and set a focus phrase in the popup.
- Every time you switch to a different tab, a full-screen overlay appears asking you to retype the phrase.
- Typing it correctly disables Focus Mode and dismisses the overlay.
- You can allowlist specific sites (e.g. docs, revision tools) so they never trigger the overlay.

## Install

1. Clone this repository `git clone https://github.com/Matty-PW/focus-extension.git`.
2. Open `chrome://extensions` in Chrome.
3. Enable Developer mode.
4. Click Load unpacked and select this directory.
5. Click the extension icon to set a phrase and turn Focus Mode on.

## Notes

- Reload any tabs that were already open before you loaded the extension — content scripts don't inject into existing pages until they're reloaded.
- Allowed sites match subdomains too (allowing `example.com` also allows `docs.example.com`)

## Permissions

- `tabs` — detect tab switches (`chrome.tabs.onActivated`) and message the active tab.
- `storage` — store the phrase, on/off state, and allowed sites in `chrome.storage.local`.
- `activeTab` — read the current tab's URL when adding it to the allowlist.
