/**
 * IKAMETI Admin — Supabase configuration & shared client.
 * Loaded after the supabase-js UMD bundle (window.supabase).
 */
window.IKAMETI_ADMIN_CONFIG = {
  SUPABASE_URL: 'https://puxytzkalbvamndgzels.supabase.co',
  SUPABASE_ANON_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1eHl0emthbGJ2YW1uZGd6ZWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4ODcxNTAsImV4cCI6MjA5NzQ2MzE1MH0.VHDqPMa5w1xN-_lf6eSSD6OWBQFoH9mKQ-ldq1EteF0',
  // Only this email may use the dashboard. Must match the email enforced by
  // Row Level Security in supabase/restrict-admin.sql.
  ADMIN_EMAIL: 'hmzaaslan77@gmail.com'
};

// One shared client for the whole admin area. Sessions persist in
// localStorage so a logged-in admin stays logged in across pages/reloads.
window.sb = window.supabase.createClient(
  window.IKAMETI_ADMIN_CONFIG.SUPABASE_URL,
  window.IKAMETI_ADMIN_CONFIG.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'ikameti-admin-auth'
    }
  }
);
