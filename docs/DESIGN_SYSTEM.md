# 🎨 IKAMETI Design System

A comprehensive, scalable design system for a modern premium SaaS website. Built with CSS custom properties for maintainability and consistency.

---

## 📋 Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing System](#spacing-system)
4. [Button System](#button-system)
5. [Card System](#card-system)
6. [Form System](#form-system)
7. [Layout Components](#layout-components)
8. [Utilities](#utilities)
9. [Best Practices](#best-practices)

---

## 🎨 Color Palette

### Brand Colors

All colors are defined as CSS variables in the `:root` selector for easy global updates.

```css
--primary: #1F7A63;              /* Brand Green */
--primary-light: #2FA77A;        /* Lighter Green */
--primary-dark: #165644;         /* Darker Green */
--primary-hover: #0D5436;        /* Hover Green */

--cta: #FF771C;                  /* Call-to-Action Orange */
--cta-hover: #E96512;            /* CTA Hover */
--cta-dark: #D96411;             /* CTA Dark */
```

### Text Colors

```css
--text-main: #161311;            /* Main Text */
--text-secondary: #546877;       /* Secondary Text */
--text-tertiary: #7A8E9E;        /* Tertiary/Muted Text */
--text-light: #B8ACAA;           /* Light Text */
--text-white: #FFFFFF;           /* White Text */
```

### Background Colors

```css
--background: #F5EDE0;           /* Main Background */
--section-background: #EFE6D8;   /* Section Background (Alternating) */
--bg-alt: #EFE6D8;               /* Alternative Background */
--bg-muted: #E8DFD3;             /* Muted Background */
```

### Usage

```html
<!-- Using CSS Variables -->
<div style="color: var(--primary);">Primary Color Text</div>
<div style="background-color: var(--background);">Background</div>

<!-- Using Utility Classes -->
<h2 class="text-primary">Colored Heading</h2>
<p class="text-secondary">Secondary text</p>
<div class="bg-base">Section with base background</div>
```

---

## 🔤 Typography

### Font System

```css
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

### Heading Hierarchy

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | clamp(32px, 6vw, 56px) | 800 | 1.2 |
| H2 | clamp(28px, 5vw, 42px) | 700 | 1.2 |
| H3 | clamp(24px, 4vw, 32px) | 700 | 1.2 |
| H4 | 20px | 600 | 1.2 |
| H5 | 18px | 600 | 1.2 |
| Paragraph | 16px | 400 | 1.5 |

### Usage

```html
<h1>Main Page Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>
<p>Body text with default styling</p>

<!-- Utility Classes -->
<p class="text-large">Larger paragraph text</p>
<p class="text-small">Smaller caption text</p>
<p class="text-muted">Muted secondary text</p>
<p class="text-bold">Bold emphasized text</p>
```

---

## 📏 Spacing System

All spacing uses the scale below for consistency. Update `--space-*` variables to change globally.

```css
--space-0: 0px
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px       /* Standard paragraph margin */
--space-5: 20px
--space-6: 24px       /* Standard section padding */
--space-8: 32px       /* Large section padding */
--space-10: 40px
--space-12: 48px
--space-16: 64px      /* XL section padding */
--space-20: 80px
--space-24: 96px
```

### Usage

```html
<div style="padding: var(--space-6);">Nice padding</div>
<div style="margin-bottom: var(--space-8);">Nice margin</div>
<div class="space-y-8">Item spacing</div>
<section class="bg-base">Automatically gets --space-16 padding</section>
```

---

## 🔘 Button System

### Button Types

#### 1. Primary Button (Brand Green)

```html
<a href="/contact" class="btn btn-primary">Get Started</a>
```

**Styles:**
- Background: `var(--primary)` (#1F7A63)
- Hover: Darker green with lift effect
- Use for primary actions within pages

#### 2. CTA Button (Orange)

```html
<a href="/contact" class="btn btn-cta">Apply Now</a>
```

**Styles:**
- Background: `var(--cta)` (#FF771C)
- Hover: `var(--cta-hover)` (#E96512)
- Use for most prominent calls-to-action
- Best for high-conversion sections

#### 3. Outline Button

```html
<button class="btn btn-outline">Learn More</button>
```

**Styles:**
- Border: 2px solid primary color
- Background: Transparent
- Hover: Fills with primary color
- Secondary call-to-action

#### 4. Outline CTA

```html
<button class="btn btn-outline-cta">Explore</button>
```

**Styles:**
- Border: 2px solid CTA orange
- Background: Transparent
- Hover: Fills with CTA orange

#### 5. White Button (For Dark Backgrounds)

```html
<a href="#" class="btn btn-white">Learn More</a>
```

**Styles:**
- Used on dark backgrounds
- White background by default
- Transparent on hover

### Button Sizes

```html
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Normal (Default)</button>
<button class="btn btn-primary btn-lg">Large</button>
<button class="btn btn-primary btn-block">Full Width</button>
```

### Button States

```html
<button class="btn btn-primary" disabled>Disabled Button</button>
```

### Usage Examples

```html
<!-- Hero Section CTA -->
<div class="flex gap-4">
    <a href="/contact" class="btn btn-cta btn-lg">Get Started Now</a>
    <a href="/about" class="btn btn-white btn-lg">Learn More</a>
</div>

<!-- Form Submit -->
<button type="submit" class="btn btn-cta btn-block">Send Message</button>

<!-- Secondary Action -->
<a href="/blog" class="btn btn-outline">Read Our Blog</a>
```

---

## 🎴 Card System

### Basic Card

```html
<div class="card">
    <h3 class="card-title">Card Title</h3>
    <p>Card content goes here</p>
</div>
```

**Features:**
- White background
- Rounded corners (12px)
- Subtle border (1px)
- Smooth hover lift effect (translateY(-8px))
- On hover: Border color changes to primary, shadow enhances

### Card with Icon

```html
<div class="card">
    <div class="card-icon">🏠</div>
    <h3>Housing Solutions</h3>
    <p>Description of the service</p>
    <a href="#" class="btn btn-primary btn-sm">Explore</a>
</div>
```

**Icon Features:**
- 64x64px container
- Gradient background (light primary colors)
- Flexible emoji or icon support

### Featured Card

```html
<div class="card card-featured">
    <h3>Featured Section</h3>
    <p>This card has a primary border</p>
</div>
```

### CTA Card (Colored Background)

```html
<div class="card-cta">
    <h3>Call to Action</h3>
    <p>Takes the CTA orange gradient background</p>
</div>
```

### Card Structure

```html
<div class="card">
    <div class="card-header">
        <h3 class="card-title">Title</h3>
    </div>
    <div class="card-body">
        <p>Main content</p>
    </div>
    <div class="card-footer">
        <a href="#">Footer link</a>
    </div>
</div>
```

---

## 📝 Form System

### Form Groups

```html
<div class="form-group">
    <label class="form-label">Email Address *</label>
    <input type="email" class="form-input" placeholder="your@email.com" required>
    <p class="form-help">We'll never share your email</p>
</div>
```

### Input Types

```html
<!-- Text Input -->
<input type="text" class="form-input" placeholder="Full name">

<!-- Email Input -->
<input type="email" class="form-input" placeholder="email@example.com">

<!-- Textarea -->
<textarea class="form-textarea" placeholder="Your message..."></textarea>

<!-- Select -->
<select class="form-input">
    <option>Choose an option</option>
</select>
```

### Form States

**Focus State:**
- Border color changes to primary
- Box-shadow highlights input
- Smooth transition

**Error State:**
```html
<input type="text" class="form-input form-error" value="Invalid input">
<p class="form-error-msg">This field is required</p>
```

### Form Example

```html
<form>
    <div class="form-group">
        <label class="form-label">Full Name *</label>
        <input type="text" class="form-input" required>
    </div>
    
    <div class="form-group">
        <label class="form-label">Email *</label>
        <input type="email" class="form-input" required>
    </div>
    
    <div class="form-group">
        <label class="form-label">Message *</label>
        <textarea class="form-textarea" required></textarea>
    </div>
    
    <button type="submit" class="btn btn-cta btn-block">Send Message</button>
</form>
```

---

## 📐 Layout Components

### Container

```html
<div class="container">
    <!-- Max-width: 1280px, auto margins, responsive padding -->
</div>

<div class="container-sm">
    <!-- Max-width: 960px (smaller container) -->
</div>

<div class="container-lg">
    <!-- Max-width: 1440px (larger container) -->
</div>
```

### Section Backgrounds

```html
<!-- Alternating automatically -->
<section class="bg-base">Content</section>
<section class="bg-alt">Content</section>

<!-- Dark section -->
<section class="bg-dark">Light text content</section>

<!-- Gradient section -->
<section class="bg-gradient">Light text content</section>
```

### Grid Layouts

```html
<!-- 3-column grid -->
<div class="grid grid-cols-3">
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
</div>

<!-- 2-column grid -->
<div class="grid grid-cols-2">
    <div>Left</div>
    <div>Right</div>
</div>

<!-- Responsive: Becomes 1 column on mobile -->
```

Available grid columns: `grid-cols-1` through `grid-cols-6`

### Spacing Utilities

```html
<!-- Flex layouts -->
<div class="flex gap-4">Items with gap</div>
<div class="flex-center">Centered content</div>
<div class="flex-between">Space-between items</div>

<!-- Spacing -->
<div class="space-y-8">Multiple items with vertical spacing</div>
<div class="mt-4">Margin top</div>
<div class="mb-4">Margin bottom</div>
```

---

## 🛠️ Utilities

### Text Utilities

```html
<p class="text-primary">Primary colored text</p>
<p class="text-secondary">Secondary colored text</p>
<p class="text-muted">Muted/tertiary text</p>
<p class="text-light">Light colored text</p>
<p class="text-bold">Bold text</p>
<p class="text-center">Centered text</p>
<p class="text-large">Larger text</p>
<p class="text-small">Smaller text</p>
```

### Display Utilities

```html
<div class="flex">Display flex</div>
<div class="flex-col">Flex column</div>
<div class="items-center">Align items center</div>
<div class="justify-center">Justify center</div>

<!-- Responsive -->
<div class="hide-mobile">Hidden on mobile</div>
<div class="show-mobile">Shown only on mobile</div>
```

### Text Truncation

```html
<p class="truncate">Long text will be truncated with ellipsis...</p>
<p class="line-clamp-2">Truncated to 2 lines</p>
<p class="line-clamp-3">Truncated to 3 lines</p>
```

---

## ✨ Animations

### Animation Classes

```html
<!-- Fade In -->
<div class="animate-fade-in">Fades in smoothly</div>

<!-- Slide Up -->
<div class="animate-slide-up">Slides up into view</div>

<!-- Scale In -->
<div class="animate-scale-in">Scales in from small</div>

<!-- Float -->
<div class="animate-float">Continuously floats up/down</div>

<!-- Pulse -->
<div class="animate-pulse">Continuously pulses opacity</div>
```

### Stagger Effect

```html
<div class="grid grid-cols-3">
    <div class="stagger-item">Item 1 - animates first</div>
    <div class="stagger-item">Item 2 - animates second</div>
    <div class="stagger-item">Item 3 - animates third</div>
</div>

<!-- JavaScript auto-adds animation when in view -->
```

---

## 🎯 Best Practices

### 1. Color Usage

✅ **DO:**
- Use `--primary` for main brand interactions
- Use `--cta` for the most important call-to-action buttons
- Use `--text-secondary` for body text descriptions

❌ **DON'T:**
- Use inline colors
- Mix multiple brand colors on the same component
- Use hardcoded hex values

### 2. Spacing

✅ **DO:**
- Use the spacing scale (`var(--space-4)`, etc.)
- Maintain consistency with padding/margins
- Use section padding for visual breathing room

❌ **DON'T:**
- Use arbitrary pixel values like `margin: 13px`
- Mix spacing scales
- Forget padding on sections

### 3. Buttons

✅ **DO:**
- Use `.btn-cta` for primary conversions
- Use `.btn-primary` for secondary actions within pages
- Use appropriate sizes (`btn-lg`, `btn-sm`)

❌ **DON'T:**
- Use `.btn-primary` everywhere
- Mix button colors on the same page
- Use generic `<button>` without button classes

### 4. Forms

✅ **DO:**
- Wrap inputs in `.form-group`
- Use `.form-label` for all form labels
- Show `.form-error-msg` on validation
- Use `.form-help` for helper text

❌ **DON'T:**
- Use plain `<input>` without `.form-input` class
- Forget to style focus and hover states
- Create custom form styling

### 5. Cards

✅ **DO:**
- Use `.card` for grouped content
- Add `.card-icon` for visual interest
- Use `.card-cta` for promotional cards

❌ **DON'T:**
- Over-use cards (not everything needs one)
- Mix card styles
- Forget hover effects

### 6. Responsive Design

✅ **DO:**
- Use the built-in responsive grid system
- Stack cards on mobile with `grid-cols-2` → `grid-cols-1`
- Use `hide-mobile` and `show-mobile` utilities

❌ **DON'T:**
- Create custom breakpoints
- Override responsive classes
- Break layout on mobile

---

## 🔧 CSS Variables Reference

### Quick Reference

```scss
// Colors
--primary: #1F7A63
--cta: #FF771C
--text-main: #161311
--text-secondary: #546877
--background: #F5EDE0

// Spacing
--space-4: 16px (standard)
--space-6: 24px (sections)
--space-8: 32px (large)
--space-16: 64px (xl sections)

// Border Radius
--radius-lg: 12px (standard)
--radius-xl: 16px (cards)

// Transitions
--transition-normal: 300ms cubic-bezier(...)

// Shadows
--shadow-lg: 0 10px 15px (standard card shadow)
--shadow-primary: primary color shadow
--shadow-cta: CTA color shadow
```

---

## 📱 Responsive Breakpoints

The design system is mobile-first with these breakpoints:

- **Mobile:** 320px - 768px
- **Tablet:** 768px - 1024px
- **Desktop:** 1024px+

### Responsive Classes

```html
<div class="grid grid-cols-3">
    <!-- 3 columns on desktop -->
    <!-- 2 columns on tablet -->
    <!-- 1 column on mobile (automatic) -->
</div>
```

---

## 📚 Component Library

All reusable components follow these patterns:

1. **Button** - Various styles (primary, cta, outline, white)
2. **Card** - Content containers with hover effects
3. **Form** - Complete form styling system
4. **Section** - Full-width content sections with backgrounds
5. **Grid** - Responsive layout system
6. **Text Utilities** - Typography and text styling
7. **Spacing** - Consistent margin/padding scale

---

## 🚀 Getting Started

1. Link the CSS file: `<link rel="stylesheet" href="css/style.css">`
2. Use semantic HTML with design system classes
3. Leverage CSS variables for colors and spacing
4. Follow component patterns for consistency
5. Test on mobile devices

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** Production Ready
