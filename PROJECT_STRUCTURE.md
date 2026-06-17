# IKAMETI Project Structure

## 📁 Folder Organization

```
ikameti-static/
├── index.html                 # Main landing page
├── about.html                 # About page
├── contact.html               # Contact page
├── faq.html                   # FAQ page
│
├── blog/                      # Blog system (PRODUCTION)
│   ├── index.html            # Blog listing page
│   ├── article.html          # Article detail page
│   ├── assets/
│   │   ├── css/blog.css      # Blog styling
│   │   └── js/blog.js        # Blog JavaScript
│   └── data/
│       └── articles.json     # Blog articles data
│
├── css/                       # Global styles
│   └── style.css             # Main stylesheet
│
├── js/                        # Global scripts
│   ├── main.js               # Main functionality
│   ├── i18n.js               # Internationalization engine
│   └── page-handler.js       # Page translation handler
│
├── assets/                    # Global assets
│   ├── css/i18n.css          # i18n styling
│   └── js/i18n.js            # i18n system
│
├── lang/                      # Language files (7 languages)
│   ├── en.json               # English
│   ├── ar.json               # العربية
│   ├── tr.json               # Türkçe
│   ├── ru.json               # Русский
│   ├── fa.json               # فارسی
│   ├── uz.json               # O'zbekcha
│   └── af.json               # Afrikaans
│
├── docs/                      # Documentation & Reports
│   ├── README.md             # Project README
│   ├── DESIGN_SYSTEM.md      # Design system docs
│   ├── I18N_SYSTEM.md        # i18n documentation
│   ├── [40+ other docs]      # Development reports & guides
│   └── ...
│
├── pages/                     # Secondary/archived pages
│   ├── blog.html             # Old blog page
│   ├── blog-details.html     # Old blog detail
│   └── landing.html          # Landing page variant
│
├── scripts/                   # Utility & development scripts
│   ├── BLOG_DEBUG.js         # Blog debugging utilities
│   ├── validate-blog-system.js # Blog validation
│   ├── update-hero.ps1       # Hero update script
│   ├── setup-i18n.sh         # i18n setup script
│   ├── TEST_BLOG_TRANSLATION.html # Test page
│   └── ...
│
└── deprecated/               # Old/unused files
    ├── README_BLOG_FIX.md    # Old documentation
    └── ...
```

## 📋 Key Files Explained

### Production Pages (Root Level)
- **index.html** - Main entry point, homepage
- **about.html** - About IKAMETI company
- **contact.html** - Contact form page
- **faq.html** - FAQ page

### Blog System (`/blog/`)
- **index.html** - Blog listing with filtering
- **article.html** - Single article view with SEO tags
- **assets/js/blog.js** - Main blog logic
- **assets/css/blog.css** - Blog styling (450+ lines)
- **data/articles.json** - Blog content source (7 articles)

### Core Systems
- **css/style.css** - Main stylesheet (red government design)
- **js/i18n.js** - Internationalization system (7 languages)
- **js/main.js** - Global functionality
- **js/page-handler.js** - i18n page integration

### Documentation (`/docs/`)
Contains all project documentation:
- Design system specifications
- i18n implementation details
- Blog structure & guides
- Development reports
- Implementation checklists
- Translation logs

### Scripts (`/scripts/`)
Development & maintenance utilities:
- Blog debug & validation tools
- Setup scripts for i18n
- Hero section updates
- Test pages

### Deprecated (`/deprecated/`)
Old documentation or superseded files

## 🌐 Features

### Internationalization (7 Languages)
- **LTR**: English, Turkish, Russian, Uzbek
- **RTL**: Arabic, Farsi, Afrikaans
- Language auto-detection & switching

### Blog System
- 7 unique articles
- Dynamic loading from JSON
- Category filtering
- Related articles
- Full SEO support (meta tags, OG tags, canonical links)
- Responsive design

### Red Government Design
- Professional government-style theme
- Red/gray/white color palette
- Modern, clean layout
- Mobile-responsive

## 📝 Development Notes

### To Add New Pages
1. Create `.html` in root directory if production page
2. Update navbar links in all pages
3. Ensure all CSS/JS paths are correct

### To Add Blog Articles
1. Edit `/blog/data/articles.json`
2. Add article object with required fields:
   - id, title, slug, description, image
   - date, category, author, content (HTML)
3. Article automatically appears on blog

### To Add New Language
1. Create `/lang/xx.json` (e.g., `de.json` for German)
2. Translate all keys maintaining structure
3. Update language list in i18n.js if needed

## 🎯 Project Status

**Production Ready** ✅
- All pages fully functional
- 7-language support complete
- Blog system operational
- SEO optimized
- Red design theme applied

Last Updated: April 28, 2026
