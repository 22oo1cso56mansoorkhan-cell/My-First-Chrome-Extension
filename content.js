// ----- content.js -----
(function() {
    let isEnabled = false;
    let originalImages = [];
    let observer = null;
    let retryCount = 0;
    const MAX_RETRIES = 5;

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
        const maxBatch = 15;
        
        for (let i = 0; i < Math.min(count, maxBatch); i++) {
            promises.push(fetchCatImage());
        }
        
        try {
            const results = await Promise.all(promises);
            while (results.length < count) {
                results.push(results[results.length % results.length]);
            }
            return results;
        } catch (error) {
            console.error('Error fetching cat images:', error);
            return Array(count).fill('https://cataas.com/cat');
        }
    }

    // ✅ FUNCTION 1: Replace ALL <img> tags
    async function replaceImages() {
        // Get ALL images - including lazy-loaded ones
        let images = document.querySelectorAll('img');
        
        // Also check for images inside shadow DOM
        document.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) {
                const shadowImgs = el.shadowRoot.querySelectorAll('img');
                images = [...images, ...shadowImgs];
            }
        });
        
        console.log(`🐱 Found ${images.length} images on page`);
        
        // Replace background images
        replaceBackgroundImages();
        
        // Replace images inside iframes (if allowed)
        replaceIframeImages();
        
        if (images.length === 0) {
            // Try again after a delay (for lazy-loaded images)
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.log(`No images found, retrying (${retryCount}/${MAX_RETRIES})...`);
                setTimeout(() => replaceImages(), 2000);
                return;
            }
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

        const catImageUrls = await fetchCatImages(images.length);
        
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
            img.decoding = 'async';
            
            // Handle loading errors
            img.onerror = function() {
                console.warn('Failed to load cat image, using fallback');
                this.src = 'https://cataas.com/cat';
            };
            
            // Ensure image is visible
            img.style.display = img.style.display || '';
            img.style.visibility = img.style.visibility || '';
            img.style.opacity = img.style.opacity || '1';
        });

        isEnabled = true;
        retryCount = 0;
        chrome.storage.local.set({ catReplacerEnabled: true });
        
        chrome.runtime.sendMessage({ 
            action: 'imagesReplaced', 
            count: images.length 
        });
        
        showNotification(`🐱 ${images.length} images replaced with cats!`);
    }

    // ✅ FUNCTION 2: Replace CSS background images
    function replaceBackgroundImages() {
        const elements = document.querySelectorAll('*');
        let bgCount = 0;
        
        elements.forEach(el => {
            // Check all background-related properties
            const bg = window.getComputedStyle(el).backgroundImage;
            const bgColor = window.getComputedStyle(el).backgroundColor;
            
            if (bg && bg !== 'none' && bg.includes('url(')) {
                // Store original background
                if (!el.dataset.originalBg) {
                    el.dataset.originalBg = bg;
                    el.dataset.originalBgColor = bgColor || '';
                }
                // Replace with cat image
                const catUrl = 'https://cataas.com/cat?width=800&height=600';
                el.style.backgroundImage = `url('${catUrl}')`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
                el.style.backgroundRepeat = 'no-repeat';
                bgCount++;
            }
        });
        
        if (bgCount > 0) {
            console.log(`🐱 Replaced ${bgCount} background images`);
        }
    }

    // ✅ FUNCTION 3: Replace images inside iframes
    function replaceIframeImages() {
        try {
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(iframe => {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (doc) {
                        const imgs = doc.querySelectorAll('img');
                        imgs.forEach(img => {
                            if (!img.dataset.originalSrc) {
                                img.dataset.originalSrc = img.src;
                            }
                            img.src = 'https://cataas.com/cat?width=200&height=200';
                            img.classList.add('cat-replaced');
                        });
                    }
                } catch (e) {
                    // Cross-origin iframe - cannot access
                    console.log('Cannot access iframe (cross-origin)');
                }
            });
        } catch (e) {
            console.log('Error processing iframes:', e);
        }
    }

    // ✅ FUNCTION 4: Restore original images
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
                img.onerror = null;
            }
        });
        
        // Restore background images
        const elements = document.querySelectorAll('[data-original-bg]');
        elements.forEach(el => {
            if (el.dataset.originalBg) {
                el.style.backgroundImage = el.dataset.originalBg;
                el.style.backgroundSize = '';
                el.style.backgroundPosition = '';
                el.style.backgroundRepeat = '';
                delete el.dataset.originalBg;
                delete el.dataset.originalBgColor;
            }
        });
        
        originalImages = [];
        isEnabled = false;
        retryCount = 0;
        chrome.storage.local.set({ catReplacerEnabled: false });
        
        // Stop observer if it exists
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        
        showNotification('🐱 Cats removed! Images restored.');
    }

    // Toggle cat mode
    function toggleCatMode() {
        if (isEnabled) {
            restoreImages();
        } else {
            // Start observing before replacing
            setupMutationObserver();
            replaceImages();
        }
    }

    // Show notification
    function showNotification(message) {
        try {
            // Remove existing notification
            const existing = document.querySelector('.cat-notification');
            if (existing) existing.remove();
            
            const notification = document.createElement('div');
            notification.className = 'cat-notification';
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
                max-width: 300px;
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

    // ✅ FUNCTION 5: Setup Mutation Observer for dynamic images
    function setupMutationObserver() {
        if (observer) {
            observer.disconnect();
        }
        
        observer = new MutationObserver((mutations) => {
            if (!isEnabled) return;
            
            let hasNewImages = false;
            let hasNewBgImages = false;
            
            mutations.forEach(mutation => {
                // Check added nodes for new images
                mutation.addedNodes.forEach(node => {
                    if (node.nodeName === 'IMG') {
                        hasNewImages = true;
                    }
                    if (node.querySelectorAll) {
                        const imgs = node.querySelectorAll('img:not(.cat-replaced)');
                        if (imgs.length > 0) hasNewImages = true;
                    }
                });
                
                // Check for attribute changes (lazy loading)
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'src' && 
                    mutation.target.nodeName === 'IMG' &&
                    !mutation.target.classList.contains('cat-replaced')) {
                    hasNewImages = true;
                }
            });
            
            if (hasNewImages) {
                console.log('🔄 New images detected, replacing...');
                clearTimeout(window._replaceTimeout);
                window._replaceTimeout = setTimeout(() => {
                    replaceImages();
                }, 300);
            }
            
            if (hasNewBgImages) {
                replaceBackgroundImages();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'srcset', 'data-src', 'data-srcset']
        });
        
        console.log('👀 Mutation observer set up for dynamic images');
    }

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        img.cat-replaced {
            border-radius: 8px !important;
            transition: all 0.3s ease !important;
            min-width: 20px !important;
            min-height: 20px !important;
            object-fit: cover !important;
            background: #f0f0f0 !important;
        }
        img.cat-replaced:hover {
            transform: scale(1.02) !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2) !important;
        }
        [data-original-bg] {
            transition: all 0.3s ease !important;
        }
        [data-original-bg]:hover {
            transform: scale(1.02) !important;
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
            console.log('🔄 Restoring previous cat mode state');
            setTimeout(() => {
                setupMutationObserver();
                replaceImages();
            }, 1500);
        }
    });

    // Also run on page load complete
    window.addEventListener('load', () => {
        chrome.storage.local.get(['catReplacerEnabled'], (result) => {
            if (result.catReplacerEnabled) {
                setTimeout(() => {
                    setupMutationObserver();
                    replaceImages();
                }, 1000);
            }
        });
    });

    console.log('🐱 Cat Image Replacer loaded! (Ultimate version - catches ALL images)');
})();