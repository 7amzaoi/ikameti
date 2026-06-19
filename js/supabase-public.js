/**
 * IKAMETI — Public site <-> Supabase integration
 * =====================================================================
 * One self-initializing module shared by every public page. It:
 *   1. Loads the Supabase JS client (ESM, from CDN) on demand.
 *   2. Exposes window.IKAMETI_DB with helpers used by the blog + forms.
 *   3. Auto-wires the two website forms so submissions land in Supabase:
 *        - "Remind Me" modal          (#remindForm)
 *        - Residency wizard            (#residency-wizard-form)
 *
 * Include with:  <script type="module" src="js/supabase-public.js"></script>
 * (use ../js/supabase-public.js from pages inside /blog/)
 *
 * The publishable anon key is safe to ship in the browser — Row Level
 * Security on the database controls what anonymous visitors may do.
 * =====================================================================
 */

const SUPABASE_URL = 'https://puxytzkalbvamndgzels.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1eHl0emthbGJ2YW1uZGd6ZWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4ODcxNTAsImV4cCI6MjA5NzQ2MzE1MH0.VHDqPMa5w1xN-_lf6eSSD6OWBQFoH9mKQ-ldq1EteF0';

let clientPromise = null;

/** Lazily create (once) and return the Supabase client. */
async function getClient() {
  if (!clientPromise) {
    clientPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
      .then(({ createClient }) =>
        createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: false }
        })
      );
  }
  return clientPromise;
}

/** Detect the active site language for tagging submissions. */
function currentLanguage() {
  try {
    if (window.i18n && typeof window.i18n.getCurrentLanguage === 'function') {
      return window.i18n.getCurrentLanguage();
    }
  } catch (_) { /* ignore */ }
  return document.documentElement.lang || 'en';
}

const IKAMETI_DB = {
  /**
   * Fetch published blog articles, newest first.
   * Returns an array shaped like the legacy articles.json so the existing
   * blog renderer can consume it unchanged. Throws on failure so callers
   * can fall back to the bundled JSON.
   */
  async getPublishedBlogs() {
    const client = await getClient();
    const { data, error } = await client
      .from('blogs')
      .select('id, slug, title, description, content, image, category, author, read_time, published_date')
      .eq('status', 'published')
      .order('published_date', { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description || '',
      excerpt: row.description || '',
      content: row.content || '',
      image: row.image || '',
      date: row.published_date || '',
      category: row.category || 'general',
      author: row.author || 'IKAMETI Team',
      readTime: row.read_time || ''
    }));
  },

  /** Insert a residency-wizard lead. */
  async insertResidency(payload) {
    const client = await getClient();
    const { error } = await client.from('residency_submissions').insert([payload]);
    if (error) throw error;
    return true;
  },

  /** Insert a "Remind Me" request. */
  async insertReminder(payload) {
    const client = await getClient();
    const { error } = await client.from('reminder_submissions').insert([payload]);
    if (error) throw error;
    return true;
  }
};

window.IKAMETI_DB = IKAMETI_DB;

// ---------------------------------------------------------------------
// Auto-wire the public forms (runs once the DOM is ready)
// ---------------------------------------------------------------------
function wireForms() {
  wireReminderForm();
  wireResidencyWizard();
}

/** "Remind Me" modal — fires a native submit event. */
function wireReminderForm() {
  const form = document.getElementById('remindForm');
  if (!form || form.dataset.supabaseWired) return;
  form.dataset.supabaseWired = '1';

  // Capture phase so we read the values before the existing handler resets the form.
  form.addEventListener('submit', () => {
    const type = (document.getElementById('residencyType') || {}).value || '';
    const expiry = (document.getElementById('expiryDate') || {}).value || '';
    const phone = (document.getElementById('phone') || {}).value || '';

    if (!type.trim() || !expiry.trim() || !phone.trim()) return; // let the page's own validation message show

    IKAMETI_DB.insertReminder({
      residency_type: type.trim(),
      expiry_date: expiry,
      phone: phone.trim(),
      language: currentLanguage()
    }).catch((err) => console.error('[IKAMETI] reminder save failed:', err));
  }, true);
}

/** Residency wizard — submitted via a button click, not a native submit. */
function wireResidencyWizard() {
  const form = document.getElementById('residency-wizard-form');
  if (!form || form.dataset.supabaseWired) return;
  form.dataset.supabaseWired = '1';

  const submitBtn = form.querySelector('#submit-btn, [data-i18n="wizard.form.submit_button"]');
  if (!submitBtn) return;

  const val = (sel) => {
    const el = form.querySelector(sel);
    return el ? (el.value || '').trim() : '';
  };
  const checked = (name) => {
    const el = form.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : '';
  };

  // Capture phase so we run alongside the page's own submit handler.
  submitBtn.addEventListener('click', () => {
    const fullName = val('input[name="full_name"]');
    const phone = val('input[name="phone"]');
    const residencyType = checked('residency_type');

    // Mirror the page's required-field rules so we don't store junk rows.
    if (!fullName || !phone || !residencyType) return;

    IKAMETI_DB.insertResidency({
      full_name: fullName,
      phone: phone,
      residency_type: residencyType,
      has_residency: checked('has_residency') || null,
      duration: checked('duration') || null,
      rental_contract: form.querySelector('input[name="rental_contract"]:checked') ? 'yes' : 'no',
      family_members: val('select[name="family_members"]') || null,
      language: currentLanguage()
    }).catch((err) => console.error('[IKAMETI] residency save failed:', err));
  }, true);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireForms);
} else {
  wireForms();
}
