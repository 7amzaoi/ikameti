/**
 * IKAMETI i18n System - Professional Multilingual Engine
 * Complete architecture for static + dynamic translation
 */

class I18nEngine {
  constructor() {
    this.languages = ['en', 'ar', 'tr', 'ru', 'fa', 'uz', 'af'];
    this.rtlLanguages = ['ar', 'fa', 'af'];
    this.currentLanguage = null;
    this.translations = {};
    this.defaultLanguage = 'en';
    this.storageKey = 'ikameti_language';
    this.translationCache = {};
    
    this.init();
  }

  /**
   * Initialize the i18n system
   */
  async init() {
    // Detect language
    this.currentLanguage = this.getSavedLanguage() || this.detectBrowserLanguage();
    
    // Load language file
    await this.loadLanguage(this.currentLanguage);
    
    // Setup event listeners
    this.setupLanguageSwitcher();
    this.setupMobileMenu();
    
    // Translate page
    this.translateStatic();
    this.applyRTL();
    
    // Setup mutation observer for dynamic content
    this.setupMutationObserver();
  }

  /**
   * Get saved language from localStorage
   */
  getSavedLanguage() {
    try {
      return localStorage.getItem(this.storageKey);
    } catch (e) {
      console.warn('localStorage not available');
      return null;
    }
  }

  /**
   * Save language to localStorage
   */
  saveLanguage(lang) {
    try {
      localStorage.setItem(this.storageKey, lang);
    } catch (e) {
      console.warn('Cannot save language to localStorage');
    }
  }

  /**
   * Detect browser language
   */
  detectBrowserLanguage() {
    const browserLang = navigator.language?.split('-')[0];
    return this.languages.includes(browserLang) ? browserLang : this.defaultLanguage;
  }

  /**
   * Load language file dynamically
   */
  async loadLanguage(lang) {
    if (!this.languages.includes(lang)) {
      lang = this.defaultLanguage;
    }

    // Check cache first
    if (this.translationCache[lang]) {
      this.translations = this.translationCache[lang];
      this.currentLanguage = lang;
      return;
    }

    try {
      const response = await fetch(`/lang/${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load ${lang}`);
      
      const data = await response.json();
      this.translations = data;
      this.translationCache[lang] = data;
      this.currentLanguage = lang;
      this.saveLanguage(lang);
      
      // Update document
      document.documentElement.lang = lang;
      document.documentElement.dir = data.meta?.direction || 'ltr';
      
      // Dispatch event
      this.dispatchLanguageChange(lang, data.meta?.direction);
      
    } catch (error) {
      console.error('Error loading language:', error);
      if (lang !== this.defaultLanguage) {
        await this.loadLanguage(this.defaultLanguage);
      }
    }
  }

  /**
   * Get translation value by dot notation key
   * Example: 'nav.home' -> translations.nav.home
   */
  getTranslation(key) {
    const keys = key.split('.');
    let value = this.translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        console.warn(`Missing translation: ${key}`);
        return this.getFallbackTranslation(key);
      }
    }
    
    return value || this.getFallbackTranslation(key);
  }

  /**
   * Get fallback translation from English
   */
  getFallbackTranslation(key) {
    if (this.currentLanguage === this.defaultLanguage) {
      return key;
    }
    
    const cache = this.translationCache[this.defaultLanguage];
    if (!cache) return key;
    
    const keys = key.split('.');
    let value = cache;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return value || key;
  }

  /**
   * Translate all static elements with data-i18n attribute
   */
  translateStatic() {
    // Text content translation
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.getTranslation(key);
      
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.value = translation;
      } else {
        element.textContent = translation;
      }
    });

    // Placeholder translation
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.getTranslation(key);
    });

    // Title attribute translation
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.getTranslation(key);
    });

    // ARIA label translation
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
      const key = element.getAttribute('data-i18n-aria');
      element.setAttribute('aria-label', this.getTranslation(key));
    });

    // Dispatch translation complete event
    window.dispatchEvent(new CustomEvent('translationComplete'));
  }

  /**
   * Apply RTL/LTR styles
   */
  applyRTL() {
    const isRTL = this.rtlLanguages.includes(this.currentLanguage);
    const html = document.documentElement;
    
    // Set direction
    html.dir = isRTL ? 'rtl' : 'ltr';
    html.style.direction = isRTL ? 'rtl' : 'ltr';
    
    // Toggle classes
    html.classList.toggle('rtl-mode', isRTL);
    html.classList.toggle('ltr-mode', !isRTL);
    
    // Update body
    document.body.dir = isRTL ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl-mode', isRTL);
    document.body.classList.toggle('ltr-mode', !isRTL);
  }

  /**
   * Setup language switcher buttons and dropdown
   */
  setupLanguageSwitcher() {
    // Dropdown button
    const dropdownBtn = document.querySelector('.language-dropdown-btn');
    const dropdownMenu = document.querySelector('.language-dropdown-menu');
    
    if (dropdownBtn) {
      // Toggle dropdown
      dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdownMenu?.classList.toggle('show');
        dropdownBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      // Close on click outside
      document.addEventListener('click', () => {
        if (dropdownMenu?.classList.contains('show')) {
          dropdownMenu.classList.remove('show');
          dropdownBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dropdownMenu?.classList.contains('show')) {
          dropdownMenu.classList.remove('show');
          dropdownBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Language switch buttons
    document.querySelectorAll('[data-language-switch]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const lang = btn.getAttribute('data-language-switch');
        await this.switchLanguage(lang);
        
        // Close dropdown if open
        if (dropdownMenu?.classList.contains('show')) {
          dropdownMenu.classList.remove('show');
          dropdownBtn?.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // Update language indicator
    this.updateLanguageIndicator();
  }

  /**
   * Update language indicator/button text
   */
  updateLanguageIndicator() {
    const dropdownBtn = document.querySelector('.language-dropdown-btn');
    const codeElement = dropdownBtn?.querySelector('.language-code');
    
    if (codeElement) {
      codeElement.textContent = this.currentLanguage.toUpperCase();
    }

    // Update active state
    document.querySelectorAll('[data-language-switch]').forEach(btn => {
      const lang = btn.getAttribute('data-language-switch');
      btn.classList.toggle('active', lang === this.currentLanguage);
      btn.setAttribute('aria-current', lang === this.currentLanguage ? 'page' : 'false');
    });
  }

  /**
   * Setup mobile menu toggle
   */
  setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('show');
        mobileMenuBtn.classList.toggle('active', isOpen);
      });

      // Close on link click
      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.remove('show');
          mobileMenuBtn.classList.remove('active');
        });
      });
    }
  }

  /**
   * Switch language and update page
   */
  async switchLanguage(lang) {
    if (!this.languages.includes(lang)) return;
    
    await this.loadLanguage(lang);
    this.translateStatic();
    this.applyRTL();
    this.updateLanguageIndicator();
    
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Dispatch language change event
   */
  dispatchLanguageChange(lang, direction) {
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: {
        language: lang,
        direction: direction,
        rtl: this.rtlLanguages.includes(lang)
      }
    }));
  }

  /**
   * Setup mutation observer for dynamically added content
   */
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Re-translate new nodes
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              this.translateNewNodes(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
  }

  /**
   * Translate newly added nodes
   */
  translateNewNodes(node) {
    // Translate node if it has data-i18n
    if (node.hasAttribute && node.hasAttribute('data-i18n')) {
      const key = node.getAttribute('data-i18n');
      const translation = this.getTranslation(key);
      node.textContent = translation;
    }

    // Translate placeholders
    if (node.hasAttribute && node.hasAttribute('data-i18n-placeholder')) {
      const key = node.getAttribute('data-i18n-placeholder');
      node.placeholder = this.getTranslation(key);
    }

    // Translate children
    if (node.querySelectorAll) {
      node.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = this.getTranslation(key);
        element.textContent = translation;
      });

      node.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = this.getTranslation(key);
      });
    }
  }

  /**
   * Public API: Get current language
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Public API: Get all languages
   */
  getLanguages() {
    return this.languages;
  }

  /**
   * Public API: Get translations object
   */
  getTranslations() {
    return this.translations;
  }

  /**
   * Public API: Manually translate element
   */
  translateElement(element) {
    if (element.hasAttribute('data-i18n')) {
      const key = element.getAttribute('data-i18n');
      element.textContent = this.getTranslation(key);
    }
  }

  /**
   * Public API: Manually set language
   */
  setLanguage(lang) {
    this.switchLanguage(lang);
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.i18n = new I18nEngine();
  });
} else {
  window.i18n = new I18nEngine();
}
