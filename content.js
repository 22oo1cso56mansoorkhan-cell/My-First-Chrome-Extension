// ----- content.js -----
(function() {
    let isEnabled = false;
    let originalImages = [];
    
    // Fetch a random cat image from the API
    async function fetchCatImage() {
        try {
            const response = await fetch('https://cataas.com/cat?json=true');
            const data = await response.json();
            const imageUrl = `https://cataas.com/cat/${data._id}`;
            return imageUrl;
        } catch (error) {
            console.error('Error fetching cat image:', error);
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
        const maxBatch = 10; // Limit concurrent requests
        
        for (let i = 0; i < Math.min(count, maxBatch); i++) {
            promises.push(fetchCatImage());
        }
        
        try {
            const results = await Promise.all(promises);
            // If we need more images, reuse the ones we have
            while (results.length < count) {
                results.push(results[results.length % results.length]);
            }
            return results;
        } catch (error) {
            console.error('Error fetching cat images:', error);
            return Array(count).fill('https://cataas.com/cat');
        }
    }

    // Replace all images on the page (including large ones)
    async function replaceImages() {
        // Get ALL images - including lazy-loaded ones
        const images = document.querySelectorAll('img');
        console.log(`Found ${images.length} images on page`);
        
        // Also find background images and replace them
        replaceBackgroundImages();
        
        if (images.length === 0) {
            showNotification('No images found on this page! 🐱');
            return;
        }

        // Store original image sources
        if (originalImages.length === 0) {
            originalImages = Array.from(images).map(img => ({
                element: img,
                src: img.src,
                originalSrc: img.src,
                srcset: img.srcset,
                sizes: img.sizes
            }));
        }

        // Get cat images
        const catImageUrls = await fetchCatImages(images.length);
        
        // Replace each image
        images.forEach((img, index) => {
            // Store original if not already stored
            if (!img.dataset.originalSrc) {
                img.dataset.originalSrc = img.src;
                img.dataset.originalSrcset = img.srcset || '';
                img.dataset.originalSizes = img.sizes || '';
            }
            
            // Remove srcset and sizes to force the new image
            img.removeAttribute('srcset');
            img.removeAttribute('sizes');
            
            // Add class for styling
            img.classList.add('cat-replaced');
            
            // Set the new src
            const catUrl = catImageUrls[index % catImageUrls.length];
            img.src = catUrl;
            
            // Force image to load
            img.loading = 'eager';
            
            // Handle loading errors
            img.onerror = function() {
                this.src = 'https://cataas.com/cat';
            };
            
            // Ensure image is visible
            img.style.display = img.style.display || '';
            img.style.visibility = img.style.visibility || '';
        });

        isEnabled = true;
        chrome.storage.local.set({ catReplacerEnabled: true });
        
        chrome.runtime.sendMessage({ 
            action: 'imagesReplaced', 
            count: images.length 
        });
        
        showNotification(`🐱 ${images.length} images replaced with cats!`);
    }

    // Replace background images (for large hero images)
    function replaceBackgroundImages() {
        const elements = document.querySelectorAll('*');
        let bgCount = 0;
        
        elements.forEach(el => {
            const bg = window.getComputedStyle(el).backgroundImage;
            if (bg && bg !== 'none' && bg.includes('url(')) {
                // Store original background
                if (!el.dataset.originalBg) {
                    el.dataset.originalBg = bg;
                }
                // Replace with cat image
                const catUrl = 'https://cataas.com/cat?width=800&height=600';
                el.style.backgroundImage = `url('${catUrl}')`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                bgCount++;
            }
        });
        
        if (bgCount > 0) {
            console.log(`Replaced ${bgCount} background images`);
        }
    }

    // Restore original images
    function restoreImages() {
        // Restore <img> tags
        const images = document.querySelectorAll('img.cat-replaced');
        images.forEach(img => {
            if (img.dataset.originalSrc) {
                img.src = img.dataset.originalSrc;
                if (img.dataset.originalSrcset) {
                    img.srcset = img.dataset.originalSrcset;
                }
                if (img.dataset.originalSizes) {
                    img.sizes = img.dataset.originalSizes;
                }
                img.classList.remove('cat-replaced');
                delete img.dataset.originalSrc;
                delete img.dataset.originalSrcset;
                delete img.dataset.originalSizes;
            }
        });
        
        // Restore background images
        const elements = document.querySelectorAll('[data-original-bg]');
        elements.forEach(el => {
            if (el.dataset.originalBg) {
                el.style.backgroundImage = el.dataset.originalBg;
                delete el.dataset.originalBg;
            }
        });
        
        originalImages = [];
        isEnabled = false;
        chrome.storage.local.set({ catReplacerEnabled: false });
        showNotification('🐱 Cats removed! Images restored.');
    }

    // Toggle cat mode
    function toggleCatMode() {
        if (isEnabled) {
            restoreImages();
        } else {
            replaceImages();
        }
    }

    // Show notification
    function showNotification(message) {
        try {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #6c5ce7;
                color: white;
                padding: 12px 20px;
                border-radius: 10px;
                font-family: system-ui, sans-serif;
                font-size: 14px;
                z-index: 999999;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                animation: slideIn 0.3s ease;
                font-weight: 500;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        } catch (e) {
            console.log('Could not show notification');
        }
    }

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        img.cat-replaced {
            border-radius: 8px;
            transition: all 0.3s ease;
            min-width: 50px;
            min-height: 50px;
            object-fit: cover;
        }
        img.cat-replaced:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        [data-original-bg] {
            transition: all 0.3s ease;
        }
        [data-original-bg]:hover {
            transform: scale(1.02);
        }
    `;
    document.head.appendChild(style);

    // Observe for dynamically added images (lazy-loaded)
    function setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            if (!isEnabled) return;
            
            let newImages = false;
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeName === 'IMG') {
                        newImages = true;
                    }
                    if (node.querySelectorAll) {
                        const imgs = node.querySelectorAll('img:not(.cat-replaced)');
                        if (imgs.length > 0) newImages = true;
                    }
                });
            });
            
            if (newImages) {
                console.log('New images detected, replacing...');
                setTimeout(replaceImages, 500);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

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
            setTimeout(() => replaceImages(), 1500);
        }
    });

    // Setup observer for lazy-loaded images
    setupMutationObserver();

    console.log('🐱 Cat Image Replacer loaded! (Now handles large images too)');
})();