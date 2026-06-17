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
