# ✅ Language Dropdown Testing Checklist

## 🔍 Visual Testing

### Button Appearance
- [ ] Dropdown button visible on all pages
- [ ] Shows current language code (EN, AR, TR, etc.)
- [ ] Globe icon 🌐 visible on desktop
- [ ] Arrow indicator ▼ visible and rotates when open
- [ ] Button has proper styling (border, colors, padding)

### Dropdown Menu
- [ ] Menu opens when button clicked
- [ ] Shows all 7 language options
- [ ] Each language has flag emoji (🇺🇸, 🇸🇦, etc.)
- [ ] Language names displayed on desktop
- [ ] Checkmark (✓) shows on selected language
- [ ] Menu positioned correctly (aligned with button)

### Responsive Design
- [ ] Desktop (> 768px): Full menu with names visible ✅
- [ ] Tablet (768px): Compact menu, still readable ✅
- [ ] Mobile (< 480px): Flag emojis visible, names hidden ✅
- [ ] No layout breakage on any screen size ✅
- [ ] Button clickable on all devices ✅

## 🌐 Functionality Testing

### Language Switching
- [ ] Click English (EN) → page translates to English
- [ ] Click Arabic (AR) → page translates to Arabic + RTL applied
- [ ] Click Turkish (TR) → page translates to Turkish + LTR applied
- [ ] Click Russian (RU) → page translates to Russian
- [ ] Click Persian (FA) → page translates to Persian + RTL applied
- [ ] Click Uzbek (UZ) → page translates to Uzbek
- [ ] Click Dari (AF) → page translates to Dari + RTL applied
- [ ] Language change instant (no page reload)

### Dropdown Interaction
- [ ] Dropdown closes after selecting language
- [ ] Clicking button again reopens dropdown
- [ ] Can click multiple languages in sequence
- [ ] Dropdown closes when clicking outside
- [ ] Dropdown closes when pressing Escape key
- [ ] Selected language shows checkmark

### localStorage Persistence
- [ ] Close browser completely
- [ ] Reopen site → same language loads automatically
- [ ] Refresh page → language preference persists
- [ ] Go to different page → language persists
- [ ] Test with each language
- [ ] Clear cache and test browser auto-detection

## 📄 Page Testing

### index.html
- [ ] Dropdown visible and working
- [ ] All nav links translate
- [ ] Hero section text translates
- [ ] Services section translates
- [ ] All pages accessible from nav

### about.html
- [ ] Dropdown visible and working
- [ ] Page content translates
- [ ] RTL/LTR applied correctly
- [ ] Navigation preserved

### blog.html
- [ ] Dropdown visible and working
- [ ] Blog content area visible
- [ ] Language switcher works
- [ ] Mobile menu works

### blog-details.html
- [ ] Dropdown visible and working
- [ ] Article content translates
- [ ] All navigation links work
- [ ] No layout issues

### contact.html
- [ ] Dropdown visible and working
- [ ] Form labels translate
- [ ] Form placeholders translate
- [ ] No minified code issues

### faq.html
- [ ] Dropdown visible and working
- [ ] FAQ questions/answers translate
- [ ] Accordion still works
- [ ] Content readable after translation

### landing.html
- [ ] Dropdown visible and working
- [ ] All sections translate
- [ ] Call-to-action buttons work
- [ ] Navigation consistent

## 🎨 RTL Testing (Arabic, Persian, Dari)

### Direction
- [ ] HTML direction set to "rtl"
- [ ] Body text flows right-to-left
- [ ] Nav menu items aligned right
- [ ] Dropdown positioned to left of button
- [ ] Margins/padding reversed correctly

### Layout Integrity
- [ ] No content overflow
- [ ] No text overlapping
- [ ] Buttons properly aligned
- [ ] Forms still usable
- [ ] Mobile layout correct

### Visual Elements
- [ ] Flag emojis render correctly
- [ ] Arrow direction correct (still pointing down)
- [ ] Checkmark position correct
- [ ] All text readable

## ⌨️ Keyboard & Accessibility

### Keyboard Navigation
- [ ] Tab key navigates to dropdown button
- [ ] Space/Enter opens dropdown
- [ ] Escape closes dropdown
- [ ] Tab through menu items
- [ ] Enter selects language option
- [ ] Tab returns focus to button

### Screen Reader Support
- [ ] Button announced as menu
- [ ] Menu items announced as menu items
- [ ] Current language announced
- [ ] Active language marked with aria-current
- [ ] ARIA labels read correctly

### Focus Indicators
- [ ] Focus outline visible on button
- [ ] Focus outline visible on menu items
- [ ] Sufficient color contrast
- [ ] Works with high contrast mode

## 🔧 Browser Testing

### Desktop Browsers
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari iOS
- [ ] Firefox Mobile
- [ ] Samsung Internet

### Compatibility
- [ ] CSS Grid works
- [ ] Flexbox positioning correct
- [ ] Transform/rotate smooth
- [ ] Animations render correctly

## 🎯 Data & Translation Testing

### Translation Files
- [ ] en.json loads correctly
- [ ] ar.json loads correctly
- [ ] tr.json loads correctly
- [ ] ru.json loads correctly
- [ ] fa.json loads correctly
- [ ] uz.json loads correctly
- [ ] af.json loads correctly

### Translation Content
- [ ] All nav items translate
- [ ] All page titles translate
- [ ] All button labels translate
- [ ] All form fields translate
- [ ] Fallback works (returns key if missing)

### data-i18n Attributes
- [ ] Elements with data-i18n update on language change
- [ ] Placeholders with data-i18n-placeholder work
- [ ] Titles with data-i18n-title work
- [ ] Aria-labels with data-i18n-aria work

## 📊 Performance Testing

### Load Time
- [ ] Page loads in < 2 seconds
- [ ] Language switch in < 100ms
- [ ] No visible lag or jank
- [ ] Animations smooth (60fps)

### Memory
- [ ] No console errors
- [ ] No memory leaks
- [ ] Dropdown garbage collected properly
- [ ] localStorage doesn't grow

### Network
- [ ] Language JSON files fetch correctly
- [ ] Files cached appropriately
- [ ] No 404s or failed requests
- [ ] CDN resources load

## 🎁 Advanced Testing

### Edge Cases
- [ ] Very long language names (if any)
- [ ] Very small screens (320px)
- [ ] Very large screens (> 1920px)
- [ ] Slow network (throttle to 3G)
- [ ] Multiple sections with translations

### State Management
- [ ] Switching back and forth between languages
- [ ] Rapid language switching (spam clicking)
- [ ] Language change with page navigation
- [ ] Multiple dropdown instances (none exist, but test)

### Error Handling
- [ ] Missing language JSON (try requesting 'xx')
- [ ] Corrupted JSON (test with browser tools)
- [ ] Missing data-i18n attribute (should not break)
- [ ] localStorage unavailable (private mode)

### User Scenarios
- [ ] User selects Arabic → visits all pages → language persists
- [ ] User selects Turkish → closes browser → reopens → Turkish loads
- [ ] User selects Persian → all RTL applied → selects English → LTR applied
- [ ] User on Dari page → selects English → all content updates

## 📋 Final Sign-Off Checklist

- [ ] All 7 pages have dropdown switcher
- [ ] All pages load without errors
- [ ] Language switches instantly on all pages
- [ ] localStorage works across all pages
- [ ] RTL applied correctly for Arabic/Persian/Dari
- [ ] Mobile responsive on all pages
- [ ] No console errors
- [ ] No CSS issues
- [ ] No JavaScript errors
- [ ] Keyboard navigation works
- [ ] Screen readers announce correctly
- [ ] Browser support verified
- [ ] Performance acceptable
- [ ] User experience smooth
- [ ] Ready for production ✅

## 🚀 Deployment Checklist

- [ ] All code committed
- [ ] No demo/test content left
- [ ] Assets properly linked (relative paths)
- [ ] No hardcoded URLs
- [ ] Minify JS/CSS (optional but recommended)
- [ ] Test on staging environment
- [ ] Final round of browser testing
- [ ] Performance profiling done
- [ ] Accessibility audit passed
- [ ] SEO meta tags updated
- [ ] Analytics tracking ready
- [ ] Backup created
- [ ] Deployment plan documented
- [ ] Rollback plan documented
- [ ] Monitoring set up
- [ ] Ready to deploy! 🎉

---

## How to Run Tests

### Manual Testing
1. Open each HTML page in browser
2. Click dropdown button
3. Select different languages
4. Verify content changes instantly
5. Refresh page - language should persist
6. Test on mobile device
7. Test RTL languages
8. Test keyboard navigation

### Browser Dev Tools Testing
```javascript
// In Console:

// Test current language
console.log(window.i18n.currentLanguage)

// Switch language
window.i18n.setLanguage('ar')

// Check direction
console.log(document.documentElement.dir)

// Get translation
console.log(window.i18n.getTranslation('nav.home'))

// Check localStorage
console.log(localStorage.getItem('ikameti_language'))
```

### Automated Testing (Optional)
```javascript
// Example test with browser automation (Selenium, Puppeteer, etc.)
// Click dropdown
page.click('.language-dropdown-btn')

// Wait for menu
await page.waitForSelector('.language-dropdown-menu.open')

// Select language
await page.click('[data-language-switch="ar"]')

// Verify language changed
const lang = await page.evaluate(() => window.i18n.currentLanguage)
console.assert(lang === 'ar', 'Language should be Arabic')
```

---

**Test Date**: _____________  
**Tester Name**: _____________  
**Status**: ☐ PASS ☐ FAIL  
**Issues Found**: 

Notes:
_________________________________________________________________
_________________________________________________________________

---

**Version**: 1.0  
**Last Updated**: April 2026
