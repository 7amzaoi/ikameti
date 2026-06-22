/* =====================================================================
   IKAMETI Admin Dashboard — logic
   Requires: window.sb (Supabase client from config.js)
   ===================================================================== */
(function () {
  'use strict';

  const sb = window.sb;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const state = {
    user: null,
    categories: [],
    blogs: [],
    residency: [],
    reminders: [],
    filters: {
      blogSearch: '', blogCat: '', blogStatus: '',
      resSearch: '', resStatus: '',
      remSearch: '', remUrgency: '', remSort: 'urgency'
    }
  };

  const VIEW_META = {
    analytics: { title: 'Analytics',      sub: 'A live overview of leads, reminders and content.',             action: '' },
    blogs:     { title: 'Blogs',          sub: 'Create, edit and remove blog articles and their categories.', action: '+ New article' },
    residency: { title: 'Residency Form', sub: '“Get Your Residency in Turkey in Minutes” — submitted leads.', action: '' },
    reminders: { title: 'Remind Me',      sub: 'Renewal reminder requests, sorted by how soon they expire.',  action: '' }
  };

  /* ---------------- helpers ---------------- */
  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }
  function slugify(s) {
    return String(s || '').toLowerCase().trim()
      .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  function fmtDate(d) {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date)) return esc(d);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtDateTime(d) {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date)) return esc(d);
    return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  // Whole days left until `dateStr`, measured at UTC midnight so the count is
  // identical for every admin regardless of their local timezone, and it ticks
  // down by exactly one each UTC day. Negative = already expired.
  const MS_PER_DAY = 86400000;
  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    if (isNaN(target)) return null;
    const todayUTC = Math.floor(Date.now() / MS_PER_DAY);
    const targetUTC = Math.floor(target.getTime() / MS_PER_DAY);
    return targetUTC - todayUTC;
  }
  function urgencyOf(days) {
    if (days == null) return 'safe';
    if (days < 7) return 'urgent';
    if (days < 30) return 'soon';
    if (days < 60) return 'upcoming';
    return 'safe';
  }
  function phoneDigits(p) { return String(p || '').replace(/[^\d]/g, ''); }

  let toastTimer;
  function toast(msg, type) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function openModal(id) { $('#' + id).classList.add('show'); }
  function closeModal(id) { $('#' + id).classList.remove('show'); }

  /* ---------------- auth ---------------- */
  async function guard() {
    const { data } = await sb.auth.getSession();
    if (!data.session) {
      window.location.replace('login.html');
      return false;
    }
    state.user = data.session.user;

    // Restrict access to the single allowed admin email.
    const allowed = (window.IKAMETI_ADMIN_CONFIG.ADMIN_EMAIL || '').toLowerCase();
    if (allowed && (state.user.email || '').toLowerCase() !== allowed) {
      await sb.auth.signOut();
      window.location.replace('login.html?denied=1');
      return false;
    }

    const email = state.user.email || 'admin';
    $('#user-email').textContent = email;
    $('#user-avatar').textContent = (email[0] || 'A').toUpperCase();
    return true;
  }

  $('#logout-btn').addEventListener('click', async () => {
    await sb.auth.signOut();
    window.location.replace('login.html');
  });

  /* ---------------- navigation ---------------- */
  function switchView(view) {
    $$('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.view === view));
    $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
    const meta = VIEW_META[view];
    $('#page-title').textContent = meta.title;
    $('#page-sub').textContent = meta.sub;
    const action = $('#primary-action');
    if (meta.action) { action.style.display = ''; action.textContent = meta.action; action.dataset.view = view; }
    else action.style.display = 'none';
    $('#app').classList.remove('nav-open');
    if (view === 'analytics') renderAnalytics();
  }
  $$('.nav-link').forEach(l => l.addEventListener('click', () => switchView(l.dataset.view)));
  $('#primary-action').addEventListener('click', () => { if ($('#primary-action').dataset.view === 'blogs') openBlogEditor(); });

  // mobile sidebar
  $('#hamburger').addEventListener('click', () => $('#app').classList.toggle('nav-open'));
  $('#scrim').addEventListener('click', () => $('#app').classList.remove('nav-open'));

  // dark / light theme toggle
  function isDark() { return document.documentElement.classList.contains('dark'); }
  $('#theme-toggle').addEventListener('click', () => {
    const dark = !isDark();
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('ikameti-theme', dark ? 'dark' : 'light'); } catch (e) {}
    if ($('#view-analytics').classList.contains('active')) renderAnalytics(); // recolour charts
  });

  // generic modal close
  $$('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.close)));
  $$('.modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('show'); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $$('.modal-overlay.show').forEach(o => o.classList.remove('show')); });

  /* =====================================================================
     BLOGS
     ===================================================================== */
  async function loadBlogs() {
    const [catRes, blogRes] = await Promise.all([
      sb.from('categories').select('*').order('name'),
      sb.from('blogs').select('*').order('published_date', { ascending: false })
    ]);
    if (catRes.error) toast('Failed to load categories: ' + catRes.error.message, 'err');
    if (blogRes.error) toast('Failed to load blogs: ' + blogRes.error.message, 'err');
    state.categories = catRes.data || [];
    state.blogs = blogRes.data || [];
    $('#count-blogs').textContent = state.blogs.length;
    renderCategories();
    renderCategoryOptions();
    renderBlogsStats();
    renderBlogs();
    refreshAnalytics();
  }

  function renderBlogsStats() {
    const pub = state.blogs.filter(b => b.status === 'published').length;
    const draft = state.blogs.filter(b => b.status === 'draft').length;
    $('#blogs-stats').innerHTML = `
      ${stat('Total articles', state.blogs.length, 'brand', ICONS.doc)}
      ${stat('Published', pub, 'ok', ICONS.globe)}
      ${stat('Drafts', draft, 'warn', ICONS.pencil)}
      ${stat('Categories', state.categories.length, '', ICONS.tag)}`;
  }

  function renderCategories() {
    const wrap = $('#categories-list');
    if (!state.categories.length) { wrap.innerHTML = '<span style="color:var(--muted);font-size:13px;">No categories yet.</span>'; return; }
    wrap.innerHTML = state.categories.map(c => `
      <span class="chip">${esc(c.name)}
        <button title="Delete category" data-del-cat="${esc(c.slug)}">&times;</button>
      </span>`).join('');
    $$('[data-del-cat]', wrap).forEach(b => b.addEventListener('click', () => deleteCategory(b.dataset.delCat)));
  }

  function renderCategoryOptions() {
    const filter = $('#blog-cat-filter');
    const editor = $('#blog-category');
    const opts = state.categories.map(c => `<option value="${esc(c.slug)}">${esc(c.name)}</option>`).join('');
    filter.innerHTML = '<option value="">All categories</option>' + opts;
    filter.value = state.filters.blogCat;
    editor.innerHTML = opts || '<option value="general">General</option>';
  }

  function filteredBlogs() {
    const q = state.filters.blogSearch.toLowerCase();
    return state.blogs.filter(b =>
      (!q || (b.title || '').toLowerCase().includes(q)) &&
      (!state.filters.blogCat || b.category === state.filters.blogCat) &&
      (!state.filters.blogStatus || b.status === state.filters.blogStatus));
  }

  function renderBlogs() {
    const rows = filteredBlogs();
    const tbody = $('#blogs-tbody');
    const empty = $('#blogs-empty');
    if (!rows.length) {
      tbody.innerHTML = '';
      empty.innerHTML = emptyState('📝', 'No articles found', 'Create your first article with the “New article” button.');
      return;
    }
    empty.innerHTML = '';
    tbody.innerHTML = rows.map(b => {
      const cat = state.categories.find(c => c.slug === b.category);
      const statusPill = b.status === 'published'
        ? '<span class="pill pill-ok">Published</span>'
        : '<span class="pill pill-muted">Draft</span>';
      return `<tr>
        <td>
          <div style="display:flex;gap:12px;align-items:center;">
            <img class="thumb" src="${esc(b.image || '')}" alt="" onerror="this.style.visibility='hidden'">
            <div>
              <div class="blog-title">${esc(b.title)}</div>
              <div class="blog-meta">${esc(b.author || '')} · /${esc(b.slug)}</div>
            </div>
          </div>
        </td>
        <td>${cat ? '<span class="cat-tag">' + esc(cat.name) + '</span>' : esc(b.category || '—')}</td>
        <td>${statusPill}</td>
        <td style="white-space:nowrap;">${fmtDate(b.published_date)}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" title="Edit" data-edit="${b.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="icon-btn del" title="Delete" data-del="${b.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
    $$('[data-edit]', tbody).forEach(b => b.addEventListener('click', () => openBlogEditor(Number(b.dataset.edit))));
    $$('[data-del]', tbody).forEach(b => b.addEventListener('click', () => deleteBlog(Number(b.dataset.del))));
  }

  // blog filters
  $('#blog-search').addEventListener('input', e => { state.filters.blogSearch = e.target.value; renderBlogs(); });
  $('#blog-cat-filter').addEventListener('change', e => { state.filters.blogCat = e.target.value; renderBlogs(); });
  $('#blog-status-filter').addEventListener('change', e => { state.filters.blogStatus = e.target.value; renderBlogs(); });

  // blog editor
  function openBlogEditor(id) {
    const b = id ? state.blogs.find(x => x.id === id) : null;
    $('#blog-modal-title').textContent = b ? 'Edit article' : 'New article';
    $('#blog-id').value = b ? b.id : '';
    $('#blog-title').value = b ? b.title : '';
    $('#blog-slug').value = b ? b.slug : '';
    $('#blog-category').value = b ? (b.category || '') : (state.categories[0] ? state.categories[0].slug : '');
    $('#blog-author').value = b ? (b.author || '') : 'IKAMETI Team';
    $('#blog-date').value = b && b.published_date ? b.published_date : new Date().toISOString().slice(0, 10);
    $('#blog-readtime').value = b ? (b.read_time || '') : '';
    $('#blog-status').value = b ? b.status : 'published';
    $('#blog-image').value = b ? (b.image || '') : '';
    $('#blog-description').value = b ? (b.description || '') : '';
    setEditorHtml(b ? (b.content || '') : '');
    fillTranslations(b ? b.translations : {});
    $('#blog-slug').dataset.touched = b ? '1' : '';
    $('#blog-image-file').value = '';
    setImageStatus('');
    setImagePreview(b ? (b.image || '') : '');
    openModal('blog-modal');
  }

  /* ---- rich-text content editor (Quill, with plain-textarea fallback) ---- */
  let quill = null, editorTried = false;
  function ensureEditor() {
    if (editorTried) return quill;
    editorTried = true;
    const host = document.getElementById('blog-content-editor');
    if (!host) return null;
    if (window.Quill) {
      quill = new window.Quill(host, {
        theme: 'snow',
        placeholder: 'Start writing your article…',
        modules: {
          toolbar: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'link'],
            ['clean']
          ]
        }
      });
    } else {
      // Fallback if the editor library can't load: a plain text box.
      const ta = document.createElement('textarea');
      ta.id = 'blog-content-fallback';
      ta.style.cssText = 'min-height:240px;width:100%;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;';
      host.replaceWith(ta);
    }
    return quill;
  }
  function setEditorHtml(html) {
    const q = ensureEditor();
    if (q) {
      // dangerouslyPasteHTML keeps the editor's internal model in sync so
      // lists, links and formatting survive (plain innerHTML assignment loses them).
      if (html && html.trim()) q.clipboard.dangerouslyPasteHTML(html);
      else q.setText('');
    } else {
      const ta = document.getElementById('blog-content-fallback'); if (ta) ta.value = html || '';
    }
  }
  function getEditorHtml() {
    const q = ensureEditor();
    if (q) { const h = q.root.innerHTML.trim(); return (h === '<p><br></p>' || h === '<p></p>') ? '' : h; }
    const ta = document.getElementById('blog-content-fallback');
    return ta ? ta.value : '';
  }

  /* ---- per-language translations (title / description / content) ---- */
  // English is NOT listed here: the main fields above ARE the English /
  // default version. This section is only for the other languages.
  const TR_LANGS = [
    ['ar', 'العربية'], ['tr', 'Türkçe'], ['ru', 'Русский'],
    ['fa', 'فارسی'], ['uz', 'Ўзбек'], ['af', 'دری']
  ];
  const TR_RTL = new Set(['ar', 'fa', 'af']);
  let translationsBuilt = false;
  const trEditors = {}; // lang code -> Quill instance (null if using textarea fallback)

  function buildTranslations() {
    if (translationsBuilt) return;
    const host = document.getElementById('blog-translations');
    if (!host) return;
    host.innerHTML = TR_LANGS.map(([code, name]) => {
      const dir = TR_RTL.has(code) ? ' dir="rtl"' : '';
      return (
        '<details class="tr-lang" data-lang="' + code + '">' +
          '<summary><span class="tr-lang-name">' + name + '</span><span class="tr-lang-code">' + code.toUpperCase() + '</span></summary>' +
          '<div class="tr-fields">' +
            '<label>Title</label>' +
            '<input type="text" id="tr-' + code + '-title"' + dir + ' placeholder="Article title in ' + name + '">' +
            '<label>Short description</label>' +
            '<textarea id="tr-' + code + '-desc" style="min-height:48px;"' + dir + ' placeholder="Card summary in ' + name + '"></textarea>' +
            '<label>Content</label>' +
            '<div id="tr-' + code + '-editor" class="tr-editor"' + dir + '></div>' +
          '</div>' +
        '</details>'
      );
    }).join('');
    translationsBuilt = true;
    // Give every language the same rich editor as English, so pasting a full
    // article keeps its headings, bold and lists — and nothing gets cut off.
    TR_LANGS.forEach(([code]) => ensureTrEditor(code));
  }

  function ensureTrEditor(code) {
    if (code in trEditors) return trEditors[code];
    const host = document.getElementById('tr-' + code + '-editor');
    if (!host) { trEditors[code] = null; return null; }
    if (window.Quill) {
      const q = new window.Quill(host, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['blockquote', 'link'],
            ['clean']
          ]
        }
      });
      if (TR_RTL.has(code)) { q.root.setAttribute('dir', 'rtl'); q.root.style.textAlign = 'right'; }

      // Smart paste: when the user pastes plain text that looks like markdown
      // (e.g. a ChatGPT article with "#", "##", "**bold**", "- item"), convert
      // it to real formatting instead of dropping it in as flat text. Rich HTML
      // pastes (Word, web pages) are left to Quill's own handling.
      q.root.addEventListener('paste', (e) => {
        const cd = e.clipboardData || window.clipboardData;
        if (!cd) return;
        const html = (cd.getData('text/html') || '').trim();
        if (html) return; // already formatted — let Quill keep it
        const text = cd.getData('text/plain') || '';
        const looksLikeMarkdown = /(^|\n)\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s)/.test(text) || /\*\*[^*]+\*\*/.test(text);
        if (!looksLikeMarkdown) return; // plain prose — normal paste is fine
        e.preventDefault();
        const range = q.getSelection(true);
        q.clipboard.dangerouslyPasteHTML(range ? range.index : q.getLength(), mdToHtml(text));
      });

      trEditors[code] = q;
      return q;
    }
    // Fallback if Quill can't load: a plain textarea (markdown converted on save).
    const ta = document.createElement('textarea');
    ta.id = 'tr-' + code + '-content-fallback';
    ta.className = 'tr-content';
    ta.style.cssText = 'min-height:150px;width:100%;';
    if (TR_RTL.has(code)) ta.setAttribute('dir', 'rtl');
    host.replaceWith(ta);
    trEditors[code] = null;
    return null;
  }

  function setTrEditorHtml(code, html) {
    const q = ensureTrEditor(code);
    if (q) {
      if (html && html.trim()) q.clipboard.dangerouslyPasteHTML(html);
      else q.setText('');
    } else {
      const ta = document.getElementById('tr-' + code + '-content-fallback');
      if (ta) ta.value = html || '';
    }
  }

  function getTrEditorHtml(code) {
    const q = ensureTrEditor(code);
    if (q) { const h = q.root.innerHTML.trim(); return (h === '<p><br></p>' || h === '<p></p>') ? '' : h; }
    const ta = document.getElementById('tr-' + code + '-content-fallback');
    return ta ? mdToHtml(ta.value) : '';
  }

  function fillTranslations(map) {
    buildTranslations();
    const t = (map && typeof map === 'object') ? map : {};
    TR_LANGS.forEach(([code]) => {
      const v = (t[code] && typeof t[code] === 'object') ? t[code] : {};
      const ti = document.getElementById('tr-' + code + '-title');
      const de = document.getElementById('tr-' + code + '-desc');
      if (ti) ti.value = v.title || '';
      if (de) de.value = v.description || v.excerpt || '';
      setTrEditorHtml(code, v.content || '');
      const det = document.querySelector('.tr-lang[data-lang="' + code + '"]');
      if (det) det.open = Boolean(String(v.title || v.description || v.content || '').trim());
    });
  }

  // Convert the pasted text into clean article HTML so a translation looks
  // exactly like the English version (headings, bold, lists — not raw "#"/"*").
  // Already-HTML input is left untouched. Plain text without any markdown is
  // simply split into paragraphs.
  function mdToHtml(s) {
    s = (s || '').replace(/\r\n?/g, '\n').trim();
    if (!s) return '';
    if (/<[a-z][\s\S]*>/i.test(s)) return s; // already HTML — keep as-is

    function inline(t) {
      t = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');   // **bold**
      t = t.replace(/__([^_]+)__/g, '<strong>$1</strong>');       // __bold__
      t = t.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>'); // *italic*
      t = t.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
      return t;
    }

    const lines = s.split('\n');
    const out = [];
    let listType = null; // 'ul' | 'ol'
    let para = [];
    const flushPara = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
    const closeList = () => { if (listType) { out.push('</' + listType + '>'); listType = null; } };

    lines.forEach((raw) => {
      const line = raw.trim();
      if (!line) { flushPara(); closeList(); return; }
      let m;
      if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
        flushPara(); closeList();
        const level = Math.min(m[1].length + 1, 6); // "#" -> h2 (matches article headings)
        out.push('<h' + level + '>' + inline(m[2].trim()) + '</h' + level + '>');
      } else if ((m = line.match(/^[-*+]\s+(.*)$/))) {
        flushPara();
        if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul'; }
        out.push('<li>' + inline(m[1].trim()) + '</li>');
      } else if ((m = line.match(/^\d+[.)]\s+(.*)$/))) {
        flushPara();
        if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol'; }
        out.push('<li>' + inline(m[1].trim()) + '</li>');
      } else {
        closeList();
        para.push(line);
      }
    });
    flushPara(); closeList();
    return out.join('\n');
  }

  function collectTranslations() {
    const out = {};
    TR_LANGS.forEach(([code]) => {
      const title = ((document.getElementById('tr-' + code + '-title') || {}).value || '').trim();
      const desc = ((document.getElementById('tr-' + code + '-desc') || {}).value || '').trim();
      const content = getTrEditorHtml(code).trim();
      const entry = {};
      if (title) entry.title = title;
      if (desc) entry.description = desc;
      if (content) entry.content = content;
      if (Object.keys(entry).length) out[code] = entry;
    });
    return out;
  }

  /* ---- cover image: upload from device (Supabase Storage) ---- */
  const BLOG_BUCKET = 'blog-images';

  function setImagePreview(url) {
    const prev = $('#blog-image-preview');
    if (url) {
      prev.style.backgroundImage = `url("${url.replace(/"/g, '%22')}")`;
      prev.classList.remove('empty');
      $('#blog-image-clear-btn').style.display = '';
    } else {
      prev.style.backgroundImage = '';
      prev.classList.add('empty');
      $('#blog-image-clear-btn').style.display = 'none';
    }
  }
  function setImageStatus(msg, kind) {
    const el = $('#blog-image-status');
    el.textContent = msg || '';
    el.className = 'image-upload-status' + (kind ? ' ' + kind : '');
  }

  async function uploadCover(file) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sb.storage.from(BLOG_BUCKET).upload(path, file, {
      cacheControl: '3600', upsert: false, contentType: file.type || undefined
    });
    if (error) throw error;
    return sb.storage.from(BLOG_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  $('#blog-image-upload-btn').addEventListener('click', () => $('#blog-image-file').click());
  $('#blog-image-clear-btn').addEventListener('click', () => {
    $('#blog-image').value = '';
    $('#blog-image-file').value = '';
    setImagePreview('');
    setImageStatus('');
  });
  $('#blog-image').addEventListener('input', e => setImagePreview(e.target.value.trim()));
  $('#blog-image-file').addEventListener('change', async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setImageStatus('Please choose an image file.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { setImageStatus('Image is too large (max 5 MB).', 'error'); return; }

    const saveBtn = $('#blog-save-btn');
    saveBtn.disabled = true;
    setImageStatus('Uploading…', 'uploading');
    try {
      const url = await uploadCover(file);
      $('#blog-image').value = url;
      setImagePreview(url);
      setImageStatus('Uploaded ✓', 'ok');
    } catch (err) {
      const m = /bucket.*not found|does not exist/i.test(err.message || '')
        ? 'Image bucket missing — run supabase/storage.sql once in Supabase.'
        : (err.message || 'Upload failed');
      setImageStatus(m, 'error');
      toast(m, 'err');
    } finally {
      saveBtn.disabled = false;
    }
  });

  // auto-slug from title until the user edits the slug field directly
  $('#blog-title').addEventListener('input', e => {
    const slugInput = $('#blog-slug');
    if (!slugInput.dataset.touched) slugInput.value = slugify(e.target.value);
  });
  $('#blog-slug').addEventListener('input', e => { e.target.dataset.touched = '1'; });

  $('#blog-form').addEventListener('submit', async e => {
    e.preventDefault();
    const id = $('#blog-id').value;
    const payload = {
      title: $('#blog-title').value.trim(),
      slug: slugify($('#blog-slug').value) || slugify($('#blog-title').value),
      category: $('#blog-category').value || null,
      author: $('#blog-author').value.trim() || 'IKAMETI Team',
      published_date: $('#blog-date').value || null,
      read_time: $('#blog-readtime').value.trim() || null,
      status: $('#blog-status').value,
      image: $('#blog-image').value.trim() || null,
      description: $('#blog-description').value.trim() || null,
      content: getEditorHtml(),
      translations: collectTranslations()
    };
    if (!payload.title || !payload.slug) { toast('Title and slug are required', 'err'); return; }

    const btn = $('#blog-save-btn');
    btn.disabled = true; btn.textContent = 'Saving…';
    let error;
    if (id) ({ error } = await sb.from('blogs').update(payload).eq('id', Number(id)));
    else ({ error } = await sb.from('blogs').insert([payload]));
    btn.disabled = false; btn.textContent = 'Save article';

    if (error) {
      toast((/duplicate|unique/i.test(error.message) ? 'That slug is already used by another article.' : error.message), 'err');
      return;
    }
    closeModal('blog-modal');
    toast(id ? 'Article updated' : 'Article created', 'ok');
    loadBlogs();
  });

  async function deleteBlog(id) {
    const b = state.blogs.find(x => x.id === id);
    if (!confirm(`Delete “${b ? b.title : 'this article'}”? This cannot be undone.`)) return;
    const { error } = await sb.from('blogs').delete().eq('id', id);
    if (error) { toast(error.message, 'err'); return; }
    toast('Article deleted', 'ok');
    loadBlogs();
  }

  // categories
  $('#add-category-btn').addEventListener('click', () => {
    $('#cat-name').value = ''; $('#cat-slug').value = ''; $('#cat-desc').value = '';
    $('#cat-slug').dataset.touched = '';
    openModal('category-modal');
  });
  $('#cat-name').addEventListener('input', e => {
    const s = $('#cat-slug'); if (!s.dataset.touched) s.value = slugify(e.target.value);
  });
  $('#cat-slug').addEventListener('input', e => { e.target.dataset.touched = '1'; });
  $('#category-form').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      name: $('#cat-name').value.trim(),
      slug: slugify($('#cat-slug').value) || slugify($('#cat-name').value),
      description: $('#cat-desc').value.trim() || null
    };
    if (!payload.name || !payload.slug) { toast('Name and slug are required', 'err'); return; }
    const { error } = await sb.from('categories').insert([payload]);
    if (error) { toast(/duplicate|unique/i.test(error.message) ? 'That category already exists.' : error.message, 'err'); return; }
    closeModal('category-modal');
    toast('Category added', 'ok');
    loadBlogs();
  });
  async function deleteCategory(slug) {
    const used = state.blogs.filter(b => b.category === slug).length;
    const msg = used ? `Delete this category? ${used} article(s) use it and will become uncategorised.` : 'Delete this category?';
    if (!confirm(msg)) return;
    const { error } = await sb.from('categories').delete().eq('slug', slug);
    if (error) { toast(error.message, 'err'); return; }
    toast('Category deleted', 'ok');
    loadBlogs();
  }

  /* =====================================================================
     SHARED submission UI bits
     ===================================================================== */
  // Small inline icons used in the KPI stat cards.
  const ICONS = {
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    alarm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>'
  };

  function stat(label, value, tone, icon) {
    return `<div class="stat ${tone ? 'tone-' + tone : ''}">
      <div class="stat-icon">${icon || ''}</div>
      <div class="stat-text"><div class="label">${esc(label)}</div><div class="value">${value}</div></div>
    </div>`;
  }
  function emptyState(emoji, title, sub) {
    return `<div class="empty"><div class="emoji">${emoji}</div><div style="font-weight:700;color:var(--ink-2);">${esc(title)}</div><div style="margin-top:4px;">${esc(sub)}</div></div>`;
  }
  // Pipeline stages, shared by the board columns, the summary bar and badges.
  const STATUS_COLS = [
    { key: 'new', label: 'New' },
    { key: 'contacted', label: 'Contacted' },
    { key: 'in_progress', label: 'In progress' },
    { key: 'closed', label: 'Closed' }
  ];
  const STATUS_LABEL = { new: 'New', contacted: 'Contacted', in_progress: 'In progress', closed: 'Closed' };
  function statusClass(s) { return 's-' + (STATUS_COLS.some(c => c.key === s) ? s : 'new'); }

  function statusSelect(table, row) {
    const s = STATUS_COLS.some(c => c.key === row.status) ? row.status : 'new';
    return `<button type="button" class="status-field status-trigger ${statusClass(s)}"
      data-status-for="${table}:${row.id}" data-status="${s}">
      <span class="status-dot"></span>
      <span class="status-cur">${STATUS_LABEL[s]}</span>
    </button>`;
  }

  /* ---- custom designed status dropdown (replaces the native <select>) ---- */
  const statusMenu = (function () {
    let pop = null, trigger = null;
    function build() {
      pop = document.createElement('div');
      pop.className = 'status-pop';
      pop.innerHTML = '<div class="status-pop-title">Move to stage</div>' + STATUS_COLS.map(c =>
        `<button type="button" class="status-opt ${statusClass(c.key)}" data-val="${c.key}">
          <span class="dot"></span><span>${c.label}</span>
          <svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </button>`).join('');
      document.body.appendChild(pop);
      pop.addEventListener('click', onPick);
    }
    function place() {
      const r = trigger.getBoundingClientRect();
      const w = Math.max(r.width, 192);
      pop.style.width = w + 'px';
      const ph = pop.offsetHeight || 220;
      let top = r.bottom + 6;
      if (top + ph > window.innerHeight - 8) top = Math.max(8, r.top - ph - 6);
      let left = Math.min(r.left, window.innerWidth - w - 8);
      pop.style.top = top + 'px';
      pop.style.left = Math.max(8, left) + 'px';
    }
    function open(t) {
      if (!pop) build();
      if (trigger === t) { close(); return; }
      trigger = t;
      const cur = t.dataset.status;
      $$('.status-opt', pop).forEach(o => o.classList.toggle('active', o.dataset.val === cur));
      place();
      pop.classList.add('show');
      t.classList.add('open');
    }
    function close() {
      if (pop) pop.classList.remove('show');
      if (trigger) trigger.classList.remove('open');
      trigger = null;
    }
    async function onPick(e) {
      const opt = e.target.closest('.status-opt');
      if (!opt || !trigger) return;
      const val = opt.dataset.val;
      const [table, idStr] = trigger.dataset.statusFor.split(':');
      const id = Number(idStr);
      const t = trigger;
      close();
      if (t.dataset.status === val) return;
      const { error } = await sb.from(table).update({ status: val }).eq('id', id);
      if (error) { toast(error.message, 'err'); return; }
      const arr = table === 'residency_submissions' ? state.residency : state.reminders;
      const item = arr.find(x => x.id === id); if (item) item.status = val;
      toast('Moved to ' + STATUS_LABEL[val], 'ok');
      if (table === 'residency_submissions') { renderResidencyStats(); renderResidency(); }
      else { renderRemindersStats(); renderReminders(); }
    }
    document.addEventListener('click', e => {
      const t = e.target.closest('.status-trigger');
      if (t) { e.stopPropagation(); open(t); return; }
      if (pop && !e.target.closest('.status-pop')) close();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return { close };
  })();

  /* ---- Kanban board: pipeline summary + status columns + drag-and-drop ---- */
  function pipelineBar(counts) {
    const segs = STATUS_COLS.filter(c => (counts[c.key] || 0) > 0).map(c => {
      const n = counts[c.key] || 0;
      return `<span class="seg ${statusClass(c.key)}" style="flex-grow:${n}" title="${c.label}: ${n}"></span>`;
    }).join('');
    const legend = STATUS_COLS.map(c =>
      `<span class="${statusClass(c.key)}"><i></i>${c.label} <b>${counts[c.key] || 0}</b></span>`).join('');
    return `<div class="pipeline"><div class="pipeline-track">${segs}</div><div class="pipeline-legend">${legend}</div></div>`;
  }

  function renderBoard(wrap, rows, cardFn) {
    const groups = { new: [], contacted: [], in_progress: [], closed: [] };
    rows.forEach(r => (groups[r.status] || groups.new).push(r));
    const counts = {}; STATUS_COLS.forEach(c => counts[c.key] = groups[c.key].length);
    let idx = 0;
    const cols = STATUS_COLS.map(c => {
      const body = groups[c.key].map(r => cardFn(r, idx++)).join('') || '<div class="board-col-empty">No leads here yet</div>';
      return `<div class="board-col ${statusClass(c.key)}" data-status="${c.key}">
        <div class="board-col-head"><span class="dot"></span><span class="title">${c.label}</span><span class="count">${counts[c.key]}</span></div>
        <div class="board-col-body">${body}</div>
      </div>`;
    }).join('');
    wrap.innerHTML = pipelineBar(counts) + `<div class="board">${cols}</div>`;
  }

  function wireBoardDnd(wrap, table, render) {
    const arr = () => table === 'residency_submissions' ? state.residency : state.reminders;
    $$('.sub-card[draggable]', wrap).forEach(card => {
      card.addEventListener('dragstart', e => {
        // Don't start a drag when the user is interacting with a control inside the card.
        if (e.target.closest('.notes-area, .status-field, .foot-actions, a, button, select, textarea')) { e.preventDefault(); return; }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.cardId);
        setTimeout(() => card.classList.add('dragging'), 0);
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        $$('.board-col.drop-over', wrap).forEach(c => c.classList.remove('drop-over'));
      });
    });
    $$('.board-col', wrap).forEach(col => {
      col.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; col.classList.add('drop-over'); });
      col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) col.classList.remove('drop-over'); });
      col.addEventListener('drop', async e => {
        e.preventDefault();
        col.classList.remove('drop-over');
        const id = Number(e.dataTransfer.getData('text/plain'));
        const newStatus = col.dataset.status;
        const item = arr().find(x => x.id === id);
        if (!item || !newStatus || item.status === newStatus) return;
        const prev = item.status;
        item.status = newStatus;          // optimistic: move card immediately
        render();
        const { error } = await sb.from(table).update({ status: newStatus }).eq('id', id);
        if (error) { item.status = prev; render(); toast(error.message, 'err'); return; }
        toast('Moved to ' + STATUS_LABEL[newStatus], 'ok');
      });
    });
  }
  function contactButtons(phone) {
    const digits = phoneDigits(phone);
    return `
      <a class="icon-btn wa" title="WhatsApp" href="https://wa.me/${digits}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.043z"/></svg>
      </a>
      <a class="icon-btn" title="Call" href="tel:${esc(phone || '')}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      </a>`;
  }
  function wireSubmissionEvents(scope, table, reloadFn) {
    // Status changes are handled by the custom dropdown (statusMenu); here we
    // only wire the notes field and the delete button.
    $$('[data-notes-for]', scope).forEach(t => t.addEventListener('change', async e => {
      const id = Number(e.target.dataset.notesFor.split(':')[1]);
      const { error } = await sb.from(table).update({ notes: e.target.value }).eq('id', id);
      if (error) { toast(error.message, 'err'); return; }
      const arr = table === 'residency_submissions' ? state.residency : state.reminders;
      const item = arr.find(x => x.id === id); if (item) item.notes = e.target.value;
      toast('Note saved', 'ok');
    }));
    $$('[data-del-sub]', scope).forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Delete this submission permanently?')) return;
      const id = Number(b.dataset.delSub);
      const { error } = await sb.from(table).delete().eq('id', id);
      if (error) { toast(error.message, 'err'); return; }
      toast('Submission deleted', 'ok');
      reloadFn();
    }));
  }
  function statusBadge(status) {
    return `<span class="pill ${statusClass(status)}">${STATUS_LABEL[status] || status}</span>`;
  }

  /* =====================================================================
     RESIDENCY SUBMISSIONS
     ===================================================================== */
  async function loadResidency() {
    const { data, error } = await sb.from('residency_submissions').select('*').order('created_at', { ascending: false });
    if (error) { toast('Failed to load leads: ' + error.message, 'err'); return; }
    state.residency = data || [];
    $('#count-residency').textContent = state.residency.length;
    renderResidencyStats();
    renderResidency();
    refreshAnalytics();
  }
  function renderResidencyStats() {
    const total = state.residency.length;
    const nw = state.residency.filter(r => r.status === 'new').length;
    const contacted = state.residency.filter(r => r.status === 'contacted').length;
    const closed = state.residency.filter(r => r.status === 'closed').length;
    $('#residency-stats').innerHTML =
      stat('Total leads', total, 'brand', ICONS.users) +
      stat('New', nw, 'warn', ICONS.inbox) +
      stat('Contacted', contacted, 'ok', ICONS.phone) +
      stat('Closed', closed, '', ICONS.check);
  }
  function filteredResidency() {
    const q = state.filters.resSearch.toLowerCase();
    return state.residency.filter(r =>
      (!state.filters.resStatus || r.status === state.filters.resStatus) &&
      (!q || (r.full_name || '').toLowerCase().includes(q) || (r.phone || '').toLowerCase().includes(q)));
  }
  function residencyCard(r, i) {
    const initials = (r.full_name || '?').trim().charAt(0).toUpperCase();
    const renewTag = r.has_residency === 'yes'
      ? '<span class="tag tag-accent">Renewal / upgrade</span>'
      : (r.has_residency === 'no' ? '<span class="tag">First-time applicant</span>' : '');
    return `<div class="sub-card lead ${statusClass(r.status)}" draggable="true" data-card-id="${r.id}" style="--i:${i}">
      <div class="sub-card-head">
        <div class="avatar">${esc(initials)}</div>
        <div class="who">
          <div class="name">${esc(r.full_name || 'Unknown')}</div>
          <div class="when">${fmtDateTime(r.created_at)}</div>
        </div>
        ${statusBadge(r.status)}
      </div>
      <div class="sub-card-tags">
        <span class="tag tag-type">${esc(labelType(r.residency_type))}</span>
        ${renewTag}
      </div>
      <div class="sub-card-body">
        ${kv('Phone', r.phone)}
        ${kv('Duration', r.duration ? r.duration.replace('-', ' ') : '—')}
        ${kv('Rental contract', r.rental_contract === 'yes' ? 'Yes' : (r.rental_contract === 'no' ? 'No' : '—'))}
        ${kv('Family members', r.family_members || '—')}
        ${kv('Language', (r.language || '—').toUpperCase())}
      </div>
      <textarea class="notes-area" placeholder="Internal notes…" data-notes-for="residency_submissions:${r.id}">${esc(r.notes || '')}</textarea>
      <div class="sub-card-foot">
        ${statusSelect('residency_submissions', r)}
        <div class="foot-actions">
          ${contactButtons(r.phone)}
          <button class="icon-btn del" title="Delete" data-del-sub="${r.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    </div>`;
  }

  function renderResidency() {
    const rows = filteredResidency();
    const wrap = $('#residency-cards');
    const empty = $('#residency-empty');
    if (!state.residency.length) {
      wrap.innerHTML = '';
      empty.innerHTML = emptyState('🧾', 'No submissions yet', 'Leads from the homepage residency wizard will appear here.');
      return;
    }
    empty.innerHTML = '';
    renderBoard(wrap, rows, residencyCard);
    wireSubmissionEvents(wrap, 'residency_submissions', loadResidency);
    wireBoardDnd(wrap, 'residency_submissions', () => { renderResidencyStats(); renderResidency(); });
  }
  function kv(k, v) { return `<div class="kv"><span class="k">${esc(k)}</span><span class="v">${esc(v == null || v === '' ? '—' : v)}</span></div>`; }
  function labelType(t) {
    const m = { tourist: 'Tourist', student: 'Student', 'real-estate': 'Real Estate', family: 'Family Sponsorship' };
    return m[t] || (t || '—');
  }

  $('#residency-search').addEventListener('input', e => { state.filters.resSearch = e.target.value; renderResidency(); });

  /* =====================================================================
     REMINDER SUBMISSIONS
     ===================================================================== */
  async function loadReminders() {
    const { data, error } = await sb.from('reminder_submissions').select('*').order('created_at', { ascending: false });
    if (error) { toast('Failed to load reminders: ' + error.message, 'err'); return; }
    state.reminders = data || [];
    $('#count-reminders').textContent = state.reminders.length;
    renderRemindersStats();
    renderReminders();
    refreshAnalytics();
  }
  function renderRemindersStats() {
    let urgent = 0, soon = 0, upcoming = 0;
    state.reminders.forEach(r => {
      const u = urgencyOf(daysUntil(r.expiry_date));
      if (u === 'urgent') urgent++; else if (u === 'soon') soon++; else if (u === 'upcoming') upcoming++;
    });
    $('#reminders-stats').innerHTML =
      stat('Total reminders', state.reminders.length, 'brand', ICONS.bell) +
      stat('Expiring < 7 days', urgent, 'danger', ICONS.alarm) +
      stat('Within 30 days', soon, 'warn', ICONS.clock) +
      stat('Within 60 days', upcoming, '', ICONS.calendar);
  }
  function filteredReminders() {
    const q = state.filters.remSearch.toLowerCase();
    let rows = state.reminders.filter(r => {
      const u = urgencyOf(daysUntil(r.expiry_date));
      return (!state.filters.remUrgency || matchUrgency(u, state.filters.remUrgency)) &&
             (!q || (r.phone || '').toLowerCase().includes(q) || (r.full_name || '').toLowerCase().includes(q));
    });
    if (state.filters.remSort === 'urgency') {
      rows = rows.slice().sort((a, b) => {
        const da = daysUntil(a.expiry_date), db = daysUntil(b.expiry_date);
        return (da == null ? 1e9 : da) - (db == null ? 1e9 : db);
      });
    } else {
      rows = rows.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return rows;
  }
  function matchUrgency(u, filter) {
    if (filter === 'urgent') return u === 'urgent';
    if (filter === 'soon') return u === 'urgent' || u === 'soon';
    if (filter === 'upcoming') return u === 'urgent' || u === 'soon' || u === 'upcoming';
    return true;
  }
  function renderReminders() {
    const rows = filteredReminders();
    const wrap = $('#reminders-cards');
    const empty = $('#reminders-empty');
    if (!state.reminders.length) {
      wrap.innerHTML = '';
      empty.innerHTML = emptyState('🔔', 'No reminders yet', 'Requests from the “Remind Me” button will appear here.');
      return;
    }
    empty.innerHTML = '';
    renderBoard(wrap, rows, reminderCard);
    wireSubmissionEvents(wrap, 'reminder_submissions', loadReminders);
    wireBoardDnd(wrap, 'reminder_submissions', () => { renderRemindersStats(); renderReminders(); });
  }
  function reminderCard(r, i) {
    const days = daysUntil(r.expiry_date);
    const u = urgencyOf(days);
    const initials = (r.full_name || r.residency_type || '?').trim().charAt(0).toUpperCase();
    return `<div class="sub-card ${u} ${statusClass(r.status)}" draggable="true" data-card-id="${r.id}" data-expiry="${esc(r.expiry_date || '')}" style="--i:${i}">
      <div class="sub-card-head">
        <div class="avatar">${esc(initials)}</div>
        <div class="who">
          <div class="name">${esc(r.full_name || r.phone || 'Unknown')}</div>
          <div class="when">Requested ${fmtDateTime(r.created_at)}</div>
        </div>
        ${statusBadge(r.status)}
      </div>
      <div class="countdown ${u}">
        <span class="big cd-icon">${countdownIcon(u)}</span>
        <span class="cd-text">${countdownText(days)}</span>
      </div>
      <div class="sub-card-tags">
        ${r.residency_type ? '<span class="tag tag-type">' + esc(r.residency_type) + '</span>' : ''}
        <span class="tag">Expires ${esc(fmtDate(r.expiry_date))}</span>
      </div>
      <div class="sub-card-body">
        ${kv('Phone', r.phone)}
        ${kv('Language', (r.language || '—').toUpperCase())}
      </div>
      <textarea class="notes-area" placeholder="Internal notes…" data-notes-for="reminder_submissions:${r.id}">${esc(r.notes || '')}</textarea>
      <div class="sub-card-foot">
        ${statusSelect('reminder_submissions', r)}
        <div class="foot-actions">
          ${contactButtons(r.phone)}
          <button class="icon-btn del" title="Delete" data-del-sub="${r.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    </div>`;
  }
  function countdownIcon(u) { return u === 'urgent' ? '⛔' : (u === 'soon' ? '⚠️' : (u === 'upcoming' ? '🟡' : '✅')); }
  function countdownText(days) {
    if (days == null) return 'No expiry date provided';
    if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
    if (days === 0) return 'Expires today';
    return `${days} day${days === 1 ? '' : 's'} left until expiry`;
  }

  // Live countdown: recompute the remaining days for the cards already on screen
  // and update them in place (text + urgency colour) — no DOM rebuild, so it
  // never re-triggers entrance animations or steals focus from a notes field.
  // Day boundaries are in UTC, so the number ticks down at 00:00 UTC.
  function tickCountdowns() {
    const wrap = document.getElementById('reminders-cards');
    if (!wrap) return;
    $$('.sub-card[data-expiry]', wrap).forEach(card => {
      const days = daysUntil(card.dataset.expiry || null);
      const u = urgencyOf(days);
      ['urgent', 'soon', 'upcoming', 'safe'].forEach(c => card.classList.remove(c));
      card.classList.add(u);
      const cd = card.querySelector('.countdown');
      if (!cd) return;
      cd.className = 'countdown ' + u;
      const icon = cd.querySelector('.cd-icon'); if (icon) icon.textContent = countdownIcon(u);
      const txt = cd.querySelector('.cd-text'); if (txt) txt.textContent = countdownText(days);
    });
  }
  setInterval(tickCountdowns, 30000);

  $('#reminders-search').addEventListener('input', e => { state.filters.remSearch = e.target.value; renderReminders(); });
  $('#reminders-sort').addEventListener('change', e => { state.filters.remSort = e.target.value; renderReminders(); });
  $$('#reminders-urgency-seg button').forEach(b => b.addEventListener('click', () => {
    $$('#reminders-urgency-seg button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    state.filters.remUrgency = b.dataset.urgency;
    renderReminders();
  }));

  /* =====================================================================
     ANALYTICS — live charts built from the loaded state (Chart.js)
     ===================================================================== */
  const charts = {};
  function refreshAnalytics() { if ($('#view-analytics').classList.contains('active')) renderAnalytics(); }

  function chartTheme() {
    const dark = isDark();
    return {
      text: dark ? '#9aa3b2' : '#6b7280',
      grid: dark ? 'rgba(255,255,255,0.07)' : 'rgba(17,24,39,0.06)',
      tip: dark ? '#05070b' : '#111827'
    };
  }
  function destroyChart(key) { if (charts[key]) { charts[key].destroy(); charts[key] = null; } }
  function lastMonths(n) {
    const out = [], base = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
      out.push({ key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'), label: d.toLocaleDateString('en-GB', { month: 'short' }) });
    }
    return out;
  }
  function monthKey(dateStr) {
    const d = new Date(dateStr); if (isNaN(d)) return null;
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  function renderAnalytics() {
    if (!window.Chart) return;
    const res = state.residency, rem = state.reminders, blogs = state.blogs;

    const closed = res.filter(r => r.status === 'closed').length;
    const conv = res.length ? Math.round((closed / res.length) * 100) : 0;
    $('#analytics-kpis').innerHTML =
      stat('Total leads', res.length, 'brand', ICONS.users) +
      stat('Active reminders', rem.length, 'warn', ICONS.bell) +
      stat('Conversion', conv + '%', 'ok', ICONS.check) +
      stat('Published blogs', blogs.filter(b => b.status === 'published').length, '', ICONS.doc);

    buildTimeChart(res, rem);
    buildStageDonut(res);
    buildUrgencyDonut(rem);
    renderTypeBars(res, rem);
    renderLangBars(res, rem);
  }

  function commonScaleOpts(th) {
    return {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', align: 'end', labels: { color: th.text, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 16, font: { size: 12, weight: '600' } } },
        tooltip: { backgroundColor: th.tip, padding: 11, cornerRadius: 9, titleColor: '#fff', bodyColor: '#e5e7eb', usePointStyle: true, boxPadding: 4 }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: th.text, font: { size: 11.5 } }, border: { display: false } },
        y: { beginAtZero: true, grid: { color: th.grid }, ticks: { color: th.text, font: { size: 11.5 }, precision: 0 }, border: { display: false } }
      }
    };
  }

  function buildTimeChart(res, rem) {
    const months = lastMonths(6);
    const resCnt = months.map(m => res.filter(r => monthKey(r.created_at) === m.key).length);
    const remCnt = months.map(m => rem.filter(r => monthKey(r.created_at) === m.key).length);
    const total = [...resCnt, ...remCnt].reduce((a, b) => a + b, 0);
    $('#ana-time-sub').textContent = total + ' in last 6 months';
    const canvas = document.getElementById('chart-time');
    if (!canvas) return;
    destroyChart('time');
    const th = chartTheme();
    const ctx = canvas.getContext('2d');
    const grad = (color) => { const g = ctx.createLinearGradient(0, 0, 0, 260); g.addColorStop(0, color + '55'); g.addColorStop(1, color + '00'); return g; };
    charts.time = new Chart(canvas, {
      type: 'line',
      data: {
        labels: months.map(m => m.label),
        datasets: [
          { label: 'Leads', data: resCnt, borderColor: '#d00000', backgroundColor: grad('#d00000'), fill: true, tension: .4, borderWidth: 2.5, pointRadius: 3, pointHoverRadius: 5, pointBackgroundColor: '#d00000' },
          { label: 'Reminders', data: remCnt, borderColor: '#2563eb', backgroundColor: grad('#2563eb'), fill: true, tension: .4, borderWidth: 2.5, pointRadius: 3, pointHoverRadius: 5, pointBackgroundColor: '#2563eb' }
        ]
      },
      options: commonScaleOpts(th)
    });
  }

  function buildDonut(key, canvasId, centerId, labels, data, colors, centerLabel) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    destroyChart(key);
    const th = chartTheme();
    charts[key] = new Chart(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 7, spacing: 2 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: th.tip, padding: 11, cornerRadius: 9, titleColor: '#fff', bodyColor: '#e5e7eb', callbacks: { label: c => ' ' + c.label + ': ' + c.raw } }
        }
      }
    });
    const center = document.getElementById(centerId);
    const total = data.reduce((a, b) => a + b, 0);
    if (center) center.innerHTML = `<span class="dc-num">${total}</span><span class="dc-lbl">${esc(centerLabel)}</span>`;
  }
  function renderLegend(elId, items) {
    const el = document.getElementById(elId);
    if (el) el.innerHTML = items.map(it => `<span class="lg-item"><i style="background:${it.color}"></i>${esc(it.label)} <b>${it.value}</b></span>`).join('');
  }

  function buildStageDonut(res) {
    const color = { new: '#2563eb', contacted: '#0e9f6e', in_progress: '#ea580c', closed: '#6b7280' };
    const counts = {}; STATUS_COLS.forEach(c => counts[c.key] = 0);
    res.forEach(r => { counts[STATUS_COLS.some(c => c.key === r.status) ? r.status : 'new']++; });
    const data = STATUS_COLS.map(c => counts[c.key]);
    buildDonut('stage', 'chart-stage', 'donut-stage-center', STATUS_COLS.map(c => c.label), data, STATUS_COLS.map(c => color[c.key]), 'leads');
    renderLegend('legend-stage', STATUS_COLS.map((c, i) => ({ label: c.label, value: data[i], color: color[c.key] })));
  }
  function buildUrgencyDonut(rem) {
    const order = [['urgent', 'Expiring < 7d', '#dc2626'], ['soon', '< 30 days', '#ea580c'], ['upcoming', '< 60 days', '#f59e0b'], ['safe', '60+ days', '#16a34a']];
    const counts = { urgent: 0, soon: 0, upcoming: 0, safe: 0 };
    rem.forEach(r => { counts[urgencyOf(daysUntil(r.expiry_date))]++; });
    const data = order.map(o => counts[o[0]]);
    buildDonut('urgency', 'chart-urgency', 'donut-urgency-center', order.map(o => o[1]), data, order.map(o => o[2]), 'reminders');
    renderLegend('legend-urgency', order.map((o, i) => ({ label: o[1], value: data[i], color: o[2] })));
  }

  function hbars(elId, map, palette) {
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    const el = document.getElementById(elId);
    if (!el) return;
    if (!entries.length) { el.innerHTML = '<div class="hbars-empty">No data yet</div>'; return; }
    const max = entries.reduce((m, e) => Math.max(m, e[1]), 0) || 1;
    el.innerHTML = entries.map((e, i) => {
      const pct = Math.round((e[1] / max) * 100);
      return `<div class="hbar">
        <div class="hbar-top"><span class="hbar-name">${esc(e[0])}</span><span class="hbar-val">${e[1]}</span></div>
        <div class="hbar-track"><span class="hbar-fill" style="width:${pct}%;background:${palette[i % palette.length]}"></span></div>
      </div>`;
    }).join('');
  }
  function renderTypeBars(res, rem) {
    const m = {};
    res.forEach(r => { const k = labelType(r.residency_type); if (k && k !== '—') m[k] = (m[k] || 0) + 1; });
    rem.forEach(r => { const k = labelType(r.residency_type); if (k && k !== '—') m[k] = (m[k] || 0) + 1; });
    hbars('bars-types', m, ['#d00000', '#2563eb', '#ea580c', '#0e9f6e', '#7c3aed']);
  }
  function renderLangBars(res, rem) {
    const m = {};
    res.concat(rem).forEach(r => { const k = (r.language || '').toUpperCase(); if (k) m[k] = (m[k] || 0) + 1; });
    hbars('bars-langs', m, ['#2563eb', '#d00000', '#0e9f6e', '#ea580c', '#7c3aed', '#0891b2']);
  }

  /* ---------------- boot ---------------- */
  (async function init() {
    const ok = await guard();
    if (!ok) return;
    switchView('analytics');
    await Promise.all([loadBlogs(), loadResidency(), loadReminders()]);
    renderAnalytics();
  })();
})();
