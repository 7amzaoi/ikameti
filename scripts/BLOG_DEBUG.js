// Debug script to verify blog translation system
// Copy this to browser console to test

console.log('=== BLOG TRANSLATION SYSTEM DEBUG ===');

// 1. Check i18n system
console.log('1. i18n System Check:');
console.log('   - window.i18n exists:', !!window.i18n);
if (window.i18n) {
  console.log('   - Current language:', window.i18n.getCurrentLanguage());
  console.log('   - getTranslation method exists:', typeof window.i18n.getTranslation === 'function');
  
  const articlesData = window.i18n.getTranslation('blog_articles');
  console.log('   - Blog articles exist:', !!articlesData);
  if (articlesData) {
    console.log('   - Number of articles:', Object.keys(articlesData).length);
    console.log('   - Article keys:', Object.keys(articlesData));
  }
}

// 2. Check BLOG system
console.log('\n2. BLOG System Check:');
console.log('   - BLOG object exists:', !!window.BLOG);
if (window.BLOG) {
  console.log('   - Loaded articles:', window.BLOG.articles.length);
  if (window.BLOG.articles.length > 0) {
    console.log('   - First article:', window.BLOG.articles[0]);
  }
  console.log('   - Language listener registered:', window.BLOG.isLanguageChangeListener);
}

// 3. Check language event listener
console.log('\n3. Language Change Event Test:');
let eventFired = false;
const testListener = (e) => {
  console.log('   - Language change event received:', e.detail.language);
  eventFired = true;
};
window.addEventListener('languageChanged', testListener);
console.log('   - Test listener added, waiting for language change...');
console.log('   - Try changing language now');

// 4. Check article content
console.log('\n4. Article Content Check:');
if (window.BLOG && window.BLOG.articles.length > 0) {
  const article = window.BLOG.articles[0];
  console.log('   - Article title:', article.title);
  console.log('   - Article content length:', article.content.length, 'characters');
  console.log('   - Article has HTML:', article.content.includes('<'));
}

// 5. Check page elements
console.log('\n5. Page Elements Check:');
console.log('   - #blog-grid exists:', !!document.getElementById('blog-grid'));
console.log('   - #article-header exists:', !!document.getElementById('article-header'));
console.log('   - #article-content exists:', !!document.getElementById('article-content'));

console.log('\n=== END DEBUG ===');
