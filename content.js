// ----- content.js -----
(function() {
    let isEnabled = false;
    let originalImages = [];
    let catImages = [];
    
    // Fetch a random cat image from the API
    async function fetchCatImage() {
        try {
            // Using Cataas API (free, no API key required)
            const response = await fetch('https://cataas.com/cat?json=true');
            const data = await response.json();
            // Cataas returns { _id: "..." } so we construct the URL
            const imageUrl = `https://cataas.com/cat/${data._id}`;
            return imageUrl;
        } catch (error) {
            console.error('Error fetching cat image:', error);
            // Fallback to a different API
            try {
                const response = await fetch('https://api.thecatapi.com/v1/images/search');
                const data = await response.json();
                return data[0]?.url || 'https://cataas.com/cat';
            } catch (fallbackError) {
                console.error('Fallback error:', fallbackError);
                return 'https://cataas.com/cat';
            }
        }
    }

    // Fetch multiple cat images
    async function fetchCatImages(count) {
        const promises = [];
        for (let i = 0; i < count; i++) {
            promises.push(fetchCatImage());
        }
        try {
            return await Promise.all(promises);
        } catch (error) {
            console.error('Error fetching cat images:', error);
            return Array(count).fill('https://cataas.com/cat');
        }
    }

    // Replace all images on the page
    async function replaceImages() {
        const images = document.querySelectorAll('img');
        
        // Store original image sources if not already stored
        if (originalImages.length === 0) {
            originalImages = Array.from(images).map(img => ({
                element: img,
                src: img.src,
                originalSrc: img.src
            }));
        }

        // Get cat images for all images on the page
        const catImageUrls = await fetchCatImages(images.length);
        
        images.forEach((img, index) => {
            // Store original src if not already stored
            if (!img.dataset.originalSrc) {
                img.dataset.originalSrc = img.src;
            }
            
            // Add a cat image class for styling
            img.classList.add('cat-replaced');
            
            // Set the new src
            const catUrl = catImageUrls[index % catImageUrls.length];
            img.src = catUrl;
            
            // Handle loading errors
            img.onerror = function() {
                this.src = 'https://cataas.com/cat';
            };
        });

        isEnabled = true;
        chrome.storage.local.set({ catReplacerEnabled: true });
        
        // Notify popup that images were replaced
        chrome.runtime.sendMessage({ 
            action: 'imagesReplaced', 
            count: images.length 
        });
    }

    // Restore original images
    function restoreImages() {
        const images = document.querySelectorAll('img.cat-replaced');
        images.forEach(img => {
            if (img.dataset.originalSrc) {
                img.src = img.dataset.originalSrc;
                img.classList.remove('cat-replaced');
                delete img.dataset.originalSrc;
            }
        });
        
        // Reset original images storage
        originalImages = [];
        isEnabled = false;
        chrome.storage.local.set({ catReplacerEnabled: false });
    }

    // Toggle cat mode
    function toggleCatMode() {
        if (isEnabled) {
            restoreImages();
            showNotification('Cat images removed! 🐱');
        } else {
            replaceImages();
            showNotification('Cat images loaded! 🐱');
        }
    }

    // Show a notification on the page
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            z-index: 999999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // Add keyframe animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        img.cat-replaced {
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        img.cat-replaced:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
    `;
    document.head.appendChild(style);

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggle') {
            toggleCatMode();
            sendResponse({ success: true, enabled: isEnabled });
        } else if (request.action === 'getStatus') {
            sendResponse({ enabled: isEnabled });
        }
        return true;
    });

    // Check storage for previous state
    chrome.storage.local.get(['catReplacerEnabled'], (result) => {
        if (result.catReplacerEnabled) {
            // Wait a bit for page to load before replacing
            setTimeout(() => replaceImages(), 1000);
        }
    });

    console.log('🐱 Cat Image Replacer loaded! Click the extension icon to toggle.');
})();