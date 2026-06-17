# IKAMETI Static Website

A complete, production-ready static website built with pure HTML, CSS, and Vanilla JavaScript. No frameworks, no build tools required!

## 📁 Project Structure

```
ikameti-static/
├── index.html              # Home page
├── about.html              # About company page
├── blog.html               # Blog listing page
├── blog-details.html       # Individual blog article page
├── contact.html            # Lead capture form
├── landing.html            # Residency service landing page
├── css/
│   └── style.css           # All styling (Tailwind CDN + custom CSS)
├── js/
│   ├── main.js             # Main interactivity script
│   └── blog-data.js        # Blog articles data
└── README.md               # This file
```

## 🚀 How to Use

### Quick Start (No Installation Needed!)

1. **Open any HTML file directly in your browser:**
   - Just double-click any `.html` file to open it
   - Or right-click → Open with → Your favorite browser

2. **Or serve locally for better experience:**
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Python 2
   python -m SimpleHTTPServer 8000
   
   # Using Node.js (if installed)
   npx http-server
   ```
   Then visit: `http://localhost:8000`

## 📄 Pages Overview

### 1. **index.html** - Home Page
- Hero section with CTA
- 3 service cards (Residency, Housing, Legal)
- Why Choose Us section
- Testimonials
- Footer

**Navigate to:** Click "Home" in navbar or open `index.html`

### 2. **about.html** - About Us
- Company introduction with stats
- Mission and Vision sections
- 6 trust element cards
- 4 core values
- CTA to contact

**Navigate to:** Click "About" in navbar

### 3. **blog.html** - Blog List
- Grid of 6 blog articles
- Category filter buttons (Immigration, Housing, Legal)
- Filter functionality with animations
- Newsletter CTA

**Navigate to:** Click "Blog" in navbar

### 4. **blog-details.html** - Blog Article Page
- Full article content with featured image
- Author information
- Related articles
- Contact CTA

**Navigate to:** Click any article in blog.html

### 5. **contact.html** - Contact/Lead Form
- Form with validation:
  - Full Name (required)
  - Phone Number (required + regex validation)
  - Nationality (required)
  - Service Type (dropdown, required)
  - Additional Notes (optional)
- Real-time error clearing
- Console logging of submitted data
- Alternative contact methods (WhatsApp, Email, Phone)
- Loading state (1.5 second simulation)
- Success alert (auto-hides after 5 seconds)

**Form Data:** Check browser console (F12) to see submitted data

**Navigate to:** Click "Contact" in navbar or any "Contact Us" button

### 6. **landing.html** - Residency Landing Page
- High-converting single-service focus
- 6 benefit cards
- 5-step process timeline
- 3 success testimonials
- 4 FAQ items (expandable)
- Multiple CTAs throughout
- Sticky header for quick action

**Navigate to:** Click "Get Started" button or "Residency Guide"

## 🎨 Design System

### Colors
- **Primary:** `#1E3A8A` (Trust Blue)
- **Secondary:** `#3B82F6` (Light Blue)
- **Accent/CTA:** `#25D366` (WhatsApp Green)
- **Text Primary:** `#111827` (Dark Gray)
- **Text Secondary:** `#6B7280` (Medium Gray)
- **Background Primary:** `#FFFFFF` (White)
- **Background Secondary:** `#F9FAFB` (Light Gray)

### Typography
- System fonts for optimal performance
- Responsive text sizes (mobile-first)
- Clear hierarchy with h1-h6

### Spacing
- 8px base unit
- Tailwind-like responsive breakpoints
- Consistent padding/margins throughout

## 💻 Features & Functionality

### ✅ Mobile Menu
- Hamburger icon that animates
- Responsive navigation
- Auto-closes when clicking links
- Touch-friendly

### ✅ Form Validation
- Real-time error clearing as user types
- Phone number regex validation
- Required field checking
- Console logging of form submissions

### ✅ Responsive Design
- Mobile-first approach
- Works perfectly on all devices
- Tablet and desktop optimized
- Touch-friendly buttons and inputs

### ✅ Interactivity
- Smooth scroll behavior
- Navbar scroll detection with shadow effect
- Blog category filtering with animation
- Expandable FAQ items
- Scroll-to-top button (appears after scrolling 300px)

### ✅ Performance
- No external dependencies (Tailwind via CDN)
- Optimized images (via Unsplash)
- Fast load times
- Smooth animations
- Minimal JavaScript

### ✅ Accessibility
- Semantic HTML
- Focus states on interactive elements
- Proper heading hierarchy
- Form labels and error messages
- Readable font sizes

## 🔧 Customization Guide

### Change Colors
Edit `css/style.css` - Update CSS variables in `:root` section:
```css
:root {
    --primary-color: #1E3A8A;
    --secondary-color: #3B82F6;
    --accent-color: #25D366;
    /* ... */
}
```

### Change Company Name
Search for "IKAMETI" and replace with your company name in all HTML files.

### Update Phone Number
Replace `+1 (555) 123-4567` with your actual phone number.

### Update Email
Replace `info@ikameti.com` with your email address.

### Edit Blog Articles
Edit `js/blog-data.js` - Modify the `blogArticles` array to add/edit articles.

### Change Contact Form Fields
Edit `contact.html` - Modify the form structure and validation in the inline script.

### Update Images
Replace Unsplash image URLs with your own:
```html
<img src="YOUR_IMAGE_URL" alt="Description">
```

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔐 Data Handling

### Contact Form
- **Form Data Capture:** Logged to browser console (F12)
- **Storage:** No backend - console logging only
- **Future:** Add email notifications or database integration

### Blog Data
- **Storage:** JavaScript array in `js/blog-data.js`
- **Future:** Connect to CMS or database for dynamic content

## 📈 Next Steps for Production

### 1. Deploy to Hosting
- **Netlify:** Drag & drop folder
- **Vercel:** Connect GitHub repo
- **GitHub Pages:** Push to `gh-pages` branch
- **Traditional Hosting:** FTP upload all files

### 2. Add Backend Integration
```javascript
// Update contact.html form submission to:
fetch('/api/submit-lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
})
```

### 3. Connect Email Service
- SendGrid
- Mailchimp
- Custom backend

### 4. Add Analytics
```html
<!-- Add Google Analytics in footer -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
```

### 5. SEO Optimization
- Add meta descriptions to each page
- Add Open Graph tags for social sharing
- Create `sitemap.xml`
- Create `robots.txt`

### 6. SSL Certificate
- Get HTTPS for security
- Update all links to use `https://`

## 🛠️ Troubleshooting

### Forms Not Working
- Check browser console for errors (F12)
- Ensure JavaScript is enabled
- Check that `js/blog-data.js` is loaded

### Blog Articles Not Showing
- Verify `blog-data.js` is linked in `blog.html`
- Check browser console for errors
- Ensure all 6 articles are in the array

### Images Not Loading
- Check image URLs are accessible
- Verify internet connection
- Check if Unsplash is reachable

### Mobile Menu Not Working
- Ensure `js/main.js` is loaded
- Check browser console for errors
- Verify JavaScript is enabled

## 📦 What's Included

✅ 6 Complete HTML Pages
✅ Responsive Design (Mobile, Tablet, Desktop)
✅ Contact Form with Validation
✅ Blog System with 6 Articles
✅ Mobile-First Navigation
✅ Modern UI Components
✅ Smooth Animations
✅ Brand Consistency
✅ Production-Ready Code
✅ Zero Framework Dependencies
✅ SEO-Friendly HTML
✅ Accessibility Support

## 📞 Support

For issues or questions, contact: **info@ikameti.com**

## 📄 License

Free to use and modify. Attribution appreciated but not required.

---

**Built with ❤️ for IKAMETI**

Version: 1.0.0
Last Updated: April 9, 2024
