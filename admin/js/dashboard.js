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
  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
    if (isNaN(target)) return null;
    return Math.round((target - today) / 86400000);
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
  }
  $$('.nav-link').forEach(l => l.addEventListener('click', () => switchView(l.dataset.view)));
  $('#primary-action').addEventListener('click', () => { if ($('#primary-action').dataset.view === 'blogs') openBlogEditor(); });

  // mobile sidebar
  $('#hamburger').addEventListener('click', () => $('#app').classList.toggle('nav-open'));
  $('#scrim').addEventListener('click', () => $('#app').classList.remove('nav-open'));

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
  }

  function renderBlogsStats() {
    const pub = state.blogs.filter(b => b.status === 'published').length;
    const draft = state.blogs.filter(b => b.status === 'draft').length;
    $('#blogs-stats').innerHTML = `
      ${stat('Total articles', state.blogs.length)}
      ${stat('Published', pub)}
      ${stat('Drafts', draft)}
      ${stat('Categories', state.categories.length)}`;
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
  const TR_LANGS = [
    ['en', 'English'], ['ar', 'العربية'], ['tr', 'Türkçe'], ['ru', 'Русский'],
    ['fa', 'فارسی'], ['uz', 'Ўзбек'], ['af', 'دری']
  ];
  const TR_RTL = new Set(['ar', 'fa', 'af']);
  let translationsBuilt = false;

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
            '<textarea id="tr-' + code + '-content" class="tr-content" style="min-height:150px;"' + dir + ' placeholder="Full article in ' + name + ' — write normally; blank lines become paragraphs."></textarea>' +
          '</div>' +
        '</details>'
      );
    }).join('');
    translationsBuilt = true;
  }

  function fillTranslations(map) {
    buildTranslations();
    const t = (map && typeof map === 'object') ? map : {};
    TR_LANGS.forEach(([code]) => {
      const v = (t[code] && typeof t[code] === 'object') ? t[code] : {};
      const ti = document.getElementById('tr-' + code + '-title');
      const de = document.getElementById('tr-' + code + '-desc');
      const co = document.getElementById('tr-' + code + '-content');
      if (ti) ti.value = v.title || '';
      if (de) de.value = v.description || v.excerpt || '';
      if (co) co.value = v.content || '';
      const det = document.querySelector('.tr-lang[data-lang="' + code + '"]');
      if (det) det.open = Boolean(String(v.title || v.description || v.content || '').trim());
    });
  }

  function htmlOrWrap(s) {
    s = (s || '').trim();
    if (!s) return '';
    if (/<[a-z][\s\S]*>/i.test(s)) return s; // already HTML — keep as-is
    return s.split(/\n{2,}/).map(function (p) { return '<p>' + p.trim().replace(/\n/g, '<br>') + '</p>'; }).join('');
  }

  function collectTranslations() {
    const out = {};
    TR_LANGS.forEach(([code]) => {
      const title = ((document.getElementById('tr-' + code + '-title') || {}).value || '').trim();
      const desc = ((document.getElementById('tr-' + code + '-desc') || {}).value || '').trim();
      const content = ((document.getElementById('tr-' + code + '-content') || {}).value || '').trim();
      const entry = {};
      if (title) entry.title = title;
      if (desc) entry.description = desc;
      if (content) entry.content = htmlOrWrap(content);
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
  function stat(label, value, cls) {
    return `<div class="stat"><div class="label">${esc(label)}</div><div class="value ${cls || ''}">${value}</div></div>`;
  }
  function emptyState(emoji, title, sub) {
    return `<div class="empty"><div class="emoji">${emoji}</div><div style="font-weight:700;color:var(--ink-2);">${esc(title)}</div><div style="margin-top:4px;">${esc(sub)}</div></div>`;
  }
  function statusSelect(table, row) {
    const opts = ['new', 'contacted', 'in_progress', 'closed'];
    const labels = { new: 'New', contacted: 'Contacted', in_progress: 'In progress', closed: 'Closed' };
    return `<select class="status-select" data-status-for="${table}:${row.id}">
      ${opts.map(o => `<option value="${o}" ${row.status === o ? 'selected' : ''}>${labels[o]}</option>`).join('')}
    </select>`;
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
    $$('[data-status-for]', scope).forEach(sel => sel.addEventListener('change', async e => {
      const id = Number(e.target.dataset.statusFor.split(':')[1]);
      const { error } = await sb.from(table).update({ status: e.target.value }).eq('id', id);
      if (error) { toast(error.message, 'err'); return; }
      const arr = table === 'residency_submissions' ? state.residency : state.reminders;
      const item = arr.find(x => x.id === id); if (item) item.status = e.target.value;
      toast('Status updated', 'ok');
      reloadFn();
    }));
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
    const map = { new: 'pill-warn', contacted: 'pill-ok', in_progress: 'pill-orange', closed: 'pill-muted' };
    const lbl = { new: 'New', contacted: 'Contacted', in_progress: 'In progress', closed: 'Closed' };
    return `<span class="pill ${map[status] || 'pill-muted'}">${lbl[status] || status}</span>`;
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
  }
  function renderResidencyStats() {
    const total = state.residency.length;
    const nw = state.residency.filter(r => r.status === 'new').length;
    const contacted = state.residency.filter(r => r.status === 'contacted').length;
    const closed = state.residency.filter(r => r.status === 'closed').length;
    $('#residency-stats').innerHTML = stat('Total leads', total) + stat('New', nw, 'warn') + stat('Contacted', contacted) + stat('Closed', closed);
  }
  function filteredResidency() {
    const q = state.filters.resSearch.toLowerCase();
    return state.residency.filter(r =>
      (!state.filters.resStatus || r.status === state.filters.resStatus) &&
      (!q || (r.full_name || '').toLowerCase().includes(q) || (r.phone || '').toLowerCase().includes(q)));
  }
  function renderResidency() {
    const rows = filteredResidency();
    const wrap = $('#residency-cards');
    const empty = $('#residency-empty');
    if (!rows.length) {
      wrap.innerHTML = '';
      empty.innerHTML = emptyState('🧾', 'No submissions yet', 'Leads from the homepage residency wizard will appear here.');
      return;
    }
    empty.innerHTML = '';
    wrap.innerHTML = rows.map(r => {
      const initials = (r.full_name || '?').trim().charAt(0).toUpperCase();
      return `<div class="sub-card safe">
        <div class="sub-card-head">
          <div class="avatar">${esc(initials)}</div>
          <div class="who">
            <div class="name">${esc(r.full_name || 'Unknown')}</div>
            <div class="when">${fmtDateTime(r.created_at)}</div>
          </div>
          ${statusBadge(r.status)}
        </div>
        <div class="sub-card-body">
          ${kv('Phone', r.phone)}
          ${kv('Residency type', labelType(r.residency_type))}
          ${kv('Already has?', r.has_residency === 'yes' ? 'Yes — renew/upgrade' : (r.has_residency === 'no' ? 'No — first time' : '—'))}
          ${kv('Duration', r.duration ? r.duration.replace('-', ' ') : '—')}
          ${kv('Rental contract', r.rental_contract === 'yes' ? 'Yes' : (r.rental_contract === 'no' ? 'No' : '—'))}
          ${kv('Family members', r.family_members || '—')}
          ${kv('Language', (r.language || '—').toUpperCase())}
        </div>
        <textarea class="notes-area" placeholder="Internal notes…" data-notes-for="residency_submissions:${r.id}">${esc(r.notes || '')}</textarea>
        <div class="sub-card-foot">
          ${statusSelect('residency_submissions', r)}
          ${contactButtons(r.phone)}
          <button class="icon-btn del" title="Delete" data-del-sub="${r.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>`;
    }).join('');
    wireSubmissionEvents(wrap, 'residency_submissions', loadResidency);
  }
  function kv(k, v) { return `<div class="kv"><span class="k">${esc(k)}</span><span class="v">${esc(v == null || v === '' ? '—' : v)}</span></div>`; }
  function labelType(t) {
    const m = { tourist: 'Tourist', student: 'Student', 'real-estate': 'Real Estate', family: 'Family Sponsorship' };
    return m[t] || (t || '—');
  }

  $('#residency-search').addEventListener('input', e => { state.filters.resSearch = e.target.value; renderResidency(); });
  $$('#residency-status-seg button').forEach(b => b.addEventListener('click', () => {
    $$('#residency-status-seg button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    state.filters.resStatus = b.dataset.status;
    renderResidency();
  }));

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
  }
  function renderRemindersStats() {
    let urgent = 0, soon = 0, upcoming = 0;
    state.reminders.forEach(r => {
      const u = urgencyOf(daysUntil(r.expiry_date));
      if (u === 'urgent') urgent++; else if (u === 'soon') soon++; else if (u === 'upcoming') upcoming++;
    });
    $('#reminders-stats').innerHTML =
      stat('Total reminders', state.reminders.length) +
      stat('Expiring < 7 days', urgent, 'danger') +
      stat('Within 30 days', soon, 'warn') +
      stat('Within 60 days', upcoming);
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
    if (!rows.length) {
      wrap.innerHTML = '';
      empty.innerHTML = emptyState('🔔', 'No reminders yet', 'Requests from the “Remind Me” button will appear here.');
      return;
    }
    empty.innerHTML = '';
    wrap.innerHTML = rows.map(r => {
      const days = daysUntil(r.expiry_date);
      const u = urgencyOf(days);
      const initials = (r.full_name || r.residency_type || '?').trim().charAt(0).toUpperCase();
      return `<div class="sub-card ${u}">
        <div class="sub-card-head">
          <div class="avatar">${esc(initials)}</div>
          <div class="who">
            <div class="name">${esc(r.full_name || r.phone || 'Unknown')}</div>
            <div class="when">Requested ${fmtDateTime(r.created_at)}</div>
          </div>
          ${statusBadge(r.status)}
        </div>
        <div class="countdown ${u}">
          <span class="big">${countdownIcon(u)}</span>
          <span>${countdownText(days)}</span>
        </div>
        <div class="sub-card-body">
          ${kv('Phone', r.phone)}
          ${kv('Residency type', r.residency_type || '—')}
          ${kv('Expiry date', fmtDate(r.expiry_date))}
          ${kv('Language', (r.language || '—').toUpperCase())}
        </div>
        <textarea class="notes-area" placeholder="Internal notes…" data-notes-for="reminder_submissions:${r.id}">${esc(r.notes || '')}</textarea>
        <div class="sub-card-foot">
          ${statusSelect('reminder_submissions', r)}
          ${contactButtons(r.phone)}
          <button class="icon-btn del" title="Delete" data-del-sub="${r.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>`;
    }).join('');
    wireSubmissionEvents(wrap, 'reminder_submissions', loadReminders);
  }
  function countdownIcon(u) { return u === 'urgent' ? '⛔' : (u === 'soon' ? '⚠️' : (u === 'upcoming' ? '🟡' : '✅')); }
  function countdownText(days) {
    if (days == null) return 'No expiry date provided';
    if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
    if (days === 0) return 'Expires today';
    return `${days} day${days === 1 ? '' : 's'} left until expiry`;
  }

  $('#reminders-search').addEventListener('input', e => { state.filters.remSearch = e.target.value; renderReminders(); });
  $('#reminders-sort').addEventListener('change', e => { state.filters.remSort = e.target.value; renderReminders(); });
  $$('#reminders-urgency-seg button').forEach(b => b.addEventListener('click', () => {
    $$('#reminders-urgency-seg button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    state.filters.remUrgency = b.dataset.urgency;
    renderReminders();
  }));

  /* ---------------- boot ---------------- */
  (async function init() {
    const ok = await guard();
    if (!ok) return;
    switchView('blogs');
    await Promise.all([loadBlogs(), loadResidency(), loadReminders()]);
  })();
})();
