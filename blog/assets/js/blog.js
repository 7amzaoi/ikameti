/**
 * Blog System - Main JavaScript File
 * Supports JSON HTML articles and future block-based content.
 */

const BLOG_RTL_LANGUAGES = new Set(['ar', 'fa', 'uz', 'af']);

// Resolve the blog/ base from this script's own URL so data loads work on
// any host or subpath (e.g. GitHub Pages project sites at /<repo>/blog/).
const BLOG_BASE = (function () {
  const s = document.currentScript;
  if (s && s.src) return s.src.replace(/assets\/js\/blog\.js.*$/, '');
  return './';
})();

const BLOG = {
  articles: [],
  activeCategory: 'all',
  isLanguageChangeListener: false,

  /**
   * Initialize blog system.
   */
  init: async function() {
    try {
      if (this.getQueryParam('debugLayout') === '1') {
        document.body.classList.add('layout-debug');
      }

      await this.loadArticles();
      this.applyLocaleDirection();
      this.setupLanguageChangeListener();
      this.router();
    } catch (error) {
      console.error('Failed to initialize blog:', error);
      this.showError('Failed to load blog content. Please refresh the page.');
    }
  },

  /**
   * Load articles from the canonical JSON data source.
   */
  loadArticles: async function(options = {}) {
    // Primary source: Supabase (managed from the admin dashboard).
    try {
      const fromDb = await this.loadArticlesFromSupabase();
      if (fromDb) {
        return true;
      }
    } catch (error) {
      console.warn('Supabase article source unavailable, falling back to JSON:', error);
    }

    // Fallback source: bundled articles.json.
    try {
      const loaded = await this.loadArticlesFromJson();
      if (loaded) {
        return true;
      }

      throw new Error('articles.json returned no articles.');
    } catch (error) {
      console.error('Failed to load blog articles from JSON:', error);
      throw error;
    }
  },

  /**
   * Load published articles from Supabase via the shared public client.
   * Returns false (so the JSON fallback runs) if the client or data
   * is unavailable.
   */
  loadArticlesFromSupabase: async function() {
    if (!window.IKAMETI_DB || typeof window.IKAMETI_DB.getPublishedBlogs !== 'function') {
      return false;
    }

    const articles = await window.IKAMETI_DB.getPublishedBlogs();
    if (!Array.isArray(articles) || articles.length === 0) {
      return false;
    }

    const dedupedArticles = new Map();
    articles
      .map((article) => this.normalizeArticle(article))
      .forEach((article) => {
        if (!article.slug) {
          return;
        }
        const existing = dedupedArticles.get(article.slug);
        if (!existing || article.id >= existing.id) {
          dedupedArticles.set(article.slug, article);
        }
      });

    this.articles = Array.from(dedupedArticles.values())
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (!Number.isNaN(dateA) && !Number.isNaN(dateB) && dateA !== dateB) {
          return dateB - dateA;
        }
        return b.id - a.id;
      });

    console.log(`Loaded ${this.articles.length} articles from Supabase`);
    return true;
  },

  /**
   * Primary source: JSON file with full HTML content.
   */
  loadArticlesFromJson: async function() {
    try {
      const response = await fetch(`${BLOG_BASE}data/articles.json`, { cache: 'no-store' });
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        return false;
      }

      const dedupedArticles = new Map();

      data
        .map((article) => this.normalizeArticle(article))
        .forEach((article) => {
          if (!article.slug) {
            return;
          }

          const existing = dedupedArticles.get(article.slug);
          if (!existing || article.id >= existing.id) {
            dedupedArticles.set(article.slug, article);
          }
        });

      this.articles = Array.from(dedupedArticles.values())
        .sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();

          if (!Number.isNaN(dateA) && !Number.isNaN(dateB) && dateA !== dateB) {
            return dateB - dateA;
          }

          return b.id - a.id;
        });

      console.log(`Loaded ${this.articles.length} articles from JSON source`);
      return true;
    } catch (error) {
      console.warn('JSON article source unavailable:', error);
      return false;
    }
  },

  /**
   * Normalize article fields across all supported data sources.
   */
  normalizeArticle: function(article) {
    return {
      id: Number(article.id) || 0,
      slug: article.slug || '',
      title: article.title || 'Untitled Article',
      description: article.description || article.excerpt || '',
      excerpt: article.excerpt || article.description || '',
      content: article.content || '',
      image: article.image || '',
      date: article.date || '',
      category: article.category || 'general',
      author: article.author || 'IKAMETI Team',
      readTime: article.readTime || '',
      translations: (article.translations && typeof article.translations === 'object') ? article.translations : {}
    };
  },

  /** Active site language code (falls back to the document language). */
  currentLang: function() {
    try {
      if (window.i18n && typeof window.i18n.getCurrentLanguage === 'function') {
        return window.i18n.getCurrentLanguage();
      }
    } catch (_) { /* ignore */ }
    return document.documentElement.lang || 'en';
  },

  /**
   * Build a map of translated blog articles from the active locale payload.
   */
  getLocalizedArticlesMap: function() {
    if (!window.i18n || typeof window.i18n.getTranslation !== 'function') {
      return new Map();
    }

    const source = window.i18n.getTranslation('blog_articles');
    if (!source || typeof source !== 'object') {
      return new Map();
    }

    const localizedArticles = new Map();

    Object.values(source).forEach((item) => {
      if (!item || typeof item !== 'object' || !item.slug) {
        return;
      }

      localizedArticles.set(item.slug, item);
    });

    return localizedArticles;
  },

  /**
   * Merge the canonical article with its localized version when available.
   */
  getLocalizedArticle: function(article) {
    const normalizedArticle = this.normalizeArticle(article || {});
    const localizedArticles = this.getLocalizedArticlesMap();
    const localizedArticle = localizedArticles.get(normalizedArticle.slug);

    // Start from the canonical article, layered with the legacy static
    // i18n override (blog_articles in the language JSON) when it exists.
    let result = normalizedArticle;
    if (localizedArticle) {
      result = {
        ...normalizedArticle,
        ...localizedArticle,
        id: Number(localizedArticle.id) || normalizedArticle.id,
        slug: localizedArticle.slug || normalizedArticle.slug,
        category: localizedArticle.category || normalizedArticle.category,
        date: localizedArticle.date || normalizedArticle.date,
        author: localizedArticle.author || normalizedArticle.author,
        image: localizedArticle.image || normalizedArticle.image,
        title: localizedArticle.title || normalizedArticle.title,
        description: localizedArticle.description || localizedArticle.excerpt || normalizedArticle.description,
        excerpt: localizedArticle.excerpt || localizedArticle.description || normalizedArticle.excerpt,
        content: localizedArticle.content || normalizedArticle.content,
        readTime: localizedArticle.readTime || normalizedArticle.readTime
      };
    }

    // Per-article translations authored in the admin dashboard take
    // precedence for the active language when they are filled in.
    const t = normalizedArticle.translations && normalizedArticle.translations[this.currentLang()];
    if (t && typeof t === 'object') {
      if (t.title && t.title.trim()) result = { ...result, title: t.title };
      const desc = (t.description && t.description.trim()) ? t.description : (t.excerpt || '');
      if (desc && desc.trim()) result = { ...result, description: desc, excerpt: desc };
      if (t.content && t.content.trim()) result = { ...result, content: t.content };
      // Per-language cover image: show the language-specific cover when one
      // was uploaded for the active language, otherwise keep the default.
      if (t.image && t.image.trim()) result = { ...result, image: t.image };
    }

    return result;
  },

  /**
   * Return all articles with locale overrides applied.
   */
  getLocalizedArticles: function() {
    return this.articles.map((article) => this.getLocalizedArticle(article));
  },

  /**
   * Setup listener for language changes.
   */
  setupLanguageChangeListener: function() {
    if (this.isLanguageChangeListener) {
      return;
    }

    window.addEventListener('languageChanged', () => {
      try {
        this.applyLocaleDirection();

        const slug = this.getQueryParam('slug');
        if (slug && this.isArticlePage()) {
          this.renderArticle(slug);
          return;
        }

        if (this.isListingPage()) {
          this.renderBlogListing();
        }
      } catch (error) {
        console.error('Error handling language change:', error);
      }
    });

    window.addEventListener('i18nReady', () => {
      this.applyLocaleDirection();

      const slug = this.getQueryParam('slug');
      if (slug && this.isArticlePage()) {
        this.renderArticle(slug);
        return;
      }

      if (this.isListingPage()) {
        this.renderBlogListing();
      }
    });

    this.isLanguageChangeListener = true;
  },

  /**
   * Route to appropriate page.
   */
  router: function() {
    if (this.articles.length === 0) {
      this.showError('No blog articles available.');
      return;
    }

    const slug = this.getQueryParam('slug');

    if (slug && this.isArticlePage()) {
      this.renderArticle(slug);
      return;
    }

    if (this.isListingPage()) {
      this.renderBlogListing();
    }
  },

  isArticlePage: function() {
    return Boolean(document.getElementById('article-content') && document.getElementById('article-header'));
  },

  isListingPage: function() {
    return Boolean(document.getElementById('blog-grid'));
  },

  /**
   * Get query parameter from URL.
   */
  getQueryParam: function(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  /**
   * Render blog listing page.
   */
  renderBlogListing: function() {
    const grid = document.getElementById('blog-grid');
    const filters = document.getElementById('blog-filters');
    if (!grid) {
      return;
    }

    this.renderBlogFilters(filters);
    grid.innerHTML = '';

    const visibleArticles = this.getFilteredArticles().map((article) => this.getLocalizedArticle(article));

    if (visibleArticles.length === 0) {
      grid.innerHTML = '<p class="empty-state">No articles found.</p>';
      return;
    }

    visibleArticles.forEach((article, index) => {
      const card = this.createArticleCard(article);
      grid.appendChild(card);

      setTimeout(() => {
        card.classList.add('visible');
      }, index * 100);
    });
  },

  /**
   * Create article card element.
   */
  createArticleCard: function(article) {
    const card = document.createElement('a');
    card.href = `./article.html?slug=${article.slug}`;
    card.className = 'article-card';

    const date = this.formatDate(article.date);
    const readArticleLabel = this.t('blog_page.read_article', 'Read Article →');

    card.innerHTML = `
      <img src="${article.image}" alt="${this.escapeHtml(article.title)}" class="article-card-image" loading="lazy">
      <div class="article-card-content">
        <div class="article-meta">
          <span class="article-category">${this.escapeHtml(this.getCategoryLabel(article.category))}</span>
          <span class="article-date">${date}</span>
        </div>
        <h3>${this.escapeHtml(article.title)}</h3>
        <p>${this.escapeHtml(article.description)}</p>
        <div class="article-card-footer">
          <span class="article-author">${this.escapeHtml(article.author)}</span>
          <span class="read-more">${this.escapeHtml(readArticleLabel)}</span>
        </div>
      </div>
    `;

    return card;
  },

  /**
   * Render single article page.
   */
  renderArticle: function(slug) {
    const article = this.articles.find((item) => item.slug === slug);

    if (!article) {
      this.renderArticleNotFound(slug);
      return;
    }

    const localizedArticle = this.getLocalizedArticle(article);

    document.title = `${localizedArticle.title} - IKAMETI Blog`;
    this.updateMetaTags(localizedArticle);
    this.injectArticleSchema(localizedArticle);
    this.renderArticleHeader(localizedArticle);
    this.renderArticleContent(localizedArticle);
    this.renderCtaSection();
    this.renderRelatedArticles(localizedArticle);
  },

  /**
   * Render article header.
   */
  renderArticleHeader: function(article) {
    const header = document.getElementById('article-header');
    if (!header) {
      return;
    }

    const date = this.formatDate(article.date);

    header.innerHTML = `
      <h1>${this.escapeHtml(article.title)}</h1>
      <div class="article-info">
        <div class="article-info-item">${this.escapeHtml(article.author)}</div>
        <span class="article-info-separator">•</span>
        <div class="article-info-item">${date}</div>
        <span class="article-info-separator">•</span>
        <div class="article-info-item"><span class="article-category">${this.escapeHtml(this.getCategoryLabel(article.category))}</span></div>
      </div>
    `;
  },

  /**
   * Render full article content with sanitization and hybrid support.
   */
  renderArticleContent: function(article) {
    const contentDiv = document.getElementById('article-content');
    if (!contentDiv) {
      return;
    }

    const post = article;
    const rawContent = post.content;
    const contentLength = typeof post.content === 'string'
      ? post.content.length
      : JSON.stringify(rawContent || '').length;

    // Required debug logging.
    console.log("Rendering content length:", contentLength);

    // Ensure content container has proper styling
    contentDiv.style.height = 'auto';
    contentDiv.style.overflow = 'visible';
    contentDiv.style.minHeight = 'auto';

    const normalizedHtml = this.convertContentToHtml(rawContent);
    const safeHtml = this.sanitizeHtml(normalizedHtml);

    contentDiv.innerHTML = '';

    if (post.image) {
      const image = document.createElement('img');
      image.src = post.image;
      image.alt = post.title || 'Article image';
      image.className = 'article-featured-image';
      image.loading = 'lazy';
      image.style.maxWidth = '100%';
      image.style.height = 'auto';
      image.style.display = 'block';
      contentDiv.appendChild(image);
    }

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'article-body blog-content';
    bodyDiv.style.height = 'auto';
    bodyDiv.style.overflow = 'visible';
    bodyDiv.style.minHeight = 'auto';
    bodyDiv.innerHTML = safeHtml;
    contentDiv.appendChild(bodyDiv);

    // Ensure all nested elements can expand fully
    bodyDiv.querySelectorAll('*').forEach((el) => {
      if (el.style.height === '100vh' || el.style.height === '100%') {
        el.style.height = 'auto';
      }
      if (el.style.maxHeight === '0' || (el.style.maxHeight && parseInt(el.style.maxHeight) < 100)) {
        el.style.maxHeight = 'none';
      }
      if (el.style.overflow === 'hidden' && !el.tagName.match(/^(CODE|PRE|INPUT)$/)) {
        el.style.overflow = 'visible';
      }
    });
  },

  /**
   * Convert HTML-string or block-content to HTML.
   */
  convertContentToHtml: function(content) {
    if (Array.isArray(content)) {
      return this.renderBlocksToHtml(content);
    }

    if (content && typeof content === 'object') {
      if (Array.isArray(content.blocks)) {
        return this.renderBlocksToHtml(content.blocks);
      }
      return this.escapeHtml(JSON.stringify(content));
    }

    const htmlString = typeof content === 'string' ? content : '';
    const trimmed = htmlString.trim();

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return this.renderBlocksToHtml(parsed);
        }
        if (parsed && Array.isArray(parsed.blocks)) {
          return this.renderBlocksToHtml(parsed.blocks);
        }
      } catch (error) {
        // Keep as plain HTML when not valid JSON.
      }
    }

    return htmlString;
  },

  /**
   * Render generic content blocks to HTML for forward compatibility.
   */
  renderBlocksToHtml: function(blocks) {
    if (!Array.isArray(blocks)) {
      return '';
    }

    return blocks.map((block) => {
      const safeBlock = block || {};
      const type = String(safeBlock.type || safeBlock.kind || 'paragraph').toLowerCase();

      if (type === 'heading' || type === 'header') {
        const level = Number(safeBlock.level) || 2;
        const normalizedLevel = Math.min(3, Math.max(2, level));
        const text = this.escapeHtml(safeBlock.text || safeBlock.content || '');
        return `<h${normalizedLevel}>${text}</h${normalizedLevel}>`;
      }

      if (type === 'list') {
        const ordered = Boolean(safeBlock.ordered);
        const items = Array.isArray(safeBlock.items) ? safeBlock.items : [];
        const tag = ordered ? 'ol' : 'ul';
        const listItems = items
          .map((item) => `<li>${this.escapeHtml(String(item))}</li>`)
          .join('');
        return `<${tag}>${listItems}</${tag}>`;
      }

      if (type === 'image') {
        const src = this.escapeHtml(safeBlock.src || safeBlock.url || '');
        const alt = this.escapeHtml(safeBlock.alt || 'Article image');
        return src ? `<img src="${src}" alt="${alt}" loading="lazy">` : '';
      }

      if (type === 'html') {
        return String(safeBlock.html || '');
      }

      const text = this.escapeHtml(safeBlock.text || safeBlock.content || '');
      return `<p>${text}</p>`;
    }).join('');
  },

  /**
   * Basic HTML sanitizer to block unsafe tags and attributes.
   */
  sanitizeHtml: function(html) {
    const template = document.createElement('template');
    template.innerHTML = String(html || '');

    const blockedTags = template.content.querySelectorAll('script, style, iframe, object, embed, link, meta, base');
    blockedTags.forEach((el) => el.remove());

    // Keep a single h1 on the page by demoting in-content h1 to h2.
    template.content.querySelectorAll('h1').forEach((heading) => {
      const replacement = document.createElement('h2');
      replacement.innerHTML = heading.innerHTML;
      heading.replaceWith(replacement);
    });

    template.content.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = String(attr.value || '').trim();

        if (name.startsWith('on')) {
          el.removeAttribute(attr.name);
          return;
        }

        if ((name === 'href' || name === 'src' || name === 'xlink:href') && /^javascript:/i.test(value)) {
          el.removeAttribute(attr.name);
        }

        // Remove problematic inline styles that constrain content
        if (name === 'style') {
          const styleValue = value.toLowerCase();
          // Remove height: 100vh, max-height constraints, overflow: hidden
          if (styleValue.includes('height: 100vh') ||
              styleValue.includes('max-height: 0') ||
              (styleValue.includes('height:') && !styleValue.includes('height: auto')) ||
              styleValue.includes('overflow: hidden')) {
            el.removeAttribute('style');
            // Re-apply safe styles if any
            const newStyle = value
              .split(';')
              .filter(s => !s.toLowerCase().includes('height: 100vh') &&
                           !s.toLowerCase().includes('max-height: 0') &&
                           !s.toLowerCase().includes('overflow: hidden'))
              .join(';')
              .trim();
            if (newStyle) {
              el.setAttribute('style', newStyle);
            }
          }
        }
      });

      if (el.tagName === 'A' && el.getAttribute('target') === '_blank') {
        el.setAttribute('rel', 'noopener noreferrer');
      }
    });

    return template.innerHTML;
  },

  /**
   * Render CTA section.
   */
  renderCtaSection: function() {
    const ctaContainer = document.getElementById('cta-container');
    if (!ctaContainer) {
      return;
    }

    const title = this.t('blog_details_page.questions.title', 'Still Have Questions?');
    const description = this.t('blog_details_page.questions.description', 'Our expert team is ready to provide personalized guidance tailored to your specific situation. Reach out today for a free consultation.');
    const consultButton = this.t('blog_details_page.questions.schedule_button', 'Schedule Consultation');
    const chatButton = this.t('blog_details_page.questions.whatsapp_button', 'Chat on WhatsApp');

    ctaContainer.innerHTML = `
      <div class="article-divider"></div>
      <div class="cta-section">
        <h3>${this.escapeHtml(title)}</h3>
        <p>${this.escapeHtml(description)}</p>
        <div class="cta-actions">
          <a href="../contact.html" class="btn btn-primary">${this.escapeHtml(consultButton)}</a>
          <a href="https://wa.me/905551234567" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">${this.escapeHtml(chatButton)}</a>
        </div>
      </div>
      <div class="article-divider"></div>
    `;
  },

  /**
   * Render related articles.
   */
  renderRelatedArticles: function(article) {
    const relatedContainer = document.getElementById('related-articles');
    if (!relatedContainer) {
      return;
    }

    const related = this.getRelatedArticles(article, 3).map((item) => this.getLocalizedArticle(item));
    const relatedTitle = this.t('blog_details_page.related_articles.title', 'Related Articles');
    const noRelated = this.t('blog_details_page.related_articles.no_related', 'No related articles found.');

    const titleElement = document.querySelector('.related-title');
    if (titleElement) {
      titleElement.textContent = relatedTitle;
    }

    if (related.length === 0) {
      relatedContainer.innerHTML = `<p class="empty-state">${this.escapeHtml(noRelated)}</p>`;
      return;
    }

    relatedContainer.innerHTML = related.map((item) => `
      <a href="./article.html?slug=${item.slug}" class="related-card">
        <img src="${item.image}" alt="${this.escapeHtml(item.title)}" class="related-card-image" loading="lazy">
        <div class="related-card-content">
          <h4>${this.escapeHtml(item.title)}</h4>
          <p>${this.escapeHtml(item.description)}</p>
          <span class="read-more">${this.escapeHtml(this.t('blog_page.read_article', 'Read Article →'))}</span>
        </div>
      </a>
    `).join('');
  },

  /**
   * Update meta tags for SEO.
   */
  updateMetaTags: function(article) {
    const pageUrl = window.location.href;
    const description = article.description || article.excerpt || '';

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', article.title);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', description);
    }

    this.setMetaProperty('og:image', article.image);
    this.setMetaProperty('og:url', pageUrl);
    this.setMetaProperty('og:type', 'article');

    const canonical = document.querySelector('link[rel="canonical"]') || this.createCanonicalLink();
    if (canonical) {
      canonical.setAttribute('href', pageUrl);
    }

    this.setMetaName('description', description);
  },

  /**
   * Inject BlogPosting + BreadcrumbList structured data for the article page.
   * Replaces any previously injected article schema on language change.
   */
  injectArticleSchema: function(article) {
    try {
      const url = window.location.href;
      const origin = window.location.origin;
      const img = article.image || (origin + '/assets/images/logo.png');
      const desc = article.description || article.excerpt || '';
      let iso = '';
      const d = new Date(article.date);
      if (!Number.isNaN(d.getTime())) { iso = d.toISOString().slice(0, 10); }
      const schema = [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: article.title,
          description: desc,
          image: img,
          datePublished: iso,
          dateModified: iso,
          author: { '@type': 'Organization', name: article.author || 'IKAMETI' },
          publisher: {
            '@type': 'Organization',
            name: 'IKAMETI',
            logo: { '@type': 'ImageObject', url: 'https://ikameti.com.tr/assets/images/logo.png' }
          },
          mainEntityOfPage: { '@type': 'WebPage', '@id': url }
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: origin + '/' },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: origin + '/blog/' },
            { '@type': 'ListItem', position: 3, name: article.title, item: url }
          ]
        }
      ];
      const old = document.getElementById('article-schema');
      if (old) { old.remove(); }
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.id = 'article-schema';
      s.textContent = JSON.stringify(schema);
      document.head.appendChild(s);
    } catch (e) { /* non-fatal */ }
  },

  /**
   * Format date to readable format.
   */
  formatDate: function(dateStr) {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return this.escapeHtml(String(dateStr || ''));
    }

    const language = this.getCurrentLanguage();
    const locale = ['en', 'ar', 'tr', 'ru', 'fa', 'uz', 'af'].includes(language) ? language : 'en';

    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).replace(/,/g, language === 'ar' || language === 'fa' ? '،' : ',');
  },

  /**
   * Render article not found state.
   */
  renderArticleNotFound: function(slug) {
    document.title = 'Article not found - IKAMETI Blog';
    this.setMetaName('description', 'Article not found.');
    this.setMetaProperty('og:title', 'Article not found');
    this.setMetaProperty('og:description', 'Article not found.');

    const header = document.getElementById('article-header');
    const content = document.getElementById('article-content');
    const cta = document.getElementById('cta-container');
    const related = document.getElementById('related-articles');

    if (header) {
      header.innerHTML = '<h1>Article not found</h1>';
    }

    if (content) {
      content.innerHTML = `<p class="error">Article not found for slug: ${this.escapeHtml(slug || '')}</p>`;
    }

    if (cta) {
      cta.innerHTML = '';
    }

    if (related) {
      related.innerHTML = '';
    }
  },

  /**
   * Render blog listing filters.
   */
  renderBlogFilters: function(container) {
    if (!container) {
      return;
    }

    const categories = this.getCategories();
    const allLabel = this.t('blog_page.filter.all', 'All Articles');

    container.innerHTML = [
      `<button type="button" class="btn btn-secondary blog-filter-button ${this.activeCategory === 'all' ? 'active' : ''}" data-category="all">${this.escapeHtml(allLabel)}</button>`,
      ...categories.map((category) => {
        const label = this.getCategoryLabel(category);
        return `<button type="button" class="btn btn-secondary blog-filter-button ${this.activeCategory === category ? 'active' : ''}" data-category="${this.escapeHtml(category)}">${this.escapeHtml(label)}</button>`;
      })
    ].join('');

    container.querySelectorAll('[data-category]').forEach((button) => {
      button.addEventListener('click', () => {
        this.activeCategory = button.getAttribute('data-category') || 'all';
        this.renderBlogListing();
      });
    });
  },

  /**
   * Get visible articles for the active filter.
   */
  getFilteredArticles: function() {
    if (this.activeCategory === 'all') {
      return this.articles;
    }

    return this.articles.filter((article) => article.category === this.activeCategory);
  },

  /**
   * Return localized category label.
   */
  getCategoryLabel: function(category) {
    const labels = {
      all: this.t('blog_page.filter.all', 'All Articles'),
      immigration: this.t('blog_page.filter.immigration', 'Immigration'),
      housing: this.t('blog_page.filter.housing', 'Housing'),
      legal: this.t('blog_page.filter.legal', 'Legal'),
      business: 'Business',
      lifestyle: 'Lifestyle'
    };

    return labels[String(category || '').toLowerCase()] || this.capitalize(String(category || 'general'));
  },

  /**
   * Return unique category list from loaded articles.
   */
  getCategories: function() {
    const categories = [];

    this.articles.forEach((article) => {
      const category = String(article.category || 'general').toLowerCase();
      if (!categories.includes(category)) {
        categories.push(category);
      }
    });

    return categories;
  },

  /**
   * Return related articles for the current article.
   */
  getRelatedArticles: function(article, limit = 3) {
    const related = [];
    const articleDate = new Date(article.date).getTime();

    const sameCategory = this.articles.filter((candidate) => candidate.slug !== article.slug && candidate.category === article.category);
    const fallback = this.articles.filter((candidate) => candidate.slug !== article.slug && candidate.category !== article.category);

    const sortedSameCategory = sameCategory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const sortedFallback = fallback.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return Math.abs(new Date(b.date).getTime() - articleDate) - Math.abs(new Date(a.date).getTime() - articleDate);
    });

    [...sortedSameCategory, ...sortedFallback].forEach((candidate) => {
      if (related.length < limit) {
        related.push(candidate);
      }
    });

    return related;
  },

  /**
   * Get current language from i18n or the document.
   */
  getCurrentLanguage: function() {
    if (window.i18n && typeof window.i18n.getCurrentLanguage === 'function') {
      return window.i18n.getCurrentLanguage();
    }

    return document.documentElement.lang || 'en';
  },

  /**
   * Apply RTL direction for supported blog languages.
   */
  applyLocaleDirection: function() {
    const language = this.getCurrentLanguage();
    const isRtl = BLOG_RTL_LANGUAGES.has(language);

    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.classList.toggle('rtl-mode', isRtl);
    document.documentElement.classList.toggle('ltr-mode', !isRtl);
  },

  /**
   * Get translated or fallback text.
   */
  t: function(key, fallback) {
    if (window.i18n && typeof window.i18n.getTranslation === 'function') {
      const translated = window.i18n.getTranslation(key);
      if (translated && translated !== key) {
        return translated;
      }
    }

    return fallback;
  },

  /**
   * Set or create a meta tag by name.
   */
  setMetaName: function(name, value) {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', name);
      document.head.appendChild(tag);
    }

    tag.setAttribute('content', value || '');
  },

  /**
   * Set or create a meta tag by property.
   */
  setMetaProperty: function(property, value) {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }

    tag.setAttribute('content', value || '');
  },

  /**
   * Create canonical link if missing.
   */
  createCanonicalLink: function() {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }

    return link;
  },

  /**
   * Capitalize fallback labels.
   */
  capitalize: function(text) {
    const value = String(text || '');
    if (!value) {
      return '';
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  },

  /**
   * Escape HTML text.
   */
  escapeHtml: function(text) {
    const div = document.createElement('div');
    div.textContent = String(text || '');
    return div.innerHTML;
  },

  /**
   * Show error message.
   */
  showError: function(message) {
    const container = document.querySelector('.container') || document.body;
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    container.prepend(errorDiv);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  BLOG.init().catch((error) => {
    console.error('Blog initialization failed:', error);
  });
});
