// Blog articles are loaded from the canonical JSON data source.
var blogArticles = [];
window.blogArticles = blogArticles;

window.blogArticlesPromise = fetch('../data/articles.json', { cache: 'no-store' })
    .then(function (response) {
        if (!response.ok) {
            throw new Error('Failed to load articles.json (' + response.status + ')');
        }

        return response.json();
    })
    .then(function (data) {
        var articles = Array.isArray(data) ? data : [];
        blogArticles.splice(0, blogArticles.length);
        Array.prototype.push.apply(blogArticles, articles);
        return blogArticles;
    })
    .catch(function (error) {
        console.error('Failed to load blog articles from articles.json:', error);
        blogArticles.splice(0, blogArticles.length);
        return blogArticles;
    });
