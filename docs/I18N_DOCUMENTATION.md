# IKAMETI Multi-Language (i18n) System - Complete Documentation

## 🌍 Overview

This system provides a complete multi-language solution for the IKAMETI website supporting 7 languages with automatic RTL/LTR handling, localStorage persistence, and smooth language switching without page reloads.

## 📦 Supported Languages

| Code | Language | Direction |
|------|----------|-----------|
| en | English | LTR |
| ar | العربية (Arabic) | RTL |
| tr | Türkçe (Turkish) | LTR |
| ru | Русский (Russian) | LTR |
| fa | فارسی (Persian) | RTL |
| uz | Ўзбек (Uzbek) | LTR |
| af | دری (Dari) | RTL |

## 🗂️ File Structure

```
ikameti-static/
├── assets/
│   ├── css/
│   │   └── i18n.css                 # Language switcher styles
│   ├── js/
│   │   └── i18n.js                  # Main i18n system
│   └── lang/
│       ├── en.json                  # English translations
│       ├── ar.json                  # Arabic translations
│       ├── tr.json                  # Turkish translations
│       ├── ru.json                  # Russian translations
│       ├── fa.json                  # Persian translations
│       ├── uz.json                  # Uzbek translations
│       └── af.json                  # Dari translations
└── [HTML pages with i18n attributes]
```

## 🚀 Installation

### 1. Add to HTML Head
```html
<head>
    <!-- ... existing meta and styles ... -->
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="assets/css/i18n.css">
</head>
```

### 2. Add Language Switcher to Navigation
```html
<nav id="navbar">
    <div class="container">
        <!-- ... logo and nav-menu ... -->
        <div class="nav-menu">
            <a href="index.html" data-i18n="nav.home">Home</a>
            <a href="about.html" data-i18n="nav.about">About</a>
            <!-- ... more nav items ... -->
        </div>
        
        <!-- Language Switcher -->
        <div class="language-switcher" style="margin-left: auto; margin-right: 1rem;">
            <button class="language-switch-btn" data-language-switch="en">EN</button>
            <button class="language-switch-btn" data-language-switch="ar">AR</button>
            <button class="language-switch-btn" data-language-switch="tr">TR</button>
            <button class="language-switch-btn" data-language-switch="ru">RU</button>
            <button class="language-switch-btn" data-language-switch="fa">FA</button>
            <button class="language-switch-btn" data-language-switch="uz">UZ</button>
            <button class="language-switch-btn" data-language-switch="af">AF</button>
        </div>
        
        <!-- ... rest of nav ... -->
    </div>
</nav>
```

### 3. Add i18n Attributes to Content
```html
<!-- Regular text content -->
<h1 data-i18n="hero.title">Your Gateway to Premium Residency & Housing</h1>
<p data-i18n="hero.subtitle">Expert guidance...</p>

<!-- Form inputs -->
<input type="text" data-i18n-placeholder="form_placeholder_name" placeholder="Your name">

<!-- Links with aria-label -->
<a href="#" data-i18n-title="common.back" title="Back">← Back</a>
```

### 4. Add Script Before Closing Body
```html
<body>
    <!-- ... page content ... -->
    
    <script src="assets/js/i18n.js"></script>
</body>
```

## 📝 Using Data-i18n Attributes

### Text Content
```html
<h1 data-i18n="hero.title">Default text here</h1>
```
Translates the element's text content using the key from `lang/XX.json` > `hero.title`

### Placeholder Attributes
```html
<input data-i18n-placeholder="form.placeholder_name" placeholder="Your name">
```
Translates the placeholder attribute

### Title Attributes
```html
<button data-i18n-title="common.back" title="Back">Back</button>
```
Translates the title attribute (tooltip)

### Aria Labels (Accessibility)
```html
<button data-i18n-aria="common.menu" aria-label="Menu">☰</button>
```
Translates the ARIA label for screen readers

## 🎨 Translation JSON Structure

Each language file (`assets/lang/en.json`, etc.) follows this nested structure:

```json
{
  "lang": "en",
  "direction": "ltr",
  "nav": {
    "home": "Home",
    "about": "About",
    "blog": "Blog",
    "faq": "FAQ",
    "contact": "Contact"
  },
  "hero": {
    "title": "Your Gateway to Premium Residency & Housing",
    "subtitle": "Expert guidance...",
    "cta_primary": "Get Started Now",
    "cta_secondary": "Learn More"
  },
  "services": {
    "title": "Our Core Services",
    "housing": {
      "title": "Housing Solutions",
      "description": "...",
      "features": ["Feature 1", "Feature 2", "Feature 3"],
      "cta": "Explore"
    }
  }
}
```

## 💻 JavaScript API

### Get Current Language
```javascript
const lang = window.i18n.getCurrentLanguage();
console.log(lang); // 'en'
```

### Get Translation
```javascript
const text = window.i18n.getTranslation('nav.home');
console.log(text); // 'Home'
```

### Set Language
```javascript
window.i18n.setLanguage('ar');
// Page updates automatically, localStorage is updated
```

### Check if RTL
```javascript
if (window.i18n.isRTL()) {
    // Apply RTL-specific styles
}
```

### Get Available Languages
```javascript
const langs = window.i18n.getAvailableLanguages();
console.log(langs); // ['en', 'ar', 'tr', 'ru', 'fa', 'uz', 'af']
```

### Format Text with Variables
```javascript
const greeting = window.i18n.formatText('common.welcome', { name: 'John' });
// If translation is: "Hello {name}!"
// Result: "Hello John!"
```

### Listen to Language Changes
```javascript
window.addEventListener('languageChanged', (e) => {
    console.log('Language changed to:', e.detail.language);
    console.log('Direction:', e.detail.direction);
});
```

## 🎯 Features

### ✅ Automatic Language Detection
- Detects browser language preference
- Falls back to English if browser language not supported

### ✅ localStorage Persistence
- Saves selected language to browser storage
- Restored on page reload
- Synced across browser tabs

### ✅ Dynamic Translation Loading
- Loads translations from JSON files on-demand
- No hardcoded translations in HTML
- Easy to add new languages

### ✅ RTL/LTR Support
- Automatic direction setting for RTL languages (Arabic, Persian, Dari)
- CSS class management (rtl-mode/ltr-mode)
- Proper element positioning and margins
- Responsive in both directions

### ✅ No Page Reload Required
- Language changes happen instantly
- DOM updated in-place
- Smooth user experience

### ✅ Accessibility
- Keyboard navigation support
- ARIA labels support
- Screen reader compatible

### ✅ Scalability
 - Easy to add new languages (just add JSON file)
- Fallback system for missing translations
- Nested translation keys for organization

## 🔧 Customization

### Add New Language
1. Create `assets/lang/xx.json` with same structure as existing files
2. Add translation entries for all keys
3. Add button to language switcher:
   ```html
   <button class="language-switch-btn" data-language-switch="xx">XX</button>
   ```

### Add New Translation Key
1. Add key to all language files:
   ```json
   "new_section": {
     "new_key": "Translation text"
   }
   ```
2. Use in HTML:
   ```html
   <element data-i18n="new_section.new_key">Default text</element>
   ```

### Customize Styling
Modify `assets/css/i18n.css`:
- Change button colors
- Adjust responsive breakpoints
- Customize animations
- Modify dropdown styles

## 📱 Responsive Design

The language switcher is fully responsive:
- **Desktop**: Full button set displayed inline
- **Tablet**: Buttons may wrap or use dropdown
- **Mobile**: Buttons scale down with smaller padding

## 🧪 Testing

### Local Testing
1. Open page in browser
2. Click language buttons
3. Check if content translates
4. Refresh page - language should persist
5. Check browser console for errors

### RTL Testing
1. Switch to Arabic, Persian, or Dari
2. Verify text aligns right
3. Check button positioning
4. Test form input directions

### localStorage Testing
1. Switch language
2. Open Developer Tools > Application > localStorage
3. Verify `ikameti_language` is set
4. Reload page - language persists

## 🐛 Troubleshooting

### Translations Not Showing
- Check if `data-i18n` attribute matches key in JSON file
- Verify JSON file syntax is correct
- Check browser console for errors
- Ensure i18n.js is loaded

### RTL Not Working
- Verify language is in `rtlLanguages` array in `i18n.js`
- Check if `direction` is set correctly in JSON
- Clear browser cache and localStorage

### Language Not Persisting
- Check if localStorage is enabled
- Verify browser isn't in private/incognito mode
- Check for browser extensions blocking storage

### Buttons Not Working
- Verify `data-language-switch` attribute value matches available language code
- Check if language file exists in `/assets/lang/`
- Inspect button with DevTools to find issues

## 📚 Examples

### Complete Page Example
See `index.html` and `about.html` for full implementation examples.

### Simple Translation
```html
<h1 data-i18n="services.title">Our Core Services</h1>
```

### Complex Structure
```html
<div class="services">
    <h2 data-i18n="services.housing.title">Housing Solutions</h2>
    <p data-i18n="services.housing.description">Property verification...</p>
    <ul>
        <li data-i18n="services.housing.features.0">Feature 1</li>
        <li data-i18n="services.housing.features.1">Feature 2</li>
        <li data-i18n="services.housing.features.2">Feature 3</li>
    </ul>
    <a href="#" class="btn" data-i18n="services.housing.cta">Explore</a>
</div>
```

## 🎓 Best Practices

1. **Keep Keys Organized**: Group related translations in nested objects
2. **Use Consistent Naming**: Use snake_case for keys, hyphens for IDs
3. **Provide Defaults**: Always have text in HTML as fallback
4. **Test Thoroughly**: Test all languages and directions
5. **Monitor Console**: Check for missing translations in console
6. **Consider Context**: RTL languages need UI adjustments
7. **Accessibility First**: Always provide aria-labels where needed
8. **Maintain Consistency**: Keep translation quality consistent across languages

## 📖 Reference

### Directory Structure
```
assets/
├── css/i18n.css                    # 170 lines
├── js/i18n.js                      # 220 lines
└── lang/
    ├── en.json                     # 400+ translations
    ├── ar.json                     # 400+ translations (Arabic)
    ├── tr.json                     # 400+ translations (Turkish)
    ├── ru.json                     # 400+ translations (Russian)
    ├── fa.json                     # 400+ translations (Persian)
    ├── uz.json                     # 400+ translations (Uzbek)
    └── af.json                     # 400+ translations (Dari)
```

### Browser Support
- Chrome 60+
- Firefox 55+
- Safari 10+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Android)

### Performance
- Lightweight: ~50KB total (including all translations)
- Fast loading: ~100ms per language change
- No external dependencies
- Pure vanilla JavaScript

## 🚀 Deployment

1. Verify all HTML pages have i18n setup
2. Test all 7 languages on all pages
3. Test RTL support (Arabic, Persian, Dari)
4. Check localStorage functionality
5. Verify responsive design on mobile
6. Minify i18n.js and i18n.css for production
7. Deploy language files to CDN if needed
8. Monitor console for errors in production

## 📞 Support

For issues or questions about the i18n system, check:
1. JavaScript console for error messages
2. This documentation
3. The i18n.js source code comments
4. Example implementations in index.html and about.html

---

**Version**: 1.0  
**Last Updated**: April 16, 2026  
**Status**: Production Ready
