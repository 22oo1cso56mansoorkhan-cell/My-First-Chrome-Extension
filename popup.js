// ----- popup.js -----
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggleBtn');
    const btnIcon = document.getElementById('btnIcon');
    const btnText = document.getElementById('btnText');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const resetBtn = document.getElementById('resetBtn');
    const stats = document.getElementById('stats');

    let isEnabled = false;

    // Get current tab
    async function getCurrentTab() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return tab;
    }

    // Update UI state
    function updateUI(enabled) {
        isEnabled = enabled;
        if (enabled) {
            statusDot.className = 'status-dot active';
            statusText.textContent = 'Active 🐱';
            btnIcon.textContent = '🐱';
            btnText.textContent = 'Remove Cats';
            toggleBtn.classList.add('active');
        } else {
            statusDot.className = 'status-dot inactive';
            statusText.textContent = 'Inactive';
            btnIcon.textContent = '🐱';
            btnText.textContent = 'Replace with Cats';
            toggleBtn.classList.remove('active');
        }
    }

    // Get current status from content script
    async function getStatus() {
        const tab = await getCurrentTab();
        try {
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
            if (response) {
                updateUI(response.enabled);
                // Get image count if enabled
                if (response.enabled) {
                    const images = document.querySelectorAll('img.cat-replaced');
                    stats.textContent = `Images replaced: ${images.length}`;
                }
            }
        } catch (error) {
            console.log('Content script not ready, using stored state');
            // Fallback to storage
            chrome.storage.local.get(['catReplacerEnabled'], (result) => {
                updateUI(result.catReplacerEnabled || false);
            });
        }
    }

    // Toggle cat mode
    async function toggleCatMode() {
        const tab = await getCurrentTab();
        try {
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
            if (response) {
                updateUI(response.enabled);
                // Update stats
                setTimeout(async () => {
                    const updatedTab = await getCurrentTab();
                    try {
                        const statusResponse = await chrome.tabs.sendMessage(updatedTab.id, { action: 'getStatus' });
                        if (statusResponse && statusResponse.enabled) {
                            const images = document.querySelectorAll('img.cat-replaced');
                            stats.textContent = `Images replaced: ${images.length}`;
                        } else {
                            stats.textContent = 'Images replaced: 0';
                        }
                    } catch (e) {
                        console.log('Could not update stats');
                    }
                }, 500);
            }
        } catch (error) {
            console.error('Error toggling:', error);
            // If content script not loaded, inject it
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
                // Try again after injection
                setTimeout(async () => {
                    const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
                    if (response) updateUI(response.enabled);
                }, 100);
            } catch (injectError) {
                console.error('Failed to inject content script:', injectError);
                alert('Please refresh the page and try again.');
            }
        }
    }

    // Reset page (refresh)
    function resetPage() {
        chrome.tabs.reload();
        window.close();
    }

    // Event listeners
    toggleBtn.addEventListener('click', toggleCatMode);
    resetBtn.addEventListener('click', resetPage);

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'imagesReplaced') {
            stats.textContent = `Images replaced: ${request.count}`;
            sendResponse({ success: true });
        }
    });

    // Load initial state
    getStatus();
});