/**
 * IKAMETI i18n System
 * Complete multi-language support with RTL/LTR handling
 */

// Resolve the site base from this script's own URL so the app works whether
// served from the domain root or a subpath (e.g. GitHub Pages /<repo>/).
const I18N_BASE = (function () {
  const s = document.currentScript;
  if (s && s.src) return s.src.replace(/assets\/js\/i18n\.js.*$/, '');
  return '/';
})();

class I18n {
  constructor() {
    this.languages = ['en', 'ar', 'tr', 'ru', 'fa', 'uz', 'af', 'tk'];
    this.rtlLanguages = ['ar', 'fa', 'af'];
    this.languageNames = {
      'en': 'English',
      'ar': 'العربية',
      'tr': 'Türkçe',
      'ru': 'Русский',
      'fa': 'فارسی',
      'uz': 'Ўзбек',
      'af': 'دری',
      'tk': 'Türkmençe'
    };
    this.currentLanguage = null;
    this.translations = {};
    this.defaultLanguage = 'en';
    this.dropdownOpen = false;
    this.init();
  }

  /**
   * Initialize the i18n system
   */
  async init() {
    // Priority: explicit user choice (localStorage) > pre-rendered page language
    // (the <html lang> set on per-language SEO pages) > browser preference
    this.currentLanguage = this.getSavedLanguage() || this.getDocumentLanguage() || this.getBrowserLanguage();

    // Load translations
    await this.loadLanguage(this.currentLanguage);
    
    // Setup language switcher listeners
    this.setupLanguageSwitcher();
    
    // Set initial RTL
    this.updateRTL();
  }

  /**
   * Get saved language from localStorage
   */
  getSavedLanguage() {
    return localStorage.getItem('ikameti_language');
  }

  /**
   * Get the language declared on the page itself (<html lang="..">).
   * Used so pre-rendered per-language SEO pages render in their own language.
   */
  getDocumentLanguage() {
    const l = document.documentElement.getAttribute('lang');
    return (l && this.languages.includes(l)) ? l : null;
  }

  /**
   * Rotate the navbar tagline (#rotating-text) through the translated
   * `rotating_words` for the current language, with a soft fade.
   */
  startNavRotation() {
    const el = document.getElementById('rotating-text');
    if (this._navRotateTimer) { clearInterval(this._navRotateTimer); this._navRotateTimer = null; }
    if (!el) return;
    const words = this.translations.rotating_words;
    if (!Array.isArray(words) || words.length === 0) return;

    let i = 0;
    el.style.transition = 'opacity 0.35s ease';
    el.textContent = words[0];
    if (words.length === 1) return;

    this._navRotateTimer = setInterval(() => {
      el.style.opacity = '0';
      setTimeout(() => {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        el.style.opacity = '1';
      }, 350);
    }, 2800);
  }

  /**
   * Get browser's preferred language
   */
  getBrowserLanguage() {
    const browserLang = navigator.language.split('-')[0];
    return this.languages.includes(browserLang) ? browserLang : this.defaultLanguage;
  }

  /**
   * Load language file dynamically
   */
  async loadLanguage(lang) {
    if (!this.languages.includes(lang)) {
      lang = this.defaultLanguage;
    }

    try {
      const response = await fetch(`${I18N_BASE}assets/lang/${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load ${lang}`);
      
      this.translations = await response.json();
      this.currentLanguage = lang;
      
      // Save to localStorage
      localStorage.setItem('ikameti_language', lang);
      
      // Update page language
      document.documentElement.lang = lang;
      document.documentElement.dir = this.translations.direction || 'ltr';
      
      // Translate all elements
      this.translatePage();

      // Update RTL
      this.updateRTL();

      // Rotate the navbar tagline words in the current language
      this.startNavRotation();

      // Trigger custom event
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { language: lang, direction: this.translations.direction }
      }));
      
    } catch (error) {
      console.error('Error loading language:', error);
      if (lang !== this.defaultLanguage) {
        this.loadLanguage(this.defaultLanguage);
      }
    }
  }

  /**
   * Get nested translation value by dot notation key
   * Example: 'nav.home' -> translations.nav.home
   */
  getTranslation(key) {
    const keys = key.split('.');
    let value = this.translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return value || key;
  }

  /**
   * Translate all elements with data-i18n attribute
   */
  translatePage() {
    // Translate text content
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.getTranslation(key);
      
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        // For form elements, update placeholder
        if (element.hasAttribute('data-i18n-placeholder')) {
          element.placeholder = translation;
        } else {
          element.value = translation;
        }
      } else {
        element.textContent = translation;
      }
    });

    // Translate placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.getTranslation(key);
    });

    // Translate title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.getTranslation(key);
    });

    // Translate aria-label attributes
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
      const key = element.getAttribute('data-i18n-aria');
      element.setAttribute('aria-label', this.getTranslation(key));
    });

    // Handle href attributes (for navigation)
    document.querySelectorAll('[data-i18n-href]').forEach(element => {
      const key = element.getAttribute('data-i18n-href');
      // This is typically for page translations, handled separately
    });
  }

  /**
   * Update RTL/LTR styles
   */
  updateRTL() {
    const isRTL = this.rtlLanguages.includes(this.currentLanguage);
    const html = document.documentElement;
    
    // Set direction
    html.style.direction = isRTL ? 'rtl' : 'ltr';
    html.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    
    // Add/remove RTL class for CSS handling
    if (isRTL) {
      html.classList.add('rtl-mode');
      html.classList.remove('ltr-mode');
    } else {
      html.classList.add('ltr-mode');
      html.classList.remove('rtl-mode');
    }
    
    // Update all elements with direction styles
    this.updateElementDirections();
  }

  /**
   * Update text direction for all elements that need adjustment
   */
  updateElementDirections() {
    const isRTL = this.rtlLanguages.includes(this.currentLanguage);
    
    // Update margin/padding directions
    document.querySelectorAll('[data-i18n-text]').forEach(element => {
      if (isRTL) {
        element.style.marginRight = element.style.marginLeft;
        element.style.paddingRight = element.style.paddingLeft;
      }
    });
  }

  /**
   * Setup language switcher buttons/dropdown
   */
  setupLanguageSwitcher() {
    // Support both old button-based and new dropdown-based switchers
    
    // Old style: Direct buttons with data-language-switch
    document.querySelectorAll('[data-language-switch]:not([role="menuitem"])').forEach(button => {
      const lang = button.getAttribute('data-language-switch');
      
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.setLanguage(lang);
      });
      
      if (lang === this.currentLanguage) {
        button.classList.add('active');
      }
    });

    // New style: Dropdown-based switcher
    const dropdownBtn = document.querySelector('.language-dropdown-btn');
    const dropdownMenu = document.querySelector('.language-dropdown-menu');
    
    if (dropdownBtn && dropdownMenu) {
      this.setupDropdown(dropdownBtn, dropdownMenu);
    }

    // Listen for language changes to update UI
    window.addEventListener('languageChanged', (e) => {
      // Update old-style buttons
      document.querySelectorAll('[data-language-switch]').forEach(button => {
        const lang = button.getAttribute('data-language-switch');
        if (lang === e.detail.language) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      });
      
      // Update dropdown button text
      if (dropdownBtn) {
        this.updateDropdownButton(dropdownBtn, e.detail.language);
      }
      
      // Update dropdown menu items
      if (dropdownMenu) {
        document.querySelectorAll('[role="menuitem"]').forEach(item => {
          const lang = item.getAttribute('data-language-switch');
          if (lang === e.detail.language) {
            item.classList.add('active');
            item.setAttribute('aria-current', 'true');
          } else {
            item.classList.remove('active');
            item.removeAttribute('aria-current');
          }
        });
      }
    });
  }

  /**
   * Setup dropdown switcher with click handlers
   */
  setupDropdown(btn, menu) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown(btn, menu);
    });

    // Handle menu item clicks
    menu.querySelectorAll('[data-language-switch]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = item.getAttribute('data-language-switch');
        this.setLanguage(lang);
        this.closeDropdown(btn, menu);
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        this.closeDropdown(btn, menu);
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeDropdown(btn, menu);
      }
    });

    // Set initial button text
    this.updateDropdownButton(btn, this.currentLanguage);
  }

  /**
   * Toggle dropdown visibility
   */
  toggleDropdown(btn, menu) {
    if (this.dropdownOpen) {
      this.closeDropdown(btn, menu);
    } else {
      this.openDropdown(btn, menu);
    }
  }

  /**
   * Open dropdown
   */
  openDropdown(btn, menu) {
    this.dropdownOpen = true;
    menu.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    btn.classList.add('active');
  }

  /**
   * Close dropdown
   */
  closeDropdown(btn, menu) {
    this.dropdownOpen = false;
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.classList.remove('active');
  }

  /**
   * Update dropdown button to show current language
   */
  updateDropdownButton(btn, lang) {
    const icon = btn.querySelector('.flag-icon') || btn.querySelector('.globe-icon');
    const text = btn.querySelector('.language-code') || (btn.children[1] || null);
    
    if (text) {
      text.textContent = lang.toUpperCase();
    }
    
    btn.setAttribute('data-current-language', lang);
  }

  /**
   * Set language and trigger page update
   */
  setLanguage(lang) {
    if (lang !== this.currentLanguage) {
      this.loadLanguage(lang);
    }
  }

  /**
   * Get current language
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get all available languages
   */
  getAvailableLanguages() {
    return this.languages;
  }

  /**
   * Check if current language is RTL
   */
  isRTL() {
    return this.rtlLanguages.includes(this.currentLanguage);
  }

  /**
   * Get translation object for a section
   */
  getSection(sectionKey) {
    return this.getTranslation(sectionKey);
  }

  /**
   * Format text with variables
   * Example: formatText('common.welcome', { name: 'John' })
   */
  formatText(key, variables = {}) {
    let text = this.getTranslation(key);
    Object.keys(variables).forEach(varKey => {
      text = text.replace(`{${varKey}}`, variables[varKey]);
    });
    return text;
  }
}

// Initialize i18n when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.i18n = new I18n();
});

// Expose to window for global access
if (!window.i18n) {
  window.i18n = new I18n();
}
