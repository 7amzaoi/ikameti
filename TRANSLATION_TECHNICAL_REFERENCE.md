# 📚 TRANSLATION SYSTEM - TECHNICAL REFERENCE

## 🎯 QUICK FACTS

```
Active Framework:    /assets/js/i18n.js (Class: I18n)
Translation Files:   /assets/lang/{lang}.json
Storage Key:         ikameti_language
Supported Languages: 7 (en, ar, tr, ru, fa, uz, af)
RTL Languages:       ar, fa, af
Default Language:    en
```

---

## 1️⃣ HOW THE STANDARD i18n FRAMEWORK WORKS

### Step 1: Load the Script
Pages like `index.html` include:
```html
<!-- Typically at end of body -->
<script src="assets/js/i18n.js"></script>
<script src="js/main.js"></script>
```

### Step 2: Framework Initializes
```javascript
// I18n class auto-runs init() in constructor
const i18n = new I18n();

// Inside init():
this.currentLanguage = this.getSavedLanguage() || this.getBrowserLanguage();
await this.loadLanguage(this.currentLanguage);
this.setupLanguageSwitcher();
this.updateRTL();
```

### Step 3: HTML Uses data-i18n Attributes
```html
<!-- Regular text -->
<h1 data-i18n="hero.title">Default fallback text</h1>

<!-- Form placeholders -->
<input data-i18n-placeholder="wizard.form.full_name" />

<!-- Titles & ARIA labels -->
<button data-i18n-title="nav.home" aria-label="Home"></button>
<a data-i18n-aria="help.text"></a>
```

### Step 4: Language File Contains Keys
**File: `/assets/lang/en.json`**
```json
{
  "hero": {
    "title": "Your Gateway to Premium Residency & Housing"
  },
  "wizard": {
    "form": {
      "full_name": "Full Name *"
    }
  }
}
```

### Step 5: Language Switcher Triggers
When user clicks language button:
```javascript
// Clicks <button data-lang="ar">
setActiveLanguage('ar');

// Which calls:
loadLanguage('ar')          // Fetches /assets/lang/ar.json
translatePage()             // Updates all data-i18n elements
updateRTL()                 // Sets dir="rtl" or dir="ltr"
localStorage.setItem()      // Saves preference
```

---

## 2️⃣ JSON TRANSLATION STRUCTURE

### File: `/assets/lang/en.json` (Complete Structure)

```json
{
  "lang": "en",
  "direction": "ltr",
  
  // NAVIGATION
  "nav": {
    "home": "Home",
    "about": "About",
    "blog": "Blog",
    "faq": "FAQ",
    "contact": "Contact"
  },
  
  // HOME PAGE HERO
  "hero": {
    "title": "Your Gateway to Premium Residency & Housing",
    "subtitle": "Expert guidance for immigration, residency, and housing contracts...",
    "cta_primary": "Get Started Now",
    "cta_secondary": "Learn More"
  },
  
  // SERVICES SECTION (Home)
  "services": {
    "title": "Our Core Services",
    "subtitle": "Comprehensive solutions designed to...",
    "housing": {
      "title": "Housing Solutions",
      "description": "Property verification, contract review...",
      "features": ["Property screening", "Contract review", "Legal support"],
      "cta": "Explore"
    },
    "residency": {
      "title": "Residency Programs",
      "description": "Navigate complex residency...",
      "features": ["Application support", "Document prep", "Interview coaching"],
      "cta": "View"
    },
    "legal": {
      "title": "Legal & Compliance",
      "description": "Full legal compliance...",
      "features": ["Legal review", "Compliance check", "24/7 support"],
      "cta": "Consult"
    }
  },
  
  // WHY CHOOSE US
  "why_choose": {
    "title": "Why IKAMETI?"
  },
  
  // TRUST INDICATORS
  "trust_indicators": {
    "clients": {
      "value": "5000+",
      "label": "Happy Clients"
    },
    "success_rate": {
      "value": "98%",
      "label": "Success Rate"
    },
    "years_experience": {
      "value": "15+",
      "label": "Years Experience"
    },
    "support": {
      "value": "24/7",
      "label": "Support Available"
    }
  },
  
  // TESTIMONIALS
  "testimonials": {
    "title": "What Clients Say",
    "quote_1": "IKAMETI made the entire residency process smooth...",
    "author_1": "Ahmed M.",
    "quote_2": "Professional, reliable, and genuinely caring...",
    "author_2": "Sarah K.",
    "quote_3": "Best decision we made...",
    "author_3": "James T."
  },
  
  // INTERACTIVE WIZARD
  "wizard": {
    "title": "Get Your Residency in Turkey in Minutes",
    "subtitle": "Answer a few quick questions...",
    "steps": {
      "step_1": {
        "label": "Residency Type",
        "question": "What type of residency are you interested in?"
      },
      "step_2": {
        "label": "Current Status",
        "question": "Do you already have residency in Turkey?"
      },
      "step_3": {
        "label": "Duration",
        "question": "How long do you want to stay?"
      },
      "step_4": {
        "label": "Additional Info",
        "question": "Tell us more about your situation"
      },
      "step_5": {
        "label": "Contact Info",
        "question": "Contact Information"
      }
    },
    "residency_options": {
      "tourist": {
        "title": "Tourist Residency",
        "description": "Short-term stay visa (30-90 days)"
      },
      "student": {
        "title": "Student Residency",
        "description": "Study permit with residence rights"
      },
      "realestate": {
        "title": "Real Estate Residency",
        "description": "Property investment visa (€250K+)"
      },
      "family": {
        "title": "Family Sponsorship",
        "description": "Family reunion visa program"
      }
    },
    "form": {
      "has_residency_yes": "Yes, I have residency",
      "has_residency_yes_desc": "Looking to renew or upgrade",
      "has_residency_no": "No, first time",
      "has_residency_no_desc": "I'm applying for the first time",
      "duration_1year": "1 Year Residency",
      "duration_1year_desc": "One-year residence permit",
      "duration_2year": "2 Years Residency",
      "duration_2year_desc": "Two-year residence permit",
      "rental_contract": "Do you have a rental contract?",
      "rental_contract_desc": "Required for most residency applications",
      "family_members": "Number of family members to include:",
      "family_members_opt_1": "Just me (1 person)",
      "family_members_opt_2": "2 people",
      "family_members_opt_3": "3 people",
      "family_members_opt_4": "4 people",
      "family_members_opt_5": "5 or more people",
      "full_name": "Full Name *",
      "full_name_placeholder": "Enter your full name",
      "phone": "Phone Number *",
      "phone_placeholder": "+90 (555) 123-4567",
      "privacy_notice": "Your information is secure...",
      "prev_button": "← Back",
      "next_button": "Next →",
      "submit_button": "Get Free Consultation"
    },
    "success": {
      "title": "Thank you for your information!",
      "message": "Our team will review your information...",
      "whatsapp": "💬 WhatsApp: +90 (555) 123-4567",
      "email": "📧 Email: info@ikameti.com"
    }
  },
  
  // ARTICLES SECTION
  "articles_section": {
    "title": "Articles & News",
    "subtitle": "Stay updated with the latest articles...",
    "article_1": {
      "title": "Complete Residency Guide",
      "icon": "📰",
      "description": "Learn all the steps..."
    },
    "article_2": {
      "title": "Property Buying Tips",
      "icon": "🏡",
      "description": "Discover the key points..."
    },
    "article_3": {
      "title": "Legal Protections",
      "icon": "⚖️",
      "description": "Understand your rights..."
    },
    "read_more": "Read More"
  },
  
  // FOOTER CTA
  "final_cta": {
    "title": "Ready to Get Started?",
    "description": "Take the first step...",
    "button": "Contact Us Today"
  },
  
  // NEWSLETTER
  "newsletter": {
    "title": "Stay Updated",
    "subtitle": "Get the latest articles...",
    "placeholder": "Enter your email",
    "cta": "Subscribe"
  },
  
  // FOOTER
  "footer": {
    "company": "IKAMETI",
    "tagline": "Your trusted partner...",
    "quick_links": "Quick Links",
    "services": "Services",
    "contact": "Contact",
    "housing_solutions": "Housing Solutions",
    "residency_programs": "Residency Programs",
    "legal_consultation": "Legal Consultation",
    "support": "Support",
    "copyright": "© 2024 IKAMETI. All rights reserved.",
    "privacy_policy": "Privacy Policy",
    "terms_of_service": "Terms of Service"
  },
  
  // ❌ ABOUT PAGE SECTION (NOT USED BY about.html)
  "about_page": {
    "hero": {
      "title": "About IKAMETI",
      "subtitle": "A trusted partner in residency and housing solutions..."
    },
    "story": {
      "title": "Our Story",
      "paragraph_1": "Founded in 2009...",
      "paragraph_2": "Our team of experienced..."
    },
    "mission": {
      "title": "Our Mission",
      "description": "To provide exceptional..."
    },
    "values": {
      "title": "Our Core Values",
      "integrity": {
        "title": "Integrity",
        "description": "We operate with complete transparency..."
      },
      "excellence": {
        "title": "Excellence",
        "description": "We strive for excellence..."
      },
      "client_first": {
        "title": "Client-First",
        "description": "Your needs come first..."
      },
      "innovation": {
        "title": "Innovation",
        "description": "We continuously evolve..."
      },
      "reliability": {
        "title": "Reliability",
        "description": "You can count on us..."
      },
      "community": {
        "title": "Community",
        "description": "We support diverse communities..."
      }
    },
    "trusted": {
      "title": "Trusted by Thousands",
      "clients": {
        "value": "5000+",
        "label": "Happy Clients"
      },
      "success_rate": {
        "value": "98%",
        "label": "Success Rate"
      },
      "experience": {
        "value": "15+",
        "label": "Years Experience"
      },
      "countries": {
        "value": "20+",
        "label": "Countries"
      }
    },
    "cta": {
      "title": "Ready to Start Your Journey?",
      "description": "Let us help you...",
      "button": "Get Started Today"
    }
  },
  
  // FAQ PAGE
  "faq": { ... },
  
  // CONTACT PAGE
  "contact": { ... }
}
```

### Language Files Available:
- `/assets/lang/en.json` - English (LTR)
- `/assets/lang/ar.json` - Arabic (RTL)
- `/assets/lang/tr.json` - Turkish (LTR)
- `/assets/lang/ru.json` - Russian (LTR)
- `/assets/lang/fa.json` - Persian (RTL)
- `/assets/lang/uz.json` - Uzbek (LTR)
- `/assets/lang/af.json` - Dari (RTL)

---

## 3️⃣ HOW ABOUT.HTML CURRENTLY WORKS (STANDALONE)

### Problem: Not Using Standard Framework

Instead of using `data-i18n` attributes, `/about.html` has **hardcoded translation objects** inside a `<script>` tag:

### The Hardcoded Objects:

#### A) Global Strings (7 languages):
```javascript
const strings = {
  ar: {
    lang: 'ar',
    dir: 'rtl',
    badge: 'إقامتي',
    home: 'الرئيسية',
    about: 'من نحن',
    blog: 'المدونة',
    faq: 'الأسئلة',
    contact: 'تواصل',
    heroTitle: 'من نحن',
    heroSubtitle: 'منصة متخصصة في تقديم خدمات...',
    // ... 100+ more strings
  },
  en: {
    lang: 'en',
    dir: 'ltr',
    badge: 'Residency',
    home: 'Home',
    about: 'About',
    blog: 'Blog',
    faq: 'FAQ',
    contact: 'Contact',
    heroTitle: 'About Us',
    heroSubtitle: 'A specialized platform for residency services...',
    // ... 100+ more strings
  },
  tr: { ... },
  ru: { ... },
  fa: { ... },
  uz: { ... },
  af: { ... }
}
```

#### B) Page Copy (200+ strings):
```javascript
const pageCopy = {
  ar: {
    heroLabel: 'عن الشركة',
    trustBadge: 'موثوقون لدى أكثر من 500 عميل',
    overviewTitle: 'نحل مشكلة حقيقية يواجهها كل أجنبي في تركيا',
    overviewBody: 'IKAMETI تساعد المقيمين...',
    overviewPoints: [
      'شرح واضح لكل خطوة...',
      'متابعة عملية لكل طلب...',
      'حلول مناسبة لاحتياجات...'
    ],
    visionTitle: 'رؤيتنا',
    visionBody: 'أن تصبح IKAMETI...',
    missionTitle: 'مهمتنا',
    missionBody: 'نحوّل الإجراءات المعقدة...',
    messageTitle: 'رسالتنا',
    messageBody: 'نقدم إرشاداً عملياً...',
    // ... 50+ more strings
  },
  en: {
    heroLabel: 'About the company',
    trustBadge: 'Trusted by 500+ clients',
    overviewTitle: 'We solve a real problem...',
    // ... etc
  },
  // ... tr, ru, fa, uz, af
}
```

#### C) Rotating Labels:
```javascript
const rotatingLabels = {
  ar: ['إقامة', 'حلول', 'خدمات', 'استشارات'],
  en: ['Residency', 'Housing', 'Legal Services', 'Solutions'],
  tr: ['İkamet', 'Konut', 'Hizmetler', 'Çözümler'],
  ru: ['ВНЖ', 'Жильё', 'Услуги', 'Решения'],
  fa: ['اقامت', 'مسکن', 'خدمات', 'راهکارها'],
  uz: ['Yashash', 'Uy-joy', 'Xizmatlar', 'Yechimlar'],
  af: ['اقامت', 'مسکن', 'خدمات', 'راه‌حل‌ها']
}
```

#### D) Section Titles:
```javascript
const sectionTitles = {
  overview: { ar: 'نظرة عامة', en: 'Overview', tr: 'Genel Bakış' },
  services: { ar: 'خدماتنا', en: 'Our Services', tr: 'Hizmetlerimiz' },
  why: { ar: 'لماذا نحن', en: 'Why Us', tr: 'Neden Biz' },
  how: { ar: 'كيف نعمل', en: 'How We Work', tr: 'Nasıl Çalışıyoruz' },
  who: { ar: 'من نخدم', en: 'Who We Serve', tr: 'Kimlere Hizmet Veriyoruz' },
  stats: { ar: 'الثقة', en: 'Trust', tr: 'Güven' },
  commitment: { ar: 'التزامنا', en: 'Our Commitment', tr: 'Taahhüdümüz' }
}
```

### Manual Translation Application:

Instead of framework automatically applying `data-i18n`, the about page has a custom function:

```javascript
function setActiveLanguage(lang) {
  // Manually set document language
  html.lang = strings[lang].lang;
  html.dir = strings[lang].dir;
  
  // Manually update navigation
  document.querySelectorAll('.nav-menu a, #mobile-menu a').forEach((el) => {
    const key = el.getAttribute('data-nav');
    if (strings[lang][key]) el.textContent = strings[lang][key];
  });
  
  // Manually update hero
  document.querySelector('.hero h1').textContent = strings[lang].heroTitle;
  document.querySelector('[data-hero-subtitle]').textContent = strings[lang].heroSubtitle;
  
  // Apply all page copy
  applyPageCopy(lang);
}

function applyPageCopy(lang) {
  const copy = pageCopy[lang];
  
  // Manual element by element updates
  document.querySelector('.hero-label').textContent = copy.heroLabel;
  document.querySelector('.trust-badge span:last-child').textContent = copy.trustBadge;
  
  // For overview section
  document.querySelector('.overview-grid .section-title').textContent = copy.overviewTitle;
  document.querySelector('.overview-grid .section-subtitle').textContent = copy.overviewBody;
  document.querySelectorAll('.overview-grid .check-list li span:last-child').forEach((el, index) => {
    if (copy.overviewPoints[index]) el.textContent = copy.overviewPoints[index];
  });
  
  // For vision/mission/message cards
  document.querySelector('.vision-box h3').textContent = copy.visionTitle;
  document.querySelector('.vision-box p').textContent = copy.visionBody;
  document.querySelector('.two-col .card:nth-child(1) h3').textContent = copy.missionTitle;
  document.querySelector('.two-col .card:nth-child(1) p').textContent = copy.missionBody;
  document.querySelector('.two-col .card:nth-child(2) h3').textContent = copy.messageTitle;
  document.querySelector('.two-col .card:nth-child(2) p').textContent = copy.messageBody;
  
  // ... continues for 50+ more manual updates
}
```

---

## 4️⃣ COMPARISON: STANDARD vs ABOUT PAGE

### Standard Pages (index.html, contact.html, etc.):
```html
<!-- HTML is simple -->
<h1 data-i18n="hero.title">Default</h1>

<!-- JavaScript minimal -->
<script src="assets/js/i18n.js"></script>
<!-- Automatic translation! -->
```

### About Page (about.html):
```html
<!-- HTML mixed with French placeholder text -->
<h1>من نحن</h1> <!-- Arabic hardcoded -->

<!-- JavaScript has 1600+ lines -->
<script>
  // 300+ hardcoded strings
  const strings = { ar: { ... }, en: { ... }, ... }
  
  // 200+ pageCopy strings
  const pageCopy = { ar: { ... }, en: { ... }, ... }
  
  // Manual translation function
  function setActiveLanguage(lang) { 
    // 50+ DOM query + manual updates
  }
  
  // Call when language changes
  langButtons.forEach(btn => 
    btn.addEventListener('click', () => setActiveLanguage(btn.dataset.lang))
  );
</script>
```

---

## 5️⃣ STORAGE & PERSISTENCE

### How Language Preference is Saved

```javascript
// In i18n.js loadLanguage():
localStorage.setItem('ikameti_language', lang);

// Next time user visits:
const savedLang = localStorage.getItem('ikameti_language');
if (savedLang) {
  // Use saved language
  loadLanguage(savedLang);
} else {
  // Use browser default
  const browserLang = navigator.language.split('-')[0];
  loadLanguage(browserLang);
}
```

### Browser Storage:
```
Domain:  ikameti.com (or localhost)
Storage: localStorage
Key:     "ikameti_language"
Value:   "en" | "ar" | "tr" | "ru" | "fa" | "uz" | "af"
Duration: Persistent (until user clears browser data)
```

---

## 6️⃣ RTL/LTR DIRECTION HANDLING

### Framework Approach:
```javascript
// In i18n.js updateRTL():
const isRTL = this.rtlLanguages.includes(this.currentLanguage);

// Set on root element
document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
document.documentElement.lang = lang;

// Add CSS classes
if (isRTL) {
  html.classList.add('rtl-mode');
  html.classList.remove('ltr-mode');
}
```

### CSS Handles Direction:
```css
/* In /assets/css/i18n.css */
[dir="rtl"] .nav-menu {
  flex-direction: row-reverse;
}

[dir="rtl"] .container {
  direction: rtl;
}

/* Flexbox auto-reverses with dir="rtl" */
```

### About Page Also Uses This:
```javascript
// Sets dir in setActiveLanguage()
html.dir = strings[lang].dir; // 'rtl' or 'ltr'
document.documentElement.setAttribute('dir', strings[lang].dir);
```

---

## 7️⃣ EVENT FLOW DIAGRAM

### When User Clicks Language Button:

```
User clicks <button data-lang="ar">
    ↓
addEventListener('click', function)
    ↓
setActiveLanguage('ar')
    ↓
├─ Save: localStorage.setItem('ikameti_language', 'ar')
├─ Fetch: await fetch('/assets/lang/ar.json')
├─ Parse: const data = await response.json()
├─ Store: this.translations = data
├─ Update DOM: document.documentElement.lang = 'ar'
├─ Update Dir: document.documentElement.dir = 'rtl'
├─ Translate: translatePage() [applies all data-i18n]
├─ Update RTL: updateRTL() [adds/removes CSS classes]
└─ Dispatch: window.dispatchEvent(new CustomEvent('languageChanged', ...))
    ↓
(Optional) Other scripts listening for languageChanged event
    ↓
Page now in Arabic, RTL mode, preference saved
```

---

## 8️⃣ USAGE EXAMPLES

### Adding New Content to Home Page (Using Framework):

**HTML:**
```html
<section>
  <h2 data-i18n="my_section.title">Fallback Title</h2>
  <p data-i18n="my_section.description">Fallback description</p>
</section>
```

**JSON (add to `/assets/lang/en.json`):**
```json
"my_section": {
  "title": "New Section Title",
  "description": "New section description text here."
}
```

**Repeat for all 7 languages** - Done! Automatic translation.

### Adding New Content to About Page (Current System):

**HTML:**
```html
<div class="my-section">
  <h2>New Section</h2>
  <p>Description</p>
</div>
```

**JavaScript (in about.html `<script>` tag):**
```javascript
// Add to strings object for each language:
const strings = {
  ar: { ..., mySection: 'قسم جديد', myDesc: 'وصف جديد' },
  en: { ..., mySection: 'New Section', myDesc: 'New description' },
  // ... repeat for tr, ru, fa, uz, af
}

// Add to pageCopy for complex sections:
const pageCopy = {
  ar: { ..., myNewContent: '...' },
  en: { ..., myNewContent: '...' },
  // ... etc
}

// Add manual DOM updates in setActiveLanguage() or applyPageCopy():
document.querySelector('.my-section h2').textContent = pageCopy[lang].myNewContent;
```

**This is tedious!** This is why integration is needed.

---

## 9️⃣ KEY FUNCTIONS REFERENCE

### In `/assets/js/i18n.js`:

| Function | Purpose | Returns |
|----------|---------|---------|
| `I18n()` | Constructor, runs init | N/A |
| `init()` | Load language, setup listeners | Promise |
| `loadLanguage(lang)` | Fetch JSON, apply translations | Promise |
| `getSavedLanguage()` | Get from localStorage | String or null |
| `getBrowserLanguage()` | Detect from navigator | String |
| `translatePage()` | Apply all data-i18n attributes | void |
| `getTranslation(key)` | Get value by dot notation | String |
| `updateRTL()` | Set dir attribute + CSS classes | void |
| `setupLanguageSwitcher()` | Add click listeners to buttons | void |

---

## 🔟 TROUBLESHOOTING

### Problem: Language doesn't change
```
1. Check: localStorage.getItem('ikameti_language')
2. Check: Is data-i18n attribute present in HTML?
3. Check: Does JSON file have that key?
4. Check: Is /assets/lang/{lang}.json accessible (no 404)?
5. Check: Browser console for fetch errors
```

### Problem: RTL not working
```
1. Check: document.documentElement.dir (should be 'rtl')
2. Check: Is CSS file /assets/css/i18n.css loaded?
3. Check: RTL languages list includes your language? ['ar', 'fa', 'af']
4. Check: CSS selectors like [dir="rtl"] are being applied
```

### Problem: About page translations not saving
```
1. About page uses its own localStorage key (should be same: 'ikameti_language')
2. Check: setActiveLanguage() is being called on button click
3. Check: Language buttons have data-lang attribute
4. Check: addEventListener is attached to correct buttons
```

---

**End of Technical Reference**
