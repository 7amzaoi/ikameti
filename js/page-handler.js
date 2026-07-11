/**
 * Page Handler - Comprehensive Translation Handler for IKAMETI
 * ============================================================
 * Handles i18n initialization, translation application, and language change listening
 * Works across all pages with proper async handling and DOM safety
 */

class PageHandler {
    constructor() {
        this.maxWaitTime = 5000; // 5 seconds max wait
        this.checkInterval = 100; // Check every 100ms
        this.i18nReady = false;
    }

    /**
     * Wait for i18n to be loaded with exponential backoff
     */
    async waitForI18n(maxAttempts = 50, delayMs = 100) {
        console.log('[PageHandler] Waiting for i18n to be ready...');
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (window.i18n && typeof window.i18n.getTranslation === 'function') {
                this.i18nReady = true;
                console.log(`[PageHandler] i18n ready after ${attempt * delayMs}ms`);
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        
        console.warn('[PageHandler] i18n not ready after timeout - proceeding anyway');
        return false;
    }

    /**
     * Apply translations to all elements with data-i18n attributes
     */
    applyTranslations() {
        if (!window.i18n) {
            console.warn('[PageHandler] i18n not available');
            return;
        }

        console.log('[PageHandler] Applying translations...');

        // Handle main content translations (data-i18n)
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = window.i18n.getTranslation(key);
            
            if (translation) {
                // Check if it's an input/select element
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
                    element.value = translation;
                } else if (element.tagName === 'OPTION') {
                    element.textContent = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });

        // Handle placeholder translations (data-i18n-placeholder)
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = window.i18n.getTranslation(key);
            if (translation) {
                element.setAttribute('placeholder', translation);
            }
        });

        // Handle title translations (data-i18n-title)
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const translation = window.i18n.getTranslation(key);
            if (translation) {
                element.setAttribute('title', translation);
            }
        });

        // Handle aria-label translations (data-i18n-aria)
        document.querySelectorAll('[data-i18n-aria]').forEach(element => {
            const key = element.getAttribute('data-i18n-aria');
            const translation = window.i18n.getTranslation(key);
            if (translation) {
                element.setAttribute('aria-label', translation);
            }
        });

        console.log('[PageHandler] Translations applied successfully');
    }

    /**
     * Setup language change listener
     */
    setupLanguageListener() {
        window.addEventListener('languageChanged', (event) => {
            console.log(`[PageHandler] Language changed to: ${event.detail.language}`);
            console.log(`[PageHandler] Direction: ${event.detail.direction}`);
            
            // Small delay to ensure i18n data is updated
            setTimeout(() => {
                this.applyTranslations();
                this.updateDocumentDirection(event.detail.direction);
                
                // Trigger custom event for page-specific handlers
                window.dispatchEvent(new CustomEvent('i18nReady', { 
                    detail: { language: event.detail.language, direction: event.detail.direction } 
                }));
            }, 50);
        });
    }

    /**
     * Update document direction for RTL/LTR
     */
    updateDocumentDirection(direction) {
        const html = document.documentElement;
        html.setAttribute('dir', direction);
        html.lang = window.i18n.getCurrentLanguage();
        console.log(`[PageHandler] Direction updated to: ${direction}`);
    }

    /**
     * Initialize page handler
     */
    async init() {
        try {
            console.log('[PageHandler] Initializing page handler...');
            
            // Wait for i18n to be ready
            await this.waitForI18n();
            
            if (window.i18n) {
                // Apply initial translations
                this.applyTranslations();
                
                // Set initial direction
                const direction = window.i18n.getTranslation('direction') || 'ltr';
                this.updateDocumentDirection(direction);
                
                // Setup language change listener
                this.setupLanguageListener();
                
                console.log('[PageHandler] Initialization complete');
            } else {
                console.error('[PageHandler] i18n is not available');
            }
        } catch (error) {
            console.error('[PageHandler] Initialization error:', error);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const handler = new PageHandler();
        handler.init().catch(error => console.error('[PageHandler] Failed to initialize:', error));
    });
} else {
    // DOM already loaded
    const handler = new PageHandler();
    handler.init().catch(error => console.error('[PageHandler] Failed to initialize:', error));
}

/* ============================================================
 * Remind Me phone widget — keep it cleanly LTR on every page.
 * intl-tel-input puts its dial-code padding on the right (it sees the RTL
 * <html>), but our CSS forces the flag to the LEFT. So mirror the padding to
 * the left, matched to the actual flag width, so the number never overlaps
 * the "+90" box. The widget is hidden until the modal opens, so we measure
 * once it is visible (and again on country change).
 * ============================================================ */
(function () {
    function fixRemindPhonePadding() {
        var phone = document.getElementById('phone');
        if (!phone) return;
        var flag = document.querySelector('#remind-modal .iti__selected-flag');
        if (!flag) return;
        var w = flag.offsetWidth;
        if (!w) return; // not visible yet
        phone.style.setProperty('padding-left', (w + 8) + 'px', 'important');
        phone.style.setProperty('padding-right', '12px', 'important');
    }
    function start() {
        var phone = document.getElementById('phone');
        if (!phone) return;
        phone.addEventListener('countrychange', fixRemindPhonePadding);
        var btn = document.getElementById('remind-me-btn');
        if (btn) btn.addEventListener('click', function () {
            // run after the modal becomes visible so the flag has a real width
            setTimeout(fixRemindPhonePadding, 50);
            setTimeout(fixRemindPhonePadding, 300);
        });
        window.addEventListener('languageChanged', function () { setTimeout(fixRemindPhonePadding, 150); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();

/* ============================================================
 * Custom <select> (.c-select) — used by the residency wizard.
 * Replaces the raw browser dropdown with a styled, on-brand menu.
 * Keeps a hidden input in sync so the value still submits, and mirrors
 * the chosen option's data-i18n key so it re-localises on language change.
 * ============================================================ */
(function () {
    function closeAll() {
        document.querySelectorAll('.c-select.open').forEach(function (el) {
            el.classList.remove('open');
            var t = el.querySelector('.c-select__trigger');
            if (t) t.setAttribute('aria-expanded', 'false');
        });
    }
    function initCSelect(root) {
        var trigger = root.querySelector('.c-select__trigger');
        var valueEl = root.querySelector('.c-select__value');
        var hidden = root.querySelector('input[type="hidden"]');
        var options = Array.prototype.slice.call(root.querySelectorAll('.c-select__option'));
        if (!trigger || !valueEl) return;
        if (valueEl.getAttribute('data-i18n')) valueEl.classList.add('is-placeholder');

        trigger.addEventListener('click', function (e) {
            e.stopPropagation();
            var isOpen = root.classList.contains('open');
            closeAll();
            if (!isOpen) { root.classList.add('open'); trigger.setAttribute('aria-expanded', 'true'); }
        });

        options.forEach(function (opt) {
            opt.addEventListener('click', function () {
                options.forEach(function (o) { o.classList.remove('selected'); });
                opt.classList.add('selected');
                if (hidden) hidden.value = opt.getAttribute('data-value') || '';
                var key = opt.getAttribute('data-i18n');
                if (key) valueEl.setAttribute('data-i18n', key); else valueEl.removeAttribute('data-i18n');
                valueEl.textContent = opt.textContent;
                valueEl.classList.remove('is-placeholder');
                closeAll();
            });
        });
    }
    function start() {
        document.querySelectorAll('.c-select').forEach(initCSelect);
        document.addEventListener('click', closeAll);
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
