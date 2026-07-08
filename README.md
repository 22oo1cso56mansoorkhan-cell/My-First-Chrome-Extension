# 🐱 Cat Image Replacer - Chrome Extension

A fun Chrome extension that replaces all images on a webpage with random cat images! Perfect for cat lovers who want to brighten up their browsing experience.


## 📋 Table of Contents
- [Features](#-features)
- [How It Works](#-how-it-works)
- [Installation](#-installation)
- [Usage](#-usage)
- [File Structure](#-file-structure)
- [Technologies Used](#-technologies-used)
- [APIs Used](#-apis-used)
- [Screenshots](#-screenshots)
- [Browser Support](#-browser-support)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Functionality
- **One-Click Toggle**: Replace all images with cats or restore originals
- **All Image Types**: Handles `<img>` tags, CSS background images, and lazy-loaded images
- **Dynamic Content**: Catches and replaces images added after page load
- **Persistent State**: Remembers if cat mode is enabled after page refresh

### Image Support
- ✅ Standard `<img>` tags
- ✅ Large hero images and banners
- ✅ CSS background images (`background-image`)
- ✅ Lazy-loaded images
- ✅ Dynamically added images (Mutation Observer)
- ✅ Images with `srcset` and `sizes` attributes
- ✅ Images inside Shadow DOM
- ✅ Cross-origin iframe images (where accessible)

### User Experience
- **Beautiful Popup**: Modern UI with status indicator
- **Real-time Feedback**: Shows number of images replaced
- **Animated Notifications**: Visual feedback when images are replaced
- **Keyboard Shortcuts**: Quick access to extension functionality
- **Dark Mode Support**: Adapts to system theme
- **Responsive Design**: Works on all screen sizes

## 🔧 How It Works

### Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Popup UI   │◄───│  Background  │───►│   Storage    │ │
│  │  (popup.js)  │    │   Script     │    │  (local)     │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                  │                    │           │
│         ▼                  ▼                    ▼           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Content Script (content.js)             │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │  1. Scan DOM for all images                   │ │  │
│  │  │  2. Fetch random cat images from API         │ │  │
│  │  │  3. Replace <img> src with cat image        │ │  │
│  │  │  4. Replace CSS background images            │ │  │
│  │  │  5. Watch for new images (Mutation Observer) │ │  │
│  │  │  6. Restore originals on toggle off          │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Image Replacement Process

1. **User clicks extension icon**
2. **Popup sends 'toggle' message to content script**
3. **Content script scans for ALL images**:
   - `<img>` tags (including lazy-loaded)
   - CSS `background-image` properties
   - Images inside Shadow DOM
   - Images inside iframes (where accessible)
4. **Fetches random cat images** from Cataas API
5. **Replaces each image**:
   - Removes `srcset` and `sizes` attributes
   - Sets `src` to cat image URL
   - Forces `loading="eager"`
6. **Sets up Mutation Observer** for dynamic content
7. **Saves state** to Chrome Storage

## 📥 Installation

### Method 1: From Chrome Web Store (Coming Soon)

*Coming soon!*

### Method 2: Manual Installation (Developer Mode)

1. **Download or Clone this repository**
   ```bash
   git clone https://github.com/yourusername/cat-image-replacer.git
   ```

2. **Open Chrome and go to Extensions**
   ```
   chrome://extensions/
   ```

3. **Enable Developer Mode**
   - Toggle the switch in the top right corner

4. **Load Unpacked Extension**
   - Click **"Load unpacked"**
   - Select the `cat-extension` folder
   - The extension will appear in your extensions list

5. **Verify Installation**
   - You should see the cat icon in your Chrome toolbar

### File Structure
```
cat-extension/
├── manifest.json     # Extension configuration
├── content.js        # Main script that replaces images
├── popup.html        # Popup interface
├── popup.js          # Popup logic
├── styles.css        # Popup styling
└── icon.jpg          # Extension icon
```

## 🚀 Usage

### Basic Usage

1. **Navigate to any webpage**
2. **Click the extension icon** in the Chrome toolbar
3. **Click "Replace with Cats"**
4. **All images will be replaced** with random cat images
5. **Click "Remove Cats"** to restore original images

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Click extension icon | Open popup |
| Click "Replace with Cats" | Replace all images |
| Click "Remove Cats" | Restore original images |
| Click "Reset Page" | Refresh current page |

### Quick Actions

- **Replace with Cats**: Replaces all images on the page
- **Remove Cats**: Restores original images
- **Reset Page**: Refreshes the current page

## 🔌 APIs Used

### Primary API: Cataas (Cat as a Service)
- **Endpoint**: `https://cataas.com/cat?json=true`
- **Response**: `{ "_id": "abc123" }`
- **Image URL**: `https://cataas.com/cat/abc123`

### Fallback API: The Cat API
- **Endpoint**: `https://api.thecatapi.com/v1/images/search`
- **Response**: `[{ "url": "https://..." }]`
- **Image URL**: From response array


## 🌍 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 60+ | ✅ Full |
| Edge | 79+ | ✅ Full |
| Brave | 60+ | ✅ Full |
| Opera | 50+ | ✅ Full |
| Firefox | - | ❌ Not Supported (Different API) |
| Safari | - | ❌ Not Supported |

## 🔧 Troubleshooting

### Common Issues and Solutions

#### ❌ Images Not Replacing
**Problem**: Images on some websites aren't being replaced
**Solutions**:
1. Wait for the page to fully load before clicking the extension
2. Click "Replace with Cats" again (the extension will retry)
3. Refresh the page and try again
4. Check console for errors (F12)

#### ❌ "Failed to fetch" Error
**Problem**: Can't fetch cat images from API
**Solutions**:
1. Check your internet connection
2. The API might be rate-limited (wait a few seconds and retry)
3. The extension will automatically use the fallback API

#### ❌ Extension Not Working
**Problem**: Extension icon is grayed out or not responding
**Solutions**:
1. Reload the extension: `chrome://extensions/` → Reload
2. Disable and re-enable the extension
3. Restart Chrome
4. Check if the page URL is supported (chrome:// pages won't work)

#### ❌ Background Images Not Replacing
**Problem**: CSS background images aren't being replaced
**Solutions**:
1. Make sure you have the latest version of `content.js`
2. Some background images are loaded with JavaScript after page load
3. The extension will automatically catch them with Mutation Observer

### Debugging

1. **Open Developer Console** (F12)
2. **Check for console logs**:
   - `🐱 Cat Image Replacer loaded!`
   - `Found X images on page`
   - `🐱 Replaced X background images`
3. **Check for errors** (red text in console)
4. **Try running the script manually** in the console:
   ```javascript
   // Test image replacement
   document.querySelectorAll('img').forEach(img => {
       img.src = 'https://cataas.com/cat';
   });
   ```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow the existing code style
- Test your changes across different websites
- Update documentation as needed
- Add new features or fix bugs

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Cataas API](https://cataas.com/) - For providing cat images
- [The Cat API](https://thecatapi.com/) - For fallback cat images
- [Font Awesome](https://fontawesome.com/) - For beautiful icons
- All the cat lovers who made this project possible!

## 📞 Contact

- **Author**: Mansoor Khan

## 🎯 Future Enhancements

- [ ] Upload custom images
- [ ] Choose from different animal types (dogs, pandas, etc.)
- [ ] Animated cat images (GIFs)
- [ ] Auto-replace on page load
- [ ] Settings to exclude certain websites
- [ ] Keyboard shortcut (Ctrl+Shift+C)
- [ ] More customization options
- [ ] Chrome Web Store release

---

**Made with ❤️ for cat lovers everywhere!** 🐱
